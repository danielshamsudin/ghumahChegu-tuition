# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a tuition management system built with Next.js 15 and Firebase. The application manages three user roles: superadmin, teacher, and student. It provides functionality for student registration, attendance tracking, and invoice generation.

## Common Commands

- **Development server**: `npm run dev` (but note: CLAUDE COMMAND says do not run npm run dev)
- **Build**: `npm run build`
- **Production start**: `npm start`
- **Lint**: `npm run lint`

## Architecture

### Core Structure
- **Frontend**: Next.js 15 with App Router, Tailwind CSS, and shadcn/ui components
- **Backend**: Firebase Authentication and Firestore
- **State Management**: React Context API for auth state

### Key Directories
- `src/app/`: App Router pages (dashboard, login, superadmin, teacher)
- `src/components/ui/`: Reusable UI components from shadcn/ui
- `src/context/`: React context providers (AuthContext)
- `src/lib/`: Firebase configuration and utilities

### Authentication & Authorization
- Firebase Auth with role-based access control
- User roles stored in Firestore `/users/{uid}` collection
- AuthContext provides `currentUser`, `userRole`, and `loading` state
- Role-based routing: superadmin → superadmin panel, teacher → teacher panel

### Database Schema
Firestore collections:
- `users`: User profiles with role field (superadmin/teacher/student)
- `students`: Student records linked to teachers via teacherId
- `attendance`: Attendance records with teacherId and studentId
- `invoices`: Generated invoices with teacherId and studentId

### Firebase Security Rules
Complex role-based rules in `firestore.rules`:
- Teachers can only access their own students' data
- Students can only access their own records
- Superadmins have full access
- Known issue: Use `resource.data.fieldId` not `request.query.get('fieldId')` for document field validation

### UI Framework
- shadcn/ui components configured in `components.json`
- Tailwind CSS with custom configuration
- Lucide React for icons
- Components use JSX (not TSX) as per configuration

## Development Notes

- The codebase uses JavaScript (.js/.jsx) rather than TypeScript
- Firebase config contains live API keys (consider environment variables for production)
- Currency is RM (Malaysian Ringgit) with RM35 hourly rate
- Invoice generation is per-student with month/year selection