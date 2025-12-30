import React from 'react';
import { Briefcase, BookOpen, Dumbbell, Home, Coffee, Gamepad2, HeartPulse, Zap, Star, AlertCircle } from 'lucide-react';

export const IconMap: Record<string, React.FC<any>> = {
  Briefcase,
  BookOpen,
  Dumbbell,
  Home,
  Coffee,
  Gamepad2,
  HeartPulse,
  Zap,
  Star,
  AlertCircle
};

export const GetIcon = ({ name, className }: { name?: string, className?: string }) => {
  const IconComponent = name && IconMap[name] ? IconMap[name] : Star;
  return <IconComponent className={className} />;
};