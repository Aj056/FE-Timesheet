export const environment = {
  production: true,
  // 🚀 PRODUCTION BACKEND API URL
  // Replace this with your actual deployed backend URL
  apiUrl: 'https://your-timesheet-backend.vercel.app', // TODO: Update with your deployed backend URL
  
  // External APIs (these should work in production)
  timeApiUrl: 'https://timeapi.io/api/time/current/zone?timeZone=Asia/Kolkata',
  quoteApiUrl: 'https://api.realinspire.live/v1/quotes/random?limit=1',
  
  // App metadata and branding
  appName: 'Willware Timesheet',
  appFullName: 'Willware Employee Timesheet & Attendance Management System',
  version: '1.0.0',
  company: 'Willware Technologies',
  
  // SEO and Branding
  seo: {
    title: 'Willware Timesheet - Employee Attendance Management System',
    description: 'Modern employee timesheet and attendance management system by Willware Technologies. Track work hours, manage employee attendance, and generate reports with ease.',
    keywords: 'willware, timesheet, attendance, employee management, work hours, time tracking, HR system, payroll',
    ogImage: 'https://willwaretech.com/wp-content/uploads/2025/04/Untitled-design-14-150x150.png',
    themeColor: '#4F46E5'
  },
  
  // Office network configuration for production
  officeNetworkConfig: {
    enabled: true,
    strictMode: true, // Set to false for development/testing
    confidenceThreshold: 80,
    // Office IP ranges (update these to match your actual office network)
    allowedNetworks: [
      '192.168.29.0/24',  // Your current office network
      '10.0.0.0/8',       // Common private network
      '172.16.0.0/12'     // Another common private network
    ]
  },
  
  // Feature flags for production
  features: {
    networkDebug: false,      // Disable debug panel in production
    manualOverride: false,    // Disable manual override in production
    detailedLogging: false,   // Disable detailed console logs
    officeNetworkCheck: true  // Enable office network validation
  }
};
