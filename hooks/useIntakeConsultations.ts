'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { resolveStaffProfileId } from '@/lib/studentParents';
import type {
  AcquisitionSource,
  IntakeConsultation,
  IntakeNextAction,
  IntakeStatus,
  NotRegisteredReason,
  RegistrationLikelihood,
} from '@/types/database';

const INTAKE_SELECT = `
  *,
  counseling_sessions(id, scheduled_at, status, title)
`;

export type CreateIntakeInput = {
  prospect_name: string;
  grade: string;
  school?: string;
  parent_name?: string;
  parent_phone?: string;
  interested_subjects?: string;
  preferred_class?: string;
  scheduled_at: string;
  counselor_id?: string;
  acquisition_source: AcquisitionSource | string;
  acquisition_source_other?: string;
};

export type UpdateIntakeRecordInput = Partial<{
  intake_status: IntakeStatus;
  consultation_content: string | null;
  parent_needs: string | null;
  student_level: string | null;
  recommended_class: string | null;
  recommended_subject: string | null;
  registration_likelihood: RegistrationLikelihood | null;
  next_action: IntakeNextAction | null;
  followup_date: string | null;
  registered: boolean;
  not_registered_reason: NotRegisteredReason | string | null;
  not_registered_reason_other: string | null;
}>;

export function useIntakeConsultations() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [intakes, setIntakes] = useState<IntakeConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntakes = useCallback(async () => {
    if (!profile?.academy_id) {
      setIntakes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('intake_consultations')
      .select(INTAKE_SELECT)
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (err) {
      setError('신입 상담 목록을 불러오지 못했습니다.');
      setIntakes([]);
    } else {
      setIntakes((data ?? []) as IntakeConsultation[]);
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes, dataVersion]);

  const createIntake = async (input: CreateIntakeInput) => {
    if (!profile?.academy_id || !profile.id) {
      return { error: '로그인 정보가 없습니다.' };
    }

    const { data: student, error: studentErr } = await supabase
      .from('students')
      .insert({
        academy_id: profile.academy_id,
        name: input.prospect_name.trim(),
        grade: input.grade.trim(),
        school: input.school?.trim() || null,
        class_id: null,
        status: 'stable',
        enrollment_status: 'prospect',
        registered_at: null,
        acquisition_source: input.acquisition_source,
        acquisition_source_other:
          input.acquisition_source === 'other' ? input.acquisition_source_other?.trim() || null : null,
      })
      .select('id')
      .single();

    if (studentErr || !student) {
      return { error: studentErr?.message ?? '예비 학생 생성에 실패했습니다.' };
    }

    const studentId = student.id as string;
    const title = `신입 상담 · ${input.prospect_name.trim()}`;
    const counselorUserId = input.counselor_id || profile.id;
    const sessionCounselorId = await resolveStaffProfileId(profile.academy_id, counselorUserId);

    const { data: session, error: sessionErr } = await supabase
      .from('counseling_sessions')
      .insert({
        academy_id: profile.academy_id,
        student_id: studentId,
        session_type: 'intake',
        status: 'scheduled',
        scheduled_at: new Date(input.scheduled_at).toISOString(),
        title,
        created_by: profile.id,
        counselor_id: sessionCounselorId,
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      await supabase.from('students').delete().eq('id', studentId);
      return { error: sessionErr?.message ?? '상담 예약에 실패했습니다.' };
    }

    const { data: intake, error: intakeErr } = await supabase
      .from('intake_consultations')
      .insert({
        academy_id: profile.academy_id,
        counseling_session_id: session.id,
        student_id: studentId,
        prospect_name: input.prospect_name.trim(),
        grade: input.grade.trim(),
        school: input.school?.trim() || null,
        parent_name: input.parent_name?.trim() || null,
        parent_phone: input.parent_phone?.trim() || null,
        interested_subjects: input.interested_subjects?.trim() || null,
        preferred_class: input.preferred_class?.trim() || null,
        counselor_id: counselorUserId,
        acquisition_source: input.acquisition_source,
        acquisition_source_other:
          input.acquisition_source === 'other' ? input.acquisition_source_other?.trim() || null : null,
        intake_status: 'scheduled',
      })
      .select('id')
      .single();

    if (intakeErr) {
      await supabase.from('counseling_sessions').delete().eq('id', session.id);
      await supabase.from('students').delete().eq('id', studentId);
      return { error: intakeErr.message };
    }

    bumpDataVersion();
    return { error: null, id: intake?.id as string, sessionId: session.id as string };
  };

  const updateIntakeRecord = async (id: string, patch: UpdateIntakeRecordInput) => {
    const intake = intakes.find((i) => i.id === id);
    const { error: err } = await supabase
      .from('intake_consultations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) return { error: err.message };

    if (intake?.counseling_session_id) {
      const sessionPatch: Record<string, string> = {};
      if (patch.intake_status === 'completed') {
        sessionPatch.status = 'completed';
        sessionPatch.completed_at = new Date().toISOString();
      } else if (patch.intake_status === 'scheduled') {
        sessionPatch.status = 'scheduled';
      } else if (
        patch.intake_status &&
        ['registered', 'on_hold', 'not_registered', 'no_show'].includes(patch.intake_status)
      ) {
        sessionPatch.status = 'completed';
        sessionPatch.completed_at = new Date().toISOString();
      }
      if (patch.consultation_content) {
        sessionPatch.summary = patch.consultation_content;
      }
      if (Object.keys(sessionPatch).length > 0) {
        await supabase
          .from('counseling_sessions')
          .update(sessionPatch)
          .eq('id', intake.counseling_session_id);
      }
    }

    if (patch.intake_status === 'registered' || patch.registered) {
      const target = intake ?? intakes.find((i) => i.id === id);
      if (target) {
        await supabase
          .from('students')
          .update({
            enrollment_status: 'active',
            registered_at: new Date().toISOString().slice(0, 10),
            acquisition_source: target.acquisition_source,
            acquisition_source_other: target.acquisition_source_other,
          })
          .eq('id', target.student_id);
      }
    }

    bumpDataVersion();
    return { error: null };
  };

  return {
    intakes,
    loading,
    error,
    refetch: fetchIntakes,
    createIntake,
    updateIntakeRecord,
  };
}

export function useAcademyStaff() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!profile?.academy_id) {
      setStaff([]);
      return;
    }
    supabase
      .from('users')
      .select('id, name')
      .eq('academy_id', profile.academy_id)
      .in('role', ['owner', 'teacher', 'desk'])
      .order('name')
      .then(({ data }) => {
        setStaff((data ?? []) as { id: string; name: string }[]);
      });
  }, [profile?.academy_id]);

  return staff;
}
