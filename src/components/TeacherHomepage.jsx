'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Clock, Users, Plus, BookOpen, UserPlus, Calendar as CalendarCheck, FileText, Settings } from 'lucide-react';

export default function TeacherHomepage() {
  const { currentUser, userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success', 'warning', 'error'
  const [showNotification, setShowNotification] = useState(false);

  // Subject management state
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    name: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    recurring: 'none',
    date: ''
  });

  // Subject assignment state
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState('');
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState([]);

  // Student management state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Invoice state
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth() + 1);
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState([]);

  // Show notification with auto-dismiss
  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setShowNotification(true);
    // Wait 1 second, then trigger slide out, then hide after animation completes
    setTimeout(() => {
      // Trigger slide-out animation by adding a class or changing state
      const notification = document.querySelector('.toast-notification');
      if (notification) {
        notification.classList.add('slide-out');
      }
      // Hide completely after slide-out animation (300ms)
      setTimeout(() => {
        setShowNotification(false);
      }, 300);
    }, 1000);
  };

  useEffect(() => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin')) {
      fetchStudents();
      fetchSubjects();
      fetchSubjectAssignments();
      fetchInvoices();
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    filterTodaysClasses();
  }, [selectedDate, subjects, subjectAssignments, students]);

  useEffect(() => {
    fetchAttendance();
  }, [currentUser, userRole, attendanceDate]);

  const fetchStudents = async () => {
    try {
      const studentsCollectionRef = collection(db, 'students');
      let q;
      if (userRole === 'teacher') {
        q = query(studentsCollectionRef, where('teacherId', '==', currentUser.uid));
      } else {
        q = studentsCollectionRef;
      }
      const studentsSnapshot = await getDocs(q);
      const studentsList = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendance = async () => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin') && attendanceDate) {
      const attendanceCollectionRef = collection(db, 'attendance');
      let q;
      if (userRole === 'teacher') {
        q = query(attendanceCollectionRef, where('teacherId', '==', currentUser.uid), where('date', '==', attendanceDate));
      } else {
        q = query(attendanceCollectionRef, where('date', '==', attendanceDate));
      }
      const attendanceSnapshot = await getDocs(q);
      const records = {};
      attendanceSnapshot.docs.forEach(d => {
        records[d.data().studentId] = { status: d.data().status, id: d.id };
      });
      setAttendanceRecords(records);
    }
  };

  const fetchInvoices = async () => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin')) {
      const invoicesCollectionRef = collection(db, 'invoices');
      let q;
      if (userRole === 'teacher') {
        q = query(invoicesCollectionRef, where('teacherId', '==', currentUser.uid));
      } else {
        q = invoicesCollectionRef;
      }
      const invoicesSnapshot = await getDocs(q);
      const invoicesList = invoicesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(invoicesList);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const subjectsCollectionRef = collection(db, 'subjects');
      let q;
      if (userRole === 'teacher') {
        q = query(subjectsCollectionRef, where('teacherId', '==', currentUser.uid));
      } else {
        q = subjectsCollectionRef;
      }
      const subjectsSnapshot = await getDocs(q);
      const subjectsList = subjectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjects(subjectsList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectAssignments = async () => {
    try {
      const assignmentsCollectionRef = collection(db, 'subjectAssignments');
      let q;
      if (userRole === 'teacher') {
        q = query(assignmentsCollectionRef, where('teacherId', '==', currentUser.uid));
      } else {
        q = assignmentsCollectionRef;
      }
      const assignmentsSnapshot = await getDocs(q);
      const assignmentsList = assignmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjectAssignments(assignmentsList);
    } catch (error) {
      console.error('Error fetching subject assignments:', error);
    }
  };

  const filterTodaysClasses = () => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayOfWeek = selectedDate.getDay();

    // Build classes from subjects + assignments
    const classes = [];

    subjects.forEach(subject => {
      // Check if subject is scheduled for selected date
      let isScheduled = false;

      if (subject.recurring === 'weekly' && subject.dayOfWeek === dayOfWeek) {
        isScheduled = true;
      } else if (subject.recurring === 'none' && subject.date === selectedDateStr) {
        isScheduled = true;
      }

      if (isScheduled) {
        // Get all students assigned to this subject
        const assignedStudents = subjectAssignments
          .filter(assignment => assignment.subjectId === subject.id)
          .map(assignment => {
            const student = students.find(s => s.id === assignment.studentId);
            return student ? student.name : 'Unknown Student';
          });

        classes.push({
          ...subject,
          students: assignedStudents
        });
      }
    });

    classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setTodaysClasses(classes);
  };

  // Subject Management Handlers
  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.startTime || !newSubject.endTime) {
      showMessage('Please fill in all required fields.', 'warning');
      return;
    }

    // Validate recurring vs one-time
    if (newSubject.recurring === 'weekly' && !newSubject.dayOfWeek) {
      showMessage('Please select a day of week for weekly recurring subjects.', 'warning');
      return;
    }

    if (newSubject.recurring === 'none' && !newSubject.date) {
      showMessage('Please select a date for one-time subjects.', 'warning');
      return;
    }

    try {
      const subjectData = {
        name: newSubject.name,
        startTime: newSubject.startTime,
        endTime: newSubject.endTime,
        recurring: newSubject.recurring,
        teacherId: currentUser.uid,
        createdAt: new Date(),
      };

      if (newSubject.recurring === 'weekly') {
        subjectData.dayOfWeek = parseInt(newSubject.dayOfWeek);
      } else {
        subjectData.date = newSubject.date;
      }

      await addDoc(collection(db, 'subjects'), subjectData);
      setNewSubject({ name: '', startTime: '', endTime: '', dayOfWeek: '', recurring: 'none', date: '' });
      showMessage('Subject added successfully!');
      fetchSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      showMessage('Failed to add subject. Please try again.', 'error');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));

      // Also delete all assignments for this subject
      const assignmentsToDelete = subjectAssignments.filter(a => a.subjectId === subjectId);
      for (const assignment of assignmentsToDelete) {
        await deleteDoc(doc(db, 'subjectAssignments', assignment.id));
      }

      showMessage('Subject and its assignments deleted successfully!');
      fetchSubjects();
      fetchSubjectAssignments();
    } catch (error) {
      console.error('Error deleting subject:', error);
      showMessage('Failed to delete subject. Please try again.', 'error');
    }
  };

  const handleAssignStudentsToSubject = async () => {
    if (!selectedSubjectForAssignment) {
      showMessage('Please select a subject.', 'warning');
      return;
    }

    if (selectedStudentsForAssignment.length === 0) {
      showMessage('Please select at least one student.', 'warning');
      return;
    }

    try {
      const promises = [];

      for (const studentId of selectedStudentsForAssignment) {
        // Check if assignment already exists
        const existingAssignment = subjectAssignments.find(
          a => a.subjectId === selectedSubjectForAssignment && a.studentId === studentId
        );

        if (!existingAssignment) {
          const assignmentData = {
            subjectId: selectedSubjectForAssignment,
            studentId: studentId,
            teacherId: currentUser.uid,
            createdAt: new Date(),
          };
          promises.push(addDoc(collection(db, 'subjectAssignments'), assignmentData));
        }
      }

      await Promise.all(promises);
      showMessage('Students assigned to subject successfully!');
      setSelectedSubjectForAssignment('');
      setSelectedStudentsForAssignment([]);
      fetchSubjectAssignments();
    } catch (error) {
      console.error('Error assigning students:', error);
      showMessage('Failed to assign students. Please try again.');
    }
  };

  const handleRemoveStudentFromSubject = async (assignmentId) => {
    try {
      await deleteDoc(doc(db, 'subjectAssignments', assignmentId));
      showMessage('Student removed from subject successfully!');
      fetchSubjectAssignments();
    } catch (error) {
      console.error('Error removing student:', error);
      showMessage('Failed to remove student. Please try again.');
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasClassesOnDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    return subjects.some(subject => {
      if (subject.date === dateStr) return true;
      if (subject.recurring === 'weekly' && subject.dayOfWeek === dayOfWeek) return true;
      return false;
    });
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Unknown';
  };

  const getAssignedStudentsForSubject = (subjectId) => {
    return subjectAssignments
      .filter(a => a.subjectId === subjectId)
      .map(a => {
        const student = students.find(s => s.id === a.studentId);
        return student ? { ...student, assignmentId: a.id } : null;
      })
      .filter(s => s !== null);
  };

  // Student Management Handlers
  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentEmail) {
      showMessage('Student name and email cannot be empty.');
      return;
    }
    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName,
        email: newStudentEmail,
        teacherId: currentUser.uid,
        createdAt: new Date(),
      });
      setNewStudentName('');
      setNewStudentEmail('');
      showMessage('Student added successfully!');
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      showMessage(`Failed to add student: ${error.message}`);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.name || !editingStudent.email) {
      showMessage('Student name and email cannot be empty.');
      return;
    }
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        email: editingStudent.email,
      });
      showMessage('Student updated successfully!');
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      showMessage(`Failed to update student: ${error.message}`);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      showMessage('Student deleted successfully!');
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
      showMessage(`Failed to delete student: ${error.message}`);
    }
  };

  // Attendance Handlers
  const handleMarkAttendance = async (studentId, status) => {
    try {
      const attendanceQuery = query(collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('teacherId', '==', currentUser.uid),
        where('date', '==', attendanceDate)
      );
      const existingAttendance = await getDocs(attendanceQuery);

      if (existingAttendance.empty) {
        const newAttendanceData = {
          studentId,
          teacherId: currentUser.uid,
          date: attendanceDate,
          status,
          markedBy: currentUser.uid,
          markedAt: new Date(),
        };
        await addDoc(collection(db, 'attendance'), newAttendanceData);
      } else {
        const recordId = existingAttendance.docs[0].id;
        const updatedAttendanceData = {
          status,
          markedBy: currentUser.uid,
          markedAt: new Date(),
        };
        await updateDoc(doc(db, 'attendance', recordId), updatedAttendanceData);
      }

      const student = students.find(s => s.id === studentId);
      if (student) {
        showMessage(`Attendance for ${student.name} marked as ${status}`);
      }
      fetchAttendance();
    } catch (error) {
      console.error("Error marking attendance:", error);
      showMessage(`Failed to mark attendance: ${error.message}`);
    }
  };

  // Invoice Handlers
  const handleGenerateInvoice = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      showMessage('Student not found.');
      return;
    }

    try {
      const attendanceQuery = query(collection(db, 'attendance'),
        where('studentId', '==', student.id),
        where('teacherId', '==', currentUser.uid),
        where('status', '==', 'present'),
        where('date', '>=', `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}-01`),
        where('date', '<=', `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}-31`)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const presentDays = attendanceSnapshot.docs.length;
      const amount = presentDays * 35;

      const existingInvoiceQuery = query(collection(db, 'invoices'),
        where('studentId', '==', student.id),
        where('teacherId', '==', currentUser.uid),
        where('month', '==', invoiceMonth),
        where('year', '==', invoiceYear)
      );
      const existingInvoiceSnapshot = await getDocs(existingInvoiceQuery);

      if (existingInvoiceSnapshot.empty) {
        await addDoc(collection(db, 'invoices'), {
          studentId: student.id,
          teacherId: currentUser.uid,
          month: invoiceMonth,
          year: invoiceYear,
          amount,
          status: 'pending',
          generatedAt: new Date(),
          details: { presentDays, ratePerDay: 35 },
        });
      } else {
        const invoiceId = existingInvoiceSnapshot.docs[0].id;
        await updateDoc(doc(db, 'invoices', invoiceId), {
          amount,
          status: 'pending',
          generatedAt: new Date(),
          details: { presentDays, ratePerDay: 35 },
        });
      }
      showMessage(`Invoice generated for ${student.name} for ${invoiceMonth}/${invoiceYear} successfully!`);
      fetchInvoices();
    } catch (error) {
      console.error("Error generating invoices:", error);
      showMessage(`Failed to generate invoices: ${error.message}`);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      showMessage('Invoice deleted successfully!');
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showMessage(`Failed to delete invoice: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>

        {/* Toast Notification */}
        {showNotification && message && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`toast-notification ${
              messageType === 'success' ? 'bg-green-600' :
              messageType === 'warning' ? 'bg-yellow-500' :
              messageType === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ease-in-out transform translate-x-0 opacity-100`}>
              {messageType === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {messageType === 'warning' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {messageType === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        <style jsx>{`
          .toast-notification {
            animation: slideIn 0.3s ease-out;
          }

          .toast-notification.slide-out {
            animation: slideOut 0.3s ease-in forwards;
          }

          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
        `}</style>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Clock className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CalendarCheck className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="classes">
              <BookOpen className="w-4 h-4 mr-2" />
              Classes
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      modifiers={{
                        hasClass: (date) => hasClassesOnDate(date)
                      }}
                      modifiersStyles={{
                        hasClass: {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                      className="rounded-md border"
                    />
                    <div className="mt-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Days with classes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Classes Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>
                      Classes for {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todaysClasses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No classes scheduled for this day</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todaysClasses.map((classItem) => (
                          <Card key={classItem.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{classItem.name}</h3>
                                    {classItem.recurring === 'weekly' && (
                                      <Badge variant="secondary">Weekly</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>
                                        {classItem.students.length > 0
                                          ? classItem.students.join(', ')
                                          : 'No students assigned'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold">{students.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                          <p className="text-2xl font-bold">{todaysClasses.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-purple-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                          <p className="text-2xl font-bold">{subjects.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Student Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="newStudentName" className="text-right">Name</Label>
                        <Input
                          id="newStudentName"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="newStudentEmail" className="text-right">Email</Label>
                        <Input
                          id="newStudentEmail"
                          type="email"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No students added yet.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setEditingStudent(student)}>
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Student</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="editStudentName" className="text-right">Name</Label>
                                        <Input
                                          id="editStudentName"
                                          value={editingStudent?.name || ''}
                                          onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                          className="col-span-3"
                                        />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="editStudentEmail" className="text-right">Email</Label>
                                        <Input
                                          id="editStudentEmail"
                                          type="email"
                                          value={editingStudent?.email || ''}
                                          onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                          className="col-span-3"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit" onClick={handleUpdateStudent}>Save Changes</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <div className="flex items-center gap-4">
                  <Label htmlFor="attendanceDate">Select Date:</Label>
                  <Input
                    id="attendanceDate"
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No students to mark attendance for.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="capitalize">
                              {attendanceRecords[student.id]?.status || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id]?.status === 'present' ? 'default' : 'outline'}
                                  onClick={() => handleMarkAttendance(student.id, 'present')}
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id]?.status === 'absent' ? 'destructive' : 'outline'}
                                  onClick={() => handleMarkAttendance(student.id, 'absent')}
                                >
                                  Absent
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <div className="flex items-center space-x-4">
                  <div>
                    <Label htmlFor="invoiceMonth" className="mr-2">Month:</Label>
                    <Input
                      type="number"
                      id="invoiceMonth"
                      value={invoiceMonth}
                      onChange={(e) => setInvoiceMonth(parseInt(e.target.value))}
                      min="1"
                      max="12"
                      className="w-20 inline-block"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceYear" className="mr-2">Year:</Label>
                    <Input
                      type="number"
                      id="invoiceYear"
                      value={invoiceYear}
                      onChange={(e) => setInvoiceYear(parseInt(e.target.value))}
                      min="2000"
                      max="2100"
                      className="w-24 inline-block"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Students with Generate Invoice buttons */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Generate Invoices</h3>
                    {students.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No students available.</p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map(student => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={() => handleGenerateInvoice(student.id)}>
                                    Generate Invoice
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Generated Invoices */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Generated Invoices</h3>
                      <Button onClick={fetchInvoices}>Refresh Invoices</Button>
                    </div>
                    {invoices.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No invoices found.</p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Month</TableHead>
                              <TableHead>Year</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.map(invoice => (
                              <TableRow key={invoice.id}>
                                <TableCell>{getStudentName(invoice.studentId)}</TableCell>
                                <TableCell>{invoice.month}</TableCell>
                                <TableCell>{invoice.year}</TableCell>
                                <TableCell>RM{invoice.amount}</TableCell>
                                <TableCell className="capitalize">{invoice.status}</TableCell>
                                <TableCell>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            {/* Subject Management Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Subject Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subjectName" className="text-right">Subject Name</Label>
                        <Input
                          id="subjectName"
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                          placeholder="e.g., Mathematics"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subjectStartTime" className="text-right">Start Time</Label>
                        <Input
                          id="subjectStartTime"
                          type="time"
                          value={newSubject.startTime}
                          onChange={(e) => setNewSubject({ ...newSubject, startTime: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subjectEndTime" className="text-right">End Time</Label>
                        <Input
                          id="subjectEndTime"
                          type="time"
                          value={newSubject.endTime}
                          onChange={(e) => setNewSubject({ ...newSubject, endTime: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subjectRecurring" className="text-right">Schedule Type</Label>
                        <select
                          id="subjectRecurring"
                          value={newSubject.recurring}
                          onChange={(e) => setNewSubject({ ...newSubject, recurring: e.target.value })}
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="none">One-time only</option>
                          <option value="weekly">Weekly Recurring</option>
                        </select>
                      </div>
                      {newSubject.recurring === 'weekly' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subjectDay" className="text-right">Day of Week</Label>
                          <select
                            id="subjectDay"
                            value={newSubject.dayOfWeek}
                            onChange={(e) => setNewSubject({ ...newSubject, dayOfWeek: e.target.value })}
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          >
                            <option value="">Select a day</option>
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                          </select>
                        </div>
                      )}
                      {newSubject.recurring === 'none' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subjectDate" className="text-right">Date</Label>
                          <Input
                            id="subjectDate"
                            type="date"
                            value={newSubject.date}
                            onChange={(e) => setNewSubject({ ...newSubject, date: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddSubject}>Add Subject</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No subjects created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <Card key={subject.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{subject.name}</h3>
                                {subject.recurring === 'weekly' && (
                                  <Badge variant="secondary">Weekly - {getDayName(subject.dayOfWeek)}</Badge>
                                )}
                                {subject.recurring === 'none' && subject.date && (
                                  <Badge variant="outline">{subject.date}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Assigned Students: </span>
                                {getAssignedStudentsForSubject(subject.id).length > 0 ? (
                                  <span>{getAssignedStudentsForSubject(subject.id).map(s => s.name).join(', ')}</span>
                                ) : (
                                  <span className="text-gray-400">No students assigned</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Assignment Section */}
            <Card>
              <CardHeader>
                <CardTitle>Assign Students to Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="assignSubject">Select Subject</Label>
                      <select
                        id="assignSubject"
                        value={selectedSubjectForAssignment}
                        onChange={(e) => setSelectedSubjectForAssignment(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Select a subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.recurring === 'weekly' ? getDayName(subject.dayOfWeek) : subject.date})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Select Students (hold Ctrl/Cmd to select multiple)</Label>
                      <select
                        multiple
                        value={selectedStudentsForAssignment}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setSelectedStudentsForAssignment(selected);
                        }}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button onClick={handleAssignStudentsToSubject}>Assign Students to Subject</Button>
                  </div>

                  {/* Current Assignments */}
                  {selectedSubjectForAssignment && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Current Assignments for {subjects.find(s => s.id === selectedSubjectForAssignment)?.name}
                      </h3>
                      {getAssignedStudentsForSubject(selectedSubjectForAssignment).length === 0 ? (
                        <p className="text-gray-500 text-sm">No students assigned yet.</p>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getAssignedStudentsForSubject(selectedSubjectForAssignment).map(student => (
                                <TableRow key={student.assignmentId}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell>{student.email}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemoveStudentFromSubject(student.assignmentId)}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}