'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Users, BookOpen, UserPlus, Settings, Calendar, Trash2, FileText } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshContainer } from '../../components/PullToRefresh';
import { BottomNav } from '../../components/BottomNav';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SuperadminPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

  // User Management State
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Class Management State
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState('');
  const [newSubject, setNewSubject] = useState({
    name: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [],
    recurring: 'none',
    date: ''
  });

  // Student Management State
  const [students, setStudents] = useState([]);
  const [selectedTeacherForStudent, setSelectedTeacherForStudent] = useState('');
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    hourlyRate: 35
  });

  // Assignment State
  const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState('');
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedStudentForAssignment, setSelectedStudentForAssignment] = useState('');
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState('');
  const [subjectAssignments, setSubjectAssignments] = useState([]);

  // Consolidated Invoice State
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth() + 1);
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());
  const [selectedStudentsForInvoice, setSelectedStudentsForInvoice] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!currentUser || userRole !== 'superadmin') {
        router.push('/dashboard');
      }
    }
  }, [loading, currentUser, userRole, router]);

  useEffect(() => {
    if (currentUser && userRole === 'superadmin') {
      fetchUsers();
      fetchAllSubjects();
      fetchAllStudents();
      fetchAllAssignments();
    }
  }, [currentUser, userRole]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([
      fetchUsers(),
      fetchAllSubjects(),
      fetchAllStudents(),
      fetchAllAssignments(),
    ]);
  };

  const { pullState, containerRef } = usePullToRefresh(handleRefresh, {
    enabled: true,
    threshold: 80,
  });

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
      setTeachers(usersList.filter(u => u.role === 'teacher'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjects(subjectsList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      const assignmentsSnapshot = await getDocs(collection(db, 'subjectAssignments'));
      const assignmentsList = assignmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjectAssignments(assignmentsList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === userId ? { ...user, role: newRole } : user))
      );
      showMessage(`Successfully updated role to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      showMessage(`Failed to update role: ${error.message}`, 'error');
    }
  };

  const handleCreateClass = async () => {
    if (!selectedTeacherForClass) {
      showMessage('Please select a teacher', 'error');
      return;
    }
    if (!newSubject.name || !newSubject.startTime || !newSubject.endTime) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }
    if (newSubject.recurring === 'weekly' && newSubject.daysOfWeek.length === 0) {
      showMessage('Please select at least one day of week', 'error');
      return;
    }
    if (newSubject.recurring === 'none' && !newSubject.date) {
      showMessage('Please select a date', 'error');
      return;
    }

    try {
      const subjectData = {
        name: newSubject.name,
        startTime: newSubject.startTime,
        endTime: newSubject.endTime,
        recurring: newSubject.recurring,
        teacherId: selectedTeacherForClass,
        createdAt: new Date(),
      };

      if (newSubject.recurring === 'weekly') {
        subjectData.daysOfWeek = newSubject.daysOfWeek.map(d => parseInt(d));
      } else {
        subjectData.date = newSubject.date;
      }

      await addDoc(collection(db, 'subjects'), subjectData);
      setNewSubject({ name: '', startTime: '', endTime: '', daysOfWeek: [], recurring: 'none', date: '' });
      setSelectedTeacherForClass('');
      showMessage('Class created successfully!');
      fetchAllSubjects();
    } catch (error) {
      console.error('Error creating class:', error);
      showMessage(`Failed to create class: ${error.message}`, 'error');
    }
  };

  const handleCreateStudent = async () => {
    if (!selectedTeacherForStudent) {
      showMessage('Please select a teacher', 'error');
      return;
    }
    if (!newStudent.name) {
      showMessage('Student name is required', 'error');
      return;
    }
    if (!newStudent.hourlyRate || newStudent.hourlyRate <= 0) {
      showMessage('Hourly rate must be greater than 0', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        name: newStudent.name,
        email: newStudent.email || '',
        hourlyRate: parseFloat(newStudent.hourlyRate),
        teacherIds: [selectedTeacherForStudent],
        createdAt: new Date(),
      });
      setNewStudent({ name: '', email: '', hourlyRate: 35 });
      setSelectedTeacherForStudent('');
      showMessage('Student created successfully!');
      fetchAllStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      showMessage(`Failed to create student: ${error.message}`, 'error');
    }
  };

  const handleAssignStudentToSubject = async () => {
    if (!selectedTeacherForAssignment) {
      showMessage('Please select a teacher', 'error');
      return;
    }
    if (!selectedStudentForAssignment) {
      showMessage('Please select a student', 'error');
      return;
    }
    if (!selectedSubjectForAssignment) {
      showMessage('Please select a subject', 'error');
      return;
    }

    // Check if assignment already exists
    const existingAssignment = subjectAssignments.find(
      a => a.subjectId === selectedSubjectForAssignment && a.studentId === selectedStudentForAssignment
    );

    if (existingAssignment) {
      showMessage('This assignment already exists', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'subjectAssignments'), {
        subjectId: selectedSubjectForAssignment,
        studentId: selectedStudentForAssignment,
        teacherId: selectedTeacherForAssignment,
        createdAt: new Date(),
      });
      setSelectedStudentForAssignment('');
      setSelectedSubjectForAssignment('');
      showMessage('Student assigned to subject successfully!');
      fetchAllAssignments();
    } catch (error) {
      console.error('Error assigning student:', error);
      showMessage(`Failed to assign student: ${error.message}`, 'error');
    }
  };

  const handleDeleteClass = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));

      // Also delete all assignments for this subject
      const assignmentsToDelete = subjectAssignments.filter(a => a.subjectId === subjectId);
      for (const assignment of assignmentsToDelete) {
        await deleteDoc(doc(db, 'subjectAssignments', assignment.id));
      }

      showMessage('Class and its assignments deleted successfully!');
      fetchAllSubjects();
      fetchAllAssignments();
    } catch (error) {
      console.error('Error deleting class:', error);
      showMessage(`Failed to delete class: ${error.message}`, 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await deleteDoc(doc(db, 'subjectAssignments', assignmentId));
      showMessage('Assignment removed successfully!');
      fetchAllAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showMessage(`Failed to delete assignment: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    if (selectedTeacherForAssignment) {
      const filteredStudents = students.filter(s => s.teacherId === selectedTeacherForAssignment);
      const filteredSubjects = subjects.filter(s => s.teacherId === selectedTeacherForAssignment);
      setTeacherStudents(filteredStudents);
      setTeacherSubjects(filteredSubjects);
    } else {
      setTeacherStudents([]);
      setTeacherSubjects([]);
    }
  }, [selectedTeacherForAssignment, students, subjects]);

  const handleMigrateStudents = async () => {
    if (!currentUser || userRole !== 'superadmin') return;
    try {
      showMessage('Starting migration...', 'info');
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      let count = 0;
      for (const studentDoc of studentsSnapshot.docs) {
        const data = studentDoc.data();
        if (data.teacherId && !data.teacherIds) {
          await updateDoc(doc(db, 'students', studentDoc.id), {
            teacherIds: [data.teacherId],
            teacherId: deleteField()
          });
          count++;
        }
      }
      showMessage(`Migration complete. Updated ${count} students.`, 'success');
      fetchAllStudents();
    } catch (error) {
      console.error('Migration failed:', error);
      showMessage(`Migration failed: ${error.message}`, 'error');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'students', studentId));

      // Also delete any assignments associated with this student
      const assignmentsToDelete = subjectAssignments.filter(a => a.studentId === studentId);
      for (const assignment of assignmentsToDelete) {
        await deleteDoc(doc(db, 'subjectAssignments', assignment.id));
      }

      showMessage('Student deleted successfully!');
      fetchAllStudents();
      fetchAllAssignments();
    } catch (error) {
      console.error("Error deleting student:", error);
      showMessage(`Failed to delete student: ${error.message}`, 'error');
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Unknown';
  };

  const formatDaysOfWeek = (daysArray) => {
    if (!daysArray || daysArray.length === 0) return 'No days selected';
    const sortedDays = [...daysArray].sort((a, b) => a - b);
    return sortedDays.map(day => getDayName(day)).join(', ');
  };

  const handleGenerateConsolidatedInvoice = async () => {
    if (selectedStudentsForInvoice.length === 0) {
      showMessage('Please select at least one student.', 'error');
      return;
    }

    try {
      const consolidatedData = [];
      let grandTotal = 0;
      const studentNames = [];

      // 1. Gather all attendance records
      for (const studentId of selectedStudentsForInvoice) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;
        studentNames.push(student.name);

        const attendanceQuery = query(collection(db, 'attendance'),
          where('studentId', '==', studentId),
          where('status', '==', 'present'),
          where('date', '>=', `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}-01`),
          where('date', '<=', `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}-31`)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);

        // Group by Subject
        const studentAttendanceBySubject = {};
        attendanceSnapshot.docs.forEach(d => {
          const data = d.data();
          const subjectId = data.subjectId;
          if (!studentAttendanceBySubject[subjectId]) {
            studentAttendanceBySubject[subjectId] = { count: 0, subjectId };
          }
          studentAttendanceBySubject[subjectId].count++;
        });

        // Resolve details and calculate with duration
        for (const subjectId in studentAttendanceBySubject) {
          const subject = subjects.find(s => s.id === subjectId);
          const teacherForThisRecord = teachers.find(t => t.id === subject?.teacherId);

          const sessionCount = studentAttendanceBySubject[subjectId].count;
          const rate = student.hourlyRate || 35;

          // Calculate session duration in hours
          let sessionDurationHours = 1; // Default to 1 hour
          if (subject && subject.startTime && subject.endTime) {
            const [startHour, startMin] = subject.startTime.split(':').map(Number);
            const [endHour, endMin] = subject.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            sessionDurationHours = (endMinutes - startMinutes) / 60;
          }

          const subtotal = sessionCount * rate * sessionDurationHours;
          grandTotal += subtotal;

          consolidatedData.push({
            studentName: student.name,
            teacherName: teacherForThisRecord?.email || 'Unknown',
            subjectName: subject ? subject.name : 'Unknown Subject',
            sessions: sessionCount,
            durationHours: sessionDurationHours,
            rate: rate,
            subtotal: subtotal
          });
        }
      }

      if (consolidatedData.length === 0) {
        showMessage('No attendance records found for selected students in this period.', 'warning');
        return;
      }

      // Helper to load images
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      };

      // 2. Generate PDF
      const pdf = new jsPDF();

      try {
        const [logoImg, qrImg] = await Promise.all([
          loadImage('/logo.jpeg'),
          loadImage('/qr.png')
        ]);

        // Add Logo (Top Right)
        pdf.addImage(logoImg, 'JPEG', 150, 10, 40, 40);
      } catch (err) {
        console.warn("Could not load images:", err);
      }

      pdf.setFontSize(20);
      pdf.text('INVOICE', 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      const consolidatedStudentName = [...new Set(studentNames)][0];
      pdf.text(`Student: ${consolidatedStudentName}`, 20, 35);
      pdf.text(`Period: ${String(invoiceMonth).padStart(2, '0')}/${invoiceYear}`, 20, 42);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 49);

      const tableData = consolidatedData.map(item => [
        item.subjectName,
        item.sessions,
        `${item.durationHours.toFixed(1)}h`,
        `RM ${item.rate.toFixed(2)}`,
        `RM ${item.subtotal.toFixed(2)}`
      ]);

      autoTable(pdf, {
        startY: 60,
        head: [['Subject', 'Sessions', 'Duration', 'Rate/hr', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });

      const finalY = pdf.lastAutoTable?.finalY || 60;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Grand Total: RM ${grandTotal.toFixed(2)}`, 190, finalY + 15, { align: 'right' });

      // Add QR Code and Payment Info
      try {
        const qrImg = await loadImage('/qr.png');
        pdf.addImage(qrImg, 'PNG', 20, finalY + 30, 40, 40);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text("Scan to Pay", 20, finalY + 25);
      } catch (e) {
        // Ignore if QR load fails
      }

      // Signature Line
      pdf.line(140, finalY + 50, 190, finalY + 50);
      pdf.text("Teacher Signature", 165, finalY + 55, { align: 'center' });

      // Save PDF
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[invoiceMonth - 1];
      const fileName = `${consolidatedStudentName.replace(/\s+/g, '_')}_${monthName}${invoiceYear}_Consolidated.pdf`;
      pdf.save(fileName);

      // 3. Save to Firestore
      await addDoc(collection(db, 'invoices'), {
        studentId: 'CONSOLIDATED',
        teacherId: 'superadmin',
        month: invoiceMonth,
        year: invoiceYear,
        amount: grandTotal,
        status: 'generated',
        generatedAt: new Date(),
        details: {
          breakdown: consolidatedData,
          studentIds: selectedStudentsForInvoice
        },
        description: `Consolidated Invoice for: ${[...new Set(studentNames)].join(', ')}`
      });

      showMessage('Consolidated invoice generated successfully!');
      setSelectedStudentsForInvoice([]);

    } catch (error) {
      console.error("Error generating consolidated invoice:", error);
      showMessage(`Failed: ${error.message}`, 'error');
    }
  };

  if (loading || !currentUser || userRole !== 'superadmin') {
    return <div className="min-h-screen flex items-center justify-center">Loading or unauthorized...</div>;
  }

  return (
    <>
      <PullToRefreshContainer containerRef={containerRef} pullState={pullState}>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Image src="/logo.jpeg" alt="CLC Logo" width={64} height={64} className="rounded-lg" />
                <h1 className="text-2xl sm:text-3xl font-bold">CLC, Chegu Learning Centre</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Superadmin Dashboard - Manage users, classes, students, and assignments</p>
            </div>

            {message && (
              <div className={`mb-4 p-3 sm:p-4 rounded text-sm sm:text-base ${messageType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1">
                <TabsTrigger value="users" className="text-xs sm:text-sm">
                  <Users className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="classes" className="text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Classes</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="text-xs sm:text-sm">
                  <UserPlus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Students</span>
                </TabsTrigger>
                <TabsTrigger value="assignments" className="text-xs sm:text-sm">
                  <Calendar className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Assign</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="text-xs sm:text-sm">
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger value="migration" className="text-xs sm:text-sm">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Migration</span>
                </TabsTrigger>
              </TabsList>

              {/* User Management Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile Card Layout */}
                    <div className="sm:hidden space-y-3">
                      {users.map(user => (
                        <div key={user.id} className="border rounded-lg p-4 bg-white">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Email</div>
                              <div className="text-sm font-medium truncate">{user.email}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Role</div>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="w-full border rounded px-3 py-2.5 text-sm capitalize"
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="superadmin">Superadmin</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="max-w-xs truncate">{user.email}</TableCell>
                              <TableCell className="capitalize">{user.role}</TableCell>
                              <TableCell>
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  className="border rounded px-3 py-2 text-sm"
                                >
                                  <option value="student">Student</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="superadmin">Superadmin</option>
                                </select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="migration">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Migration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">One-click migration to update student records from &quot;Single Teacher&quot; to &quot;Multiple Teachers&quot; data model.</p>
                    <Button onClick={handleMigrateStudents}>Migrate Students</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Classes Tab */}
              <TabsContent value="classes">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Create Class for Teacher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Select Teacher</Label>
                        <select
                          value={selectedTeacherForClass}
                          onChange={(e) => setSelectedTeacherForClass(e.target.value)}
                          className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                        >
                          <option value="">Select a teacher</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm">Subject Name</Label>
                        <Input
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                          placeholder="e.g., Mathematics"
                          className="h-12 mt-1.5"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Start Time</Label>
                          <Input
                            type="time"
                            value={newSubject.startTime}
                            onChange={(e) => setNewSubject({ ...newSubject, startTime: e.target.value })}
                            className="h-12 mt-1.5"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">End Time</Label>
                          <Input
                            type="time"
                            value={newSubject.endTime}
                            onChange={(e) => setNewSubject({ ...newSubject, endTime: e.target.value })}
                            className="h-12 mt-1.5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Schedule Type</Label>
                        <select
                          value={newSubject.recurring}
                          onChange={(e) => setNewSubject({ ...newSubject, recurring: e.target.value })}
                          className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                        >
                          <option value="none">One-time only</option>
                          <option value="weekly">Weekly Recurring</option>
                        </select>
                      </div>

                      {newSubject.recurring === 'weekly' && (
                        <div>
                          <Label className="text-sm">Days of Week</Label>
                          <div className="border rounded p-3 sm:p-4 space-y-2 mt-1.5">
                            {[
                              { value: 0, label: 'Sunday' },
                              { value: 1, label: 'Monday' },
                              { value: 2, label: 'Tuesday' },
                              { value: 3, label: 'Wednesday' },
                              { value: 4, label: 'Thursday' },
                              { value: 5, label: 'Friday' },
                              { value: 6, label: 'Saturday' }
                            ].map((day) => (
                              <label key={day.value} className="flex items-center space-x-3 cursor-pointer py-2 hover:bg-gray-50 rounded px-2">
                                <input
                                  type="checkbox"
                                  checked={newSubject.daysOfWeek.includes(day.value.toString())}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewSubject({
                                        ...newSubject,
                                        daysOfWeek: [...newSubject.daysOfWeek, day.value.toString()]
                                      });
                                    } else {
                                      setNewSubject({
                                        ...newSubject,
                                        daysOfWeek: newSubject.daysOfWeek.filter(d => d !== day.value.toString())
                                      });
                                    }
                                  }}
                                  className="w-5 h-5"
                                />
                                <span className="text-sm">{day.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {newSubject.recurring === 'none' && (
                        <div>
                          <Label className="text-sm">Date</Label>
                          <Input
                            type="date"
                            value={newSubject.date}
                            onChange={(e) => setNewSubject({ ...newSubject, date: e.target.value })}
                            className="h-12 mt-1.5"
                          />
                        </div>
                      )}

                      <Button onClick={handleCreateClass} className="w-full sm:w-auto h-12">Create Class</Button>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold mb-4 text-base sm:text-lg">All Classes</h3>

                      {/* Mobile Card Layout */}
                      <div className="sm:hidden space-y-3">
                        {subjects.map(subject => {
                          const teacher = teachers.find(t => t.id === subject.teacherId);
                          return (
                            <div key={subject.id} className="border rounded-lg p-4 bg-white">
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500">Teacher</div>
                                  <div className="text-sm font-medium truncate">{teacher?.email || 'Unknown'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Subject</div>
                                  <div className="text-sm font-medium">{subject.name}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Time</div>
                                  <div className="text-sm">{subject.startTime} - {subject.endTime}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Schedule</div>
                                  <div className="text-sm">
                                    {subject.recurring === 'weekly'
                                      ? `Weekly: ${subject.daysOfWeek && Array.isArray(subject.daysOfWeek)
                                        ? formatDaysOfWeek(subject.daysOfWeek)
                                        : getDayName(subject.dayOfWeek)}`
                                      : `One-time: ${subject.date}`}
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClass(subject.id)}
                                  className="w-full mt-2 h-12"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Teacher</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Schedule</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjects.map(subject => {
                              const teacher = teachers.find(t => t.id === subject.teacherId);
                              return (
                                <TableRow key={subject.id}>
                                  <TableCell className="max-w-xs truncate">{teacher?.email || 'Unknown'}</TableCell>
                                  <TableCell>{subject.name}</TableCell>
                                  <TableCell className="whitespace-nowrap">{subject.startTime} - {subject.endTime}</TableCell>
                                  <TableCell>
                                    {subject.recurring === 'weekly'
                                      ? `Weekly: ${subject.daysOfWeek && Array.isArray(subject.daysOfWeek)
                                        ? formatDaysOfWeek(subject.daysOfWeek)
                                        : getDayName(subject.dayOfWeek)}`
                                      : `One-time: ${subject.date}`}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteClass(subject.id)}
                                      className="h-10"
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Add Student for Teacher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Select Teacher</Label>
                        <select
                          value={selectedTeacherForStudent}
                          onChange={(e) => setSelectedTeacherForStudent(e.target.value)}
                          className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                        >
                          <option value="">Select a teacher</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm">Student Name</Label>
                        <Input
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          placeholder="Student Name"
                          className="h-12 mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Email (Optional)</Label>
                        <Input
                          type="email"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          placeholder="student@example.com"
                          className="h-12 mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Hourly Rate (RM)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newStudent.hourlyRate}
                          onChange={(e) => setNewStudent({ ...newStudent, hourlyRate: e.target.value })}
                          className="h-12 mt-1.5"
                        />
                      </div>

                      <Button onClick={handleCreateStudent} className="w-full sm:w-auto h-12">Add Student</Button>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold mb-4 text-base sm:text-lg">All Students</h3>

                      {/* Mobile Card Layout */}
                      <div className="sm:hidden space-y-3">
                        {students.map(student => {
                          const teacher = teachers.find(t => t.id === student.teacherId);
                          return (
                            <div key={student.id} className="border rounded-lg p-4 bg-white">
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500">Teacher</div>
                                  <div className="text-sm font-medium truncate">{teacher?.email || 'Unknown'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Student Name</div>
                                  <div className="text-sm font-medium">{student.name}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Email</div>
                                  <div className="text-sm truncate">{student.email || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Hourly Rate</div>
                                  <div className="text-sm font-medium">RM{student.hourlyRate || 35}</div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="w-full mt-2 h-12"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Teacher</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Hourly Rate</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map(student => {
                              const teacher = teachers.find(t => t.id === student.teacherId);
                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="max-w-xs truncate">{teacher?.email || 'Unknown'}</TableCell>
                                  <TableCell>{student.name}</TableCell>
                                  <TableCell className="max-w-xs truncate">{student.email || 'N/A'}</TableCell>
                                  <TableCell>RM{student.hourlyRate || 35}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteStudent(student.id)}
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Assign Student to Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Select Teacher</Label>
                        <select
                          value={selectedTeacherForAssignment}
                          onChange={(e) => setSelectedTeacherForAssignment(e.target.value)}
                          className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                        >
                          <option value="">Select a teacher</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                          ))}
                        </select>
                      </div>

                      {selectedTeacherForAssignment && (
                        <>
                          <div>
                            <Label className="text-sm">Select Student</Label>
                            <select
                              value={selectedStudentForAssignment}
                              onChange={(e) => setSelectedStudentForAssignment(e.target.value)}
                              className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                            >
                              <option value="">Select a student</option>
                              {teacherStudents.map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-sm">Select Subject</Label>
                            <select
                              value={selectedSubjectForAssignment}
                              onChange={(e) => setSelectedSubjectForAssignment(e.target.value)}
                              className="w-full border rounded px-3 py-3 mt-1.5 text-sm"
                            >
                              <option value="">Select a subject</option>
                              {teacherSubjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.startTime} - {subject.endTime})
                                </option>
                              ))}
                            </select>
                          </div>

                          <Button onClick={handleAssignStudentToSubject} className="w-full sm:w-auto h-12">
                            Assign Student to Subject
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold mb-4 text-base sm:text-lg">All Assignments</h3>

                      {/* Mobile Card Layout */}
                      <div className="sm:hidden space-y-3">
                        {subjectAssignments.map(assignment => {
                          const teacher = teachers.find(t => t.id === assignment.teacherId);
                          const student = students.find(s => s.id === assignment.studentId);
                          const subject = subjects.find(s => s.id === assignment.subjectId);
                          return (
                            <div key={assignment.id} className="border rounded-lg p-4 bg-white">
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500">Teacher</div>
                                  <div className="text-sm font-medium truncate">{teacher?.email || 'Unknown'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Student</div>
                                  <div className="text-sm font-medium">{student?.name || 'Unknown'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Subject</div>
                                  <div className="text-sm">{subject?.name || 'Unknown'}</div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="w-full mt-2 h-12"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Teacher</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjectAssignments.map(assignment => {
                              const teacher = teachers.find(t => t.id === assignment.teacherId);
                              const student = students.find(s => s.id === assignment.studentId);
                              const subject = subjects.find(s => s.id === assignment.subjectId);
                              return (
                                <TableRow key={assignment.id}>
                                  <TableCell className="max-w-xs truncate">{teacher?.email || 'Unknown'}</TableCell>
                                  <TableCell>{student?.name || 'Unknown'}</TableCell>
                                  <TableCell>{subject?.name || 'Unknown'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      className="h-10"
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Consolidated Invoices Tab */}
              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Consolidated Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Search and Selection */}
                      <div className="space-y-4">
                        <Label>Search Student Name</Label>
                        <Input
                          placeholder="Type name to search..."
                          value={invoiceSearchQuery}
                          onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                          className="h-12"
                        />

                        {invoiceSearchQuery && (
                          <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                            <Label className="text-sm font-semibold mb-2 block">Select Student Records to Merge:</Label>
                            {students
                              .filter(s => s.name.toLowerCase().includes(invoiceSearchQuery.toLowerCase()))
                              .map(student => {
                                const teacher = teachers.find(t => t.id === student.teacherId);
                                return (
                                  <label key={student.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer border">
                                    <input
                                      type="checkbox"
                                      checked={selectedStudentsForInvoice.includes(student.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStudentsForInvoice([...selectedStudentsForInvoice, student.id]);
                                        } else {
                                          setSelectedStudentsForInvoice(selectedStudentsForInvoice.filter(id => id !== student.id));
                                        }
                                      }}
                                      className="w-5 h-5"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{student.name}</div>
                                      <div className="text-xs text-gray-500">
                                        Teacher: {teacher?.email || 'Unknown'} | Rate: RM{student.hourlyRate || 35}/hr
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            {students.filter(s => s.name.toLowerCase().includes(invoiceSearchQuery.toLowerCase())).length === 0 && (
                              <p className="text-gray-500 text-center py-4">No matching students found.</p>
                            )}
                          </div>
                        )}

                        {selectedStudentsForInvoice.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded text-blue-700 text-sm">
                            {selectedStudentsForInvoice.length} records selected for consolidation.
                          </div>
                        )}
                      </div>

                      {/* Generation Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <Label>Month</Label>
                          <select
                            value={invoiceMonth}
                            onChange={(e) => setInvoiceMonth(parseInt(e.target.value))}
                            className="w-full border rounded px-3 py-3 mt-1.5"
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Year</Label>
                          <Input
                            type="number"
                            value={invoiceYear}
                            onChange={(e) => setInvoiceYear(parseInt(e.target.value))}
                            className="h-12 mt-1.5"
                          />
                        </div>
                      </div>

                      <Button onClick={handleGenerateConsolidatedInvoice} className="w-full h-12 text-lg">
                        Generate Consolidated Invoice PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefreshContainer>

      {/* Bottom Nav outside container to ensure viewport-fixed positioning */}
      <BottomNav userRole={userRole} activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
