import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDrhzrIBeXhk1A8PcnS5N8NUTUPKxOPHkQ",
    authDomain: "ghumahchegu-tuition.firebaseapp.com",
    projectId: "ghumahchegu-tuition",
    storageBucket: "ghumahchegu-tuition.firebasestorage.app",
    messagingSenderId: "664019611663",
    appId: "1:664019611663:web:f21acc3ee0051b3283337a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    console.log("Starting migration...");
    try {
        const studentsRef = collection(db, 'students');
        const snapshot = await getDocs(studentsRef);

        if (snapshot.empty) {
            console.log("No students found to migrate.");
            return;
        }

        let updatedCount = 0;
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Check if we need to migrate
            if (data.teacherId && !data.teacherIds) {
                console.log(`Migrating student ${docSnap.id}...`);

                await updateDoc(doc(db, 'students', docSnap.id), {
                    teacherIds: [data.teacherId],
                    teacherId: deleteField()
                });

                updatedCount++;
            } else if (data.teacherId && data.teacherIds) {
                // cleanup if somehow both exist (partial migration or bug)
                console.log(`Cleaning up student ${docSnap.id} (had both fields)...`);
                if (!data.teacherIds.includes(data.teacherId)) {
                    // Safety check, though logically we should trust one. 
                    // For this task, assuming teacherIds is the source of truth if it exists is safer if we just added it, 
                    // but if we are just transitioning, preserving teacherId into array is better.
                    await updateDoc(doc(db, 'students', docSnap.id), {
                        teacherIds: [...data.teacherIds, data.teacherId],
                        teacherId: deleteField()
                    });
                } else {
                    await updateDoc(doc(db, 'students', docSnap.id), {
                        teacherId: deleteField()
                    });
                }
                updatedCount++;
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} documents.`);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
