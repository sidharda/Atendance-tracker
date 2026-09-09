import React, { useState } from 'react';
import { Employee } from '../types';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Calendar,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  MoreVertical,
} from 'lucide-react';

interface EmployeeDirectoryViewProps {
  employees: Employee[];
  departments: string[];
  onAddEmployeeClick: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
  onViewCalendar: (employee: Employee) => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  departments,
  onAddEmployeeClick,
  onEditEmployee,
  onDeleteEmployee,
  onToggleStatus,
  onViewCalendar,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'department' | 'joiningDate'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter employees
  const filtered = employees.filter((emp) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.id.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchPhone = emp.phone?.includes(q) || false;
      if (!matchName && !matchId && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  // Sort employees
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'id') {
      comp = a.id.localeCompare(b.id, undefined, { numeric: true });
    } else if (sortBy === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (sortBy === 'department') {
      comp = a.department.localeCompare(b.department);
    } else if (sortBy === 'joiningDate') {
      comp = a.joiningDate.localeCompare(b.joiningDate);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const handleSort = (field: 'id' | 'name' | 'department' | 'joiningDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const activeCount = employees.filter((e) => e.status === 'active').length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Staff Records
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage profiles, update contact information, toggle active/inactive status, or view attendance history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-directory-add-employee"
            onClick={onAddEmployeeClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-directory"
            type="text"
            placeholder="Search by name, ID (EMP-001), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              id="tab-status-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({employees.length})
            </button>
            <button
              id="tab-status-active"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              id="tab-status-inactive"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Archived ({inactiveCount})
            </button>
          </div>

          {/* Department Filter */}
          <label htmlFor="select-directory-dept" className="sr-only">Filter by Department</label>
          <select
            id="select-directory-dept"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee ID</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Full Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3">Contact</th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('joiningDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Joining Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-600">No employees match criteria</p>
                    <p className="text-xs mt-1">Try resetting the search terms or department filters.</p>
                  </td>
                </tr>
              ) : (
                sorted.map((emp, index) => (
                  <tr
                    key={emp.id}
                    id={`row-emp-${emp.id}`}
                    onDoubleClick={() => onEditEmployee(emp)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                    title="Double-click to edit details"
                  >
                    {/* ID */}
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-600">
                      {emp.id}
                    </td>

                    {/* Name */}
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
                          <div className="text-xs text-slate-500 font-mono">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {emp.department}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div>{emp.phone || 'No phone'}</div>
                    </td>

                    {/* Joining Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                      {emp.joiningDate}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Archived
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Attendance History Calendar */}
                        <button
                          id={`btn-calendar-emp-${emp.id}`}
                          onClick={() => onViewCalendar(emp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Attendance Calendar"
                          aria-label={`View attendance calendar for ${emp.name}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </button>

                        {/* Edit Employee */}
                        <button
                          id={`btn-edit-emp-${emp.id}`}
                          onClick={() => onEditEmployee(emp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Employee Details"
                          aria-label={`Edit ${emp.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Toggle Active/Archive */}
                        <button
                          id={`btn-toggle-status-emp-${emp.id}`}
                          onClick={() => onToggleStatus(emp)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            emp.status === 'active'
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.status === 'active' ? 'Archive Employee' : 'Restore Employee'}
                          aria-label={emp.status === 'active' ? `Archive ${emp.name}` : `Restore ${emp.name}`}
                        >
                          {emp.status === 'active' ? (
                            <Archive className="w-4 h-4" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete Employee */}
                        <button
                          id={`btn-delete-emp-${emp.id}`}
                          onClick={() => onDeleteEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Employee Record"
                          aria-label={`Delete ${emp.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {sorted.length} of {employees.length} total staff records.
          </span>
          <span className="hidden sm:inline">
            Double-click any row to edit employee profile.
          </span>
        </div>
      </div>
    </div>
  );
};
