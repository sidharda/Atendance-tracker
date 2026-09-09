import React, { useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  AttendanceSettings,
  NavTab,
  ToastMessage,
} from './types';
import {
  getStoredEmployees,
  saveEmployees,
  getStoredAttendance,
  saveAttendance,
  getStoredDepartments,
  saveDepartments,
  getStoredSettings,
  saveSettings,
} from './utils/storage';
import { getDailyAttendanceStats, getTodayDateISO } from './utils/attendanceUtils';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MarkAttendanceView } from './components/MarkAttendanceView';
import { EmployeeDirectoryView } from './components/EmployeeDirectoryView';
import { AddEmployeeView } from './components/AddEmployeeView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import {
  EditEmployeeModal,
  ConfirmDialogModal,
  EmployeeCalendarModal,
} from './components/Modals';
import { ToastContainer } from './components/Toast';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data loaded from LocalStorage
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStoredAttendance());
  const [departments, setDepartments] = useState<string[]>(() => getStoredDepartments());
  const [settings, setSettings] = useState<AttendanceSettings>(() => getStoredSettings());

  // Date jump parameter for mark attendance
  const [markAttendanceDate, setMarkAttendanceDate] = useState<string>(getTodayDateISO());

  // Modals state
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const [employeeForCalendar, setEmployeeForCalendar] = useState<Employee | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Synchronize state changes to LocalStorage
  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveDepartments(departments);
  }, [departments]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Handle Attendance Save
  const handleSaveAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendance(updatedRecords);
    saveAttendance(updatedRecords);
  };

  // Handle Employee Add
  const handleAddEmployee = (newEmp: Employee) => {
    const updated = [newEmp, ...employees];
    setEmployees(updated);
    saveEmployees(updated);
  };

  // Handle Department Add
  const handleAddDepartment = (newDept: string) => {
    if (!departments.includes(newDept)) {
      const updated = [...departments, newDept];
      setDepartments(updated);
      saveDepartments(updated);
      addToast('info', `Added department: ${newDept}`);
    }
  };

  // Handle Employee Update
  const handleSaveEditedEmployee = (updatedEmp: Employee) => {
    const updated = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
    setEmployees(updated);
    saveEmployees(updated);
  };

  // Handle Toggle Active/Archived
  const handleToggleStatus = (emp: Employee) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    const actionLabel = newStatus === 'inactive' ? 'archive' : 'activate';

    setConfirmConfig({
      isOpen: true,
      title: `${newStatus === 'inactive' ? 'Archive' : 'Restore'} Employee?`,
      message: `Are you sure you want to ${actionLabel} ${emp.name} (${emp.id})? Inactive employees will not appear in daily attendance rolls.`,
      confirmLabel: newStatus === 'inactive' ? 'Yes, Archive' : 'Yes, Restore',
      confirmVariant: newStatus === 'inactive' ? 'warning' : 'primary',
      onConfirm: () => {
        const updated = employees.map((e) =>
          e.id === emp.id ? { ...e, status: newStatus } : e
        );
        setEmployees(updated);
        saveEmployees(updated);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        addToast(
          'info',
          `Employee ${emp.name} is now ${newStatus === 'inactive' ? 'archived' : 'active'}.`
        );
      },
    });
  };

  // Handle Employee Delete
  const handleDeleteEmployee = (emp: Employee) => {
    setConfirmConfig({
      isOpen: true,
      title: `Permanently Delete ${emp.name}?`,
      message: `This will permanently delete ${emp.name} (${emp.id}) and all of their historical attendance records. This action cannot be undone. You may also archive the employee instead.`,
      confirmLabel: 'Permanently Delete',
      confirmVariant: 'danger',
      onConfirm: () => {
        const updatedEmps = employees.filter((e) => e.id !== emp.id);
        const updatedAtt = attendance.filter((a) => a.employeeId !== emp.id);
        setEmployees(updatedEmps);
        setAttendance(updatedAtt);
        saveEmployees(updatedEmps);
        saveAttendance(updatedAtt);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        addToast('success', `Deleted employee ${emp.name} and purged related records.`);
      },
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setEditModalOpen(true);
  };

  // Open Calendar Modal
  const handleOpenCalendar = (emp: Employee) => {
    setEmployeeForCalendar(emp);
    setCalendarModalOpen(true);
  };

  // Jump from Dashboard to Mark Attendance on a specific date
  const handleJumpToMarkDate = (dateStr: string) => {
    setMarkAttendanceDate(dateStr);
    setCurrentTab('mark-attendance');
  };

  // Reset all data callback
  const handleDataReset = (newEmps: Employee[], newAtt: AttendanceRecord[]) => {
    setEmployees(newEmps);
    setAttendance(newAtt);
    setDepartments(getStoredDepartments());
    setSettings(getStoredSettings());
  };

  // Summary figures for Header and Sidebar
  const todayISO = getTodayDateISO();
  const todayStats = getDailyAttendanceStats(employees, attendance, todayISO);
  const activeCount = employees.filter((e) => e.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        activeEmployeesCount={activeCount}
        todayMarkedPercent={todayStats.percentage}
        companyName={settings.companyName}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
          totalEmployees={employees.length}
          activeEmployees={activeCount}
          todayMarkedPercent={todayStats.percentage}
          companyName={settings.companyName}
        />

        {/* Dynamic Main Content View */}
        <main
          id="main-content-area"
          className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0 transition-all"
        >
          {currentTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              attendance={attendance}
              departments={departments}
              onNavigate={setCurrentTab}
              onSelectMarkDate={handleJumpToMarkDate}
            />
          )}

          {currentTab === 'mark-attendance' && (
            <MarkAttendanceView
              employees={employees}
              attendance={attendance}
              departments={departments}
              initialDate={markAttendanceDate}
              onSaveAttendance={handleSaveAttendance}
              onNotify={addToast}
            />
          )}

          {currentTab === 'directory' && (
            <EmployeeDirectoryView
              employees={employees}
              departments={departments}
              onAddEmployeeClick={() => setCurrentTab('add-employee')}
              onEditEmployee={handleOpenEdit}
              onDeleteEmployee={handleDeleteEmployee}
              onToggleStatus={handleToggleStatus}
              onViewCalendar={handleOpenCalendar}
            />
          )}

          {currentTab === 'add-employee' && (
            <AddEmployeeView
              employees={employees}
              departments={departments}
              onAddEmployee={handleAddEmployee}
              onAddDepartment={handleAddDepartment}
              onNotify={addToast}
              onCancel={() => setCurrentTab('directory')}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              employees={employees}
              attendance={attendance}
              departments={departments}
              onViewEmployeeCalendar={handleOpenCalendar}
              onNotify={addToast}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onDataReset={handleDataReset}
              onNotify={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <EditEmployeeModal
        isOpen={editModalOpen}
        employee={employeeToEdit}
        departments={departments}
        allEmployees={employees}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEditedEmployee}
        onNotify={addToast}
      />

      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <EmployeeCalendarModal
        isOpen={calendarModalOpen}
        employee={employeeForCalendar}
        attendance={attendance}
        onClose={() => setCalendarModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
