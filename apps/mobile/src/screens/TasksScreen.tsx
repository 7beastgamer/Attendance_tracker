import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { scheduleTaskReminders, requestNotificationPermissions } from '../utils/notifications';
import { Task, getLocalDateString, getTaskDateString } from '../shared';

export default function TasksScreen() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('tasks')
      .onSnapshot(snapshot => {
        const loadedTasks: Task[] = [];
        snapshot.forEach(doc => {
          loadedTasks.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(loadedTasks);
        scheduleTaskReminders(loadedTasks);
      });

    return () => unsubscribe();
  }, [user]);

  const addTask = async () => {
    if (!user) return;
    const newTaskRef = firestore().collection('users').doc(user.uid).collection('tasks').doc();
    await newTaskRef.set({
      title: "New Task " + Math.floor(Math.random() * 100),
      dueAt: selectedDate + "T12:00:00Z", // Mock UTC time for the selected day
      source: "manual",
      done: false
    });
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;
    await firestore().collection('users').doc(user.uid).collection('tasks').doc(task.id).update({
      done: !task.done
    });
  };

  const markedDates: any = {};
  markedDates[selectedDate] = { selected: true, selectedColor: '#64ffda' };

  tasks.forEach(task => {
    const dateKey = getTaskDateString(task.dueAt);
    if (markedDates[dateKey]) {
      markedDates[dateKey].marked = true;
      markedDates[dateKey].dotColor = '#4caf50';
    } else {
      markedDates[dateKey] = { marked: true, dotColor: '#4caf50' };
    }
  });

  const selectedTasks = tasks.filter(t => getTaskDateString(t.dueAt) === selectedDate);

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#004d40',
          calendarBackground: '#00332a',
          textSectionTitleColor: '#64ffda',
          selectedDayBackgroundColor: '#64ffda',
          selectedDayTextColor: '#00332a',
          todayTextColor: '#64ffda',
          dayTextColor: '#ffffff',
          monthTextColor: '#64ffda',
          dotColor: '#4caf50',
          arrowColor: '#64ffda',
        }}
      />

      <View style={styles.agendaHeader}>
        <Text style={styles.agendaTitle}>Agenda for {selectedDate}</Text>
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={selectedTasks}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No tasks for this day.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.taskItem, item.done && styles.taskDone]} 
            onPress={() => toggleTask(item)}
            accessible={true}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={`${item.title}, ${item.source === 'classroom' ? 'Classroom task' : 'Manual task'}`}
          >
            <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>
              {item.done ? '✓' : '○'} {item.title}
            </Text>
            {item.source === 'classroom' && <Text style={styles.sourceTag}>Classroom</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#004d40' },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  agendaTitle: { fontSize: 18, fontWeight: 'bold', color: '#64ffda' },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#64ffda', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: '#00332a', fontWeight: 'bold', lineHeight: 28 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  taskItem: { backgroundColor: '#00332a', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskDone: { opacity: 0.6 },
  taskTitle: { color: '#fff', fontSize: 16 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#aaa' },
  sourceTag: { fontSize: 10, backgroundColor: '#f57c00', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }
});
