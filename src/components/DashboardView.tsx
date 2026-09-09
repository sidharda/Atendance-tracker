import React, { useState } from 'react';
import { Employee, AttendanceRecord, NavTab } from '../types';
import {
  getDailyAttendanceStats,
  formatFriendlyDate,
  getDayName,
  getTodayDateISO,
} from '../utils/attendanceUtils';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  UserCheck,
  UserX,
  Plane,
  Building2,
  Filter,
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  departments: string[];
  onNavigate: (tab: NavTab) => void;
  onSelectMarkDate?: (dateStr: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendance,
  departments,
  onNavigate,
  onSelectMarkDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateISO());
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const todayISO = getTodayDateISO();
  const isToday = selectedDate === todayISO;
  const friendlyDate = formatFriendlyDate(selectedDate);
  const dayName = getDayName(selectedDate);

  // Daily statistics
  const stats = getDailyAttendanceStats(employees, attendance, selectedDate);

  // Filter employees for selected date roster
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const recordMap = new Map<string, AttendanceRecord>();
  attendance
    .filter((a) => a.date === selectedDate)
    .forEach((a) => recordMap.set(a.employeeId, a));

  const filteredEmployees = activeEmployees.filter((emp) => {
    if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
    const rec = recordMap.get(emp.id);
    const status = rec ? rec.status : 'unmarked';
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    return true;
  });

  // Department breakdown stats
  const deptStats = departments.map((dept) => {
    const deptEmps = activeEmployees.filter((e) => e.department === dept);
    const total = deptEmps.length;
    let presentCount = 0;
    deptEmps.forEach((emp) => {
      const rec = recordMap.get(emp.id);
      if (rec && rec.status === 'present') presentCount++;
    });
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    return {
      name: dept,
      total,
      presentCount,
      rate,
    };
  });

  const handleGoToMarkAttendance = () => {
    if (onSelectMarkDate) {
      onSelectMarkDate(selectedDate);
    }
    onNavigate('mark-attendance');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              {dayName || 'Day Overview'}
            </span>
            {isToday && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Today
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Attendance Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Viewing records for <strong className="text-slate-800">{friendlyDate}</strong>.
            Instant real-time synchronization.
          </p>
        </div>

        {/* Date Switcher & Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-medium text-slate-500">Date:</span>
            <input
              id="dashboard-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
            />
          </div>

          {!isToday && (
            <button
              id="btn-dashboard-jump-today"
              onClick={() => setSelectedDate(todayISO)}
              className="px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Back to Today
            </button>
          )}

          <button
            id="btn-dashboard-mark-attendance"
            onClick={handleGoToMarkAttendance}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
          >
            <span>Mark for this Date</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Employees */}
        <div
          id="kpi-total-employees"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Staff
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.activeCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>{stats.inactiveCount} inactive</span>
              <span>•</span>
              <span>{stats.totalEmployees} total</span>
            </div>
          </div>
        </div>

        {/* Present Card (#10B981) */}
        <div
          id="kpi-present-count"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Present
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {stats.present}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{stats.percentage}% attendance rate</span>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#10B981] transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        {/* Absent Card (#EF4444) */}
        <div
          id="kpi-absent-count"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Absent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              {stats.absent}
            </div>
            <p className="text-xs text-rose-600 mt-1">
              {stats.activeCount > 0
                ? `${Math.round((stats.absent / stats.activeCount) * 100)}% of active staff`
                : '0%'}
            </p>
          </div>
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#EF4444] transition-all duration-500"
            style={{
              width: `${stats.activeCount > 0 ? (stats.absent / stats.activeCount) * 100 : 0}%`,
            }}
          />
        </div>

        {/* On Leave Card (#F59E0B) */}
        <div
          id="kpi-onleave-count"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              On Leave
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {stats.onLeave}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Approved leave days
            </p>
          </div>
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#F59E0B] transition-all duration-500"
            style={{
              width: `${stats.activeCount > 0 ? (stats.onLeave / stats.activeCount) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Not Marked Card (#9CA3AF) */}
        <div
          id="kpi-unmarked-count"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Not Marked
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-700">
              {stats.unmarked}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.unmarked > 0 ? 'Pending roll' : 'All marked!'}
            </p>
          </div>
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#9CA3AF] transition-all duration-500"
            style={{
              width: `${stats.activeCount > 0 ? (stats.unmarked / stats.activeCount) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Hours Logged Card */}
        <div
          id="kpi-hours-logged"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
              Hours Logged
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
              {Math.round(stats.totalHours * 10) / 10}
              <span className="text-sm font-semibold text-indigo-600 ml-1">hrs</span>
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              {stats.avgHoursPerPresent} hrs / present staff
            </p>
          </div>
          <div
            className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-500"
            style={{
              width: `${Math.min(100, stats.activeCount > 0 ? (stats.totalHours / (stats.activeCount * 8)) * 100 : 0)}%`,
            }}
          />
        </div>
      </div>

      {/* Main Row: Department Progress & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Attendance */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Department Attendance Breakdown
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {friendlyDate}
            </span>
          </div>

          <div className="space-y-4">
            {deptStats.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{dept.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {dept.presentCount} / {dept.total} present
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        dept.rate >= 80
                          ? 'bg-emerald-50 text-emerald-700'
                          : dept.rate >= 50
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {dept.rate}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.rate >= 80
                        ? 'bg-[#10B981]'
                        : dept.rate >= 50
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#EF4444]'
                    }`}
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations & Overview */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                id="btn-quick-take-attendance"
                onClick={handleGoToMarkAttendance}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Mark Attendance</p>
                    <p className="text-xs text-slate-500">Quick bulk or individual marking</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-quick-add-staff"
                onClick={() => onNavigate('add-employee')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Register Staff</p>
                    <p className="text-xs text-slate-500">Auto-ID generation & validation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-quick-reports"
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Export Reports</p>
                    <p className="text-xs text-slate-500">Download CSV & 7-day logs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Overall Rate:</span>
              <span className="font-bold text-blue-600 text-sm">
                {stats.percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Employee Status Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Daily Attendance Roster ({filteredEmployees.length})
            </h3>
            <p className="text-xs text-slate-500">
              Showing active employees status for {friendlyDate}
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="filter-dashboard-dept"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <select
                id="filter-dashboard-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
                <option value="on-leave">On Leave Only</option>
                <option value="unmarked">Not Marked Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Status for {dayName}</th>
                <th className="px-5 py-3 text-center">Hours</th>
                <th className="px-5 py-3 text-right">Marked Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No employees matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const rec = recordMap.get(emp.id);
                  const status = rec ? rec.status : 'unmarked';

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{emp.id} • {emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {status === 'present' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#10B981] border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                            Present
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#EF4444] border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                            Absent
                          </span>
                        )}
                        {status === 'on-leave' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-[#F59E0B] border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            On Leave
                          </span>
                        )}
                        {status === 'unmarked' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#9CA3AF] border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]"></span>
                            Not Marked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {status === 'unmarked' ? (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {typeof rec?.hours === 'number' ? rec.hours : (status === 'present' ? 8 : 0)} hrs
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-500">
                        {rec?.markedAt
                          ? new Date(rec.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
