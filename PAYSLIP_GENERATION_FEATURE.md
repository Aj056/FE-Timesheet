# Payslip Generation Feature

## Overview
The payslip generation feature allows administrators to create, customize, and download professional payslips for employees. The feature includes a form-based interface that resembles an actual payslip template with editable fields.

## Features

### 1. **Generate Payslip Button**
- Located in the Employee Details view (`/admin/employee-details/:id`)
- Navigates to the payslip generation page with pre-populated employee information

### 2. **Payslip Form Template**
- Professional payslip design with company header
- Pre-populated employee details (name, ID, email, department)
- Editable salary components:
  - Basic Salary
  - HRA (House Rent Allowance)
  - DA (Dearness Allowance)
  - Allowances
  - Overtime
  - Bonus
  - Provident Fund
  - Income Tax
  - Insurance
  - Other Deductions

### 3. **Automatic Calculations**
- Gross Salary (sum of all earnings)
- Total Deductions (sum of all deductions)
- Net Salary (gross - deductions)
- Pro-rated salary based on days worked

### 4. **PDF Download**
- Optimized for print/PDF generation
- Professional formatting with company logo placeholder
- Print-friendly styling with preserved colors
- Automatic filename: `Payslip_EmployeeName_Month_Year`

## Usage Instructions

### For Administrators:

1. **Navigate to Employee Details**
   - Go to the employee list (`/admin/employees`)
   - Click on any employee to view details

2. **Generate Payslip**
   - Click the "Generate Payslip" button (green button with document icon)
   - You'll be redirected to the payslip generation page

3. **Customize Payslip**
   - Employee details are pre-populated but can be edited
   - Modify salary components as needed
   - Update attendance details (working days, days worked, leave taken)
   - All calculations update automatically

4. **Download PDF**
   - Click the "Download PDF" button
   - Browser's print dialog will open
   - Choose "Save as PDF" or print directly
   - The document is optimized for A4 paper size

### Navigation Options:

- **Back to Employee**: Returns to the employee details page
- **Reset**: Resets all fields to default values
- **Download PDF**: Generates PDF for download/print

## Technical Implementation

### Components:
- `generate-payslip.ts` - Main component logic
- `generate-payslip.html` - Payslip template
- `generate-payslip.scss` - Styling with print optimizations

### Route:
- `/admin/generate-payslip/:id` - Payslip generation page

### Key Features:
- Reactive form with two-way data binding
- Real-time calculation updates
- Print-optimized CSS with color preservation
- Responsive design for mobile/tablet viewing
- Error handling and loading states

## Customization

### Company Logo:
To add your company logo, uncomment and update the image tag in `generate-payslip.html`:
```html
<img src="assets/images/company-logo.png" alt="Company Logo" class="company-logo-img">
```

### Company Information:
Update company details in the template:
- Company name
- Address
- Contact information

### Salary Components:
Add or modify salary components by updating:
- The `PayslipData` interface in the component
- The form fields in the template
- The calculation methods

### Styling:
Modify the SCSS file to match your company's branding:
- Color scheme
- Typography
- Layout adjustments

## Browser Compatibility
- Modern browsers with print API support
- PDF generation via browser's built-in print-to-PDF feature
- Responsive design for all screen sizes

## Future Enhancements
- Integration with dedicated PDF libraries (jsPDF, PDFKit)
- Email delivery functionality
- Payslip templates library
- Bulk payslip generation
- Digital signatures
- Data persistence/storage
