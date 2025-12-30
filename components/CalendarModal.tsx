
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getDayMeta } from '../utils/storage';

interface CalendarModalProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ currentDate, onSelectDate, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  // Adjust so Monday is first (0 = Sunday in JS, usually we want Mon-Sun layout or Sun-Sat. Let's do Sun-Sat for simplicity)
  const startDay = getFirstDayOfMonth(year, month); 

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const renderDays = () => {
    const days = [];
    // Empty slots for prev month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateToCheck = new Date(year, month, d);
      const isToday = new Date().toDateString() === dateToCheck.toDateString();
      const isSelected = currentDate.toDateString() === dateToCheck.toDateString();
      
      const meta = getDayMeta(dateToCheck);
      const hasData = meta && meta.hasData;
      
      // Load indicator
      let loadColor = 'bg-slate-100';
      if (hasData) {
        if (meta.minutes < 120) loadColor = 'bg-emerald-100 border-emerald-200 text-emerald-700'; // Light
        else if (meta.minutes < 360) loadColor = 'bg-blue-100 border-blue-200 text-blue-700'; // Medium
        else loadColor = 'bg-violet-100 border-violet-200 text-violet-700 font-bold'; // Heavy
      }

      days.push(
        <button
          key={d}
          onClick={() => {
            onSelectDate(dateToCheck);
            onClose();
          }}
          className={`
            h-14 rounded-xl flex flex-col items-center justify-center relative border transition-all
            ${isSelected ? 'ring-2 ring-blue-500 z-10' : 'hover:bg-slate-50'}
            ${hasData ? `${loadColor} border-transparent` : 'bg-white border-slate-100 text-slate-400'}
            ${isToday ? 'font-bold' : ''}
          `}
        >
          <span className="text-sm">{d}</span>
          {hasData && (
             <div className="flex gap-0.5 mt-1">
               {/* Tiny dots visualization */}
               <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
             </div>
          )}
          {isToday && !hasData && <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <CalendarIcon size={20} />
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-800">Historial</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-bold font-heading text-slate-800">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days Grid */}
        <div className="p-6 pt-0">
           <div className="grid grid-cols-7 gap-2 mb-2">
             {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
               <div key={d} className="text-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">{d}</div>
             ))}
           </div>
           <div className="grid grid-cols-7 gap-2 overflow-y-auto max-h-[50vh] no-scrollbar">
             {renderDays()}
           </div>
        </div>
        
        {/* Legend */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center gap-6 text-xs text-slate-500">
           <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-300"></span>Ligero</div>
           <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-300"></span>Normal</div>
           <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-300"></span>Intenso</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
