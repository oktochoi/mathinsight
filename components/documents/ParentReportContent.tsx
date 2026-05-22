'use client';

import {
  isParentReportParseIncomplete,
  parseParentReportText,
  sanitizeParentReportText,
} from '@/lib/parentReportFormat';

export function ParentReportContent({
  text,
  studentName,
  periodStart,
  periodEnd,
  hideTitle = false,
}: {
  text: string;
  studentName?: string;
  periodStart?: string;
  periodEnd?: string;
  hideTitle?: boolean;
}) {
  const sanitized = sanitizeParentReportText(text);
  const parsed = parseParentReportText(sanitized);
  const parseIncomplete = isParentReportParseIncomplete(sanitized, parsed);
  const displayTitle =
    parsed.title ??
    (studentName && periodStart && periodEnd
      ? `${studentName} 학생 학습 리포트 (${periodStart} ~ ${periodEnd})`
      : null);

  return (
    <div className="space-y-6">
      {displayTitle && !hideTitle && (
        <p className="text-base font-bold text-slate-900">{displayTitle}</p>
      )}

      {!parseIncomplete && parsed.intro && (
        <section>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {parsed.intro}
          </p>
        </section>
      )}

      {!parseIncomplete &&
        parsed.sections.map((section) => (
        <section key={section.heading}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{section.heading}</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {section.body}
          </p>
        </section>
        ))}

      {parseIncomplete && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <p className="text-xs text-amber-800 mb-2">
            섹션 구분이 불명확해 전체 본문을 표시합니다.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {sanitized}
          </p>
        </div>
      )}

      {!parseIncomplete && parsed.sections.length === 0 && !parsed.intro && (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{sanitized}</p>
      )}

      {!parseIncomplete && parsed.closing && (
        <p className="text-sm text-slate-500 pt-2 border-t border-slate-100 whitespace-pre-wrap">
          {parsed.closing}
        </p>
      )}
    </div>
  );
}
