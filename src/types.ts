export type EmployeeStatus = 'active' | 'inactive';

export type AttendanceStatus = 'present' | 'absent' | 'on-leave';
export type AttendanceMarkStatus = AttendanceStatus | 'unmarked';

export interface Employee {
  id: string; // EMP-001
  name: string;
  email: string;
  phone?: string;
  department: string;
  joiningDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  createdAt: string; // ISO string
}

export interface AttendanceRecord {
  id: string; // ATT-001
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  hours?: number; // hours worked for the day (e.g. 8, 4, 9.5)
  markedAt: string; // ISO string
  markedBy: string; // e.g. "admin"
}

export interface AttendanceSettings {
  companyName: string;
  workingDays: string[]; // ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  workingDaysPerMonth: number;
  defaultHoursPerDay: number;
  autoSave: boolean;
}

export type NavTab = 
  | 'dashboard' 
  | 'mark-attendance' 
  | 'directory' 
  | 'add-employee' 
  | 'reports' 
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export interface EmployeeAttendanceStats {
  employee: Employee;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  unmarkedCount: number;
  totalDays: number;
  attendancePercentage: number;
  totalHours: number;
  avgHoursPerDay: number;
  last7Days: {
    date: string;
    dayLabel: string;
    status: AttendanceMarkStatus;
    hours?: number;
  }[];
}
