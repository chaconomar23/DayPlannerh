import React from 'react';
import { ActivityTemplate } from '../types';
import { GetIcon } from './Icons';
import { CATEGORY_COLORS } from '../constants';

interface ActivityCardProps {
  activity: ActivityTemplate;
  onDragStart: (e: React.DragEvent, activity: ActivityTemplate) => void;
  compact?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onDragStart, compact }) => {
  // Extract base color class for the indicator dot
  const dotColor = activity.color === 'blue' ? 'bg-blue-500' :
                   activity.color === 'violet' ? 'bg-violet-500' :
                   activity.color === 'emerald' ? 'bg-emerald-500' :
                   activity.color === 'pink' ? 'bg-pink-500' : 'bg-slate-500';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, activity)}
      className={`
        relative overflow-hidden cursor-grab active:cursor-grabbing
        bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md
        rounded-xl transition-all duration-200 group
        ${compact ? 'p-2 w-full mb-3 flex items-center gap-3' : 'p-3 flex items-center gap-4 w-full mb-3'}
      `}
    >
      <div className={`p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:text-slate-900 transition-colors`}>
        <GetIcon name={activity.icon} className="w-4 h-4" />
      </div>

      <div className="flex-1">
        <h3 className="font-heading font-semibold text-slate-800 text-sm tracking-tight leading-none">
          {activity.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{activity.category}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;