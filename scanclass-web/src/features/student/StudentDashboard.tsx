import { DialogBox, type DialogProps } from '../../components/TempBox';
import React, { useState, useEffect } from 'react';
import SubjectCard from './SubjectCard';
import type { StudentData } from './StudentPortal';
import { api } from '../../services/api';
import { ScanFace, LogOut, X, Fingerprint } from 'lucide-react';

interface DashboardProps { studentData: StudentData; showToast: (msg: string, type: 'success' | 'error') => void; }

const StudentDashboard: React.FC<DashboardProps> = ({ studentData, showToast }) => {
  const [subjects, setSubjects] = useState<any[]>(studentData.subjects || []);
  const [statsMap, setStatsMap] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');

  const [dialog, setDialog] = useState<DialogProps>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showDialog = (title: string, message: string, type: DialogProps['type'] = 'alert', confirmAction?: () => void) => {
    setDialog({ 
      isOpen: true, title, message, type, 
      onConfirm: () => { setDialog((prev: DialogProps) => ({ ...prev, isOpen: false })); if(confirmAction) confirmAction(); },
      onCancel: type === 'confirm' ? () => setDialog((prev: DialogProps) => ({ ...prev, isOpen: false })) : undefined 
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join-code');
    if (code) { setEnrollCode(code); setShowEnrollModal(true); }
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subsRes, logsRes] = await Promise.all([api.get(`/student/${studentData.student_id}/subjects`), api.get(`/student/${studentData.student_id}/attendance`)]);
      setSubjects(subsRes.data.subjects || []);
      const newStats: any = {};
      (logsRes.data.logs || []).forEach((log: any) => {
        const subId = log.subject_id;
        if (!newStats[subId]) newStats[subId] = { total: 0, attended: 0 };
        newStats[subId].total += 1;
        if (log.is_present) newStats[subId].attended += 1;
      });
      setStatsMap(newStats);
    } catch (error) { showToast("Failed to load data.", "error"); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [studentData.student_id]);

  const handleUnenroll = (subjectId: string) => {
    showDialog("Confirm Unenrollment", "Are you sure you want to unenroll from this subject?", "confirm", async () => {
      try { await api.delete(`/student/${studentData.student_id}/subject/${subjectId}`); await fetchData(); showToast("Successfully unenrolled.", "success"); }
      catch (error) { showToast("Failed to unenroll.", "error"); }
    });
  };

  const handleEnrollClick = (e: React.FormEvent) => {
    e.preventDefault(); if (!enrollCode.trim()) return;
    const codeToEnroll = enrollCode.trim().toUpperCase();
    const isDuplicate = subjects.some((s) => (s.subjects || s).subject_code.toUpperCase() === codeToEnroll);

    if (isDuplicate) { showDialog("Already Enrolled", `You are already enrolled in ${codeToEnroll}.`, "alert"); return; }

    setShowEnrollModal(false);
    showDialog("Confirm Enrollment", `Do you want to enroll in ${codeToEnroll}?`, "confirm", async () => {
      try {
        await api.post(`/student/${studentData.student_id}/enroll`, { subject_code: codeToEnroll });
        setEnrollCode(''); window.history.replaceState({}, document.title, window.location.pathname);
        await fetchData(); showToast("Successfully enrolled!", "success");
      } catch (error: any) { showDialog("Enrollment Failed", error.response?.data?.detail || "Invalid access code.", "error"); }
    });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Fingerprint className="text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" size={64} strokeWidth={1} />
      <span className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase">Loading your data...</span>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-10 animate-fade-in-up">
      <DialogBox {...dialog} />

      <div className="max-w-7xl mx-auto w-full pb-20">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <ScanFace size={32} className="text-black" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-1">
                  Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Verified</span>
                </h1>
                <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">ID: {String(studentData.student_id || 'Unknown').substring(0, 8)} • Welcome, {studentData.name}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 md:mt-0 relative z-10">
            <button onClick={() => window.location.reload()} className="h-14 px-6 rounded-xl font-bold flex items-center gap-2 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <LogOut size={20} /> Sign Out
            </button>
            <button onClick={() => setShowEnrollModal(true)} className="h-14 bg-cyan-400 hover:bg-cyan-300 text-black px-8 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all font-black tracking-wide flex items-center gap-3 uppercase text-sm hover:scale-105 active:scale-95">
              + Join Subject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subNode, idx) => {
            const sub = subNode.subjects || subNode;
            const stats = statsMap[sub.subject_id] || { total: 0, attended: 0 };
            const pct = stats.total === 0 ? 100 : Math.round((stats.attended / stats.total) * 100);
            return <SubjectCard key={idx} subject={sub} stats={stats} pct={pct} isLow={stats.total > 0 && pct < 75} onUnenroll={handleUnenroll} />;
          })}
        </div>

        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030509]/90 backdrop-blur-xl p-4 animate-fade-in">
            <div className="p-1 rounded-[2.5rem] bg-gradient-to-b from-cyan-500/30 to-transparent w-full max-w-lg shadow-[0_0_80px_rgba(34,211,238,0.15)] animate-fade-in-up">
              <div className="bg-[#0A0F1C] p-10 rounded-[2.3rem] border border-white/5 relative overflow-hidden">

                <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h2 className="text-3xl font-black text-white tracking-wide">Join Subject</h2>
                  <button onClick={() => setShowEnrollModal(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={24} /></button>
                </div>
                <p className="text-sm mb-10 text-slate-400 font-medium relative z-10">Enter the access code provided by your teacher to enroll.</p>

                <form onSubmit={handleEnrollClick} className="relative z-10">
                  <input type="text" value={enrollCode} onChange={(e) => setEnrollCode(e.target.value)} placeholder="ENTER CODE"
                    className="w-full h-20 px-6 rounded-2xl border border-white/10 outline-none mb-8 text-center text-4xl font-mono font-black uppercase tracking-[0.2em] bg-black/50 focus:border-cyan-400 text-cyan-400 shadow-inner transition-colors placeholder:text-slate-800" required />
                  <button type="submit" className="w-full h-16 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:scale-[1.02] active:scale-95">
                    Enroll Now
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentDashboard;