
import React, { useState, useMemo, useEffect } from 'react';
import { ActivityTemplate, ScheduleBlock, Category } from './types';
import { INITIAL_ACTIVITIES, START_HOUR, END_HOUR, MINUTES_PER_SLOT, CATEGORY_COLORS } from './constants';
import { saveDay, loadDay } from './utils/storage';
import ActivityCard from './components/ActivityCard';
import TimeSlot from './components/TimeSlot';
import CalendarModal from './components/CalendarModal';
import { analyzeDayWithGemini } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Sparkles, X, Grid, BarChart3, ChevronLeft, GripVertical, Clock, Save, Calendar as CalendarIcon, Lock } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // --- Day Data State ---
  const [activities, setActivities] = useState<ActivityTemplate[]>(INITIAL_ACTIVITIES);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  
  // --- UI State ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // --- Drag State ---
  const [draggedActivity, setDraggedActivity] = useState<ActivityTemplate | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<ScheduleBlock | null>(null);
  const [dragOverTime, setDragOverTime] = useState<number | null>(null);
  
  // --- Time Modal State ---
  const [timeStartTime, setTimeStartTime] = useState("09:00");
  const [timeEndTime, setTimeEndTime] = useState("10:00");

  // --- New Activity Form State ---
  const [isCreating, setIsCreating] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [newActCat, setNewActCat] = useState<Category>(Category.WORK_STUDY);
  const [newActDur, setNewActDur] = useState(60);

  // --- Logic Checks ---
  const isToday = useMemo(() => {
    return new Date().toDateString() === currentDate.toDateString();
  }, [currentDate]);

  // Is editable only if it's today
  const isEditable = isToday; 

  // --- Formatting ---
  const formattedDate = currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // --- Data Loading & Saving ---

  // Load data when date changes
  useEffect(() => {
    const data = loadDay(currentDate);
    if (data) {
      setSchedule(data.blocks);
    } else {
      setSchedule([]); // Reset for new/empty days
    }
    setAiFeedback(""); // Clear AI context
  }, [currentDate]);

  // Auto-save when schedule changes (Only if it's today)
  useEffect(() => {
    if (isEditable) {
       // Debounce slightly or just save
       saveDay(currentDate, schedule, activities);
    }
  }, [schedule, activities, currentDate, isEditable]);


  // --- Stats Logic ---
  const totalScore = useMemo(() => {
    return schedule.reduce((acc, block) => {
      // Prioritize snapshot data if in history mode
      const score = block.snapshot ? block.snapshot.score : activities.find(a => a.id === block.activityId)?.score || 0;
      return acc + score;
    }, 0);
  }, [schedule, activities]);

  const statsData = useMemo(() => {
    const distribution: Record<string, number> = {};
    Object.values(Category).forEach(c => distribution[c] = 0);
    schedule.forEach(block => {
      const category = block.snapshot ? block.snapshot.category : activities.find(a => a.id === block.activityId)?.category;
      if (category) distribution[category] += block.duration;
    });
    return Object.entries(distribution).filter(([_, value]) => value > 0).map(([name, value]) => ({
        name, value, color: CATEGORY_COLORS[name as Category]
    }));
  }, [schedule, activities]);

  const totalHours = useMemo(() => {
     const mins = schedule.reduce((acc, b) => acc + b.duration, 0);
     return (mins / 60).toFixed(1);
  }, [schedule]);


  // --- Helpers ---
  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    let total = h * 60 + m;
    if (total < START_HOUR * 60) total += 24 * 60; 
    return total;
  };

  // --- Actions ---

  const handleCreateActivity = () => {
    if (!newActName.trim()) return;
    const newActivity: ActivityTemplate = {
      id: Date.now().toString(),
      name: newActName,
      category: newActCat,
      score: 5,
      defaultDuration: newActDur,
      color: newActCat === Category.WORK_STUDY ? 'blue' : newActCat === Category.PROJECT ? 'violet' : newActCat === Category.HEALTH ? 'emerald' : newActCat === Category.LEISURE ? 'pink' : 'slate',
      icon: 'Star'
    };
    setActivities([...activities, newActivity]);
    setIsCreating(false);
    setNewActName("");
  };

  const handleDragStartActivity = (e: React.DragEvent, activity: ActivityTemplate) => {
    if (!isEditable) return;
    setDraggedActivity(activity);
    setDraggedBlock(null);
  };

  const handleDragStartBlock = (e: React.DragEvent, block: ScheduleBlock) => {
    if (!isEditable) return;
    e.stopPropagation();
    setDraggedBlock(block);
    setDraggedActivity(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSlotDragOver = (e: React.DragEvent, time: number) => {
    if (!isEditable) return;
    e.preventDefault();
    if (dragOverTime !== time) {
      setDragOverTime(time);
    }
  };

  const handleDrop = (e: React.DragEvent, time: number) => {
    if (!isEditable) return;
    e.preventDefault();
    setDragOverTime(null);

    let initialStart = time;
    let initialDur = 60;

    if (draggedActivity) initialDur = draggedActivity.defaultDuration;
    else if (draggedBlock) initialDur = draggedBlock.duration;
    else return;

    setTimeStartTime(minutesToTime(initialStart));
    setTimeEndTime(minutesToTime(initialStart + initialDur));
    setShowTimeModal(true);
  };

  const confirmTimeSelection = () => {
    const startMins = timeToMinutes(timeStartTime);
    const endMins = timeToMinutes(timeEndTime);
    
    if (endMins <= startMins) {
      alert("Fin debe ser posterior al inicio.");
      return;
    }
    const duration = endMins - startMins;

    // Determine ID and collision...
    let candidateActivityId = '';
    let isMove = false;
    
    if (draggedActivity) candidateActivityId = draggedActivity.id;
    else if (draggedBlock) { candidateActivityId = draggedBlock.activityId; isMove = true; }

    const hasCollision = schedule.some(block => {
      if (isMove && block.id === draggedBlock?.id) return false;
      const blockEnd = block.startTime + block.duration;
      return (startMins < blockEnd && endMins > block.startTime);
    });

    if (hasCollision) {
      alert("¡Conflicto de horario!");
      return;
    }

    if (isMove && draggedBlock) {
      setSchedule(prev => prev.map(b => b.id === draggedBlock.id ? { ...b, startTime: startMins, duration } : b));
    } else {
      const newBlock: ScheduleBlock = {
        id: Date.now().toString(),
        activityId: candidateActivityId,
        startTime: startMins,
        duration: duration
      };
      setSchedule(prev => [...prev, newBlock]);
    }

    setShowTimeModal(false);
    setDraggedActivity(null);
    setDraggedBlock(null);
  };

  const removeBlock = (blockId: string) => {
    if (!isEditable) return;
    setSchedule(prev => prev.filter(b => b.id !== blockId));
    setSelectedBlockId(null);
  };

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    setAiFeedback("");
    const feedback = await analyzeDayWithGemini(schedule, activities, totalScore);
    setAiFeedback(feedback);
    setLoadingAi(false);
  };

  // --- Render Prep ---
  const timelineSlots = [];
  for (let i = START_HOUR * 60; i < END_HOUR * 60; i += MINUTES_PER_SLOT) {
    timelineSlots.push(i);
  }

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      {/* --- LEFT COLUMN (Sidebar) --- */}
      <div 
        className={`
          flex-shrink-0 relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          bg-white border-r border-slate-200 shadow-sm
          flex flex-col z-30
          ${isDrawerOpen ? 'w-[320px]' : 'w-[80px]'}
        `}
      >
        {/* Toggle / Home */}
        <div className="h-24 flex items-center justify-center border-b border-slate-100 relative">
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`
               w-12 h-12 rounded-xl flex items-center justify-center
               transition-all duration-300
               ${isDrawerOpen ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}
            `}
          >
             {isDrawerOpen ? <ChevronLeft /> : <Grid />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 bg-white">
          {!isDrawerOpen && (
             <div className="flex flex-col items-center gap-6 mt-4 opacity-40">
                <div className="w-1 h-12 bg-slate-200 rounded-full" />
                <span className="text-[10px] uppercase rotate-90 whitespace-nowrap tracking-[0.3em] text-slate-400 mt-8 font-bold">
                  {isEditable ? 'Actividades' : 'Banco Bloqueado'}
                </span>
             </div>
          )}

          <div className={`transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 delay-150' : 'opacity-0 hidden'}`}>
             
             {/* Edit Mode Check */}
             {!isEditable ? (
               <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                 <h3 className="text-sm font-bold text-slate-600">Modo Historial</h3>
                 <p className="text-xs text-slate-400 mt-1">Este día es solo lectura.</p>
                 <button 
                   onClick={() => setCurrentDate(new Date())}
                   className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                 >
                   Volver a Hoy
                 </button>
               </div>
             ) : (
               /* Create New (Only visible if Editable) */
               <div className="mb-8">
                 {!isCreating ? (
                   <button 
                     onClick={() => setIsCreating(true)}
                     className="w-full py-4 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                   >
                     <Plus size={16} className="group-hover:rotate-90 transition-transform"/> Nueva Actividad
                   </button>
                 ) : (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 space-y-3 shadow-inner">
                      <input 
                        autoFocus type="text" placeholder="Nombre..." 
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                        value={newActName} onChange={(e) => setNewActName(e.target.value)}
                      />
                      <div className="flex gap-2">
                         <select 
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-700 shadow-sm"
                           value={newActCat} onChange={(e) => setNewActCat(e.target.value as Category)}
                         >
                           {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                         <input 
                           type="number" className="w-16 bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-700 text-center shadow-sm"
                           value={newActDur} onChange={(e) => setNewActDur(Number(e.target.value))}
                         />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleCreateActivity} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white shadow-md shadow-blue-200">Crear</button>
                      </div>
                   </div>
                 )}
               </div>
             )}

             <div className="space-y-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">Banco</h3>
               {activities.length === 0 && !isCreating && (
                 <p className="text-sm text-slate-400 text-center py-4 italic">Vacío</p>
               )}
               {activities.map(activity => (
                 <div key={activity.id} className={!isEditable ? "opacity-50 pointer-events-none grayscale" : ""}>
                    <ActivityCard 
                        activity={activity} 
                        onDragStart={handleDragStartActivity}
                        compact={true} 
                    />
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN (Timeline) --- */}
      <div className="flex-1 relative flex flex-col h-full bg-[#f8fafc]">
        
        {/* Header */}
        <header className="flex-none h-24 flex items-end justify-between px-8 pb-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm z-20 sticky top-0 shadow-sm">
           
           {/* Date Navigation */}
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-sm transition-all text-slate-700"
              >
                <CalendarIcon size={18} className="text-blue-500" />
                <span className="font-heading font-bold text-sm">Calendario</span>
              </button>
              
              <div className="h-8 w-px bg-slate-200"></div>

              <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-heading font-bold tracking-tight text-slate-900">
                        {displayDate}
                    </h1>
                    {!isEditable && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                            Historial
                        </span>
                    )}
                </div>
                <div className="flex gap-4 mt-1">
                    <span className="text-xs font-mono font-medium text-slate-400">
                        {totalHours} hrs planificadas
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                         •
                    </span>
                    <span className={`text-xs font-mono font-bold ${totalScore >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalScore > 0 ? '+' : ''}{totalScore} Puntos
                    </span>
                </div>
              </div>
           </div>
           
           <button 
             onClick={() => setShowStats(true)}
             className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all hover:scale-105 shadow-sm"
           >
             <BarChart3 size={20} />
           </button>
        </header>

        {/* Timeline Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full px-4 pb-32 pt-4">
          <div className="relative max-w-3xl mx-auto flex">
             
             {/* Left: Hour & Density Sidebar */}
             <div className="w-12 mr-2 flex flex-col pt-2 opacity-50">
                 {/* Visual filler for sidebar density - calculated vaguely based on slots */}
                 {timelineSlots.map((time, idx) => {
                     const isHour = time % 60 === 0;
                     if (!isHour) return null;
                     
                     // Check if this hour is busy
                     const busyBlock = schedule.find(b => {
                        const start = b.startTime;
                        const end = b.startTime + b.duration;
                        return (time >= start && time < end);
                     });
                     
                     return (
                         <div key={time} className="h-[64px] flex items-start justify-end pr-2">
                             <div className={`w-1 rounded-full transition-all ${busyBlock ? 'h-12 bg-slate-400' : 'h-1 bg-slate-200'}`}></div>
                         </div>
                     )
                 })}
             </div>

             {/* Main Timeline */}
             <div className="flex-1 relative">
                {timelineSlots.map(time => (
                    <div 
                        key={time} 
                        onDragOver={(e) => isEditable && handleSlotDragOver(e, time)}
                    >
                        <TimeSlot 
                        minutesFromMidnight={time} 
                        onDrop={handleDrop} 
                        isOver={dragOverTime === time}
                        onDragOver={(e) => isEditable && handleSlotDragOver(e, time)}
                        onDragLeave={() => setDragOverTime(null)}
                        />
                    </div>
                ))}

                {/* Blocks */}
                {schedule.map(block => {
                    // Logic to retrieve display data: Snapshot > Live Activity
                    let name, category, color;
                    
                    if (block.snapshot) {
                        name = block.snapshot.name;
                        category = block.snapshot.category;
                        color = block.snapshot.color;
                    } else {
                        const act = activities.find(a => a.id === block.activityId);
                        name = act?.name;
                        category = act?.category;
                        color = act?.color || 'slate';
                    }

                    if (!name) return null; // Should not happen

                    const PX_PER_MIN = 64 / 60;
                    const startOffsetMin = block.startTime - (START_HOUR * 60);
                    const topPx = startOffsetMin * PX_PER_MIN;
                    const heightPx = block.duration * PX_PER_MIN;
                    
                    const isSelected = selectedBlockId === block.id;
                    const colorClasses = CATEGORY_COLORS[category as Category] || 'bg-slate-100 text-slate-800';

                    return (
                        <div
                        key={block.id}
                        draggable={isEditable}
                        onDragStart={(e) => handleDragStartBlock(e, block)}
                        onClick={() => isEditable && setSelectedBlockId(isSelected ? null : block.id)}
                        className={`
                            absolute left-0 right-2 rounded-lg 
                            flex flex-col justify-center px-4
                            transition-all duration-200 z-10 
                            ${colorClasses} shadow-sm border border-transparent
                            ${isEditable ? 'cursor-grab active:cursor-grabbing hover:z-20 hover:shadow-md' : 'cursor-default opacity-90'}
                            ${isSelected ? 'ring-2 ring-slate-400 z-30 shadow-lg' : ''}
                        `}
                        style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                        }}
                        >
                            {isEditable && (
                                <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity text-current opacity-30">
                                    <GripVertical size={14} />
                                </div>
                            )}

                            <div className="flex justify-between items-center w-full overflow-hidden">
                                <div className="min-w-0 flex flex-col w-full">
                                    <span className="text-sm font-bold truncate leading-tight">
                                        {name}
                                    </span>
                                    {heightPx > 40 && (
                                        <div className="flex justify-between items-center w-full mt-1">
                                            <span className="text-xs opacity-80 font-medium">
                                                {minutesToTime(block.startTime)} - {minutesToTime(block.startTime + block.duration)}
                                            </span>
                                            <span className="text-[10px] opacity-60 uppercase tracking-widest truncate ml-2">
                                                {category}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {isSelected && isEditable && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                        className="w-7 h-7 flex items-center justify-center bg-white/50 rounded-full text-red-600 hover:bg-red-500 hover:text-white transition-colors ml-3 flex-shrink-0 shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {showCalendar && (
          <CalendarModal 
            currentDate={currentDate}
            onSelectDate={setCurrentDate}
            onClose={() => setShowCalendar(false)}
          />
      )}

      {showTimeModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 transform scale-100 transition-transform">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600"/> Definir Horario
                </h3>
                <button onClick={() => setShowTimeModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Inicio</label>
                  <input 
                    type="time" 
                    value={timeStartTime}
                    onChange={(e) => setTimeStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fin</label>
                  <input 
                    type="time" 
                    value={timeEndTime}
                    onChange={(e) => setTimeEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setShowTimeModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
                 <button onClick={confirmTimeSelection} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"><Save size={16} /> Guardar</button>
              </div>
           </div>
        </div>
      )}

      {showStats && (
        <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-heading font-bold text-slate-800">
                   {isToday ? 'Resumen Hoy' : `Resumen ${currentDate.getDate()}`}
               </h2>
               <button onClick={() => setShowStats(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600">
                 <X size={18} />
               </button>
             </div>

             <div className="h-56 w-full mb-8 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
                      paddingAngle={4}
                      dataKey="value" stroke="none"
                    >
                      {statsData.map((entry, index) => {
                         const color = entry.color.includes('blue') ? '#3b82f6' : 
                                       entry.color.includes('violet') ? '#8b5cf6' : 
                                       entry.color.includes('emerald') ? '#10b981' : 
                                       entry.color.includes('pink') ? '#ec4899' : '#64748b';
                         return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className={`text-4xl font-bold font-heading ${totalScore >= 0 ? 'text-slate-800' : 'text-red-500'}`}>{totalScore}</span>
                </div>
             </div>
             
             {/* Simple Report List */}
             <div className="space-y-3 mb-6">
                 {statsData.sort((a,b) => b.value - a.value).slice(0, 3).map(stat => (
                     <div key={stat.name} className="flex justify-between items-center text-sm">
                         <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                             <span className="text-slate-600 font-medium">{stat.name}</span>
                         </div>
                         <span className="font-bold text-slate-800">{(stat.value/60).toFixed(1)}h</span>
                     </div>
                 ))}
             </div>

             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-violet-600">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Análisis IA</span>
                </div>
                
                {aiFeedback ? (
                  <p className="text-sm text-slate-600 leading-relaxed font-medium animate-in fade-in">
                    {aiFeedback}
                  </p>
                ) : (
                   <button 
                      onClick={handleAiAnalysis}
                      disabled={loadingAi}
                      className="w-full py-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2"
                   >
                     {loadingAi ? 'Procesando...' : 'Analizar este día'}
                   </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
