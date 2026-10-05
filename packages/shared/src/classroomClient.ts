export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
];

export async function fetchClassroomCourses(accessToken: string) {
  const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function fetchCourseWork(accessToken: string, courseId: string) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch coursework');
  return res.json();
}

export async function fetchStudentSubmissions(accessToken: string, courseId: string, courseWorkId: string) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

import { Task } from './types';

export function mapClassroomToTask(courseId: string, courseWork: any, submission?: any): Task {
  let dueAt = new Date().toISOString(); // fallback
  if (courseWork.dueDate) {
    const { year, month, day } = courseWork.dueDate;
    const { hours = 12, minutes = 0 } = courseWork.dueTime || {};
    dueAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
  }

  return {
    id: `classroom-${courseWork.id}`,
    title: courseWork.title,
    courseId: courseId,
    dueAt,
    source: 'classroom',
    done: submission ? submission.state === 'TURNED_IN' || submission.state === 'RETURNED' : false,
    alternateLink: courseWork.alternateLink,
    classroomId: courseWork.id,
    lastSyncedAt: new Date().toISOString()
  };
}
