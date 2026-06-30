'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { STUDENT_GRADE_OPTIONS } from '@/lib/gradeOptions';
import type { UserProfile } from '@/types/database';

const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other', label: '기타' },
] as const;

type Props = {
  onSaved?: () => void;
  submitLabel?: string;
  showStudentFields?: boolean;
};

export function UserProfileForm({
  onSaved,
  submitLabel = '저장',
  showStudentFields,
}: Props) {
  const { profile, refresh } = useAuth();
  const isStudent = showStudentFields ?? profile?.role === 'student';

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(profile?.gender ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [school, setSchool] = useState(profile?.school ?? '');
  const [grade, setGrade] = useState(profile?.grade ?? '중1');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${profile.id}/avatar.${ext}`;
    const { data, error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
    await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (isStudent && !grade) {
      setError('학년을 선택해 주세요.');
      return;
    }
    if (!profile?.id) return;

    setSaving(true);
    setError('');

    const payload: Partial<UserProfile> = {
      name: name.trim(),
      phone: phone.trim() || null,
      gender: gender || null,
      birthdate: birthdate || null,
    };

    if (isStudent) {
      payload.school = school.trim() || null;
      payload.grade = grade || null;
    }

    const { error: err } = await supabase.from('users').update(payload).eq('id', profile.id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    onSaved?.();
  };

  const initial = name.charAt(0) || '?';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-white">{initial}</span>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <i className="ri-camera-line text-white text-lg" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {uploading ? '업로드 중…' : '사진 변경'}
          </button>
          <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG (선택)</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">이름 *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="홍길동"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      {isStudent && (
        <>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">학교</label>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="OO중학교"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">학년 *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              {STUDENT_GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">휴대전화</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">성별</label>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGender(g.value)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                gender === g.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">생년월일</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors"
      >
        {saving ? '저장 중…' : submitLabel}
      </button>
    </form>
  );
}
