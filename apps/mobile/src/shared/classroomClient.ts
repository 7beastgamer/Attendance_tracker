export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
];

export class ClassroomAuthError extends Error {
  constructor(message = 'Classroom access token is invalid or expired.') {
    super(message);
    this.name = 'ClassroomAuthError';
  }
}

async function classroomFetch(url: string, accessToken: string, context: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new ClassroomAuthError();
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to ${context} (HTTP ${res.status}). ${body}`.trim());
  }
  return res.json();
}

export async function fetchClassroomCourses(accessToken: string) {
  return classroomFetch(
    'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
    accessToken,
    'fetch courses'
  );
}

export async function fetchCourseWork(accessToken: string, courseId: string) {
  return classroomFetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
    accessToken,
    'fetch coursework'
  );
}

export async function fetchStudentSubmissions(accessToken: string, courseId: string, courseWorkId: string) {
  return classroomFetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
    accessToken,
    'fetch submissions'
  );
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
