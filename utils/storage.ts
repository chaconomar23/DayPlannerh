
import { ScheduleBlock, DayData, Category, ActivityTemplate } from '../types';

const STORAGE_PREFIX = 'planner_day_';

export const getStorageKey = (date: Date) => {
  return `${STORAGE_PREFIX}${date.toISOString().split('T')[0]}`;
};

export const saveDay = (date: Date, blocks: ScheduleBlock[], activities: ActivityTemplate[]) => {
  const key = getStorageKey(date);
  
  // Hydrate blocks with snapshot data before saving
  const snapshotBlocks: ScheduleBlock[] = blocks.map(block => {
    const activity = activities.find(a => a.id === block.activityId);
    return {
      ...block,
      snapshot: activity ? {
        name: activity.name,
        category: activity.category,
        color: activity.color,
        score: activity.score
      } : block.snapshot // Keep existing snapshot if available
    };
  });

  const totalScore = snapshotBlocks.reduce((acc, b) => acc + (b.snapshot?.score || 0), 0);
  const totalMinutes = snapshotBlocks.reduce((acc, b) => acc + b.duration, 0);

  const data: DayData = {
    date: date.toISOString().split('T')[0],
    blocks: snapshotBlocks,
    totalScore,
    totalMinutes
  };

  localStorage.setItem(key, JSON.stringify(data));
  updateMonthIndex(date, totalMinutes, totalScore);
};

export const loadDay = (date: Date): DayData | null => {
  const key = getStorageKey(date);
  const dataStr = localStorage.getItem(key);
  return dataStr ? JSON.parse(dataStr) : null;
};

// --- Indexing for Calendar Performance ---

interface MonthIndex {
  [dateStr: string]: {
    minutes: number;
    score: number;
    hasData: boolean;
  };
}

const INDEX_KEY = 'planner_index';

const getIndex = (): MonthIndex => {
  const str = localStorage.getItem(INDEX_KEY);
  return str ? JSON.parse(str) : {};
};

const updateMonthIndex = (date: Date, minutes: number, score: number) => {
  const index = getIndex();
  const dateStr = date.toISOString().split('T')[0];
  index[dateStr] = { minutes, score, hasData: minutes > 0 };
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
};

export const getDayMeta = (date: Date) => {
  const index = getIndex();
  return index[date.toISOString().split('T')[0]] || null;
};
