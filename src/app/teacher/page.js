'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc as getSingleDoc, deleteField } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Shadcn UI Components
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';

export default function TeacherPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentHourlyRate, setNewStudentHourlyRate] = useState(35);
  const [editingStudent, setEditingStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [attendanceRecords, setAttendanceRecords] = useState({}); // {studentId: status}
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!currentUser || (userRole !== 'teacher' && userRole !== 'superadmin')) {
        router.push('/dashboard'); // Redirect if not teacher/superadmin or not logged in
      }
    }
  }, [loading, currentUser, userRole, router]);

  const fetchStudents = useCallback(async () => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin')) {
      const studentsCollectionRef = collection(db, 'students');
      try {
        const studentsSnapshot = await getDocs(studentsCollectionRef);
        const studentsList = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudents(studentsList);

        // Removed Lazy Migration: Since all teachers can see all students, 
        // migrating old `teacherId` to `teacherIds` is less time-critical 
        // for access, though still good for data model cleanliness. 
        // We can keep a background check or just rely on the superadmin tool.
      } catch (err) {
        console.error("Error fetching students:", err);
        setMessage("Error fetching students. Please try refreshing.");
      }
    }
  }, [currentUser, userRole]);

  const fetchAttendance = useCallback(async () => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin') && attendanceDate) {
      const attendanceCollectionRef = collection(db, 'attendance');
      let q;
      if (userRole === 'teacher') {
        q = query(attendanceCollectionRef, where('teacherId', '==', currentUser.uid), where('date', '==', attendanceDate));
      } else { // superadmin can see all attendance
        q = query(attendanceCollectionRef, where('date', '==', attendanceDate));
      }
      const attendanceSnapshot = await getDocs(q);
      const records = {};
      attendanceSnapshot.docs.forEach(d => {
        records[d.data().studentId] = { status: d.data().status, id: d.id };
      });
      setAttendanceRecords(records);
    }
  }, [currentUser, userRole, attendanceDate]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleAddStudent = async () => {
    if (!newStudentName) {
      setMessage('Student name cannot be empty.');
      return;
    }
    if (!newStudentHourlyRate || newStudentHourlyRate <= 0) {
      setMessage('Hourly rate must be greater than 0.');
      return;
    }
    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName,
        email: newStudentEmail || '',
        hourlyRate: parseFloat(newStudentHourlyRate),
        teacherIds: [currentUser.uid],
        createdAt: new Date(),
      });
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentHourlyRate(35);
      setMessage('Student added successfully!');
      fetchStudents(); // Re-fetch students to update the list
    } catch (error) {
      console.error("Error adding student:", error);
      setMessage(`Failed to add student: ${error.message}`);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.name) {
      setMessage('Student name cannot be empty.');
      return;
    }
    if (!editingStudent.hourlyRate || editingStudent.hourlyRate <= 0) {
      setMessage('Hourly rate must be greater than 0.');
      return;
    }
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        email: editingStudent.email || '',
        hourlyRate: parseFloat(editingStudent.hourlyRate),
      });
      setMessage('Student updated successfully!');
      setEditingStudent(null);
      fetchStudents(); // Re-fetch students to update the list
    } catch (error) {
      console.error("Error updating student:", error);
      setMessage(`Failed to update student: ${error.message}`);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      setMessage('Student deleted successfully!');
      // Filter out the deleted student from the state
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
      setMessage(`Failed to delete student: ${error.message}`);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {

    try {
      const attendanceQuery = query(collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('teacherId', '==', currentUser.uid),
        where('date', '==', attendanceDate)
      );
      const existingAttendance = await getDocs(attendanceQuery);


      if (existingAttendance.empty) {
        // Add new attendance record
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
        // Update existing attendance record
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
        setMessage(`Attendance for ${student.name} marked as ${status}`);
      } else {
        setMessage(`Attendance for student ${studentId} marked as ${status}`); // Fallback
      }
      fetchAttendance(); // Re-fetch attendance to update UI
    } catch (error) {
      console.error("Error marking attendance in catch block:", error); // MODIFY THIS LOG
      setMessage(`Failed to mark attendance: ${error.message}`);
    }
  };

  const handleGenerateInvoice = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      setMessage('Student not found.');
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

      // Group attendance by subject to calculate duration-based amounts
      const attendanceBySubject = {};
      for (const attendanceDoc of attendanceSnapshot.docs) {
        const attendanceData = attendanceDoc.data();
        const subjectId = attendanceData.subjectId;

        if (!attendanceBySubject[subjectId]) {
          attendanceBySubject[subjectId] = {
            count: 0,
            subjectId: subjectId
          };
        }
        attendanceBySubject[subjectId].count++;
      }

      // Calculate total amount considering session duration
      let totalAmount = 0;
      const sessionDetails = [];
      const hourlyRate = student.hourlyRate || 35;

      for (const subjectId in attendanceBySubject) {
        const sessionCount = attendanceBySubject[subjectId].count;
        let sessionDurationHours = 1; // Default to 1 hour if subject not found
        let subjectName = 'Unknown Subject';

        // Fetch subject to get duration
        if (subjectId && subjectId !== 'undefined') {
          try {
            const subjectDoc = await getSingleDoc(doc(db, 'subjects', subjectId));
            if (subjectDoc.exists()) {
              const subjectData = subjectDoc.data();
              subjectName = subjectData.name || 'Unknown Subject';

              // Calculate duration in hours from startTime and endTime
              if (subjectData.startTime && subjectData.endTime) {
                const [startHour, startMin] = subjectData.startTime.split(':').map(Number);
                const [endHour, endMin] = subjectData.endTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                sessionDurationHours = (endMinutes - startMinutes) / 60;
              }
            }
          } catch (error) {
            console.error('Error fetching subject:', error);
          }
        }

        const subtotal = sessionCount * hourlyRate * sessionDurationHours;
        totalAmount += subtotal;

        sessionDetails.push({
          subjectName,
          sessionCount,
          durationHours: sessionDurationHours,
          subtotal
        });
      }

      // If no attendance records found, set amount to 0
      if (attendanceSnapshot.docs.length === 0) {
        totalAmount = 0;
      }

      // Check if invoice already exists for this student, month, and year
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
          amount: totalAmount,
          status: 'pending',
          generatedAt: new Date(),
          details: {
            sessionDetails: sessionDetails,
            hourlyRate: hourlyRate
          },
        });
      } else {
        // Update existing invoice
        const invoiceId = existingInvoiceSnapshot.docs[0].id;
        await updateDoc(doc(db, 'invoices', invoiceId), {
          amount: totalAmount,
          status: 'pending', // Reset status if re-generated
          generatedAt: new Date(),
          details: {
            sessionDetails: sessionDetails,
            hourlyRate: hourlyRate
          },
        });
      }
      setMessage(`Invoice generated for ${student.name} for ${invoiceMonth}/${invoiceYear} successfully!`);
      fetchInvoices(); // Refresh the invoice list
    } catch (error) {
      console.error("Error generating invoices:", error);
      setMessage(`Failed to generate invoices: ${error.message}`);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      setMessage('Invoice deleted successfully!');
      fetchInvoices(); // Refresh the invoice list
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setMessage(`Failed to delete invoice: ${error.message}`);
    }
  };

  const fetchInvoices = useCallback(async () => {
    if (currentUser && (userRole === 'teacher' || userRole === 'superadmin')) {
      const invoicesCollectionRef = collection(db, 'invoices');
      let q;
      if (userRole === 'teacher') {
        q = query(invoicesCollectionRef, where('teacherId', '==', currentUser.uid));
      } else { // superadmin can see all invoices
        q = invoicesCollectionRef;
      }
      const invoicesSnapshot = await getDocs(q);
      const invoicesList = invoicesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(invoicesList);
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  if (loading || !currentUser || (userRole !== 'teacher' && userRole !== 'superadmin')) {
    return <div className="min-h-screen flex items-center justify-center">Loading or unauthorized...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex flex-col items-center gap-3 mb-6">
        <Image src="/logo.jpeg" alt="CLC Logo" width={64} height={64} className="rounded-lg" />
        <h1 className="text-3xl font-bold text-center">CLC, Chegu Learning Centre</h1>
      </div>
      {message && <p className="text-center text-green-600 mb-4">{message}</p>}

      {/* Add Student Section */}
      <section className="mb-8 p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">Add New Student</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newStudentName" className="text-right">Name</Label>
                <Input id="newStudentName" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newStudentHourlyRate" className="text-right">Hourly Rate (RM)</Label>
                <Input id="newStudentHourlyRate" type="number" min="0" step="0.01" value={newStudentHourlyRate} onChange={(e) => setNewStudentHourlyRate(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddStudent}>Add Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Student List Section */}
      <section className="mb-8 p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">My Students</h2>
        <div className="flex items-center space-x-4 mb-4">
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
        {students.length === 0 ? (
          <p>No students added yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>RM{student.hourlyRate || 35}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingStudent(student)}>Edit</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Student</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editStudentName" className="text-right">Name</Label>
                              <Input id="editStudentName" value={editingStudent?.name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editStudentEmail" type="email" className="text-right">Email</Label>
                              <Input id="editStudentEmail" value={editingStudent?.email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editStudentHourlyRate" className="text-right">Hourly Rate (RM)</Label>
                              <Input id="editStudentHourlyRate" type="number" min="0" step="0.01" value={editingStudent?.hourlyRate || ''} onChange={(e) => setEditingStudent({ ...editingStudent, hourlyRate: e.target.value })} className="col-span-3" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={handleUpdateStudent}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)} className="mr-2">Delete</Button>
                      <Button size="sm" onClick={() => handleGenerateInvoice(student.id)}>Generate Invoice</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Attendance Marking Section */}
      <section className="mb-8 p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>
        <div className="mb-4">
          <Label htmlFor="attendanceDate" className="mr-2">Select Date:</Label>
          <Input
            type="date"
            id="attendanceDate"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-auto inline-block"
          />
        </div>
        {students.length === 0 ? (
          <p>No students to mark attendance for.</p>
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
                      <Button
                        size="sm"
                        className="mr-2"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>



      {/* Invoice List Section */}
      <section className="mb-8 p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">Generated Invoices</h2>
        <Button onClick={fetchInvoices} className="mb-4">Refresh Invoices</Button>
        {invoices.length === 0 ? (
          <p>No invoices found.</p>
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
                    <TableCell>{students.find(s => s.id === invoice.studentId)?.name || 'N/A'}</TableCell>
                    <TableCell>{invoice.month}</TableCell>
                    <TableCell>{invoice.year}</TableCell>
                    <TableCell>RM{invoice.amount}</TableCell>
                    <TableCell className="capitalize">{invoice.status}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}


