export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  // Extended Profile Data
  phone?: string;
  batch?: string;
  rollNumber?: string;
  guardianName?: string;
  guardianContact?: string;
  address?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  thumbnail: string;
  totalDuration: string;
  lastWatchedTimestamp?: number; // seconds
  isLocked?: boolean; // Payment pending
  isLive?: boolean; // New: Live class indicator
  studentCount?: number; // For teacher view
  batchId?: string;
}

export interface ExamSession {
  id: string;
  courseId: string;
  title: string;
  durationMinutes: number;
  warnings: number;
  isActive: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  viewers: number;
  transcript: string; // Mock transcript for AI
  isActive: boolean;
}

export interface AnalyticsData {
  name: string;
  student: number;
  classAvg: number;
  topper: number;
}

export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface FeeRecord {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  category: 'TUITION' | 'LAB' | 'LIBRARY' | 'EXAM' | 'PLACEMENT';
  phase: 1 | 2;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface TestResult {
  id: string;
  title: string;
  date: string;
  score: number;
  totalScore: number;
  classAverage: number;
  topperScore: number;
  subject: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'PROJECT';
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  courseName: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  totalSubmissions: number;
  totalStudents: number;
  status: 'ACTIVE' | 'CLOSED';
}

export interface StudentPerformance {
  id: string;
  name: string;
  attendance: number;
  avgScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}