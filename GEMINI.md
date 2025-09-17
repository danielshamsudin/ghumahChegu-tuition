## 6. Known Issues & Resolutions

### 6.1 Firebase Firestore Security Rules - Teacher Attendance/Invoice Read Permissions

**Issue:**
Teachers were encountering "Missing or Insufficient permissions" errors when attempting to view the dashboard (which led to the teacher panel) and mark student attendance. Specifically, the `getDocs` calls for `attendance` and `invoices` were failing. Initial debugging suggested `currentUser.uid` was not available for teacher accounts, but further investigation revealed `currentUser` and `userRole` were correctly populated in the client-side application. The root cause was a mismatch between the client-side queries and the Firebase Firestore security rules.

**Root Cause:**
The `firestore.rules` for `attendance` and `invoices` read permissions for the `teacher` and `student` roles were incorrectly using `request.query.get('fieldId') == request.auth.uid`. While `request.query.get()` can be used to enforce query parameters, it was causing issues in this specific context, leading to permission denials. The correct approach for enforcing ownership based on a document's field is to use `resource.data.fieldId == request.auth.uid`.

**Resolution:**
The `firestore.rules` were updated to change the `allow read` conditions for `attendance` and `invoices` collections for both `teacher` and `student` roles.
*   **Before (problematic):** `request.query.get('teacherId') == request.auth.uid` and `request.query.get('studentId') == request.auth.uid`
*   **After (resolved):** `resource.data.teacherId == request.auth.uid` and `resource.data.studentId == request.auth.uid`

This change ensures that the security rules correctly check the `teacherId` or `studentId` field *within the document being accessed* against the authenticated user's UID, allowing teachers to read attendance and invoice records associated with their students, and students to read their own.

**Impact:**
After deploying the corrected rules, teachers can now successfully view their students' attendance records and generate invoices without permission errors. The `addDoc` and `updateDoc` operations for attendance also now function correctly as the initial `getDocs` query no longer fails.

### 6.2 Firebase Firestore Security Rules - Invoice Delete Permissions

**Issue:**
Teachers were encountering "Missing or Insufficient permissions" errors when attempting to delete invoices. The root cause was traced to an incorrect security rule that was using `request.resource.data.teacherId` for validation, which is not available during `delete` operations.

**Root Cause:**
The `firestore.rules` for `invoices` delete permissions for the `teacher` role were incorrectly using `request.resource.data.teacherId == request.auth.uid`. The `request.resource` object is not populated on `delete` requests. The correct object to use is `resource`, which represents the document being deleted.

**Resolution:**
The `firestore.rules` were updated to change the `allow delete` condition for the `invoices` collection for the `teacher` role.
*   **Before (problematic):** `request.resource.data.teacherId == request.auth.uid`
*   **After (resolved):** `resource.data.teacherId == request.auth.uid`

This change ensures that the security rules correctly check the `teacherId` field of the invoice being deleted against the authenticated user's UID.

**Impact:**
Teachers can now successfully delete invoices they have created.

## 7. Feature Updates

### 7.1 Invoice Management

**Summary:**
A comprehensive invoice management feature has been added to the teacher dashboard. This feature allows teachers to generate, view, and delete invoices for their students individually.

**Changes:**
*   **Individual Invoice Generation:** The system now supports generating invoices for each student separately. A "Generate Invoice" button has been added to each student's row in the "My Students" table.
*   **Invoice Viewing:** A new "Generated Invoices" section has been added to the teacher dashboard, displaying a list of all generated invoices in a table. The table includes the student's name, invoice month, year, amount, and status.
*   **Invoice Deletion:** Teachers can now delete invoices directly from the "Generated Invoices" table. A "Delete" button is available for each invoice.
*   **Rate Update:** The hourly rate for calculating invoice amounts has been updated from $10 to RM35.
*   **UI/UX Improvements:**
    *   The currency symbol has been updated from `$` to `RM`.
    *   The month and year selection for invoice generation has been moved to the "My Students" section for better usability.
    *   A "Refresh Invoices" button has been added to allow teachers to manually update the list of generated invoices.
    *   The "Student ID" column in the invoice list has been replaced with "Student Name" for better readability.
