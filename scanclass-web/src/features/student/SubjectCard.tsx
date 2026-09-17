// src/features/student/SubjectCard.tsx
import React from 'react';

interface SubjectCardProps {
  subject: { subject_id: string; name: string; subject_code: string; section: string };
  stats: { total: number; attended: number };
  pct: number;
  isLow: boolean;
  onUnenroll: (id: string) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, stats, pct, isLow, onUnenroll }) => {
  return (
    <div className="group perspective-1000 h-full">
      <div className="relative transform-gpu transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col justify-between">
        
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            {subject.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            {subject.subject_code} • Sec {subject.section}
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">Total Classes</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">Attended</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{stats.attended}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium dark:text-gray-200">Attendance</span>
            <span className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-blue-500'}`}>
              {pct}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
              style={{ width: `${pct}%` }}
            ></div>
          </div>

          {isLow && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mb-4">
              ⚠️ Below 75% — Needs attention
            </p>
          )}

          <button 
            onClick={() => onUnenroll(subject.subject_id)}
            className="w-full mt-2 py-2 px-4 rounded-xl text-sm font-semibold transition-colors bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-red-900/30 dark:text-gray-300 dark:hover:text-red-400"
          >
            Unenroll Subject
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;