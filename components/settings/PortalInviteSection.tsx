'use client';

export function PortalInviteSection() {
  return (
    <div className="rounded-2xl p-6 bg-indigo-50/50 border border-indigo-100 space-y-2">
      <h3 className="text-sm font-bold text-slate-900">학부모·학생 연결 안내</h3>
      <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 leading-relaxed">
        <li>
          <strong>학원 연결 코드</strong>(설정 상단)와 학생 이름으로 포털에서 연결 요청합니다.
        </li>
        <li>원장이 <strong>연결 요청</strong>에서 승인하면 포털에 수업·리포트가 표시됩니다.</li>
        <li>
          또는 Students에서 <strong>가입 이메일</strong>을 저장해 자동 연결할 수 있습니다 (시연 백업).
        </li>
      </ol>
    </div>
  );
}
