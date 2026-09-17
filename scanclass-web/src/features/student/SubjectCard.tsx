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
    <div className="group perspective-1000 h-full w-full">
      <div className="relative transform-gpu transition-all duration-500 ease-out hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(184,92,56,0.15)] bg-white dark:bg-[#1E1612] rounded-[2rem] p-8 lg:p-10 border-2 border-[#E8DCD0] dark:border-[#3A2A22] hover:border-[#B85C38]/50 min-h-[340px] flex flex-col justify-between overflow-hidden">
        
        {/* Subtle Decorative Gradient */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700 ${isLow ? 'bg-red-500' : 'bg-[#D2691E]'}`}></div>

        <div className="relative z-10">
          <h3 className="text-3xl font-display font-extrabold text-[#2B1B12] dark:text-[#E8DCD0] leading-tight mb-3">
            {subject.name}
          </h3>
          <span className="inline-block px-3 py-1.5 rounded-lg bg-[#FAECE1] dark:bg-[#2C201A] text-[#B85C38] text-[13px] font-mono font-bold tracking-widest border border-[#B85C38]/20">
            {subject.subject_code} • SEC {subject.section}
          </span>
          
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-[#FDF9F1] dark:bg-[#181311] p-5 rounded-2xl border border-[#E8DCD0] dark:border-[#3A2A22]">
              <span className="block text-[12px] uppercase tracking-widest text-[#8A5A44] mb-1 font-bold">Conducted</span>
              <span className="text-4xl font-black text-[#2B1B12] dark:text-[#E8DCD0]">{stats.total}</span>
            </div>
            <div className="bg-[#FDF9F1] dark:bg-[#181311] p-5 rounded-2xl border border-[#E8DCD0] dark:border-[#3A2A22]">
              <span className="block text-[12px] uppercase tracking-widest text-[#8A5A44] mb-1 font-bold">Present</span>
              <span className="text-4xl font-black text-[#22C55E]">{stats.attended}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <span className="text-[13px] font-bold uppercase tracking-widest text-[#8A5A44]">Devotion (Attendance)</span>
            <span className={`text-3xl font-black ${isLow ? 'text-red-500' : 'text-[#B85C38]'}`}>{pct}%</span>
          </div>
          
          <div className="w-full bg-[#FAECE1] dark:bg-[#2C201A] rounded-full h-3 mb-6 overflow-hidden shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-[#B85C38] to-[#D2691E]'}`}
              style={{ width: `${pct}%` }}
            ></div>
          </div>

          {isLow && (
            <p className="text-[13px] font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
              Warning: Devotion is below 75%
            </p>
          )}

          <button 
            onClick={() => onUnenroll(subject.subject_id)}
            className="w-full py-4 rounded-xl text-[14px] font-extrabold uppercase tracking-widest transition-colors border-2 border-[#E8DCD0] dark:border-[#3A2A22] hover:border-red-200 dark:hover:border-red-900/50 bg-[#FDF9F1] hover:bg-red-50 text-[#8A5A44] hover:text-red-600 dark:bg-[#181311] dark:hover:bg-[#3f1616] dark:text-[#B59582] dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            Abandon Subject
          </button>
        </div>
      </div>
    </div>
  );
};
export default SubjectCard;