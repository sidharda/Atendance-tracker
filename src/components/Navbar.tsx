import React, { useState, useEffect } from 'react';
import { NavTab } from '../types';
import { CalendarCheck2, Clock, Menu, X, PlusCircle, Sparkles } from 'lucide-react';
import { formatFriendlyDate, getTodayDateISO } from '../utils/attendanceUtils';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  activeEmployeesCount: number;
  todayMarkedPercent: number;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectTab,
  mobileMenuOpen,
  onToggleMobileMenu,
  activeEmployeesCount,
  todayMarkedPercent,
  companyName,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const todayISO = getTodayDateISO();
  const formattedToday = formatFriendlyDate(todayISO);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                    Daily Attendance Tracker
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Pro v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {companyName} • {activeEmployeesCount} Active Staff
                </p>
              </div>
            </div>
          </div>

          {/* Center / Right: Live Clock & Date Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock & Date display */}
            <div
              id="live-clock-badge"
              className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700"
            >
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span className="font-mono font-semibold text-slate-900">{timeStr || '--:--:--'}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700 font-semibold">{formattedToday}</span>
            </div>

            {/* Quick Today's Attendance Pill */}
            <div
              id="today-attendance-pill"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
              title="Today's attendance rate"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Today: {todayMarkedPercent}% Marked</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="nav-quick-mark-btn"
                onClick={() => onSelectTab('mark-attendance')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span className="hidden sm:inline">Mark Attendance</span>
                <span className="sm:hidden">Mark</span>
              </button>

              <button
                id="nav-quick-add-btn"
                onClick={() => onSelectTab('add-employee')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-all"
                title="Register new employee"
              >
                <PlusCircle className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Add Employee</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
