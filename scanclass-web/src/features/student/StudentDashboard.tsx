import React, { useState, useEffect } from 'react';
import SubjectCard from './SubjectCard';
import type { StudentData } from './StudentPortal';
import { api } from '../../services/api'; 
import { Compass } from 'lucide-react';

interface DashboardProps { studentData: StudentData; showToast: (msg: string, type: 'success' | 'error') => void; }
interface StatsMap { [key: string]: { total: number; attended: number }; }

const StudentDashboard: React.FC<DashboardProps> = ({ studentData, showToast }) => {
  const [subjects, setSubjects] = useState<any[]>(studentData.subjects || []);
  const [statsMap, setStatsMap] = useState<StatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join-code');
    if (code) { setEnrollCode(code); setShowEnrollModal(true); }
  }, []);

  const LOW_ATTENDANCE_THRESHOLD = 75;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subsRes, logsRes] = await Promise.all([ api.get(`/student/${studentData.student_id}/subjects`), api.get(`/student/${studentData.student_id}/attendance`) ]);
      setSubjects(subsRes.data.subjects || []);
      const logs = logsRes.data.logs || [];
      const newStats: StatsMap = {};
      logs.forEach((log: any) => {
        const subId = log.subject_id;
        if (!newStats[subId]) newStats[subId] = { total: 0, attended: 0 };
        newStats[subId].total += 1;
        if (log.is_present) newStats[subId].attended += 1;
      });
      setStatsMap(newStats);
    } catch (error) { showToast("Failed to fetch data", "error"); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [studentData.student_id]);

  const handleUnenroll = async (subjectId: string) => {
    if (!window.confirm("Abandon this pursuit of knowledge?")) return;
    try { await api.delete(`/student/${studentData.student_id}/subject/${subjectId}`); await fetchData(); showToast("Subject abandoned.", "success"); } 
    catch (error) { showToast("Failed to unenroll.", "error"); }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault(); if (!enrollCode.trim()) return;
    try {
      await api.post(`/student/${studentData.student_id}/enroll`, { subject_code: enrollCode });
      setShowEnrollModal(false); setEnrollCode('');
      window.history.replaceState({}, document.title, "/student");
      await fetchData(); showToast("Enrolled successfully!", "success");
    } catch (error) { showToast("Invalid code or already enrolled.", "error"); }
  };

  if (isLoading) return <div className="flex justify-center mt-32"><div className="w-16 h-16 border-4 border-[#B85C38]/20 border-t-[#B85C38] rounded-full animate-spin"></div></div>;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#E8DCD0] dark:border-[#3A2A22] pb-8">
        <div>
          <h1 className="text-5xl lg:text-6xl font-display font-black text-[#2B1B12] dark:text-[#E8DCD0] tracking-tight">
            Pranam, {studentData.name} 🙏
          </h1>
          <p className="mt-4 text-xl text-[#8A5A44] dark:text-[#B59582] font-medium max-w-2xl">
            Your academic devotion awaits. Review your standing below.
          </p>
        </div>
        <button onClick={() => setShowEnrollModal(true)} className="mt-8 md:mt-0 bg-gradient-to-r from-[#B85C38] to-[#8C4A23] hover:from-[#A04D2E] hover:to-[#733A19] text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-[#B85C38]/30 transition-all hover:-translate-y-1 font-extrabold text-lg flex items-center gap-3">
          <Compass size={24} /> Enter New Domain
        </button>
      </div>

      {/* Strict 3-Column Grid with Large Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
        {subjects.map((subNode, idx) => {
          const sub = subNode.subjects || subNode; 
          const subId = sub.subject_id;
          const stats = statsMap[subId] || { total: 0, attended: 0 };
          const pct = stats.total === 0 ? 100 : Math.round((stats.attended / stats.total) * 100);
          return <SubjectCard key={idx} subject={sub} stats={stats} pct={pct} isLow={stats.total > 0 && pct < LOW_ATTENDANCE_THRESHOLD} onUnenroll={handleUnenroll} />;
        })}
        {subjects.length === 0 && (
          <div className="col-span-full text-center py-32 bg-white/50 dark:bg-[#1E1612]/50 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-[#E8DCD0] dark:border-[#3A2A22]">
             <p className="text-3xl text-[#8A5A44] dark:text-[#B59582] font-display font-bold">You walk no path yet.</p>
             <p className="text-xl text-[#B85C38] mt-4 font-medium">Click 'Enter New Domain' to begin your studies.</p>
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120D0A]/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1612] p-10 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-[#E8DCD0] dark:border-[#3A2A22] animate-fade-in-up">
            <h2 className="text-4xl font-display font-extrabold mb-3 text-center text-[#2B1B12] dark:text-[#E8DCD0]">Join Domain</h2>
            <p className="text-center text-[#8A5A44] dark:text-[#B59582] text-lg mb-10 font-medium">Enter the secret code provided by your Acharya.</p>
            <form onSubmit={handleEnroll}>
              <input type="text" value={enrollCode} onChange={(e) => setEnrollCode(e.target.value)} placeholder="e.g. AR101" className="w-full h-20 px-6 rounded-2xl bg-[#FDF9F1] dark:bg-[#181311] border-2 border-[#E8DCD0] dark:border-[#3A2A22] focus:border-[#B85C38] outline-none mb-10 text-center text-3xl font-mono font-bold uppercase tracking-widest text-[#B85C38]" required />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 h-16 border-2 border-[#E8DCD0] dark:border-[#3A2A22] hover:bg-[#FAECE1] dark:hover:bg-[#2C201A] text-[#2B1B12] dark:text-[#E8DCD0] font-extrabold text-lg rounded-2xl transition">Cancel</button>
                <button type="submit" className="flex-1 h-16 bg-[#B85C38] hover:bg-[#8C4A23] text-white font-extrabold text-lg rounded-2xl shadow-lg transition">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentDashboard;