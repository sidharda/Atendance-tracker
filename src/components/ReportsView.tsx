import React, { useState } from 'react';
import { Employee, AttendanceRecord, EmployeeAttendanceStats } from '../types';
import {
  calculateEmployeesStats,
  generateAttendanceCSV,
  downloadCSVFile,
  getTodayDateISO,
  formatDateISO,
  formatFriendlyDate,
} from '../utils/attendanceUtils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  UserCheck,
  UserX,
  Plane,
  Eye,
  CalendarDays,
  Clock,
} from 'lucide-react';

interface ReportsViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  departments: string[];
  onViewEmployeeCalendar: (employee: Employee) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

type DateRangePreset = 'this-month' | 'last-7-days' | 'last-30-days' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  attendance,
  departments,
  onViewEmployeeCalendar,
  onNotify,
}) => {
  const today = new Date();
  const todayISO = getTodayDateISO();

  // Presets default to "this-month"
  const [preset, setPreset] = useState<DateRangePreset>('this-month');
  
  // Calculate default dates for this month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState<string>(formatDateISO(firstDayOfMonth));
  const [endDate, setEndDate] = useState<string>(todayISO);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const [sortBy, setSortBy] = useState<'name' | 'department' | 'percentage' | 'present' | 'id' | 'hours'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle preset change
  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === 'this-month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateISO(first));
      setEndDate(formatDateISO(now));
    } else if (newPreset === 'last-7-days') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      setStartDate(formatDateISO(past7));
      setEndDate(formatDateISO(now));
    } else if (newPreset === 'last-30-days') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 29);
      setStartDate(formatDateISO(past30));
      setEndDate(formatDateISO(now));
    }
  };

  // Calculate comprehensive stats for selected range
  const allStats: EmployeeAttendanceStats[] = calculateEmployeesStats(
    employees,
    attendance,
    startDate,
    endDate,
    endDate
  );

  // Filter
  const filteredStats = allStats.filter((item) => {
    const emp = item.employee;
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.id.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }
    return true;
  });

  // Sort
  const sortedStats = [...filteredStats].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') {
      comp = a.employee.name.localeCompare(b.employee.name);
    } else if (sortBy === 'department') {
      comp = a.employee.department.localeCompare(b.employee.department);
    } else if (sortBy === 'percentage') {
      comp = a.attendancePercentage - b.attendancePercentage;
    } else if (sortBy === 'present') {
      comp = a.presentCount - b.presentCount;
    } else if (sortBy === 'hours') {
      comp = a.totalHours - b.totalHours;
    } else if (sortBy === 'id') {
      comp = a.employee.id.localeCompare(b.employee.id, undefined, { numeric: true });
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const handleSortToggle = (field: 'name' | 'department' | 'percentage' | 'present' | 'id' | 'hours') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' || field === 'department' ? 'asc' : 'desc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (sortedStats.length === 0) {
      onNotify('warning', 'No records found to export for current criteria.');
      return;
    }

    const rangeLabel = `${startDate}_to_${endDate}`;
    const csvContent = generateAttendanceCSV(sortedStats, `${formatFriendlyDate(startDate)} to ${formatFriendlyDate(endDate)}`);
    const filename = `attendance_report_${rangeLabel}.csv`;
    downloadCSVFile(csvContent, filename);
    onNotify('success', `Exported attendance report (${sortedStats.length} staff) to ${filename}`);
  };

  // Aggregate totals
  const totalPresent = sortedStats.reduce((acc, s) => acc + s.presentCount, 0);
  const totalAbsent = sortedStats.reduce((acc, s) => acc + s.absentCount, 0);
  const totalLeave = sortedStats.reduce((acc, s) => acc + s.leaveCount, 0);
  const totalHoursSum = sortedStats.reduce((acc, s) => acc + s.totalHours, 0);
  const totalRecorded = totalPresent + totalAbsent + totalLeave;
  const overallAvgRate = totalRecorded > 0 ? Math.round((totalPresent / totalRecorded) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Analytics & Reporting
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Attendance Reports & Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive audit trail with 7-day indicators, monthly percentages, and CSV export.
          </p>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Average Rate
          </span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {overallAvgRate}%
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Across selected period</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Total Present Days
          </span>
          <div className="text-2xl font-extrabold text-[#10B981] mt-1">
            {totalPresent}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Logged present entries</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Total Absent Days
          </span>
          <div className="text-2xl font-extrabold text-[#EF4444] mt-1">
            {totalAbsent}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Recorded absences</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Total Approved Leaves
          </span>
          <div className="text-2xl font-extrabold text-[#F59E0B] mt-1">
            {totalLeave}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">On-leave entries</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
            Total Hours Worked
          </span>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">
            {Math.round(totalHoursSum * 10) / 10} <span className="text-sm font-semibold text-indigo-500">hrs</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Sum of worked hours</p>
        </div>
      </div>

      {/* Filter and Date Range Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Date presets & Range Inputs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              id="preset-this-month"
              onClick={() => handlePresetChange('this-month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preset === 'this-month'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              id="preset-last-7-days"
              onClick={() => handlePresetChange('last-7-days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preset === 'last-7-days'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              id="preset-last-30-days"
              onClick={() => handlePresetChange('last-30-days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preset === 'last-30-days'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              id="preset-custom"
              onClick={() => setPreset('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preset === 'custom'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }}
                className="bg-transparent border-none font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>
            <span className="text-slate-400 text-xs">to</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }}
                className="bg-transparent border-none font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Search, Dept, Status filters */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-report-search"
              type="text"
              placeholder="Filter by name, email, or EMP-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="select-report-dept" className="sr-only">Filter Department</label>
            <select
              id="select-report-dept"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <label htmlFor="select-report-status" className="sr-only">Filter Status</label>
            <select
              id="select-report-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Staff</option>
              <option value="active">Active Only</option>
              <option value="inactive">Archived Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('id')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('department')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dept</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3 text-center">
                  <span>Last 7 Days</span>
                  <div className="text-[10px] text-slate-400 font-normal lowercase">
                    (hover for date)
                  </div>
                </th>
                <th
                  className="px-5 py-3 text-center cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('present')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Present / Total</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 text-center cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('hours')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total Hours</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSortToggle('percentage')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Attendance %</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No attendance records for the selected criteria.
                  </td>
                </tr>
              ) : (
                sortedStats.map((item, index) => {
                  const emp = item.employee;
                  const rate = item.attendancePercentage;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      {/* ID */}
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-600">
                        {emp.id}
                      </td>

                      {/* Employee Info */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {emp.email}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {emp.department}
                        </span>
                      </td>

                      {/* Last 7 Days Color-Coded Dots */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {item.last7Days.map((d, dIdx) => {
                            let dotBg = 'bg-[#9CA3AF]'; // unmarked
                            let title = `${d.dayLabel} (${d.date}): Not Marked`;

                            if (d.status === 'present') {
                              dotBg = 'bg-[#10B981] ring-2 ring-emerald-200';
                              title = `${d.dayLabel} (${d.date}): Present`;
                            } else if (d.status === 'absent') {
                              dotBg = 'bg-[#EF4444] ring-2 ring-rose-200';
                              title = `${d.dayLabel} (${d.date}): Absent`;
                            } else if (d.status === 'on-leave') {
                              dotBg = 'bg-[#F59E0B] ring-2 ring-amber-200';
                              title = `${d.dayLabel} (${d.date}): On Leave`;
                            }

                            return (
                              <div
                                key={dIdx}
                                className={`w-3.5 h-3.5 rounded-full ${dotBg} transition-transform hover:scale-125 cursor-help`}
                                title={title}
                              />
                            );
                          })}
                        </div>
                      </td>

                      {/* Present / Total Days Breakdown */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="text-xs font-bold text-slate-800">
                          <span className="text-[#10B981]">{item.presentCount}</span> /{' '}
                          <span>{item.totalDays} days</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.absentCount} abs • {item.leaveCount} leave
                        </div>
                      </td>

                      {/* Total Hours Worked */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {Math.round(item.totalHours * 10) / 10} hrs
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {item.avgHoursPerDay} hrs/day
                        </div>
                      </td>

                      {/* Attendance Percentage */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                              rate >= 85
                                ? 'bg-emerald-50 text-[#10B981] border border-emerald-200'
                                : rate >= 65
                                ? 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                                : 'bg-rose-50 text-[#EF4444] border border-rose-200'
                            }`}
                          >
                            {rate}%
                          </span>
                        </div>
                      </td>

                      {/* View Calendar Action */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => onViewEmployeeCalendar(emp)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Open employee attendance calendar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Log</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Color Legend */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">7-Day Indicator Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
              Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
              Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
              On Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#9CA3AF]"></span>
              Not Marked
            </span>
          </div>

          <div className="text-slate-400">
            {sortedStats.length} staff records computed.
          </div>
        </div>
      </div>
    </div>
  );
};
