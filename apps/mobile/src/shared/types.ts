import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string(),
  baselinePresent: z.number().default(0),
  baselineAbsent: z.number().default(0),
  classroomCourseId: z.string().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const LogSchema = z.object({
  status: z.enum(['present', 'absent']).optional(),
  present: z.number().optional(),
  absent: z.number().optional(),
});
export type Log = z.infer<typeof LogSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  courseId: z.string().optional(),
  dueAt: z.string(), // UTC string
  source: z.enum(['classroom', 'manual']),
  done: z.boolean().default(false),
  alternateLink: z.string().optional(),
  classroomId: z.string().optional(),
  lastSyncedAt: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// Data structure aggregating a course with its sub-collection logs
export interface CourseWithLogs extends Course {
  logs: Record<string, Log>; // keyed by yyyy-mm-dd
}
