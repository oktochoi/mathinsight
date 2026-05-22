'use client';

import type { ParentReport, ReportTone } from '@/types/database';
import { ParentReportContent } from '@/components/documents/ParentReportContent';

const TONE_LABELS: Record<ReportTone, string> = {
  friendly: '친근한',
  objective: '객관적인',
  exam_focused: '시험 대비',
  encouraging: '격려 중심',
};

export function ParentReportView({ report }: { report: ParentReport }) {
  const studentName = (report.students as { name?: string })?.name ?? '학생';
  const grade = (report.students as { grade?: string })?.grade;

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 min-w-0 max-w-full">
      <div
        className="p-6 sm:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1e32)' }}
      >
        <h2 className="text-xl font-bold">{studentName} 학생 학부모 리포트</h2>
        <p className="text-sm text-slate-300 mt-1">
          {report.period_start} ~ {report.period_end}
          {grade ? ` · ${grade}` : ''}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          저장일 {report.created_at.slice(0, 10)} · {TONE_LABELS[report.tone]}
        </p>
      </div>
      <div className="p-6 sm:p-8">
        <ParentReportContent
          text={report.report_text}
          studentName={studentName}
          periodStart={report.period_start}
          periodEnd={report.period_end}
          hideTitle
        />
      </div>
    </div>
  );
}
