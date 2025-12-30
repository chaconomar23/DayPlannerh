import { ActivityTemplate, Category } from './types';

// Palette for full colored blocks (Light Mode Friendly)
export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.WORK_STUDY]: 'bg-blue-100 text-blue-900 border-blue-200',
  [Category.PROJECT]: 'bg-violet-100 text-violet-900 border-violet-200',
  [Category.HEALTH]: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  [Category.OBLIGATION]: 'bg-slate-100 text-slate-900 border-slate-200',
  [Category.LEISURE]: 'bg-pink-100 text-pink-900 border-pink-200',
};

// Start empty
export const INITIAL_ACTIVITIES: ActivityTemplate[] = [];

export const TIME_SLOTS_PER_HOUR = 4; // 15 min slots
export const MINUTES_PER_SLOT = 60 / TIME_SLOTS_PER_HOUR;
export const START_HOUR = 5; // 5 AM
export const END_HOUR = 29; // 5 AM next day
