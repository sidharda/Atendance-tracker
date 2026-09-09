import React, { useState, useRef } from 'react';
import { AttendanceSettings, Employee, AttendanceRecord } from '../types';
import {
  exportAllDataJSON,
  importAllDataJSON,
  resetAllDataToDemo,
} from '../utils/storage';
import {
  Settings,
  Building2,
  Calendar,
  Save,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCode,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AttendanceSettings;
  onUpdateSettings: (newSettings: AttendanceSettings) => void;
  onDataReset: (employees: Employee[], attendance: AttendanceRecord[]) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const ALL_WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
  onNotify,
}) => {
  const [companyName, setCompanyName] = useState<string>(settings.companyName);
  const [workingDays, setWorkingDays] = useState<string[]>(settings.workingDays);
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState<number>(settings.workingDaysPerMonth);
  const [defaultHoursPerDay, setDefaultHoursPerDay] = useState<number>(settings.defaultHoursPerDay ?? 8);
  const [autoSave, setAutoSave] = useState<boolean>(settings.autoSave);

  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleWorkDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length <= 1) {
        onNotify('warning', 'At least one working day must be active.');
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      onNotify('error', 'Company name cannot be empty.');
      return;
    }
    const updated: AttendanceSettings = {
      companyName: companyName.trim(),
      workingDays,
      workingDaysPerMonth: Number(workingDaysPerMonth) || 22,
      defaultHoursPerDay: Number(defaultHoursPerDay) || 8,
      autoSave,
    };
    onUpdateSettings(updated);
    onNotify('success', 'Application settings saved successfully!');
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Full system JSON backup downloaded.');
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = importAllDataJSON(text);
        if (result.success) {
          onNotify('success', result.message);
          window.location.reload(); // Reload to refresh all state cleanly
        } else {
          onNotify('error', result.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Demo Data
  const handleExecuteReset = () => {
    const demo = resetAllDataToDemo();
    onDataReset(demo.employees, demo.attendance);
    setConfirmResetOpen(false);
    onNotify('info', 'Reset database to clean initial demo data.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Preferences & Storage
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          System Settings & Backup
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure work shifts, branding, working calendar rules, and complete offline JSON backup/restore.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Branding & Work Rules
            </h3>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization / Company Name
              </label>
              <input
                id="input-settings-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Innovations Corp."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Working Days of Week */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Standard Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_WEEK_DAYS.map((day) => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleToggleWorkDay(day)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Selected days are counted as standard working schedule for statistics.
              </p>
            </div>

            {/* Working Days per Month & Hours per Day */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Standard Days / Month
                </label>
                <input
                  id="input-settings-days-per-month"
                  type="number"
                  min={1}
                  max={31}
                  value={workingDaysPerMonth}
                  onChange={(e) => setWorkingDaysPerMonth(parseInt(e.target.value) || 22)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Hours / Day
                </label>
                <input
                  id="input-settings-hours-per-day"
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={defaultHoursPerDay}
                  onChange={(e) => setDefaultHoursPerDay(parseFloat(e.target.value) || 8)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Auto-Save Behavior
                </label>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    id="checkbox-settings-autosave"
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="checkbox-settings-autosave"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Sync to LocalStorage
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                id="btn-save-settings"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Persistence & Backup Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              LocalStorage Backup & Restore
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All employee records and daily logs are stored in your browser's LocalStorage. You can export a full JSON snapshot or restore previous backups anytime.
            </p>

            {/* Export JSON */}
            <button
              id="btn-export-json-backup"
              type="button"
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Full JSON Backup</span>
            </button>

            {/* Import JSON */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="input-file-backup"
              />
              <button
                id="btn-trigger-import-json"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Import JSON Backup File</span>
              </button>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Reset to Demo */}
            <div>
              <button
                id="btn-open-reset-modal"
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset to Clean Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {confirmResetOpen && (
        <div
          id="modal-confirm-reset"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Reset to Demo Data?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                This will reset your local database with default sample employees and attendance history. Any custom employees created in this browser will be replaced.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                id="btn-cancel-reset"
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reset"
                type="button"
                onClick={handleExecuteReset}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
