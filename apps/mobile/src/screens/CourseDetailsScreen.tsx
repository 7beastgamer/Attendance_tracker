import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { CourseWithLogs, calculateAttendance, getLocalDateString } from '../shared';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, addMonths, subMonths, isSameDay } from 'date-fns';

export default function CourseDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const courseId = (route.params as any)?.courseId;
  
  const [course, setCourse] = useState<CourseWithLogs | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!user || !courseId) return;

    const unsub = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(courseId)
      .onSnapshot(async (docSnap) => {
        if (!docSnap.exists) {
          console.warn(`Course not found: ${courseId}`);
          setCourse(null);
          return;
        }
        const courseData = docSnap.data()!;
        const logsSnapshot = await docSnap.ref.collection('logs').get();
        const logs: Record<string, any> = {};
        logsSnapshot.docs.forEach(logDoc => {
          logs[logDoc.id] = logDoc.data();
        });

        const updatedCourse = {
          id: docSnap.id,
          name: courseData.name,
          color: courseData.color || '#64ffda',
          baselinePresent: courseData.baselinePresent || 0,
          baselineAbsent: courseData.baselineAbsent || 0,
          logs,
        } as CourseWithLogs;
        
        setCourse(updatedCourse);
        navigation.setOptions({ title: updatedCourse.name });
      });

    return () => unsub();
  }, [user, courseId, navigation]);

  if (!course) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  }

  const handleUpdateLog = async (type: 'present' | 'absent', delta: number) => {
    if (!user) return;
    const dateStr = getLocalDateString(selectedDate);
    const existingLog = course.logs[dateStr] || {};
    
    let currentPresent = existingLog.present !== undefined ? existingLog.present : (existingLog.status === 'present' ? 1 : 0);
    let currentAbsent = existingLog.absent !== undefined ? existingLog.absent : (existingLog.status === 'absent' ? 1 : 0);

    if (type === 'present') currentPresent = Math.max(0, currentPresent + delta);
    if (type === 'absent') currentAbsent = Math.max(0, currentAbsent + delta);

    const batch = firestore().batch();
    
    batch.set(
      firestore().collection('users').doc(user.uid).collection('courses').doc(courseId).collection('logs').doc(dateStr), 
      { present: currentPresent, absent: currentAbsent }, 
      { merge: true }
    );
    
    batch.update(
      firestore().collection('users').doc(user.uid).collection('courses').doc(courseId),
      { lastUpdated: firestore.FieldValue.serverTimestamp() }
    );
    
    await batch.commit();
  };

  const selectedDateStr = getLocalDateString(selectedDate);
  const selectedLog = course.logs[selectedDateStr] || {};
  const presentCount = selectedLog.present !== undefined ? selectedLog.present : (selectedLog.status === 'present' ? 1 : 0);
  const absentCount = selectedLog.absent !== undefined ? selectedLog.absent : (selectedLog.status === 'absent' ? 1 : 0);
  const stats = calculateAttendance(course, 75);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayIndex = getDay(monthStart);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Calendar Section */}
      <View style={styles.card}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}><Text style={styles.monthNav}>{'<'}</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}><Text style={styles.monthNav}>{'>'}</Text></TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.dayOfWeek}>{d}</Text>
          ))}
          
          {Array.from({ length: startingDayIndex }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
          
          {days.map(day => {
            const dStr = getLocalDateString(day);
            const log = course.logs[dStr] || {};
            const p = log.present !== undefined ? log.present : (log.status === 'present' ? 1 : 0);
            const a = log.absent !== undefined ? log.absent : (log.status === 'absent' ? 1 : 0);
            
            let bgColor = '#1e293b';
            let textColor = '#fff';
            if (p > 0 && a === 0) { bgColor = '#bbf7d0'; textColor = '#14532d'; } // green
            else if (a > 0 && p === 0) { bgColor = '#fecaca'; textColor = '#7f1d1d'; } // red
            else if (p > 0 && a > 0) { bgColor = '#fef08a'; textColor = '#713f12'; } // orange

            const isSelected = isSameDay(day, selectedDate);

            return (
              <TouchableOpacity 
                key={dStr} 
                onPress={() => setSelectedDate(day)}
                style={[styles.dayCell, { backgroundColor: bgColor }, isSelected && styles.selectedDay]}
              >
                <Text style={[styles.dayText, { color: textColor }]}>{format(day, 'd')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Editor Section */}
      <View style={styles.card}>
        <Text style={styles.editTitle}>Edit: {format(selectedDate, 'EEE, MMM dd')}</Text>
        
        <View style={styles.counterRow}>
          <Text style={styles.presentLabel}>Present</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity onPress={() => handleUpdateLog('present', -1)} style={styles.btn}><Text style={styles.btnText}>-</Text></TouchableOpacity>
            <Text style={styles.countText}>{presentCount}</Text>
            <TouchableOpacity onPress={() => handleUpdateLog('present', 1)} style={styles.btn}><Text style={styles.btnText}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.absentLabel}>Absent</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity onPress={() => handleUpdateLog('absent', -1)} style={styles.btn}><Text style={styles.btnText}>-</Text></TouchableOpacity>
            <Text style={styles.countText}>{absentCount}</Text>
            <TouchableOpacity onPress={() => handleUpdateLog('absent', 1)} style={styles.btn}><Text style={styles.btnText}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={[styles.card, { alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
          <Text style={styles.presentLabel}>Present: {stats.totalPresent}</Text>
          <Text style={styles.absentLabel}>Absent: {stats.totalAbsent}</Text>
        </View>
        <Text style={styles.totalText}>Total Sessions: {stats.totalClasses}</Text>
        <Text style={styles.percentText}>Overall Attendance: {stats.percentage.toFixed(2)}%</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthNav: {
    color: '#94a3b8',
    fontSize: 24,
    paddingHorizontal: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayOfWeek: {
    width: '14.28%',
    textAlign: 'center',
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayCell: {
    width: '12%',
    aspectRatio: 1,
    margin: '1.14%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  dayText: {
    fontWeight: 'bold',
  },
  editTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  presentLabel: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
  },
  absentLabel: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    padding: 4,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  totalText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  percentText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
