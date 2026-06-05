/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SchoolType = 'elementary' | 'middle' | 'high';

export interface SchoolSettings {
  schoolName: string;
  schoolVision: string;
  address: string;
  logoUrl?: string;
  schoolType: SchoolType;
  genderType?: 'boys' | 'girls' | 'coed';
  phoneNumber?: string;
  faxNumber?: string;
  currentMonth?: number;
}

export interface ClassData {
  id: string;
  grade: number;
  classNumber: number;
  homeroomTeacher: string;
  assistantTeacher: string;
  boysCount: number;
  girlsCount: number;
}

export interface MonthlyEvent {
  id: string;
  date: string; // ISO string or simple YYYY-MM-DD
  content: string;
}

export interface Notice {
  id: string;
  content: string;
  createdAt: number;
}

export interface ScheduleItem {
  name: string;
  startTime: string;
  endTime: string;
}
