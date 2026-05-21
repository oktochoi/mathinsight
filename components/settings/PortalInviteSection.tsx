'use client';

export function PortalInviteSection() {
  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-3">
      <h3 className="text-sm font-bold text-slate-900">학부모·학생 포털 연결</h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        학부모·학생이 각각 <strong>학부모</strong> / <strong>학생</strong> 유형으로 회원가입한 뒤,{' '}
        <strong>학생 관리</strong>에서 해당 학생을 수정할 때 가입 이메일을 입력하면 연결됩니다.
        연결되면 학부모는 <code className="bg-slate-100 px-1 rounded">/parent</code>, 학생은{' '}
        <code className="bg-slate-100 px-1 rounded">/student</code>에서 수업·리포트를 볼 수 있습니다.
      </p>
      <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1">
        <li>학부모·학생에게 MathInsight 회원가입 안내 (역할 선택 필수)</li>
        <li>학생 관리 → 학생 수정 → 학부모/학생 이메일 입력 후 저장</li>
        <li>이메일을 비우고 저장하면 연결이 해제됩니다</li>
      </ol>
    </div>
  );
}
