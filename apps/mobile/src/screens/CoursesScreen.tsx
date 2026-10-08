import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthContext } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import { CourseWithLogs, getLocalDateString, fetchClassroomCourses, fetchCourseWork, fetchStudentSubmissions, mapClassroomToTask } from '../shared';

export default function CoursesScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<CourseWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .onSnapshot(async (snapshot) => {
        const loadedCourses: CourseWithLogs[] = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const courseData = doc.data();
            const logsSnapshot = await doc.ref.collection('logs').get();
            const logs: Record<string, any> = {};
            
            logsSnapshot.docs.forEach(logDoc => {
              logs[logDoc.id] = logDoc.data();
            });

            return {
              id: doc.id,
              name: courseData.name,
              color: courseData.color || '#64ffda',
              baselinePresent: courseData.baselinePresent || 0,
              baselineAbsent: courseData.baselineAbsent || 0,
              logs,
            } as CourseWithLogs;
          })
        );
        
        setCourses(loadedCourses);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user]);

  const markAttendance = async (courseId: string, status: 'present' | 'absent') => {
    if (!user) return;
    const today = getLocalDateString(new Date());
    
    const batch = firestore().batch();
    
    const logRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(courseId)
      .collection('logs')
      .doc(today);
      
    batch.set(logRef, { status }, { merge: true });
    
    const courseRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(courseId);
      
    batch.update(courseRef, { lastUpdated: firestore.FieldValue.serverTimestamp() });
    
    await batch.commit();
  };

  const addCourse = async () => {
    if (!user) return;
    const newCourseRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc();
    
    await newCourseRef.set({
      name: "New Course " + Math.floor(Math.random() * 100),
      color: '#64ffda',
      baselinePresent: 0,
      baselineAbsent: 0,
    });
  };

  const syncClassroom = async () => {
    console.log("Firebase user before Classroom sync:", user);
    console.log("Firebase UID:", user?.uid);
    console.log("Firebase email:", user?.email);
    if (!user) return;
    try {
      setIsSyncing(true);
      const { accessToken } = await GoogleSignin.getTokens();
      if (!accessToken) throw new Error("No access token");

      const coursesRes = await fetchClassroomCourses(accessToken);
      if (!coursesRes.courses) return;

      const batch = firestore().batch();

      for (const gc of coursesRes.courses) {
        const localCourseId = `classroom-${gc.id}`;
        
        const courseRef = firestore().collection('users').doc(user.uid).collection('courses').doc(localCourseId);
        batch.set(courseRef, {
          name: gc.name,
          color: '#f57c00',
          classroomId: gc.id,
        }, { merge: true });

        const [courseWorkRes, submissionsRes] = await Promise.all([
          fetchCourseWork(accessToken, gc.id).catch(() => ({ courseWork: [] })),
          fetchStudentSubmissions(accessToken, gc.id, '-').catch(() => ({ studentSubmissions: [] }))
        ]);

        const workItems = courseWorkRes.courseWork || [];
        const submissions = submissionsRes.studentSubmissions || [];

        for (const work of workItems) {
          const sub = submissions.find((s: any) => s.courseWorkId === work.id);
          const task = mapClassroomToTask(localCourseId, work, sub);
          const taskRef = firestore().collection('users').doc(user.uid).collection('tasks').doc(task.id);
          batch.set(taskRef, task, { merge: true });
        }
      }

      await batch.commit();
      Alert.alert("Success", "Classroom synced!");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Sync Error", e.message || "Failed to sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#64ffda" style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Courses</Text>
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity onPress={syncClassroom} disabled={isSyncing}>
                <Text style={[styles.syncButton, isSyncing && {opacity: 0.5}]}>
                  {isSyncing ? "Syncing..." : "Sync"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addCourse}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No courses found. Add one!</Text>}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onMarkPresent={() => markAttendance(item.id, 'present')}
            onMarkAbsent={() => markAttendance(item.id, 'absent')}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004d40',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64ffda',
  },
  addButton: {
    color: '#00332a',
    backgroundColor: '#64ffda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  syncButton: {
    color: '#fff',
    backgroundColor: '#f57c00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#004d40',
  },
  empty: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
