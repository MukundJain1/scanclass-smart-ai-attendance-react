import React from 'react';

interface SubjectCardProps {
  subject: { subject_id: string; name: string; subject_code: string; section?: string };
  stats: { total: number; attended: number };
  pct: number;
  isLow: boolean;
  onUnenroll: (id: string) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, stats, pct, isLow, onUnenroll }) => {
  const dashArray = 251.2; // Circumference of r=40
  const dashOffset = dashArray - (dashArray * pct) / 100;

  return (
    <div className="group perspective-1000 h-full w-full cursor-pointer">
      {/* 3D Tilt Wrapper */}
      <div className="relative transform-gpu transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-x-2 bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-[2rem] min-h-[320px] shadow-2xl group-hover:shadow-cyan-500/20">
        
        <div className="bg-[#0A0F1C]/90 backdrop-blur-2xl rounded-[31px] p-8 h-full flex flex-col justify-between overflow-hidden relative">
          
          {/* Ambient Glow tied to Attendance Status */}
          <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-opacity duration-700 group-hover:opacity-40 ${isLow ? 'bg-rose-500' : 'bg-cyan-400'}`}></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="inline-block px-3 py-1 mb-4 rounded-lg bg-white/5 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold tracking-widest uppercase">
                {subject.subject_code} {subject.section && `• SEC ${subject.section}`}
              </span>
              <h3 className="text-2xl font-black text-white leading-tight mb-2 pr-4">
                {subject.name}
              </h3>
            </div>
            
            {/* Holographic Circular Progress Ring */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-white/5 rounded-full border border-white/5 shadow-inner">
              <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round"
                  className={`transition-all duration-1000 ease-out ${isLow ? 'text-rose-500' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]'}`} 
                />
              </svg>
              <span className="absolute text-[11px] font-black">{pct}%</span>
            </div>
          </div>

          <div className="mt-8 relative z-10">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                <span className="block text-[9px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Sessions</span>
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                <span className="block text-[9px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Attended</span>
                <span className={`text-2xl font-black ${isLow ? 'text-rose-400' : 'text-cyan-400'}`}>{stats.attended}</span>
              </div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); onUnenroll(subject.subject_id); }} className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] opacity-0 group-hover:opacity-100 focus:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300">
              Abort Subject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubjectCard;