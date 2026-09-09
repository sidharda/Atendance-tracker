import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { getNextEmployeeId } from '../utils/attendanceUtils';
import { getTodayDateISO } from '../utils/attendanceUtils';
import {
  UserPlus,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  IdCard,
} from 'lucide-react';

interface AddEmployeeViewProps {
  employees: Employee[];
  departments: string[];
  onAddEmployee: (newEmployee: Employee) => void;
  onAddDepartment: (newDept: string) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onCancel?: () => void;
}

export const AddEmployeeView: React.FC<AddEmployeeViewProps> = ({
  employees,
  departments,
  onAddEmployee,
  onAddDepartment,
  onNotify,
  onCancel,
}) => {
  const [empId, setEmpId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [department, setDepartment] = useState<string>(departments[0] || 'IT');
  const [customDept, setCustomDept] = useState<string>('');
  const [showCustomDept, setShowCustomDept] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>(getTodayDateISO());
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto-generate employee ID
  useEffect(() => {
    const nextId = getNextEmployeeId(employees);
    setEmpId(nextId);
  }, [employees]);

  // Form validation
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // ID check
    if (!empId.trim()) {
      newErrors.empId = 'Employee ID is required.';
    } else if (!/^EMP-\d{3,}$/i.test(empId.trim())) {
      newErrors.empId = 'Format must be EMP-001 or EMP-XXX.';
    } else if (employees.some((e) => e.id.toLowerCase() === empId.trim().toLowerCase())) {
      newErrors.empId = `Employee ID ${empId} already exists.`;
    }

    // Name check
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must have at least 2 characters.';
    }

    // Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g. name@company.com).';
    } else if (employees.some((e) => e.email.toLowerCase() === email.trim().toLowerCase())) {
      newErrors.email = 'This email address is already registered to another staff member.';
    }

    // Phone check (optional, but if provided must be 10 digits)
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      }
    }

    // Department check
    if (showCustomDept && !customDept.trim()) {
      newErrors.customDept = 'Please specify custom department name.';
    }

    // Joining date check
    if (!joiningDate) {
      newErrors.joiningDate = 'Joining date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      onNotify('error', 'Please resolve highlighted validation errors before submitting.');
      return;
    }

    let finalDept = department;
    if (showCustomDept && customDept.trim()) {
      finalDept = customDept.trim();
      if (!departments.includes(finalDept)) {
        onAddDepartment(finalDept);
      }
    }

    const newEmp: Employee = {
      id: empId.trim().toUpperCase(),
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() ? phone.replace(/[\s-]/g, '') : undefined,
      department: finalDept,
      joiningDate,
      status,
      createdAt: new Date().toISOString(),
    };

    onAddEmployee(newEmp);
    onNotify('success', `Employee ${newEmp.name} (${newEmp.id}) successfully added!`);

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    const nextId = getNextEmployeeId(employees);
    setEmpId(nextId);
    setFullName('');
    setDepartment(departments[0] || 'IT');
    setCustomDept('');
    setShowCustomDept(false);
    setEmail('');
    setPhone('');
    setJoiningDate(getTodayDateISO());
    setStatus('active');
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Onboarding
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Register New Employee
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Add an employee to the directory with automatic ID generation, strict field validation, and duplicate checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Employee ID & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-emp-id"
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="EMP-001"
                    className={`w-full px-3.5 py-2.5 text-sm font-mono font-semibold rounded-xl border bg-slate-50 focus:outline-hidden focus:ring-2 ${
                      errors.empId
                        ? 'border-rose-300 ring-rose-200'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setEmpId(getNextEmployeeId(employees))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                    title="Generate next available ID"
                  >
                    Auto
                  </button>
                </div>
                {errors.empId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.empId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="emp-status"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active Staff</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="emp-status"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="w-4 h-4 text-slate-500 focus:ring-slate-500"
                    />
                    <span>Inactive / Archived</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 2: Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-emp-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-hidden focus:ring-2 ${
                  errors.fullName
                    ? 'border-rose-300 ring-rose-200'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Row 3: Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              {!showCustomDept ? (
                <div className="flex gap-2">
                  <select
                    id="select-emp-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomDept(true)}
                    className="px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
                  >
                    + New Dept
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="input-custom-department"
                    type="text"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="Enter custom department name"
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomDept(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {errors.customDept && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.customDept}
                </p>
              )}
            </div>

            {/* Row 4: Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-emp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eleanor@company.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-hidden focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 ring-rose-200'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone (10 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-emp-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={14}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:outline-hidden focus:ring-2 ${
                      errors.phone
                        ? 'border-rose-300 ring-rose-200'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Row 5: Joining Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-emp-joining-date"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                />
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                id="btn-clear-add-form"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Form</span>
              </button>

              <div className="flex items-center gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  id="btn-submit-add-employee"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Save Employee</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live ID Badge Preview */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Staff Pass
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {fullName
                  ? fullName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'ID'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {fullName.trim() || 'Employee Name'}
                </h3>
                <p className="text-xs font-mono text-blue-300">
                  {empId || 'EMP-000'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-700/60 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-200">
                  {showCustomDept && customDept ? customDept : department}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200 truncate max-w-[170px]">
                  {email.trim() || 'email@company.com'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joining Date:</span>
                <span className="font-mono text-slate-200">{joiningDate}</span>
              </div>
            </div>
          </div>

          {/* Validation Requirements Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Validation Checklist
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Auto-assigned unique Employee ID format (EMP-XXX)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Email format validation & duplicate prevention
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Phone validation (10 digits if provided)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Instant local storage persistence
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
