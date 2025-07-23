/**
 * Unified interfaces for the entire application
 * All services and components should use these interfaces
 */

// Employee related interfaces
export interface Employee {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: string;
  department?: string;
  joiningDate?: string;
  joinDate?: string; // Alternative field name for join date
  workLocation?: string;
  designation?: string;
  bankAccount?: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber?: string;
  resourceType?: string;
  address?: string;
  phone?: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
  timelog?:any[]
}

// Authentication related interfaces
export interface LoginResponse {
  success: boolean;
  user?: Employee;
  token?: string;
  message?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Attendance related interfaces
export interface AttendanceSession {
  loginTime?: string;
  logoutTime?: string;
  date: string;
  checkinDateTime?: string;
  checkoutDateTime?: string; // Store actual checkout datetime for restrictions
  workingHours?: number;
  status?: 'present' | 'absent' | 'partial';
  attendanceId?: string; // Store the attendance record ID from check-in response for checkout
}

export interface AttendanceRecord extends AttendanceSession {
  id: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  partialDays: number;
  totalWorkingHours: number;
}

// Network related interfaces
export interface OfficeNetworkStatus {
  isConnected: boolean;
  isOfficeNetwork: boolean;
  ipAddress: string;
  checking: boolean;
}

// Validation related interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string;
}

// Quote related interfaces
export interface Quote {
  content: string;
  author: string;
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Create employee request interface
export interface CreateEmployeeRequest {
  name: string;
  email: string;
  workLocation: string;
  department: string;
  role: string;
  position: string;
  joinDate: string;
  bankAccount: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber: string;
  resourceType: string;
  username: string;
  password: string;
  address: string;
  phone: string;
}
