import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, AttendanceMarkStatus } from '../types';
import {
  getTodayDateISO,
  formatFriendlyDate,
  getDayName,
  getPast30Days,
  getNextAttendanceId,
} from '../utils/attendanceUtils';
import {
  Calendar,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Plane,
  X,
} from 'lucide-react';

interface MarkAttendanceViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  departments: string[];
  initialDate?: string;
  onSaveAttendance: (updatedRecords: AttendanceRecord[]) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

interface DayRecordEntry {
  status: AttendanceMarkStatus;
  hours: number;
  markedAt?: string;
  id?: string;
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  employees,
  attendance,
  departments,
  initialDate,
  onSaveAttendance,
  onNotify,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayDateISO());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  
  // Local working state for records for the selected date
  // Key: employeeId -> { status, hours, markedAt, markedBy, id }
  const [dayRecords, setDayRecords] = useState<Map<string, DayRecordEntry>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<Map<string, AttendanceMarkStatus>>(new Map());
  const [undoHistory, setUndoHistory] = useState<Map<string, DayRecordEntry> | null>(null);

  const past30 = getPast30Days();
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const friendlyDate = formatFriendlyDate(selectedDate);
  const dayName = getDayName(selectedDate);
  const isToday = selectedDate === getTodayDateISO();

  // Synchronize local state when selectedDate or attendance changes
  useEffect(() => {
    const existing = attendance.filter((a) => a.date === selectedDate);
    const map = new Map<string, DayRecordEntry>();
    const snapshot = new Map<string, AttendanceMarkStatus>();

    activeEmployees.forEach((emp) => {
      const rec = existing.find((r) => r.employeeId === emp.id);
      if (rec) {
        const hrs = typeof rec.hours === 'number' ? rec.hours : (rec.status === 'present' ? 8 : 0);
        map.set(emp.id, { status: rec.status, hours: hrs, markedAt: rec.markedAt, id: rec.id });
        snapshot.set(emp.id, rec.status);
      } else {
        map.set(emp.id, { status: 'unmarked', hours: 0 });
        snapshot.set(emp.id, 'unmarked');
      }
    });

    setDayRecords(map);
    setLastSavedSnapshot(snapshot);
    setHasUnsavedChanges(false);
    setSelectedEmployeeIds(new Set());
    setUndoHistory(null);
  }, [selectedDate, attendance, employees]);

  // Filtered employees for display
  const filteredEmployees = activeEmployees.filter((emp) => {
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

  // Calculate summary for this screen
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let unmarkedCount = 0;
  let totalHoursToday = 0;

  activeEmployees.forEach((emp) => {
    const rec = dayRecords.get(emp.id);
    const status = rec ? rec.status : 'unmarked';
    const hrs = rec ? rec.hours : 0;
    if (status === 'present') {
      presentCount++;
      totalHoursToday += hrs;
    } else if (status === 'absent') {
      absentCount++;
      totalHoursToday += hrs;
    } else if (status === 'on-leave') {
      leaveCount++;
      totalHoursToday += hrs;
    } else {
      unmarkedCount++;
    }
  });

  // Save current state for undo before applying modifications
  const captureUndoState = () => {
    const clone = new Map<string, DayRecordEntry>();
    dayRecords.forEach((v, k) => clone.set(k, { ...v }));
    setUndoHistory(clone);
  };

  // Update single employee status
  const handleSetStatus = (empId: string, newStatus: AttendanceMarkStatus) => {
    captureUndoState();
    const next = new Map<string, DayRecordEntry>(dayRecords);
    const existing = next.get(empId);
    const nowISO = new Date().toISOString();

    let newHours = existing?.hours ?? 0;
    if (newStatus === 'present' && (newHours === 0 || !existing)) {
      newHours = 8;
    } else if (newStatus === 'absent' || newStatus === 'unmarked') {
      newHours = 0;
    }

    next.set(empId, {
      status: newStatus,
      hours: newHours,
      markedAt: newStatus === 'unmarked' ? undefined : nowISO,
      id: existing?.id,
    });

    setDayRecords(next);
    setHasUnsavedChanges(true);
  };

  // Update single employee hours
  const handleSetHours = (empId: string, hours: number) => {
    captureUndoState();
    const next = new Map<string, DayRecordEntry>(dayRecords);
    const existing = next.get(empId);
    const nowISO = new Date().toISOString();
    const safeHours = Math.max(0, Math.min(24, Math.round(hours * 10) / 10));

    let newStatus = existing?.status || 'unmarked';
    if (safeHours > 0 && newStatus === 'unmarked') {
      newStatus = 'present';
    }

    next.set(empId, {
      status: newStatus,
      hours: safeHours,
      markedAt: newStatus === 'unmarked' ? undefined : (existing?.markedAt || nowISO),
      id: existing?.id,
    });

    setDayRecords(next);
    setHasUnsavedChanges(true);
  };

  // Checkbox selection
  const handleToggleSelect = (empId: string) => {
    const next = new Set(selectedEmployeeIds);
    if (next.has(empId)) next.delete(empId);
    else next.add(empId);
    setSelectedEmployeeIds(next);
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.size === filteredEmployees.length) {
      setSelectedEmployeeIds(new Set());
    } else {
      const allIds = new Set(filteredEmployees.map((e) => e.id));
      setSelectedEmployeeIds(allIds);
    }
  };

  // Bulk status update
  const handleBulkSetStatus = (status: AttendanceMarkStatus) => {
    const targetIds = selectedEmployeeIds.size > 0
      ? Array.from(selectedEmployeeIds)
      : filteredEmployees.map((e) => e.id);

    if (targetIds.length === 0) {
      onNotify('info', 'No employees selected or matching criteria.');
      return;
    }

    captureUndoState();
    const next = new Map<string, DayRecordEntry>(dayRecords);
    const nowISO = new Date().toISOString();

    targetIds.forEach((id) => {
      const cur = next.get(id);
      let newHours = cur?.hours ?? 0;
      if (status === 'present' && newHours === 0) {
        newHours = 8;
      } else if (status === 'absent' || status === 'unmarked') {
        newHours = 0;
      }

      next.set(id, {
        status,
        hours: newHours,
        markedAt: status === 'unmarked' ? undefined : nowISO,
        id: cur?.id,
      });
    });

    setDayRecords(next);
    setHasUnsavedChanges(true);
    onNotify(
      'info',
      `Marked ${targetIds.length} employee${targetIds.length > 1 ? 's' : ''} as ${
        status === 'unmarked' ? 'Not Marked' : status.toUpperCase()
      }`
    );
  };

  // Bulk hours update
  const handleBulkSetHours = (hours: number) => {
    const targetIds = selectedEmployeeIds.size > 0
      ? Array.from(selectedEmployeeIds)
      : filteredEmployees.map((e) => e.id);

    if (targetIds.length === 0) {
      onNotify('info', 'No employees selected or matching criteria.');
      return;
    }

    captureUndoState();
    const next = new Map<string, DayRecordEntry>(dayRecords);
    const nowISO = new Date().toISOString();
    const safeHours = Math.max(0, Math.min(24, hours));

    targetIds.forEach((id) => {
      const cur = next.get(id);
      const newStatus = cur?.status === 'unmarked' || !cur ? (safeHours > 0 ? 'present' : 'unmarked') : cur.status;
      next.set(id, {
        status: newStatus,
        hours: safeHours,
        markedAt: cur?.markedAt || nowISO,
        id: cur?.id,
      });
    });

    setDayRecords(next);
    setHasUnsavedChanges(true);
    onNotify('info', `Set ${safeHours} hours for ${targetIds.length} employee${targetIds.length > 1 ? 's' : ''}.`);
  };

  // Undo last action
  const handleUndo = () => {
    if (!undoHistory) return;
    setDayRecords(undoHistory);
    setUndoHistory(null);
    setHasUnsavedChanges(true);
    onNotify('info', 'Reverted last change.');
  };

  // Save changes to LocalStorage
  const handleSave = () => {
    // Keep records for all other dates
    const otherRecords = attendance.filter((a) => a.date !== selectedDate);
    const newDayRecords: AttendanceRecord[] = [];

    dayRecords.forEach((val, empId) => {
      if (val.status !== 'unmarked') {
        newDayRecords.push({
          id: val.id || getNextAttendanceId([...otherRecords, ...newDayRecords]),
          employeeId: empId,
          date: selectedDate,
          status: val.status as AttendanceStatus,
          hours: typeof val.hours === 'number' ? val.hours : (val.status === 'present' ? 8 : 0),
          markedAt: val.markedAt || new Date().toISOString(),
          markedBy: 'admin',
        });
      }
    });

    const combined = [...otherRecords, ...newDayRecords];
    onSaveAttendance(combined);
    setHasUnsavedChanges(false);

    // Update snapshot
    const snapshot = new Map<string, AttendanceMarkStatus>();
    dayRecords.forEach((v, k) => snapshot.set(k, v.status));
    setLastSavedSnapshot(snapshot);

    onNotify('success', `Attendance and hours for ${friendlyDate} successfully saved to LocalStorage!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Selection Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5" />
                Attendance Entry
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Today's Roll
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Mark Daily Attendance
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select date (past 30 days supported), toggle individual statuses or execute bulk updates.
            </p>
          </div>

          {/* Date Selector & Quick Jump */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <label htmlFor="mark-attendance-date-picker" className="sr-only">Attendance Date</label>
              <input
                id="mark-attendance-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Past 30 Days Dropdown */}
            <label htmlFor="select-past-30-days" className="sr-only">Quick past 30 days selector</label>
            <select
              id="select-past-30-days"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer"
            >
              {past30.map((d) => (
                <option key={d.dateStr} value={d.dateStr}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Save Button */}
            <button
              id="btn-save-attendance"
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl shadow-xs transition-all ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>

            {/* Undo Button */}
            {undoHistory && (
              <button
                id="btn-undo-attendance"
                onClick={handleUndo}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Undo last modification"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Status Bar for Selected Day */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">
              {friendlyDate} ({dayName})
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              {presentCount} Present
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
              {absentCount} Absent
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              {leaveCount} On Leave
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-[#9CA3AF]"></span>
              {unmarkedCount} Not Marked
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              <Clock className="w-3.5 h-3.5" />
              {Math.round(totalHoursToday * 10) / 10} Total Hours
            </span>
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 text-amber-600 font-semibold text-xs animate-bounce">
              <Info className="w-3.5 h-3.5" />
              <span>Unsaved changes in this session</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <input
              id="checkbox-select-all"
              type="checkbox"
              checked={
                filteredEmployees.length > 0 &&
                selectedEmployeeIds.size === filteredEmployees.length
              }
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="checkbox-select-all"
              className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
            >
              {selectedEmployeeIds.size > 0
                ? `${selectedEmployeeIds.size} Selected`
                : 'Select All'}
            </label>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Bulk status buttons with EXACT colors requested */}
          <button
            id="btn-bulk-present"
            onClick={() => handleBulkSetStatus('present')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-[#10B981] hover:bg-emerald-600 shadow-xs transition-colors"
          >
            Mark {selectedEmployeeIds.size > 0 ? 'Selected' : 'All'} Present
          </button>

          <button
            id="btn-bulk-absent"
            onClick={() => handleBulkSetStatus('absent')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-[#EF4444] hover:bg-rose-600 shadow-xs transition-colors"
          >
            Mark {selectedEmployeeIds.size > 0 ? 'Selected' : 'All'} Absent
          </button>

          <button
            id="btn-bulk-leave"
            onClick={() => handleBulkSetStatus('on-leave')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-[#F59E0B] hover:bg-amber-600 shadow-xs transition-colors"
          >
            Mark {selectedEmployeeIds.size > 0 ? 'Selected' : 'All'} On Leave
          </button>

          <button
            id="btn-bulk-unmark"
            onClick={() => handleBulkSetStatus('unmarked')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Clear / Unmark
          </button>

          {/* Quick Hours Bulk Operations */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 sm:border-l border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Hours:</span>
            <button
              id="btn-bulk-8h"
              type="button"
              onClick={() => handleBulkSetHours(8)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              title="Set 8 working hours for selected/all"
            >
              All 8h
            </button>
            <button
              id="btn-bulk-4h"
              type="button"
              onClick={() => handleBulkSetHours(4)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
              title="Set 4 half-day hours for selected/all"
            >
              All 4h
            </button>
          </div>
        </div>

        {/* Search & Department Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-marking"
              type="text"
              placeholder="Search staff or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          <label htmlFor="select-marking-dept" className="sr-only">Filter by Department</label>
          <select
            id="select-marking-dept"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden cursor-pointer font-medium"
          >
            <option value="all">All Depts</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Attendance Marking List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3">Employee Details</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Set Status ({dayName})</th>
                <th className="px-4 py-3 text-center">Hours Worked</th>
                <th className="px-4 py-3 text-right">Last Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No active employees found.</p>
                    <p className="text-xs mt-1">Try adjusting the search query or department filter.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const record = dayRecords.get(emp.id);
                  const currentStatus = record ? record.status : 'unmarked';
                  const isSelected = selectedEmployeeIds.has(emp.id);

                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/40'
                          : index % 2 === 1
                          ? 'bg-slate-50/30'
                          : 'bg-white'
                      } hover:bg-slate-50/80`}
                    >
                      {/* Checkbox */}
                      <td className="w-12 px-4 py-3 text-center">
                        <input
                          id={`checkbox-emp-${emp.id}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(emp.id)}
                          className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {emp.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {emp.id} • {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {emp.department}
                        </span>
                      </td>

                      {/* 4 Status Toggle Buttons */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 gap-1">
                          {/* Present Button (#10B981) */}
                          <button
                            id={`btn-status-present-${emp.id}`}
                            onClick={() => handleSetStatus(emp.id, 'present')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === 'present'
                                ? 'bg-[#10B981] text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          {/* Absent Button (#EF4444) */}
                          <button
                            id={`btn-status-absent-${emp.id}`}
                            onClick={() => handleSetStatus(emp.id, 'absent')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-[#EF4444] text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-white/80'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          {/* On Leave Button (#F59E0B) */}
                          <button
                            id={`btn-status-leave-${emp.id}`}
                            onClick={() => handleSetStatus(emp.id, 'on-leave')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === 'on-leave'
                                ? 'bg-[#F59E0B] text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-white/80'
                            }`}
                          >
                            <Plane className="w-3.5 h-3.5" />
                            <span>On Leave</span>
                          </button>

                          {/* Not Marked Button (#9CA3AF) */}
                          <button
                            id={`btn-status-unmark-${emp.id}`}
                            onClick={() => handleSetStatus(emp.id, 'unmarked')}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              currentStatus === 'unmarked'
                                ? 'bg-[#9CA3AF] text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                            }`}
                            title="Reset to unmarked"
                          >
                            Not Marked
                          </button>
                        </div>
                      </td>

                      {/* Hours Worked Controller */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white transition-all">
                            <input
                              id={`input-hours-${emp.id}`}
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              value={record?.hours ?? (currentStatus === 'present' ? 8 : 0)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                handleSetHours(emp.id, isNaN(val) ? 0 : val);
                              }}
                              className="w-11 text-center font-bold text-xs bg-transparent border-none focus:outline-hidden text-slate-800"
                              title="Hours worked for this date"
                            />
                            <span className="text-[11px] text-slate-400 font-medium select-none">hrs</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              id={`btn-hours-8h-${emp.id}`}
                              onClick={() => handleSetHours(emp.id, 8)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                                record?.hours === 8
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Set standard 8 hours"
                            >
                              8h
                            </button>
                            <button
                              type="button"
                              id={`btn-hours-4h-${emp.id}`}
                              onClick={() => handleSetHours(emp.id, 4)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                                record?.hours === 4
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Set half-day 4 hours"
                            >
                              4h
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500">
                        {record?.markedAt ? (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(record.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Showing {filteredEmployees.length} of {activeEmployees.length} active employees.
            {hasUnsavedChanges && ' Remember to save changes.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-footer-save-attendance"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Attendance Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
