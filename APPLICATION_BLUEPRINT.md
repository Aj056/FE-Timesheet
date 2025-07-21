# 📋 FE-Timesheet Application Blueprint

## 🏗️ Application Overview

**FE-Timesheet** is a comprehensive employee attendance management system built with Angular 20+ using standalone components and modern reactive patterns. The application provides role-based access control for employees and administrators, featuring real-time attendance tracking, employee management, and comprehensive reporting capabilities.

### 🎯 Core Features
- **Role-based Authentication** (Employee/Admin)
- **Real-time Attendance Tracking** (Check-in/Check-out with office network detection)
- **Employee Profile Management** with dynamic avatar system
- **Administrative Dashboard** for employee management
- **Monthly Reports** and attendance analytics
- **Payslip Generation** and download functionality
- **Dark/Light Theme** support
- **Toast Notifications** and popup confirmations
- **Network Diagnostics** for office connectivity

---

## 🏛️ Architecture Overview

### Application Structure
```
src/app/
├── admin/           # Administrative modules and components
├── auth/            # Authentication modules
├── core/            # Core services, guards, interceptors, interfaces
├── employee/        # Employee-specific modules and components
├── shared/          # Shared components and utilities
└── styles/          # Global styles and theming
```

### Key Technologies
- **Framework**: Angular 20+ with Standalone Components
- **State Management**: Signals and BehaviorSubjects
- **HTTP Client**: Angular HttpClient with interceptors
- **Routing**: Angular Router with lazy loading
- **Forms**: Reactive Forms with validation
- **Styling**: SCSS with CSS custom properties for theming

---

## 🔐 Authentication & Authorization

### AuthService (`core/services/auth.service.ts`)
**Purpose**: Central authentication service managing login/logout and session state

**Key Methods**:
- `login(credentials: LoginCredentials)`: Handles user authentication
- `logout()`: Clears session and redirects to login
- `isLoggedIN()`: Checks authentication status
- `getUserRole()`: Returns current user role
- `storeAuthData()`: Manages localStorage session data

**Dependencies**:
- HttpClient for API communication
- ValidationService for credential validation
- Router for navigation
- Environment configuration for API endpoints

**Session Management**:
```typescript
// Stored in localStorage:
- token: JWT authentication token
- userId: Current user ID
- role: User role (employee/admin)
- userData: Complete user profile information
```

### Guards

#### AuthGuard (`core/guards/auth.guard.ts`)
**Purpose**: Protects routes requiring authentication
**Logic**: Checks `authService.isLoggedIN()`, redirects to login if unauthorized

#### RoleGuard (`core/guards/role.guard.ts`)
**Purpose**: Enforces role-based access control
**Logic**: Validates current user role against route requirements

---

## 🔌 Core Services

### 1. EmployeeService (`core/services/employee.service.ts`)
**Purpose**: Handles all employee-related CRUD operations

**Key Methods**:
- `getAllEmployees()`: Fetches employee list with pagination
- `getEmployeeById(id)`: Retrieves specific employee details
- `createEmployee(data)`: Creates new employee records
- `updateEmployee(id, data)`: Updates employee information
- `deleteEmployee(id)`: Removes employee records

**API Endpoints**:
- `GET /allemp` - Fetch all employees
- `POST /emp` - Create employee
- `PUT /emp/:id` - Update employee
- `DELETE /emp/:id` - Delete employee

**Data Mapping**: Converts backend response format to frontend Employee interface

### 2. AttendanceService (`core/services/attendance.service.ts`)
**Purpose**: Manages attendance tracking and reporting

**Key Features**:
- Real-time attendance data with BehaviorSubjects
- Check-in/check-out functionality with office network validation
- Attendance statistics and reporting
- localStorage integration for offline capability

**Key Methods**:
- `recordLogin(employeeId, employeeName)`: Records check-in
- `recordLogout(attendanceId)`: Records check-out
- `getTodayAttendance(employeeId)`: Gets current day attendance
- `getAttendanceStats(employeeId)`: Calculates attendance statistics

**Session Management**:
```typescript
interface AttendanceSession {
  loginTime?: string;
  logoutTime?: string;
  date: string;
  checkinDateTime?: string;
  checkoutDateTime?: string;
  workingHours?: number;
  status?: 'present' | 'absent' | 'partial';
  attendanceId?: string; // For proper checkout mapping
}
```

### 3. ToastService (`core/services/toast.service.ts`)
**Purpose**: Centralized notification system

**Methods**:
- `success(message, duration?)`: Success notifications
- `error(message, duration?)`: Error notifications
- `info(message, duration?)`: Info notifications
- `warning(message, duration?)`: Warning notifications

**Features**:
- Auto-removal with configurable duration
- Toast container component integration
- Queue management for multiple notifications

### 4. PopupService (`core/services/popup.service.ts`)
**Purpose**: Modal dialogs and confirmations

**Methods**:
- `confirm(message, options?)`: Confirmation dialogs
- `alert(message, options?)`: Alert dialogs
- `close()`: Programmatic popup closure

### 5. ThemeService (`core/services/theme.service.ts`)
**Purpose**: Dynamic theme management

**Features**:
- Dark/Light theme switching
- Theme persistence in localStorage
- CSS custom properties integration
- Component subscription support

### 6. IpCheckService (`core/services/ip-check.service.ts`)
**Purpose**: Office network detection for attendance validation

**Methods**:
- `checkOfficeNetwork()`: Validates office network connectivity
- `getCurrentIP()`: Retrieves current IP address
- Office network validation for check-in/check-out restrictions

---

## 🔄 HTTP Interceptors

### 1. AuthInterceptor (`core/interceptors/auth.interceptor.ts`)
**Purpose**: Automatically adds JWT tokens to HTTP requests

**Logic**:
```typescript
// Adds Authorization header to all requests
headers: { 'Authorization': `Bearer ${token}` }
```

### 2. ErrorInterceptor (`core/interceptors/error.interceptor.ts`)
**Purpose**: Global error handling and response processing

**Error Handling**:
- 401: Token expiry → Auto logout and redirect to login
- 500: Server errors → Fallback to localStorage
- Network errors: Graceful degradation

### 3. SecurityInterceptor (`core/interceptors/security.interceptor.ts`)
**Purpose**: Additional security headers and request timeout

**Features**:
- 30-second request timeout
- Security headers injection
- Protected route identification

---

## 🧩 Component Architecture

### Admin Module (`admin/`)

#### AdminComponent (`admin/admin-component/admin-component.ts`)
**Purpose**: Main administrative dashboard container
**Features**:
- Admin navigation integration
- Theme management
- Global admin actions (logout, mobile navigation)

**Dependencies**: AuthService, ThemeService, ToastService, Router

#### EmployeesList (`admin/employees-list/employees-list.ts`)
**Purpose**: Employee management interface with CRUD operations

**Key Features**:
- Paginated employee list with search/filter
- Real-time employee status management
- Bulk operations and individual employee actions
- Role-based action visibility

**Dependencies**: EmployeeService, ToastService, PopupService

#### CreateEmployee (`admin/create-employee/create-employee.ts`)
**Purpose**: New employee registration form

**Features**:
- Comprehensive form validation
- Password strength indicators
- Auto-generated secure passwords
- Real-time validation feedback

**Dependencies**: EmployeeService, ValidationService, PasswordSecurityService

#### ViewEmployee (`admin/view-employee/view-employee.ts`)
**Purpose**: Detailed employee profile display

**Features**:
- Complete employee information display
- Status indicators with visual styling
- Quick action buttons (edit, payslip generation)
- Responsive design for mobile/desktop

#### EditEmployeeComponent (`admin/edit-employee-component/edit-employee-component.ts`)
**Purpose**: Employee information update form

**Features**:
- Pre-populated form with existing data
- Reactive form validation
- Optimistic UI updates
- Error handling with rollback capability

### Employee Module (`employee/`)

#### Employeecomponent (`employee/employeecomponent/employeecomponent.ts`)
**Purpose**: Main employee dashboard

**Features**:
- Dynamic user avatar with initials
- Profile information display from localStorage
- Navigation to sub-modules (profile, attendance, payslip)
- Theme management integration

**User Profile Integration**:
```typescript
interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
  department?: string;
  designation?: string;
  workLocation?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  panNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
}

// Dynamic avatar generation
getUserInitials(): string {
  const name = this.user?.name || 'User';
  return name.substring(0, 2).toUpperCase();
}
```

#### EmployeeProfile (`employee/employee-profile/employee-profile.ts`)
**Purpose**: Comprehensive employee profile display

**Features**:
- Complete profile information from localStorage
- Dynamic avatar with user initials
- Organized information sections (personal, work, financial)
- Responsive design with mobile optimization

#### EmployeeloginForm (`employee/employeelogin-form/employeelogin-form.ts`)
**Purpose**: Attendance management interface

**Key Features**:
- Check-in/check-out functionality with office network validation
- 1-hour restriction between checkout and next check-in
- Error handling with retry mechanisms
- Confirmation popups for attendance actions

**Attendance Flow**:
```typescript
// Check-in process
sendCheckinData() {
  1. Validate office network connectivity
  2. Send check-in request to API
  3. Store attendance ID from response
  4. Update localStorage with session data
  5. Show success notification
}

// Check-out process
sendCheckoutData() {
  1. Retrieve stored attendance ID
  2. Send checkout request with proper ID mapping
  3. Calculate working hours
  4. Update session data
  5. Implement 1-hour restriction for next check-in
}
```

#### AttendanceSummary (`employee/attendance-summary/attendance-summary.ts`)
**Purpose**: Attendance analytics and reporting

**Features**:
- Monthly/weekly attendance statistics
- Working hours calculation
- Attendance trend visualization
- Export functionality

---

## 🌐 API Integration

### Environment Configuration
```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### API Endpoints

#### Authentication Endpoints
- `POST /login` - User authentication
- `POST /logout` - User logout (if backend session management)

#### Employee Management Endpoints
- `GET /allemp` - Fetch all employees
- `GET /emp/:id` - Get employee by ID
- `POST /emp` - Create new employee
- `PUT /emp/:id` - Update employee
- `DELETE /emp/:id` - Delete employee

#### Attendance Endpoints
- `POST /attendance/checkin` - Record check-in
- `PUT /attendance/checkout/:id` - Record check-out
- `GET /attendance/:employeeId` - Get employee attendance
- `GET /attendance/stats/:employeeId` - Get attendance statistics

### Response Handling
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

---

## 📱 Shared Components

### ToastContainerComponent (`shared/components/toast-container/`)
**Purpose**: Global notification display system
**Features**: Multiple toast support, auto-removal, positioning

### PopupContainerComponent (`shared/components/popup-container/`)
**Purpose**: Modal dialog system
**Features**: Configurable popups, overlay management, keyboard navigation

### NetworkDiagnosticsComponent (`shared/components/network-diagnostics/`)
**Purpose**: Network connectivity monitoring
**Features**: Office network detection, IP address display, connectivity status

### SessionWarningComponent (`shared/components/session-warning.component.ts`)
**Purpose**: Session timeout warnings
**Features**: Automatic session monitoring, user notifications

---

## 🎨 Styling & Theming

### Theme Architecture
```scss
// _variables.scss
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  
  // Dark theme variables
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #dee2e6;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  --border-color: #444444;
}
```

### Component Styling
- **Admin Theme**: `styles/_admin-theme.scss`
- **Mixins**: `styles/_mixins.scss` (reusable styling patterns)
- **Variables**: `styles/_variables.scss` (global design tokens)

---

## 🔍 Debugging Guide

### Development Tools

#### Console Logging
All services implement comprehensive logging:
```typescript
// Authentication flow
console.log('🔐 Login attempt for username:', credentials.username);
console.log('✅ Login successful');

// API requests
console.log('🌐 Calling API endpoint:', `${this.baseUrl}/allemp`);
console.log('📊 Raw API response:', response);

// Error handling
console.error('❌ Failed to fetch employees:', error);
```

#### Local Storage Debug
Key localStorage items for debugging:
```typescript
// Authentication
localStorage.getItem('token')
localStorage.getItem('userId')
localStorage.getItem('role')
localStorage.getItem('userData')

// Attendance
localStorage.getItem('currentAttendanceSession')
localStorage.getItem('attendanceRecords')

// Theme
localStorage.getItem('theme')
```

### Common Issues & Solutions

#### 1. Authentication Issues
**Problem**: User gets redirected to login after successful authentication
**Debug Steps**:
1. Check browser console for 401 errors
2. Verify token in localStorage
3. Check AuthGuard logic
4. Validate API token format

#### 2. Attendance Check-in/Check-out Issues
**Problem**: Check-out fails or attendance ID missing
**Debug Steps**:
1. Verify attendance ID stored during check-in
2. Check network connectivity (IpCheckService)
3. Validate API response format
4. Check localStorage session data

#### 3. Employee Data Loading Issues
**Problem**: Employee list not loading or showing empty
**Debug Steps**:
1. Check API endpoint response in Network tab
2. Verify data mapping in EmployeeService
3. Check console for mapping errors
4. Validate backend API format vs frontend expectations

### Performance Monitoring
- Route preloading strategy implementation
- Lazy loading for heavy components
- BehaviorSubject usage for real-time data
- Change detection optimization with OnPush strategy

---

## 🚀 Deployment & Production

### Build Configuration
```bash
# Development build
ng serve

# Production build
ng build --configuration production

# Run tests
ng test
```

### Environment Variables
```typescript
// production environment
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api'
};
```

### Security Considerations
- JWT token expiry handling
- XSS protection with sanitization
- CSRF protection via interceptors
- Secure HTTP headers implementation
- Office network validation for attendance

---

## 📋 Component Dependency Matrix

| Component | Services Used | Purpose |
|-----------|---------------|---------|
| AdminComponent | AuthService, ThemeService, ToastService | Admin dashboard management |
| EmployeesList | EmployeeService, ToastService, PopupService | Employee CRUD operations |
| CreateEmployee | EmployeeService, ValidationService, PasswordSecurityService | Employee registration |
| Employeecomponent | ThemeService, PopupService, ToastService | Employee dashboard |
| EmployeeProfile | AuthService | Profile display |
| EmployeeloginForm | ToastService, PopupService, IpCheckService, HttpClient | Attendance management |
| AttendanceSummary | AttendanceService | Attendance reporting |
| App | ThemeService, SeoService | Root application setup |

---

## 🔧 Maintenance & Updates

### Code Quality Standards
- TypeScript strict mode enabled
- Comprehensive interface definitions
- Error handling at all levels
- Reactive programming patterns
- Modern Angular features (standalone components, signals)

### Testing Strategy
- Unit tests for all services
- Component testing with TestBed
- End-to-end testing for critical flows
- Mock services for isolated testing

### Documentation
- Inline code comments for complex logic
- Interface documentation for API contracts
- Component purpose and dependency documentation
- Change log maintenance for updates

---

This blueprint provides a comprehensive overview of the FE-Timesheet application architecture, component relationships, service dependencies, and debugging strategies. Use this document for development, maintenance, troubleshooting, and onboarding new team members.
