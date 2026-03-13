"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'default' | 'warning';
  badge?: string;
  progress?: number;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  badge,
  progress 
}) => {
  const isPrimary = variant === 'primary';
  const isWarning = variant === 'warning';

  if (isPrimary) {
    return (
      <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-100 relative overflow-hidden group">
        {Icon && (
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon className="w-12 h-12" />
          </div>
        )}
        <p className="text-teal-50 text-sm font-medium mb-1">{title}</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{value}</h2>
        {badge && (
          <div className="mt-4 flex items-center text-xs text-teal-800 font-semibold bg-white/30 w-fit px-2 py-1 rounded-md">
            {badge}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h2 className={`text-2xl font-bold ${isWarning ? 'text-rose-500' : 'text-slate-700'}`}>
            {value}
          </h2>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${isWarning ? 'bg-rose-50' : 'bg-teal-50'}`}>
            <Icon className={`w-5 h-5 ${isWarning ? 'text-rose-500' : 'text-teal-500'}`} />
          </div>
        )}
      </div>
      {subtitle && (
        <p className={`text-xs mt-4 font-medium ${isWarning ? 'text-rose-500' : 'text-teal-500'}`}>
          {subtitle}
        </p>
      )}
      {progress !== undefined && (
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4">
          <div 
            className="bg-blue-400 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default KPICard;
