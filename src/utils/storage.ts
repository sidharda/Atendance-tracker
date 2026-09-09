import { Employee, AttendanceRecord, AttendanceSettings } from '../types';

export const STORAGE_KEYS = {
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  DEPARTMENTS: 'departments',
  SETTINGS: 'attendance_settings',
} as const;

export const DEFAULT_DEPARTMENTS: string[] = [
  'IT',
  'HR',
  'Finance',
  'Operations',
  'Marketing',
];

export const DEFAULT_SETTINGS: AttendanceSettings = {
  companyName: 'Apex Innovations Corp.',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workingDaysPerMonth: 22,
  defaultHoursPerDay: 8,
  autoSave: true,
};

// Helper to format date string YYYY-MM-DD
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate realistic initial seed demo data
export function generateSeedData(): { employees: Employee[]; attendance: AttendanceRecord[] } {
  const today = new Date();
  
  const employees: Employee[] = [
    {
      id: 'EMP-001',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@company.com',
      phone: '9876543210',
      department: 'IT',
      joiningDate: '2023-01-15',
      status: 'active',
      createdAt: '2023-01-15T09:00:00.000Z',
    },
    {
      id: 'EMP-002',
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      phone: '9876543211',
      department: 'IT',
      joiningDate: '2023-03-20',
      status: 'active',
      createdAt: '2023-03-20T09:00:00.000Z',
    },
    {
      id: 'EMP-003',
      name: 'Elena Rodriguez',
      email: 'elena.rodriguez@company.com',
      phone: '9876543212',
      department: 'HR',
      joiningDate: '2022-11-01',
      status: 'active',
      createdAt: '2022-11-01T09:00:00.000Z',
    },
    {
      id: 'EMP-004',
      name: 'David Kim',
      email: 'david.kim@company.com',
      phone: '9876543213',
      department: 'Finance',
      joiningDate: '2023-06-10',
      status: 'active',
      createdAt: '2023-06-10T09:00:00.000Z',
    },
    {
      id: 'EMP-005',
      name: 'Aisha Patel',
      email: 'aisha.patel@company.com',
      phone: '9876543214',
      department: 'Operations',
      joiningDate: '2023-08-01',
      status: 'active',
      createdAt: '2023-08-01T09:00:00.000Z',
    },
    {
      id: 'EMP-006',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      phone: '9876543215',
      department: 'Marketing',
      joiningDate: '2024-02-14',
      status: 'active',
      createdAt: '2024-02-14T09:00:00.000Z',
    },
    {
      id: 'EMP-007',
      name: 'Amanda Taylor',
      email: 'amanda.taylor@company.com',
      phone: '9876543216',
      department: 'Finance',
      joiningDate: '2024-04-05',
      status: 'active',
      createdAt: '2024-04-05T09:00:00.000Z',
    },
    {
      id: 'EMP-008',
      name: 'Robert Garcia',
      email: 'robert.garcia@company.com',
      phone: '9876543217',
      department: 'Operations',
      joiningDate: '2022-05-18',
      status: 'inactive',
      createdAt: '2022-05-18T09:00:00.000Z',
    },
  ];

  const attendance: AttendanceRecord[] = [];
  let attCounter = 1;

  // Generate attendance for the past 14 days (skipping weekends or setting status)
  for (let i = 14; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      continue; // Skip weekends for attendance records
    }

    const dateStr = formatDateISO(targetDate);

    employees.forEach((emp, empIndex) => {
      if (emp.status !== 'active') return;

      // Seed realistic distribution: mostly present, occasionally on-leave or absent
      let status: 'present' | 'absent' | 'on-leave' = 'present';

      if (i === 0) {
        // For today: make most present, 1 absent, 1 on-leave
        if (empIndex === 2) status = 'on-leave';
        else if (empIndex === 4) status = 'absent';
        else status = 'present';
      } else {
        const seedValue = (empIndex * 7 + i * 3) % 20;
        if (seedValue === 3 || seedValue === 11) {
          status = 'on-leave';
        } else if (seedValue === 7 || seedValue === 17) {
          status = 'absent';
        } else {
          status = 'present';
        }
      }

      const paddedId = String(attCounter++).padStart(3, '0');
      const hours = status === 'present' ? (empIndex % 4 === 0 ? 8.5 : empIndex % 3 === 0 ? 7.5 : 8) : 0;
      attendance.push({
        id: `ATT-${paddedId}`,
        employeeId: emp.id,
        date: dateStr,
        status,
        hours,
        markedAt: new Date(targetDate.setHours(9, 15 + empIndex, 0)).toISOString(),
        markedBy: 'admin',
      });
    });
  }

  return { employees, attendance };
}

// Storage helpers
export function getStoredEmployees(): Employee[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!data) {
      const seed = generateSeedData();
      saveEmployees(seed.employees);
      saveAttendance(seed.attendance);
      return seed.employees;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load employees from LocalStorage:', err);
    return [];
  }
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (err) {
    console.error('Failed to save employees to LocalStorage:', err);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!data) {
      const seed = generateSeedData();
      saveEmployees(seed.employees);
      saveAttendance(seed.attendance);
      return seed.attendance;
    }
    const parsed: AttendanceRecord[] = JSON.parse(data);
    return parsed.map((r) => ({
      ...r,
      hours: typeof r.hours === 'number' ? r.hours : r.status === 'present' ? 8 : 0,
    }));
  } catch (err) {
    console.error('Failed to load attendance from LocalStorage:', err);
    return [];
  }
}

export function saveAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance to LocalStorage:', err);
  }
}

export function getStoredDepartments(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!data) {
      saveDepartments(DEFAULT_DEPARTMENTS);
      return DEFAULT_DEPARTMENTS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export function saveDepartments(departments: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  } catch (err) {
    console.error('Failed to save departments:', err);
  }
}

export function getStoredSettings(): AttendanceSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultHoursPerDay: typeof parsed.defaultHoursPerDay === 'number' ? parsed.defaultHoursPerDay : 8,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AttendanceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function resetAllDataToDemo(): { employees: Employee[]; attendance: AttendanceRecord[] } {
  const seed = generateSeedData();
  saveEmployees(seed.employees);
  saveAttendance(seed.attendance);
  saveDepartments(DEFAULT_DEPARTMENTS);
  saveSettings(DEFAULT_SETTINGS);
  return seed;
}

export function exportAllDataJSON(): string {
  const exportData = {
    employees: getStoredEmployees(),
    attendance: getStoredAttendance(),
    departments: getStoredDepartments(),
    settings: getStoredSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(exportData, null, 2);
}

export function importAllDataJSON(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.employees) || !Array.isArray(data.attendance)) {
      return { success: false, message: 'Invalid file format. Must contain employees and attendance arrays.' };
    }
    saveEmployees(data.employees);
    saveAttendance(data.attendance);
    if (Array.isArray(data.departments)) {
      saveDepartments(data.departments);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return { success: true, message: `Successfully imported ${data.employees.length} employees and ${data.attendance.length} attendance records!` };
  } catch (err) {
    return { success: false, message: 'JSON parsing error: ' + (err instanceof Error ? err.message : 'Unknown error') };
  }
}
