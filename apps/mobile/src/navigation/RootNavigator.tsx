import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoursesScreen from '../screens/CoursesScreen';
import TasksScreen from '../screens/TasksScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CoursesStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#64ffda',
    }}>
      <Stack.Screen name="CoursesList" component={CoursesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course Details' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#64ffda',
      tabBarStyle: { backgroundColor: '#0f172a', borderTopWidth: 0 },
      tabBarActiveTintColor: '#64ffda',
      tabBarInactiveTintColor: '#94a3b8',
    }}>
      <Tab.Screen name="Courses" component={CoursesStack} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
    </Tab.Navigator>
  );
}
