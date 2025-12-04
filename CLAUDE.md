# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a tuition management system built with Next.js 15 and Firebase. The application manages three user roles: superadmin, teacher, and student. It provides functionality for student registration with custom hourly rates, class/subject scheduling with multi-day recurrence, attendance tracking grouped by subjects, and automated PDF invoice generation with detailed breakdowns.

## Common Commands

- **Development server**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build` (uses Turbopack)
- **Production start**: `npm start`
- **Lint**: `npm run lint`

## Architecture

### Core Structure
- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS v4, and shadcn/ui components
- **Backend**: Firebase Authentication and Firestore
- **State Management**: React Context API for auth state (AuthContext)

### Key Directories
- `src/app/`: App Router pages and routes
  - `dashboard/`: Main dashboard with role-based routing
  - `login/`: Authentication page
  - `superadmin/`: Superadmin panel
  - `teacher/`: Legacy teacher panel (teachers primarily use dashboard route)
- `src/components/ui/`: Reusable UI components from shadcn/ui
- `src/components/`: Application components (e.g., TeacherHomepage)
- `src/context/`: React context providers (AuthContext.js)
- `src/lib/`: Firebase configuration and utilities
  - `firebase.js`: Firebase app initialization, auth, and Firestore exports
  - `firebaseAuth.js`: Authentication helper functions
  - `utils.js`: Utility functions

### Authentication & Authorization
- Firebase Auth with role-based access control
- User roles stored in Firestore `/users/{uid}` collection with `role` field
- AuthContext provides `currentUser`, `userRole`, and `loading` state
- Role-based routing:
  - `/` redirects to `/login` if not authenticated, `/dashboard` if authenticated
  - Teachers → `/dashboard` (TeacherHomepage component)
  - Superadmin → `/superadmin` or `/dashboard`
  - Legacy teacher panel at `/teacher` (kept for backward compatibility)

### Database Schema
Firestore collections:
- `users`: User profiles with role field (superadmin/teacher/student)
- `students`: Student records with fields:
  - `name` (required), `email` (optional), `hourlyRate` (required, custom per student)
  - `teacherId` (links to teacher), `createdAt`
- `subjects`: Class/subject schedules with fields:
  - `name`, `startTime`, `endTime`, `teacherId`
  - `recurring`: 'weekly' or 'none'
  - `daysOfWeek`: Array of day numbers [0-6] for weekly recurring (supports multiple days)
  - `date`: Specific date string for one-time classes
  - Backward compatible with old `dayOfWeek` single-day format
- `subjectAssignments`: Links students to subjects
  - `studentId`, `subjectId`, `teacherId`, `createdAt`
- `attendance`: Attendance records with fields:
  - `studentId`, `subjectId`, `teacherId`, `date`, `status` ('present'/'absent')
  - Tracks attendance per student per subject per date
- `invoices`: Generated invoice records with fields:
  - `studentId`, `teacherId`, `month`, `year`, `amount`, `status`
  - `details`: Object containing breakdown by subject and grand total

### Firebase Security Rules (firestore.rules)
Role-based security rules enforce data access:
- **Superadmins**: Full access to all collections
- **Teachers**: Can only access their own students' data (filtered by `resource.data.teacherId`)
- **Students**: Can only access their own records (filtered by `resource.data.studentId`)

**CRITICAL**: When writing security rules:
- Use `resource.data.fieldId` to check document fields (NOT `request.query.get('fieldId')`)
- Use `request.resource.data.fieldId` for create/update operations
- Use `resource.data.fieldId` for read/delete operations
- Example: `resource.data.teacherId == request.auth.uid` (correct)
- Example: `request.query.get('teacherId') == request.auth.uid` (WRONG)

**Note**: Some attendance rules are temporarily relaxed for debugging (see comments in firestore.rules:26-34)

### UI Framework
- shadcn/ui components configured in `components.json`
  - Style: "new-york"
  - Uses JSX (not TSX) as per `"tsx": false` configuration
  - Icon library: Lucide React
- Tailwind CSS v4 with custom configuration
- Component aliases configured:
  - `@/components` → `src/components`
  - `@/lib` → `src/lib`
  - `@/components/ui` → `src/components/ui`

### Business Logic
- **Currency**: RM (Malaysian Ringgit)
- **Hourly rate**: RM35 per hour
- **Invoice generation**: Per-student with month/year selection
- **Invoice fields**: studentId, studentName, teacherId, month, year, amount, status, createdAt

### Main Components
- `src/app/page.js`: Root route with authentication-based redirect
- `src/app/dashboard/page.js`: Main dashboard, renders TeacherHomepage for teachers
- `src/app/superadmin/page.js`: Superadmin dashboard with tabs for Users, Classes, Students, and Assignments
- `src/components/TeacherHomepage.jsx`: Primary teacher interface with tabs:
  - Overview: Calendar and today's classes
  - Students: Manage students with hourly rates
  - Attendance: Mark attendance grouped by subjects
  - Invoices: Generate PDF receipts
  - Classes: Manage subjects and student assignments

## Dependencies

### Core
- Next.js 15 with App Router and Turbopack
- React 19
- Firebase (auth, firestore)
- Tailwind CSS
- shadcn/ui components

### PDF Generation
- `jspdf`: PDF creation library
- `jspdf-autotable`: Table plugin for jsPDF

### Icons
- `lucide-react`: Icon library

## Development Notes

- The codebase uses JavaScript (.js/.jsx) rather than TypeScript
- Firebase config contains live API keys (consider environment variables for production)
- Currency is RM (Malaysian Ringgit)
- Hourly rates are custom per student (default RM35 when creating new students)
- When importing jsPDF, use: `import { jsPDF } from 'jspdf'` and `import autoTable from 'jspdf-autotable'`
- App metadata configured in `src/app/layout.js` with title "Tuition Management System"

### Server Restart Protocol
**IMPORTANT**: For crucial changes (especially component logic, state management, or data handling), the Next.js dev server MUST be restarted to ensure changes are properly compiled and cached:
- If Claude is running the server: Kill and restart the background shell
- If user is running the server: Remind them to restart with Ctrl+C then `npm run dev`
- Hard refresh browser (Ctrl+Shift+R) after server restart
- Turbopack hot reload is not always reliable for major changes

## Key Features

### Student Management
- Add/edit/delete students with custom hourly rates
- Email field is optional (only name and hourly rate required)
- Students displayed with their individual rates

### Subject/Class Management
- Create subjects with name and time slots
- Support for weekly recurring (multiple days per week) or one-time classes
- Example: A subject can recur on Monday, Wednesday, and Friday
- Edit subjects to change name, times, and recurring days
- Assign students to subjects with searchable checkbox interface
- Calendar view shows days with scheduled classes

### Attendance Tracking
- Attendance tab shows only classes scheduled for selected date
- Students grouped by their subjects/classes
- Each subject displays its time and enrolled students
- Attendance tracked per student per subject per date
- Supports students attending multiple classes on same day

### Invoice Generation
- Generates PDF receipts with filename format: `{StudentName}_{MonthYear}.pdf`
- PDF contains detailed breakdown:
  - Company logo at top right (`/public/logo.jpeg`)
  - Table showing each subject attended with specific dates (dd/mm format)
  - Number of sessions per subject
  - Rate per session (student's hourly rate)
  - Subtotal per subject
  - Grand total for the month
  - Payment terms and notes section
  - QR code for payment (`/public/qr.png`)
  - Teacher signature line
- Uses jsPDF and jspdf-autotable libraries
- Professional formatted receipts with blue headers, bold fonts, and striped rows
- Date formatting uses local timezone (dd/mm/yyyy format)
- Invoice number format: MM/YYYY
- Automatically saves invoice record to Firestore with breakdown details

### Superadmin Dashboard
Accessible at `/superadmin` with 4 tabs:

#### Users Tab
- View all users in the system
- Change user roles (student/teacher/superadmin)
- Dropdown selection for role assignment

#### Classes Tab
- Create classes/subjects for any teacher
- Select teacher from dropdown
- Configure subject name, start/end time
- Support for weekly recurring (multi-day) or one-time classes
- View all classes across all teachers
- Delete classes (automatically removes associated assignments)

#### Students Tab
- Add students for any teacher
- Select teacher from dropdown
- Enter student name (required), email (optional), hourly rate
- View all students across all teachers with their rates

#### Assignments Tab
- Assign students to subjects for a specific teacher
- Three-step process:
  1. Select teacher
  2. Select student (filtered by teacher)
  3. Select subject (filtered by teacher)
- View all current assignments
- Remove assignments with delete button
- Prevents duplicate assignments

## Important Implementation Details

### Multi-Day Recurring Classes
- Subjects store `daysOfWeek` as an array of integers [0-6] where 0=Sunday, 6=Saturday
- Old single-day format (`dayOfWeek` as single integer) is backward compatible
- Filtering logic checks both new array format and old single-day format
- UI uses checkboxes for selecting multiple days when creating/editing subjects

### Attendance System
- Composite key used: `${studentId}_${subjectId}` for tracking attendance records
- Allows same student to have different attendance status for different classes on same day
- fetchAttendance() creates unique keys combining student and subject IDs
- handleMarkAttendance() saves with subjectId field in Firestore

### Student Search in Assignment
- Real-time filtering as user types in search field
- Checkbox interface for multi-select (no need for Ctrl/Cmd)
- Shows count of selected students
- Prevents duplicate assignments (checks existing before adding)

### PDF Generation Flow
1. Query attendance records filtered by student, teacher, month, and 'present' status
2. Group attendance records by subjectId and collect all dates
3. Calculate sessions per subject and subtotal (sessions × hourly rate)
4. Generate PDF using jsPDF with:
   - Company logo loaded from `/public/logo.jpeg`
   - Header with invoice title, student name, invoice number, and date
   - autoTable with subject details including formatted dates
   - Payment notes and terms
   - QR code for payment from `/public/qr.png`
   - Teacher signature section
5. Save PDF with descriptive filename format: `{StudentName}_{MonthName}{Year}.pdf`
6. Store invoice record in Firestore with breakdown details

### Date Handling
- Uses `getLocalDateString()` helper function to avoid timezone issues
- Formats dates as YYYY-MM-DD for storage and comparison
- Displays dates as dd/mm/yyyy in PDFs and UI
- Calendar date filtering uses local date strings to prevent off-by-one day errors
- Calendar deselection prevented: `handleDateSelect` only updates if date is truthy (prevents undefined state when clicking same date twice)

---

## Mobile Optimization (Updated: 2025-10-30)

### Overview
The application has been fully optimized for mobile devices, particularly iPhone 12 and above, while maintaining 100% desktop functionality. All changes follow a mobile-first approach with progressive enhancement for larger screens.

### Responsive Design Implementation

#### 1. Navigation & Tab System
**Location**: `src/components/TeacherHomepage.jsx`, `src/app/dashboard/page.js`

- **Tab Navigation** (Floating Pill Design - iOS Style):
  - **Mobile**: Floating pill-shaped navigation bar with glassmorphism effect
    - **Container**:
      - Position: `fixed bottom-4` with inset margins (`left-4 right-4`) - floats above content
      - Shape: Fully rounded pill (`rounded-full`)
      - Glassmorphism: `backdrop-blur-xl` with semi-transparent background (`bg-white/80`)
      - Shadow: Large soft shadow (`shadow-lg`) for elevation
      - Border: Subtle translucent border (`border-gray-200/50`)
      - Padding: `px-2 py-2` for compact, modern look
      - Centered: `flex justify-center` for perfect centering
    - **Individual Tab Pills**:
      - **Active state**:
        - Background: Solid blue pill (`bg-blue-600`)
        - Text: White (`text-white`)
        - Shadow: Medium shadow (`shadow-md`) for depth
        - Full rounded shape: `rounded-full`
      - **Inactive state**:
        - Background: Transparent (`bg-transparent`)
        - Text: Gray (`text-gray-600`)
        - No shadow for flat appearance
      - Size: `min-w-[60px]` minimum width, auto height
      - Padding: `px-3 py-2` for comfortable tap area
      - Icon size: `w-5 h-5` (20px) - compact but clear
      - Label size: `text-[10px]` with `font-medium`
      - Spacing: `gap-0.5` between icon and label
      - Transition: Smooth 300ms animation (`transition-all duration-300`)
    - Layout: 5 pills in equal-width grid (`grid-cols-5 gap-1`)
    - Safe area support: `safe-bottom` class for notched devices
    - Content padding: `pb-20` on main container to prevent overlap
  - **Desktop**: Traditional top tabs with horizontal layout
    - Position: Static top placement
    - Layout: Icons beside text (`flex-row`)
    - Styling: Default shadcn/ui tabs appearance

- **Top Navigation Bar**:
  - Mobile: Sticky top navbar, truncated title, hidden email on very small screens
  - Desktop: Full layout with welcome message and email
  - Sticky positioning: `sticky top-0 z-40` for always-visible navigation
  - Responsive padding: `px-4 md:px-6`, `py-3 md:py-4`

#### 2. Form Dialogs
**Location**: `src/components/TeacherHomepage.jsx`

All dialog forms converted from desktop 4-column grid to mobile-friendly stacking:
- **Pattern**: `grid-cols-1 md:grid-cols-4`
- **Labels**: Left-aligned on mobile, right-aligned on desktop (`md:text-right`)
- **Inputs**: Full width on mobile, 3-column span on desktop (`md:col-span-3`)
- **Buttons**: Full width on mobile, auto width on desktop (`w-full sm:w-auto`)
- **Dialog width**: Responsive max-width `max-w-[calc(100vw-2rem)] md:max-w-lg`
- **Scroll**: Added `max-h-[90vh] overflow-y-auto` for long forms (e.g., Add/Edit Subject)

**Affected Forms**:
- Add/Edit Student
- Add/Edit Subject (with multi-day selection checkboxes)
- All form inputs stack vertically on mobile

#### 3. Table-to-Card Conversion
**Location**: `src/components/TeacherHomepage.jsx`

Implemented dual-view system for all tables:
- **Mobile**: Card-based layout (`block md:hidden`)
- **Desktop**: Traditional table layout (`hidden md:block`)

**Students Table** (Students Tab):
- Mobile: Cards with student name, hourly rate, Edit/Delete buttons (full width)
- Desktop: 3-column table (Name, Hourly Rate, Actions)

**Attendance Tables** (Attendance Tab):
- Mobile: Cards grouped by subject with Present/Absent buttons (full width)
- Desktop: Table grouped by subject with student rows
- Cards show student name and current status with clear action buttons

**Invoice Tables** (Invoices Tab):
- **Generate Invoice**:
  - Mobile: Cards with student name, hourly rate, Generate button (full width)
  - Desktop: 3-column table
- **Generated Invoices**:
  - Mobile: Cards with 2-column grid showing Month, Year, Amount, Status
  - Desktop: 6-column table with all details
  - Responsive header: `flex-col sm:flex-row` for title and Refresh button

**Assignment Table** (Classes Tab):
- Mobile: Cards with student name, hourly rate, Remove button (full width)
- Desktop: 3-column table
- Only visible when a subject is selected

#### 4. Overview Tab Optimization
**Location**: `src/components/TeacherHomepage.jsx`

- **Layout**: `grid-cols-1 lg:grid-cols-3` for calendar (1/3) and classes (2/3)
- **Calendar**:
  - Responsive padding: `px-2 md:px-6` for content
  - Full width on mobile with proper margin handling
  - Touch-friendly date selection

- **Today's Classes**:
  - Shortened date format on mobile: "Dec 15" vs "Monday, December 15, 2024"
  - Stacked layout: `flex-col md:flex-row` for class details (time and students)
  - Better word wrapping with `break-words` for long student names
  - Responsive card padding: `px-3 md:px-4`, `pb-3`
  - Responsive spacing: `space-y-3 md:space-y-4`

- **Quick Stats**: Already responsive with `grid-cols-1 md:grid-cols-3`

#### 5. Toast Notifications
**Location**: `src/components/TeacherHomepage.jsx`

- **Mobile**:
  - Bottom-center positioning: `fixed bottom-4 left-4 right-4`
  - Slide-up animation from bottom
  - Full width with side margins, max-width for readability

- **Desktop**:
  - Top-right positioning: `md:top-4 md:bottom-auto md:left-auto md:right-4`
  - Slide-in-right animation
  - Fixed width for consistency

- **Animation**: Responsive keyframes using media queries (`@media (max-width: 768px)`)

#### 6. Mobile-Specific Utilities
**Location**: `src/app/globals.css`, `src/app/layout.js`

**CSS Enhancements**:
- **Smooth scrolling**: `-webkit-overflow-scrolling: touch` for iOS
- **Tap targets**: Minimum 44x44px for buttons, links, inputs (Apple HIG compliant)
- **Text adjustment**: Disabled auto-zoom on orientation change
- **Safe area insets**: Support for notched devices (iPhone X and above)
  ```css
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  ```

**Viewport Configuration**:
```javascript
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ffffff",
};
```

### Responsive Breakpoints

| Breakpoint | Size | Primary Usage |
|-----------|------|---------------|
| Default | < 640px | Mobile phones (base styles) |
| `sm:` | ≥ 640px | Large phones / small tablets |
| `md:` | ≥ 768px | Tablets / small laptops |
| `lg:` | ≥ 1024px | Laptops / desktops |
| `xl:` | ≥ 1280px | Large desktops |

### Tested Device Viewports

| Device | Viewport | Status |
|--------|----------|--------|
| iPhone 12 Mini | 375 x 812 | ✅ Optimized |
| iPhone 12/13/14 | 390 x 844 | ✅ Optimized |
| iPhone 14 Plus / 15 Plus | 428 x 926 | ✅ Optimized |
| iPhone 14 Pro / 15 Pro | 393 x 852 | ✅ Optimized |
| iPhone 15 Pro Max | 430 x 932 | ✅ Optimized |

### Key Mobile Features

1. **Floating Pill Navigation (iOS-Style)**: Glassmorphic floating bar with individual pill-shaped tabs, backdrop blur, and smooth color transitions - modern and premium look
2. **Touch-Optimized**: All interactive elements meet Apple's 44x44px minimum tap target size
3. **Glassmorphism Effect**: Backdrop blur with semi-transparent background creates depth and modern aesthetic
4. **Card-Based UI**: Tables converted to scannable cards on mobile
5. **Smart Truncation**: Text truncates with ellipsis where needed
6. **Responsive Typography**: Font sizes scale appropriately (`text-base md:text-lg`)
7. **Sticky Header**: Top navigation bar stays accessible while scrolling
8. **Bottom Notifications**: Toast messages appear at bottom on mobile for better thumb reach
9. **Safe Area Support**: Layout adapts to notched devices automatically (home indicator spacing)
10. **Smooth Animations**: 300ms transitions for tab switching with shadow and color changes

### Performance

- **Build Status**: ✅ Successful
- **First Load JS**: 429 kB (Dashboard route)
- **Build Time**: ~13s with Turbopack
- **Optimization**: All pages statically generated
- **Bundle**: Optimized with code splitting

### Testing Checklist

For mobile optimization verification:
- [ ] Bottom navigation displays on mobile (< 768px) and is fixed at bottom
- [ ] Bottom navigation respects safe area on notched devices
- [ ] Active tab is highlighted with blue background and top border
- [ ] Desktop shows traditional top tabs (≥ 768px)
- [ ] All forms stack vertically and are keyboard-accessible
- [ ] Tables display as cards on viewports < 768px
- [ ] Toast notifications appear at bottom on mobile
- [ ] Top navigation bar is sticky and responsive
- [ ] All touch targets are minimum 44x44px (bottom nav is 64px height)
- [ ] Calendar is touch-friendly
- [ ] Date formats are abbreviated on mobile
- [ ] Dialogs don't exceed viewport width
- [ ] No horizontal overflow on any page
- [ ] Content has bottom padding to prevent overlap with bottom nav

### Development Guidelines for Mobile

When adding new features:

1. **Always use mobile-first approach**: Start with mobile styles, add `md:`, `lg:` for larger screens
2. **Test touch targets**: Ensure buttons/links are minimum 44x44px
3. **Consider card views**: For any new table, implement a card alternative for mobile
4. **Use responsive utilities**: Prefer `flex-col md:flex-row` over fixed layouts
5. **Test on real devices**: Chrome DevTools device emulation is good, but test on actual iPhones when possible
6. **Watch for overflow**: Use `truncate`, `break-words`, or `overflow-hidden` appropriately
7. **Responsive padding**: Use `p-4 md:p-6` pattern for spacing
8. **Form dialogs**: Follow the `grid-cols-1 md:grid-cols-4` pattern for consistency
