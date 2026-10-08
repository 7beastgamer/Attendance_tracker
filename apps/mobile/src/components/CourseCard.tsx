import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CourseWithLogs, calculateAttendance } from '../shared';

interface Props {
  course: CourseWithLogs;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onPress: () => void;
}

export default function CourseCard({ course, onMarkPresent, onMarkAbsent, onPress }: Props) {
  const stats = calculateAttendance(course, 75); // Using the 75% target default

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { borderLeftColor: course.color }]} activeOpacity={0.8}>
      <View style={styles.content}>
        <Text style={styles.title}>{course.name}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(stats.percentage, 100)}%`,
                  backgroundColor: stats.percentage >= 75 ? '#4caf50' : '#f44336'
                }
              ]} 
            />
          </View>
          <Text style={styles.percentage}>{stats.percentage.toFixed(1)}%</Text>
        </View>
        
        <Text style={styles.status}>{stats.statusText}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.btnPresent]} 
          onPress={onMarkPresent}
          accessible={true}
          accessibilityLabel={`Mark present for ${course.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.btnAbsent]} 
          onPress={onMarkAbsent}
          accessible={true}
          accessibilityLabel={`Mark absent for ${course.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#00332a',
    borderRadius: 8,
    borderLeftWidth: 6,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginRight: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  percentage: {
    color: '#fff',
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  status: {
    color: '#aaa',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPresent: {
    backgroundColor: '#4caf50',
  },
  btnAbsent: {
    backgroundColor: '#f44336',
  },
  btnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
