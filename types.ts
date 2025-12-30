
export enum Category {
  WORK_STUDY = 'Trabajo/Estudio',
  PROJECT = 'Proyecto Personal',
  HEALTH = 'Salud',
  OBLIGATION = 'Obligaciones',
  LEISURE = 'Ocio',
}

export interface ActivityTemplate {
  id: string;
  name: string;
  category: Category;
  score: number;
  defaultDuration: number;
  icon?: string;
  color: string;
}

export interface ScheduleBlock {
  id: string;
  activityId: string;
  startTime: number;
  duration: number;
  // Snapshot properties for history (frozen data)
  snapshot?: {
    name: string;
    category: Category;
    color: string;
    score: number;
  };
}

export interface DayData {
  date: string; // ISO string YYYY-MM-DD
  blocks: ScheduleBlock[];
  totalScore: number;
  totalMinutes: number;
}

export interface DayStats {
  totalScore: number;
  categoryDistribution: { name: string; value: number; color: string }[];
}
