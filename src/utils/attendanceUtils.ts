import { Employee, AttendanceRecord, AttendanceMarkStatus, EmployeeAttendanceStats } from '../types';
import { formatDateISO } from './storage';

export { formatDateISO };

export function getTodayDateISO(): string {
  return formatDateISO(new Date());
}

export function formatFriendlyDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getDayName(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  } catch {
    return '';
  }
}

export function getPast30Days(): { dateStr: string; label: string; dayName: string; isToday: boolean }[] {
  const result = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDateISO(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({
      dateStr,
      label: i === 0 ? `Today (${formatted})` : i === 1 ? `Yesterday (${formatted})` : `${dayName}, ${formatted}`,
      dayName,
      isToday: i === 0,
    });
  }
  return result;
}

export function getLast7DaysDates(baseDateStr: string = getTodayDateISO()): { dateStr: string; dayLabel: string; shortDate: string }[] {
  const parts = baseDateStr.split('-');
  const base = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const list = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    list.push({
      dateStr: formatDateISO(d),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    });
  }
  return list;
}

// Generate the next employee ID, e.g. EMP-009
export function getNextEmployeeId(employees: Employee[]): string {
  let maxNum = 0;
  employees.forEach((emp) => {
    const match = emp.id.match(/^EMP-(\d+)$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxNum) maxNum = val;
    }
  });
  const nextNum = maxNum + 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
}

// Generate next attendance record ID
export function getNextAttendanceId(attendance: AttendanceRecord[]): string {
  let maxNum = 0;
  attendance.forEach((rec) => {
    const match = rec.id.match(/^ATT-(\d+)$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxNum) maxNum = val;
    }
  });
  const nextNum = maxNum + 1;
  return `ATT-${String(nextNum).padStart(3, '0')}`;
}

// Get daily attendance stats for a specific date
export function getDailyAttendanceStats(
  employees: Employee[],
  attendance: AttendanceRecord[],
  targetDate: string
) {
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const totalEmployees = employees.length;
  const activeCount = activeEmployees.length;

  const recordsForDate = attendance.filter((a) => a.date === targetDate);
  const recordMap = new Map<string, AttendanceRecord>();
  recordsForDate.forEach((r) => recordMap.set(r.employeeId, r));

  let present = 0;
  let absent = 0;
  let onLeave = 0;
  let unmarked = 0;
  let totalHours = 0;

  activeEmployees.forEach((emp) => {
    const rec = recordMap.get(emp.id);
    if (!rec) {
      unmarked++;
    } else if (rec.status === 'present') {
      present++;
      const hrs = typeof rec.hours === 'number' ? rec.hours : 8;
      totalHours += hrs;
    } else if (rec.status === 'absent') {
      absent++;
      const hrs = typeof rec.hours === 'number' ? rec.hours : 0;
      totalHours += hrs;
    } else if (rec.status === 'on-leave') {
      onLeave++;
      const hrs = typeof rec.hours === 'number' ? rec.hours : 0;
      totalHours += hrs;
    }
  });

  const markedTotal = present + absent + onLeave;
  // Percentage = (Present / Active Employees) * 100
  const percentage = activeCount > 0 ? Math.round((present / activeCount) * 100) : 0;
  const avgHoursPerPresent = present > 0 ? (totalHours / present).toFixed(1) : '0';

  return {
    totalEmployees,
    activeCount,
    inactiveCount: totalEmployees - activeCount,
    present,
    absent,
    onLeave,
    unmarked,
    markedTotal,
    percentage,
    totalHours,
    avgHoursPerPresent,
  };
}

// Calculate comprehensive stats for all employees over a given date range
export function calculateEmployeesStats(
  employees: Employee[],
  attendance: AttendanceRecord[],
  startDateStr: string,
  endDateStr: string,
  baseReferenceDate: string = getTodayDateISO()
): EmployeeAttendanceStats[] {
  // 7 days for the indicator pills
  const last7DaysInfo = getLast7DaysDates(baseReferenceDate);

  // Quick lookup of records: key = `${employeeId}_${date}`
  const lookup = new Map<string, AttendanceRecord>();
  attendance.forEach((r) => {
    lookup.set(`${r.employeeId}_${r.date}`, r);
  });

  // Calculate unique days in range
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return employees.map((emp) => {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let totalHours = 0;

    // Filter attendance records in the range for this employee
    attendance.forEach((rec) => {
      if (rec.employeeId === emp.id && rec.date >= startDateStr && rec.date <= endDateStr) {
        const hrs = typeof rec.hours === 'number' ? rec.hours : rec.status === 'present' ? 8 : 0;
        totalHours += hrs;

        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'absent') absentCount++;
        else if (rec.status === 'on-leave') leaveCount++;
      }
    });

    const recordedDays = presentCount + absentCount + leaveCount;
    // Total working days denominator: at least recordedDays or 1
    const denominator = recordedDays > 0 ? recordedDays : 1;
    const percentage = recordedDays > 0 ? Math.round((presentCount / denominator) * 100) : 0;
    const avgHoursPerDay = recordedDays > 0 ? Math.round((totalHours / recordedDays) * 10) / 10 : 0;

    const last7Days = last7DaysInfo.map((d) => {
      const rec = lookup.get(`${emp.id}_${d.dateStr}`);
      const status: AttendanceMarkStatus = rec ? rec.status : 'unmarked';
      const hours = rec ? (typeof rec.hours === 'number' ? rec.hours : (rec.status === 'present' ? 8 : 0)) : undefined;
      return {
        date: d.dateStr,
        dayLabel: d.dayLabel,
        status,
        hours,
      };
    });

    return {
      employee: emp,
      presentCount,
      absentCount,
      leaveCount,
      unmarkedCount: Math.max(0, daysDiff - recordedDays),
      totalDays: recordedDays,
      attendancePercentage: percentage,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay,
      last7Days,
    };
  });
}

// Generate CSV string for export
export function generateAttendanceCSV(stats: EmployeeAttendanceStats[], dateRangeLabel: string): string {
  const headers = [
    'Employee ID',
    'Full Name',
    'Department',
    'Email',
    'Phone',
    'Status',
    'Joining Date',
    'Present Days',
    'Absent Days',
    'On-Leave Days',
    'Attendance Rate (%)',
    'Total Hours Worked',
    'Avg Hours/Day',
  ];

  const rows = stats.map((item) => {
    const emp = item.employee;
    return [
      `"${emp.id}"`,
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${emp.department.replace(/"/g, '""')}"`,
      `"${emp.email.replace(/"/g, '""')}"`,
      `"${emp.phone || ''}"`,
      `"${emp.status}"`,
      `"${emp.joiningDate}"`,
      item.presentCount,
      item.absentCount,
      item.leaveCount,
      `${item.attendancePercentage}%`,
      item.totalHours,
      item.avgHoursPerDay,
    ].join(',');
  });

  const metadataComment = `# Daily Attendance Tracker Report - ${dateRangeLabel}\n# Generated At: ${new Date().toLocaleString()}\n`;
  return metadataComment + [headers.join(','), ...rows].join('\n');
}

// Trigger CSV download in browser
export function downloadCSVFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
