import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceMarkStatus } from '../types';
import { formatDateISO, getStoredAttendance } from '../utils/storage';
import {
  X,
  AlertTriangle,
  Calendar,
  Save,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Plane,
} from 'lucide-react';

/* =========================================================================
   1. EDIT EMPLOYEE MODAL
   ========================================================================= */
interface EditEmployeeModalProps {
  employee: Employee | null;
  departments: string[];
  allEmployees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  departments,
  allEmployees,
  isOpen,
  onClose,
  onSave,
  onNotify,
}) => {
  if (!isOpen || !employee) return null;

  const [name, setName] = useState<string>(employee.name);
  const [department, setDepartment] = useState<string>(employee.department);
  const [email, setEmail] = useState<string>(employee.email);
  const [phone, setPhone] = useState<string>(employee.phone || '');
  const [joiningDate, setJoiningDate] = useState<string>(employee.joiningDate);
  const [status, setStatus] = useState<'active' | 'inactive'>(employee.status);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setDepartment(employee.department);
      setEmail(employee.email);
      setPhone(employee.phone || '');
      setJoiningDate(employee.joiningDate);
      setStatus(employee.status);
      setErrors({});
    }
  }, [employee]);

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Name is required.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Invalid email format.';
    } else if (
      allEmployees.some(
        (e) => e.id !== employee.id && e.email.toLowerCase() === email.trim().toLowerCase()
      )
    ) {
      errs.email = 'Email already taken by another employee.';
    }

    if (phone.trim()) {
      const clean = phone.replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(clean)) {
        errs.phone = 'Phone must be exactly 10 digits.';
      }
    }

    if (!joiningDate) errs.joiningDate = 'Joining date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated: Employee = {
      ...employee,
      name: name.trim(),
      department,
      email: email.trim().toLowerCase(),
      phone: phone.trim() ? phone.replace(/[\s-]/g, '') : undefined,
      joiningDate,
      status,
    };

    onSave(updated);
    onNotify('success', `Employee ${updated.name} successfully updated.`);
    onClose();
  };

  return (
    <div
      id="modal-edit-employee"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative">
        <button
          id="btn-close-edit-modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          aria-label="Close edit dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            {employee.id}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Employee</h3>
            <p className="text-xs text-slate-500 font-mono">ID: {employee.id}</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone (10 digits)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Joining Date *
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <div className="flex items-center gap-4 mt-1">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="edit-status"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Active</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="edit-status"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                />
                <span>Inactive (Archived)</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-edit-employee"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   2. CONFIRMATION DIALOG MODAL
   ========================================================================= */
interface ConfirmDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-confirmation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
            confirmVariant === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : confirmVariant === 'warning'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : confirmVariant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. INDIVIDUAL EMPLOYEE ATTENDANCE CALENDAR MODAL
   ========================================================================= */
interface EmployeeCalendarModalProps {
  employee: Employee | null;
  attendance: AttendanceRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeCalendarModal: React.FC<EmployeeCalendarModalProps> = ({
  employee,
  attendance,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());

  // Filter attendance for this employee
  const empRecords = attendance.filter((a) => a.employeeId === employee.id);
  const recordMap = new Map<string, AttendanceRecord>();
  empRecords.forEach((r) => recordMap.set(r.date, r));

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Build days in month
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Statistics for this month
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let workingDaysCount = 0;
  let totalHoursMonth = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend) workingDaysCount++;

    const dateStr = formatDateISO(d);
    const rec = recordMap.get(dateStr);
    if (rec) {
      if (rec.status === 'present') {
        presentDays++;
        totalHoursMonth += typeof rec.hours === 'number' ? rec.hours : 8;
      } else if (rec.status === 'absent') {
        absentDays++;
      } else if (rec.status === 'on-leave') {
        leaveDays++;
      }
    }
  }

  const recordedTotal = presentDays + absentDays + leaveDays;
  const attendanceRate = recordedTotal > 0 ? Math.round((presentDays / recordedTotal) * 100) : 0;

  return (
    <div
      id="modal-employee-calendar"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          aria-label="Close calendar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
            {employee.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {employee.name} — Attendance Calendar
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {employee.id} • {employee.department} • Joined: {employee.joiningDate}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
            <p className="text-base font-extrabold text-blue-600">{attendanceRate}%</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700">Present</span>
            <p className="text-base font-extrabold text-[#10B981]">{presentDays}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-700">Absent</span>
            <p className="text-base font-extrabold text-[#EF4444]">{absentDays}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700">On Leave</span>
            <p className="text-base font-extrabold text-[#F59E0B]">{leaveDays}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-700">Total Hours</span>
            <p className="text-base font-extrabold text-indigo-700">{Math.round(totalHoursMonth * 10) / 10}h</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between pt-1">
          <h4 className="text-sm font-bold text-slate-800">{monthName}</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 rounded-lg bg-slate-50/40" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = new Date(currentYear, currentMonth, day);
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const dateStr = formatDateISO(d);
              const rec = recordMap.get(dateStr);

              let bg = 'bg-slate-50 text-slate-700 border-slate-200';
              let badgeText = '';

              if (rec) {
                if (rec.status === 'present') {
                  bg = 'bg-emerald-50 text-[#10B981] border-emerald-300 font-bold';
                  const hrs = typeof rec.hours === 'number' ? rec.hours : 8;
                  badgeText = `${hrs}h`;
                } else if (rec.status === 'absent') {
                  bg = 'bg-rose-50 text-[#EF4444] border-rose-300 font-bold';
                  badgeText = 'A';
                } else if (rec.status === 'on-leave') {
                  bg = 'bg-amber-50 text-[#F59E0B] border-amber-300 font-bold';
                  badgeText = 'L';
                }
              } else if (isWeekend) {
                bg = 'bg-slate-100/60 text-slate-400 border-transparent';
                badgeText = 'W';
              }

              const tooltipHours = rec?.status === 'present' ? ` (${rec.hours ?? 8} hrs)` : '';

              return (
                <div
                  key={day}
                  className={`h-11 rounded-xl border p-1 flex flex-col items-center justify-between text-xs transition-all ${bg}`}
                  title={`${dateStr}: ${rec ? rec.status : isWeekend ? 'Weekend' : 'Not marked'}${tooltipHours}`}
                >
                  <span className="font-semibold text-[11px] leading-none">{day}</span>
                  <span className="text-[10px] font-mono font-bold uppercase">{badgeText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            P = Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
            A = Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            L = On Leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            W = Weekend / Unmarked
          </span>
        </div>
      </div>
    </div>
  );
};
