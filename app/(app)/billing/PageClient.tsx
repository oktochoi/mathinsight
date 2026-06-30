'use client';

import { useMemo, useRef, useState } from 'react';
import { useBillingCenter } from '@/hooks/useBillingCenter';
import { useNotifications } from '@/hooks/useNotifications';
import { BillingHero } from '@/components/billing/BillingHero';
import { BillingOverview } from '@/components/billing/BillingOverview';
import { BillingTimelinePlaceholder } from '@/components/billing/BillingTimelinePlaceholder';
import { BillingActionCenter } from '@/components/billing/BillingActionCenter';
import { BillingChargesTable } from '@/components/billing/BillingChargesTable';
import { BillingClassRates } from '@/components/billing/BillingClassRates';
import { BillingAiInsight } from '@/components/billing/BillingAiInsight';
import { BillingForecast } from '@/components/billing/BillingForecast';
import { StudentPaymentDrawer } from '@/components/billing/StudentPaymentDrawer';
import { PaidCompletionModal } from '@/components/billing/PaidCompletionModal';
import { BillingSelectionBar } from '@/components/billing/BillingSelectionBar';
import { BillingChargeModal } from '@/components/billing/BillingChargeModal';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import { downloadBillingExcel } from '@/lib/exportBillingExcel';
import { cn } from '@/lib/cn';
import type { BillingListFilter } from '@/lib/billingOperations';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';

const PRIMARY_FILTERS: { key: BillingListFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unpaid', label: '미납' },
  { key: 'overdue', label: '연체' },
  { key: 'due_today', label: '오늘 납부' },
  { key: 'rereg_unpaid', label: '재등록+미납' },
  { key: 'paid', label: '완납' },
];

function defaultFilter(rows: EnrichedPaymentRow[]): BillingListFilter {
  if (rows.some((r) => r.isOverdue)) return 'overdue';
  if (rows.some((r) => r.payment.status === 'pending')) return 'unpaid';
  return 'all';
}

export default function BillingPage() {
  const center = useBillingCenter();
  const { sendDemo } = useNotifications();
  const chargesRef = useRef<HTMLElement>(null);

  const [listFilter, setListFilter] = useState<BillingListFilter | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerRow, setDrawerRow] = useState<EnrichedPaymentRow | null>(null);
  const [paidPromptRow, setPaidPromptRow] = useState<EnrichedPaymentRow | null>(null);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [dueDateModal, setDueDateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState('');

  const activeFilter = listFilter ?? defaultFilter(center.enrichedRows);

  const filteredRows = useMemo(
    () => center.filterRows(activeFilter),
    [center, activeFilter]
  );

  const selectedRows = useMemo(
    () => center.enrichedRows.filter((r) => selectedIds.has(r.payment.id)),
    [center.enrichedRows, selectedIds]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const scrollToCharges = () => {
    chargesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTaskSelect = (filter: BillingListFilter) => {
    setListFilter(filter);
    scrollToCharges();
  };

  const handleManageOverdue = () => {
    setListFilter(center.enrichedRows.some((r) => r.isOverdue) ? 'overdue' : 'unpaid');
    scrollToCharges();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  };

  const handleMarkPaid = async (row: EnrichedPaymentRow) => {
    const result = await center.updatePaymentStatus(row.payment.id, 'paid');
    if (result.error) {
      showToast(result.error);
      return;
    }
    const updated = { ...row, payment: { ...row.payment, status: 'paid' as const } };
    setPaidPromptRow(updated);
    if (drawerRow?.payment.id === row.payment.id) {
      setDrawerRow(updated);
    }
  };

  const handleRegisterNextMonth = async (row: EnrichedPaymentRow) => {
    setActionBusy(true);
    const result = await center.createNextMonthBilling(row.payment.id);
    setActionBusy(false);
    if (result.error) showToast(result.error);
    else showToast(`${row.studentName} — 다음 달 청구가 등록되었습니다.`);
  };

  const handleRegisterRereg = async (studentId: string, studentName: string) => {
    setActionBusy(true);
    const result = await center.registerReregistration(studentId);
    setActionBusy(false);
    if (result.error) showToast(result.error);
    else if (result.already) showToast(`${studentName} — 이미 재등록 진행 중입니다.`);
    else showToast(`${studentName} — 재등록 예정으로 등록했습니다.`);
    void center.refetchRereg();
  };

  const handleContact = async (row: EnrichedPaymentRow) => {
    const result = await sendDemo({
      channel: 'sms',
      recipient_label: `${row.studentName} 학부모`,
      message: `[수강료 안내] ${row.payment.title} ${row.payment.amount.toLocaleString()}원 — 납부기한 ${row.payment.due_date}`,
      student_id: row.payment.student_id,
      template_key: 'billing_reminder',
    });
    if (result.error) showToast(result.error);
    else showToast('문자 발송이 기록되었습니다.');
  };

  const handleBulkClass = async (
    classId: string,
    title: string,
    amount: number,
    dueDate: string,
    billingMonth: string
  ) => {
    const targets = center.students.filter(
      (s) => s.class_id === classId && s.enrollment_status === 'active'
    );
    if (targets.length === 0) {
      showToast('해당 반에 재원 학생이 없습니다.');
      return;
    }
    const result = await center.createPaymentsBulk(
      targets.map((s) => ({
        student_id: s.id,
        title,
        amount,
        due_date: dueDate,
        billing_month: billingMonth || undefined,
      }))
    );
    if (result.error) showToast(result.error);
    else showToast(`${result.count}건 청구가 등록되었습니다.`);
  };

  const handleBulkStudents = async (
    studentIds: string[],
    title: string,
    amount: number,
    dueDate: string,
    billingMonth: string
  ) => {
    const result = await center.createPaymentsBulk(
      studentIds.map((id) => ({
        student_id: id,
        title,
        amount,
        due_date: dueDate,
        billing_month: billingMonth || undefined,
      }))
    );
    if (result.error) showToast(result.error);
    else showToast(`${result.count}건 청구가 등록되었습니다.`);
  };

  const handleChangeDueDate = async () => {
    if (!newDueDate) return;
    const ids = [...selectedIds];
    const result = await center.updateDueDate(ids, newDueDate);
    if (result.error) showToast(result.error);
    else {
      showToast(`${ids.length}건 납부기한이 변경되었습니다.`);
      setSelectedIds(new Set());
      setDueDateModal(false);
      setNewDueDate('');
    }
  };

  const sendBulk = async (channel: 'sms' | 'kakao') => {
    const targets = selectedRows.length > 0 ? selectedRows : filteredRows.filter((r) => r.isOverdue);
    if (targets.length === 0) {
      showToast('발송할 청구를 선택하거나 연체 목록을 확인하세요.');
      return;
    }
    let ok = 0;
    for (const row of targets.slice(0, 15)) {
      const res = await sendDemo({
        channel,
        recipient_label: `${row.studentName} 학부모`,
        message:
          channel === 'sms'
            ? `[수강료 안내] ${row.payment.title} 납부기한 ${row.payment.due_date}`
            : `[카카오 알림] ${row.payment.title} 수강료 납부 안내`,
        student_id: row.payment.student_id,
        template_key: channel === 'sms' ? 'billing_bulk' : 'billing_kakao',
      });
      if (!res.error) ok++;
    }
    showToast(`${ok}건 ${channel === 'sms' ? '문자' : '카카오'} 발송이 기록되었습니다.`);
  };

  const handleBulkNextMonth = async () => {
    const paidRows = selectedRows.filter((r) => r.payment.status === 'paid' && !r.hasNextMonthBilling);
    if (paidRows.length === 0) {
      showToast('완납·다음달 미등록 건을 선택하세요.');
      return;
    }
    setActionBusy(true);
    let ok = 0;
    for (const row of paidRows) {
      const res = await center.createNextMonthBilling(row.payment.id);
      if (!res.error) ok++;
    }
    setActionBusy(false);
    showToast(`${ok}건 다음 달 청구가 등록되었습니다.`);
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    downloadBillingExcel(filteredRows, center.today);
    showToast(`${filteredRows.length}건 엑셀(CSV)로 저장했습니다.`);
  };

  const drawerHasRereg = drawerRow
    ? center.reregRecords.some(
        (r) =>
          r.student_id === drawerRow.payment.student_id &&
          ['pending', 'contacted', 'deferred'].includes(r.status)
      )
    : false;

  if (center.loading) return <PageLoader />;

  return (
    <div className="space-y-8 w-full min-w-0 max-w-6xl mx-auto pb-24">
      {center.error && <ErrorBanner message={center.error} />}
      {toast && (
        <p
          className="text-sm rounded-xl px-3 py-2"
          style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)', border: '1px solid var(--color-success-border)' }}
        >
          {toast}
        </p>
      )}

      <BillingHero
        kpis={center.kpis}
        onRegisterCharge={() => setChargeModalOpen(true)}
        onManageOverdue={handleManageOverdue}
        onExport={handleExport}
      />

      <BillingOverview kpis={center.kpis} />

      <BillingTimelinePlaceholder />

      <BillingActionCenter
        tasks={center.todayTasks}
        activeFilter={activeFilter !== 'all' ? activeFilter : null}
        onSelect={handleTaskSelect}
      />

      <section ref={chargesRef} id="charges" className="scroll-mt-20 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
              청구 목록
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
              학생을 클릭하면 수납 상세 Drawer가 열립니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {PRIMARY_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setListFilter(key)}
                className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all cursor-pointer"
                style={
                  activeFilter === key
                    ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)', borderColor: 'var(--app-ink)' }
                    : {
                        background: 'var(--app-surface)',
                        color: 'var(--app-ink-3)',
                        borderColor: 'var(--app-border)',
                      }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <BillingChargesTable
          rows={filteredRows}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onStudentClick={setDrawerRow}
          onMarkPaid={(row) => void handleMarkPaid(row)}
          onContact={(row) => void handleContact(row)}
          onRegisterNextMonth={(row) => void handleRegisterNextMonth(row)}
          today={center.today}
        />
      </section>

      <BillingSelectionBar
        count={selectedIds.size}
        onChangeDueDate={() => setDueDateModal(true)}
        onSendSms={() => void sendBulk('sms')}
        onSendKakao={() => void sendBulk('kakao')}
        onBulkNextMonth={() => void handleBulkNextMonth()}
        onClear={() => setSelectedIds(new Set())}
      />

      <BillingAiInsight lines={center.insights} />

      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--app-surface-2)] cursor-pointer"
        >
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
              추가 운영 정보
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
              반별 수납률 · 수납 예측
            </p>
          </div>
          <i
            className={cn('ri-arrow-down-s-line transition-transform', showDetails && 'rotate-180')}
            style={{ color: 'var(--app-ink-4)' }}
          />
        </button>
        {showDetails && (
          <div className="px-5 pb-6 pt-2 space-y-6" style={{ borderTop: '1px solid var(--app-border)' }}>
            <div className="grid lg:grid-cols-2 gap-6">
              <BillingForecast forecast={center.forecast} />
              <BillingClassRates rates={center.classRates} />
            </div>
          </div>
        )}
      </section>

      <BillingChargeModal
        open={chargeModalOpen}
        classes={center.classes}
        students={center.students
          .filter((s) => s.enrollment_status === 'active')
          .map((s) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            class_id: s.class_id,
          }))}
        onClose={() => setChargeModalOpen(false)}
        onBulkClass={handleBulkClass}
        onBulkStudents={handleBulkStudents}
      />

      <PaidCompletionModal
        row={paidPromptRow}
        busy={actionBusy}
        onCreateNextMonth={() => {
          if (!paidPromptRow) return;
          void handleRegisterNextMonth(paidPromptRow).then(() => setPaidPromptRow(null));
        }}
        onRegisterRereg={() => {
          if (!paidPromptRow) return;
          void handleRegisterRereg(paidPromptRow.payment.student_id, paidPromptRow.studentName).then(
            () => setPaidPromptRow(null)
          );
        }}
        onClose={() => setPaidPromptRow(null)}
      />

      {dueDateModal && (
        <>
          <button
            type="button"
            className="app-overlay"
            onClick={() => setDueDateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="app-modal-panel pointer-events-auto w-full max-w-sm">
              <header className="app-modal-header">
                <h3 className="font-bold" style={{ color: 'var(--app-ink)' }}>
                  납부기한 변경
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
                  {selectedIds.size}건 선택됨
                </p>
              </header>
              <div className="app-modal-body">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{
                    background: 'var(--app-surface-2)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-ink)',
                    outline: 'none',
                  }}
                />
              </div>
              <footer className="app-modal-footer">
                <button type="button" onClick={() => setDueDateModal(false)} className="app-btn app-btn-ghost">
                  취소
                </button>
                <button
                  type="button"
                  disabled={!newDueDate}
                  onClick={() => void handleChangeDueDate()}
                  className="app-btn app-btn-primary disabled:opacity-50"
                >
                  변경
                </button>
              </footer>
            </div>
          </div>
        </>
      )}

      <StudentPaymentDrawer
        open={!!drawerRow}
        row={drawerRow}
        payments={drawerRow ? center.studentPayments(drawerRow.payment.student_id) : []}
        counseling={drawerRow ? center.studentCounseling(drawerRow.payment.student_id) : []}
        hasRereg={drawerHasRereg}
        aiSummary={
          drawerRow
            ? center.studentSummary(drawerRow.payment.student_id, drawerRow.studentName)
            : ''
        }
        onClose={() => setDrawerRow(null)}
        onMarkPaid={(id) => {
          const row = center.enrichedRows.find((r) => r.payment.id === id);
          if (row) void handleMarkPaid(row);
        }}
        onRegisterNextMonth={() => {
          if (drawerRow) void handleRegisterNextMonth(drawerRow);
        }}
        onRegisterRereg={() => {
          if (drawerRow)
            void handleRegisterRereg(drawerRow.payment.student_id, drawerRow.studentName);
        }}
      />
    </div>
  );
}
