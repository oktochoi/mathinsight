'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  STAFF_NAV_SECTIONS,
  TODAY_HUB_HREF,
  getActiveSectionId,
  isNavItemActive,
  isSectionActive,
  type NavSection,
} from '@/lib/staffNavigation';
import { useStaffPermissions, type PermissionKey } from '@/lib/permissions';
import { StaffScopeBanner } from '@/components/staff/StaffScopeBanner';

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function filterItems(section: NavSection, can: (p: PermissionKey) => boolean) {
  return section.items.filter((item) => {
    if (item.hidden) return false;
    if (item.requiredPermissions?.length) {
      return item.requiredPermissions.every((p) => can(p as PermissionKey));
    }
    return true;
  });
}

export default function Sidebar({
  open = false,
  onClose,
  collapsed: collapsedProp,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const router = useRouter();
  const { profile, academy, loading } = useAuth();
  const { can } = useStaffPermissions();

  const activeSectionId = getActiveSectionId(pathname);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    today: true,
    classes: true,
    students: true,
    homerooms: true,
    parents: false,
    counseling: false,
    operations: false,
    reports: true,
    settings: true,
  }));

  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;
  const setCollapsed = onCollapsedChange ?? setCollapsedInternal;

  useEffect(() => {
    if (activeSectionId) {
      setExpanded((prev) => ({ ...prev, [activeSectionId]: true }));
    }
  }, [activeSectionId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose?.();
    router.replace('/auth');
  };

  const initial = profile?.name?.charAt(0) ?? '?';
  const showProfileLoading = loading && !profile;

  const toggleSection = (id: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpanded((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen h-[100dvh] flex-col transition-all duration-200 ease-out',
        collapsed ? 'w-[68px]' : 'w-[min(240px,85vw)] max-w-[240px] lg:w-60',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{
        background: 'var(--app-sidebar-bg)',
        borderRight: '1px solid var(--app-border)',
      }}
    >
      {/* 브랜드 로고 */}
      <div
        className={cn(
          'flex items-center justify-between pt-5 pb-4',
          collapsed ? 'px-2.5 lg:px-2.5' : 'px-4 lg:px-5 lg:pt-6'
        )}
      >
        <Link
          href={TODAY_HUB_HREF}
          className={cn('flex items-center min-w-0', collapsed ? 'justify-center w-full' : 'gap-2.5')}
          onClick={onClose}
          title="오늘 현황"
        >
          <div
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--app-accent)' }}
          >
            <i className="ri-sun-fill text-white text-xs" />
          </div>
          {!collapsed && <BrandMark variant="dark" nameClassName="text-[13px] font-semibold" />}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: 'var(--app-ink-3)' }}
            aria-label="메뉴 닫기"
          >
            <i className="ri-close-line text-base" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          <StaffScopeBanner />
        </div>
      )}

      {/* 메인 네비게이션 */}
      <nav className="flex-1 px-2 overflow-y-auto overscroll-contain pb-2" aria-label="업무 메뉴">
        {STAFF_NAV_SECTIONS.map((section) => {
          const items = filterItems(section, can);
          if (items.length === 0) return null;

          const sectionActive = isSectionActive(pathname, search, section);
          const isOpen = expanded[section.id] ?? false;

          // 단일 아이템 섹션 → 바로 링크로 렌더링 (accordion 없음)
          const isFlat = items.length === 1;

          return (
            <div key={section.id}>
              {/* 구분선 */}
              {section.dividerAbove && !collapsed && (
                <div className="mx-1 my-2" style={{ borderTop: '1px solid var(--app-border)' }} />
              )}
              {section.dividerAbove && collapsed && (
                <div className="mx-2 my-2" style={{ borderTop: '1px solid var(--app-border)' }} />
              )}

              <div className="mb-0.5">
                {isFlat ? (
                  // 단일 아이템: 바로 링크
                  <Link
                    href={items[0].href}
                    onClick={onClose}
                    title={collapsed ? section.label : undefined}
                    className={cn(
                      'app-nav-item',
                      sectionActive && 'app-nav-item-active',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <i
                      className={cn(
                        section.icon,
                        'text-sm shrink-0',
                        sectionActive ? 'text-[var(--app-accent)]' : 'text-[var(--app-ink-3)]'
                      )}
                    />
                    {!collapsed && <span className="truncate">{section.label}</span>}
                  </Link>
                ) : (
                  // 다중 아이템: accordion
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      title={collapsed ? section.label : undefined}
                      className={cn(
                        'app-nav-item w-full cursor-pointer',
                        sectionActive && !isOpen && 'app-nav-item-active',
                        collapsed && 'justify-center px-2'
                      )}
                      aria-expanded={isOpen}
                    >
                      <i
                        className={cn(
                          section.icon,
                          'text-sm shrink-0',
                          sectionActive ? 'text-[var(--app-accent)]' : 'text-[var(--app-ink-3)]'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1 text-left">{section.label}</span>
                          <i
                            className={cn(
                              'ri-arrow-down-s-line text-xs shrink-0 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                            style={{ color: 'var(--app-ink-4)' }}
                          />
                        </>
                      )}
                    </button>

                    {!collapsed && isOpen && (
                      <ul className="mt-0.5 mb-1.5 ml-3 pl-2.5 border-l" style={{ borderColor: 'var(--app-border)' }}>
                        {items.map((item) => {
                          const active = isNavItemActive(pathname, search, item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={cn('app-nav-item text-[13px] py-1.5', active && 'app-nav-item-active')}
                              >
                                <i
                                  className={cn(
                                    item.icon,
                                    'text-sm shrink-0',
                                    active ? 'text-[var(--app-accent)]' : 'text-[var(--app-ink-4)]'
                                  )}
                                />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 하단: 접기 버튼 + 프로필 + 로그아웃 */}
      <div className="px-2 pt-2 pb-3" style={{ borderTop: '1px solid var(--app-border)' }}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'app-nav-item w-full cursor-pointer mb-2 hidden lg:flex',
            collapsed && 'justify-center px-2'
          )}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <i
            className={cn(
              collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line',
              'text-sm shrink-0'
            )}
            style={{ color: 'var(--app-ink-3)' }}
          />
          {!collapsed && <span>접기</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
            <div
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--app-accent)' }}
            >
              {showProfileLoading ? '…' : initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                {showProfileLoading ? '불러오는 중' : profile?.name ?? '사용자'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--app-ink-3)' }}>
                {academy?.name ?? '학원'}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'app-nav-item app-btn-ghost w-full cursor-pointer safe-area-pb',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? '로그아웃' : undefined}
        >
          <i className="ri-logout-box-line text-sm shrink-0" style={{ color: 'var(--app-ink-3)' }} />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
