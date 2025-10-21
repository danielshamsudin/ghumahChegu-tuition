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
