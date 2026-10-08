'use client';



import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { signInWithGoogle, logOut, getClassroomToken, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

import { CourseWithLogs, getLocalDateString, Task, fetchClassroomCourses, fetchCourseWork, fetchStudentSubmissions, mapClassroomToTask } from 'shared';
import CourseCard from '@/components/CourseCard';
import TaskCalendar from '@/components/TaskCalendar';

export default function Home() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<CourseWithLogs[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Keep course metadata and per-course logs in local maps so that a write to
    // a logs sub-collection updates the UI immediately. Previously logs were
    // read once with getDocs inside the courses listener, which never re-fired
    // when a log changed — so marks after the first did not show up.
    const courseMeta = new Map<string, any>();
    const courseLogs = new Map<string, Record<string, any>>();
    const logUnsubs = new Map<string, () => void>();

    const rebuild = () => {
      const list: CourseWithLogs[] = Array.from(courseMeta.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color || '#8ab4f8',
        baselinePresent: data.baselinePresent || 0,
        baselineAbsent: data.baselineAbsent || 0,
        logs: courseLogs.get(id) || {},
      } as CourseWithLogs));
      setCourses(list);
    };

    const unsubCourses = onSnapshot(collection(db, 'users', user.uid, 'courses'), (snapshot) => {
      const seen = new Set<string>();

      snapshot.docs.forEach((d) => {
        seen.add(d.id);
        courseMeta.set(d.id, d.data());

        // Attach a live logs listener once per course.
        if (!logUnsubs.has(d.id)) {
          const unsub = onSnapshot(
            collection(db, 'users', user.uid, 'courses', d.id, 'logs'),
            (logsSnap) => {
              const logs: Record<string, any> = {};
              logsSnap.forEach((logDoc) => {
                logs[logDoc.id] = logDoc.data();
              });
              courseLogs.set(d.id, logs);
              rebuild();
            }
          );
          logUnsubs.set(d.id, unsub);
        }
      });

      // Clean up listeners for deleted courses.
      for (const id of Array.from(logUnsubs.keys())) {
        if (!seen.has(id)) {
          logUnsubs.get(id)?.();
          logUnsubs.delete(id);
          courseMeta.delete(id);
          courseLogs.delete(id);
        }
      }

      rebuild();
    });

    // Fetch Tasks
    const unsubTasks = onSnapshot(collection(db, 'users', user.uid, 'tasks'), (snapshot) => {
      const loadedTasks: Task[] = [];
      snapshot.forEach(d => {
        loadedTasks.push({ id: d.id, ...d.data() } as Task);
      });
      setTasks(loadedTasks);
    });

    return () => {
      unsubCourses();
      unsubTasks();
      logUnsubs.forEach((unsub) => unsub());
      logUnsubs.clear();
    };
  }, [user]);

  const syncClassroom = async () => {
    if (!user) return;

    let token: string;
    try {
      // Always obtain a valid (fresh if needed) access token. Google tokens
      // expire after ~1 hour, so a token stored at sign-in is often stale.
      token = await getClassroomToken();
    } catch (err) {
      console.error("Could not obtain Classroom access token:", err);
      alert("Google Classroom access was not granted. Please try again and approve the permission request.");
      return;
    }

    try {
      setIsSyncing(true);
      const coursesRes = await fetchClassroomCourses(token);
      if (!coursesRes.courses || coursesRes.courses.length === 0) {
        alert("No active courses found in Google Classroom.");
        return;
      }

      const batch = writeBatch(db);

      for (const gc of coursesRes.courses) {
        const localCourseId = `classroom-${gc.id}`;

        // Ensure Course exists
        const courseRef = doc(db, 'users', user.uid, 'courses', localCourseId);
        batch.set(courseRef, {
          name: gc.name,
          color: '#f57c00', // Orange for Classroom courses
          classroomId: gc.id,
        }, { merge: true });

        // Fetch CourseWork first
        const courseWorkRes = await fetchCourseWork(token, gc.id).catch((err) => {
          console.warn(`Failed to fetch coursework for ${gc.name}:`, err);
          return { courseWork: [] };
        });

        const workItems = courseWorkRes.courseWork || [];

        // Fetch submissions per courseWork item
        for (const work of workItems) {
          let sub = undefined;
          try {
            const submissionsRes = await fetchStudentSubmissions(token, gc.id, work.id);
            const submissions = submissionsRes.studentSubmissions || [];
            sub = submissions[0]; // student's own submission (first match)
          } catch (err) {
            console.warn(`Failed to fetch submissions for ${work.title}:`, err);
          }

          const task = mapClassroomToTask(localCourseId, work, sub);
          const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
          batch.set(taskRef, task, { merge: true });
        }
      }

      await batch.commit();
      alert("Sync complete!");
    } catch (error: any) {
      console.error("Classroom sync error:", error);
      if (error?.name === 'ClassroomAuthError') {
        // Token was rejected mid-sync. Drop it so the next attempt re-prompts.
        sessionStorage.removeItem('classroomToken');
        sessionStorage.removeItem('classroomTokenExpiry');
        alert("Your Google Classroom session expired. Click \"Sync Classroom\" again to re-authorize.");
      } else {
        alert("Failed to sync Classroom. Check the browser console for details.");
      }
    } finally {
      setIsSyncing(false);
    }
  };



  const addCourse = async () => {
    if (!user) return;
    const name = prompt("Enter course name:");
    if (name) {
      const newCourseRef = doc(collection(db, 'users', user.uid, 'courses'));
      await setDoc(newCourseRef, {
        name,
        color: '#8ab4f8',
        baselinePresent: 0,
        baselineAbsent: 0,
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this course?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'courses', courseId));
    }
  };

  const markAttendance = async (courseId: string, status: 'present' | 'absent') => {
    if (!user) return;
    const today = getLocalDateString(new Date());
    const logRef = doc(db, 'users', user.uid, 'courses', courseId, 'logs', today);

    // Accumulate counts (consistent with the course detail page) so a course
    // can be marked more than once per day. Read the current log from local
    // state to compute the next value, converting any legacy { status } field.
    const course = courses.find((c) => c.id === courseId);
    const existing: any = course?.logs?.[today] || {};
    let present = existing.present !== undefined ? existing.present : (existing.status === 'present' ? 1 : 0);
    let absent = existing.absent !== undefined ? existing.absent : (existing.status === 'absent' ? 1 : 0);

    if (status === 'present') present += 1;
    else absent += 1;

    await setDoc(logRef, { present, absent }, { merge: true });
  };

  const addTask = async () => {
    if (!user) return;
    const title = prompt("Enter task title:");
    if (!title) return;

    const today = getLocalDateString(new Date());
    const dateInput = prompt("Due date (YYYY-MM-DD):", today);
    if (!dateInput) return;

    // Validate the entered date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateInput) || isNaN(new Date(dateInput + "T00:00:00").getTime())) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    const newTaskRef = doc(collection(db, 'users', user.uid, 'tasks'));
    await setDoc(newTaskRef, {
      title,
      dueAt: dateInput + "T12:00:00Z",
      source: 'manual',
      done: false,
    });
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
      done: !task.done
    });
  };

  // Extract upcoming reminders (not done, next 7 days)
  const upcomingReminders = tasks.filter(t => !t.done).slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e]">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#1e1e1e]">
        <h1 className="text-4xl font-bold text-white">Attendance Tracker</h1>
        <p className="text-center max-w-md text-gray-300">
          Track your classes, sync with Google Classroom, and never miss a deadline.
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-[#8ab4f8] text-[#1e1e1e] font-semibold rounded shadow-md hover:bg-[#aecbfa] transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1e1e1e] text-gray-200">
      <header className="flex items-center justify-between p-4 border-b border-[#333]">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={syncClassroom}
            disabled={isSyncing}
            className="px-4 py-2 bg-[#8ab4f8] text-[#1e1e1e] rounded font-bold hover:bg-[#aecbfa] transition-colors disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Classroom"}
          </button>
          <span className="text-sm">{user.displayName}</span>
          <button
            onClick={logOut}
            className="px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        {/* Left pane: Courses */}
        <section className="w-full md:w-1/3 md:min-w-[340px] bg-[#2d2d2d] rounded-lg p-4 shadow-inner flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Your Courses</h2>
            <button onClick={addCourse} className="text-sm px-3 py-1 bg-white/10 text-white rounded font-bold hover:bg-white/20 transition-colors">+ Add</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {courses.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">No courses added yet. Add one!</div>
            ) : (
              courses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onMarkPresent={() => markAttendance(course.id, 'present')}
                  onMarkAbsent={() => markAttendance(course.id, 'absent')}
                  onDelete={() => deleteCourse(course.id)}
                />
              ))
            )}
          </div>
        </section>

        {/* Right pane: Task calendar and reminders */}
        <section className="flex-[2] flex flex-col gap-4">
          <div className="flex-[2] bg-[#2d2d2d] rounded-lg p-4 shadow-inner flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Tasks & Deadlines</h2>
              <button onClick={addTask} className="text-sm px-3 py-1 bg-white/10 text-white rounded font-bold hover:bg-white/20 transition-colors">+ Add Task</button>
            </div>
            <TaskCalendar tasks={tasks} onToggleTask={toggleTask} />
          </div>
          <div className="flex-1 bg-[#2d2d2d] rounded-lg p-4 shadow-inner overflow-y-auto max-h-[300px]">
            <h2 className="text-xl font-semibold mb-4 text-white">Reminders</h2>
            {upcomingReminders.length === 0 ? (
              <div className="text-gray-400">No upcoming reminders.</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcomingReminders.map(task => (
                  <li key={task.id} className="bg-[#1e1e1e] p-3 rounded flex justify-between items-center">
                    <span>{task.title}</span>
                    <span className="text-sm text-[#8ab4f8]">{task.dueAt.split('T')[0]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
