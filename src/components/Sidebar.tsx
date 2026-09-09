import React from 'react';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  UserPlus,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  totalEmployees: number;
  activeEmployees: number;
  todayMarkedPercent: number;
  companyName: string;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  onCloseMobileMenu,
  totalEmployees,
  activeEmployees,
  todayMarkedPercent,
  companyName,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'mark-attendance',
      label: 'Mark Attendance',
      icon: <CalendarCheck2 className="w-5 h-5 shrink-0" />,
      badge: `${todayMarkedPercent}%`,
    },
    {
      id: 'directory',
      label: 'Employee Directory',
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: totalEmployees,
    },
    {
      id: 'add-employee',
      label: 'Add Employee',
      icon: <UserPlus className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'reports',
      label: 'Reports & History',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar Content */}
      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Company Mini Card */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-slate-800 truncate" title={companyName}>
                {companyName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeEmployees} active of {totalEmployees} total
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Main Menu
            </p>
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-4 border-t border-slate-100">
          <div className="p-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Quick Tip
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Attendance auto-saves to LocalStorage. You can also export CSV reports or full JSON backups anytime.
            </p>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-400">
            Daily Attendance Tracker • 100% Client Persistent
          </div>
        </div>
      </aside>
    </>
  );
};
