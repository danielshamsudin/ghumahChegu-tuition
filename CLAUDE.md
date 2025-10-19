# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a tuition management system built with Next.js 15 and Firebase. The application manages three user roles: superadmin, teacher, and student. It provides functionality for student registration, attendance tracking, subject assignment, and invoice generation.

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
- Auth flow:
  1. User signs in via `/login`
  2. `onAuthStateChanged` listener in AuthContext fetches user role from Firestore
  3. Dashboard route (`/dashboard`) handles role-based rendering:
     - Teachers see TeacherHomepage component
     - Superadmins see links to superadmin and legacy teacher panels
- Protected routes check `currentUser` and redirect to `/login` if not authenticated

### Database Schema
Firestore collections:
- `users`: User profiles with `role` field (superadmin/teacher/student)
- `students`: Student records with `teacherId` (linked to teacher who created them)
- `attendance`: Attendance records with `teacherId` and `studentId`
- `invoices`: Generated invoices with `teacherId`, `studentId`, month, year, amount, status
- `subjects`: Subject records with `teacherId`
- `subjectAssignments`: Subject assignments with `teacherId` and `studentId`

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

## Development Notes

- **Language**: JavaScript (.js/.jsx) rather than TypeScript
- **React version**: React 19.1.0 (latest)
- **Next.js version**: 15.5.3 with Turbopack enabled
- **Tailwind CSS**: v4 (using @tailwindcss/postcss)
- **Firebase config**: Live API keys are in `src/lib/firebase.js` (consider environment variables for production)
- **Component style**: Always use JSX extensions and syntax (NOT TSX)

## Known Issues & Important Notes

### Firestore Security Rules
From GEMINI.md, two major issues were resolved:

1. **Read permissions issue**: Changed from `request.query.get('fieldId')` to `resource.data.fieldId` for attendance and invoices read operations
2. **Delete permissions issue**: Changed from `request.resource.data.teacherId` to `resource.data.teacherId` for delete operations (`request.resource` is not available during delete)

### Routing Structure
- Teachers use `/dashboard` route (NOT `/teacher`)
- The `/teacher` route exists as "Legacy Teacher Panel" but is primarily for superadmin access
- Dashboard route renders different UI based on `userRole` from AuthContext
