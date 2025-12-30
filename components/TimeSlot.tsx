import React from 'react';

interface TimeSlotProps {
  minutesFromMidnight: number;
  onDrop: (e: React.DragEvent, time: number) => void;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ 
  minutesFromMidnight, 
  onDrop, 
  isOver,
  onDragOver,
  onDragLeave
}) => {
  const displayMinutes = minutesFromMidnight % (24 * 60);
  const hours = Math.floor(displayMinutes / 60);
  const minutes = displayMinutes % 60;
  const isHourMark = minutes === 0;

  return (
    <div 
      className={`
        relative flex w-full select-none
        ${isHourMark ? 'h-16' : 'h-8'} 
        ${isOver ? 'bg-blue-50' : 'bg-transparent'}
        transition-colors duration-150
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, minutesFromMidnight)}
    >
      {/* Time Label */}
      <div className="w-16 flex-shrink-0 flex flex-col items-end pr-4 pt-0">
        {isHourMark && (
          <span className="text-sm font-heading font-bold text-slate-800">
            {hours.toString().padStart(2, '0')}:00
          </span>
        )}
      </div>
      
      {/* Grid Lines */}
      <div className="flex-1 relative border-l border-slate-200">
        {isHourMark ? (
           // Hour Line
          <div className="absolute top-0 left-0 w-full h-px bg-slate-200" />
        ) : (
           // Quarter Hour Line (Subtle)
           <div className="absolute top-0 left-0 w-4 h-px bg-slate-100" />
        )}
      </div>
    </div>
  );
};

export default TimeSlot;