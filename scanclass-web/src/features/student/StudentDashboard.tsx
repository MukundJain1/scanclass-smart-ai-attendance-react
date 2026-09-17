// src/features/student/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import SubjectCard from './SubjectCard';
import type { StudentData } from './StudentPortal';
import { api } from '../../services/api'; // Ensure api is exported from api.ts

interface DashboardProps {
  studentData: StudentData;
}

interface StatsMap {
  [key: string]: { total: number; attended: number };
}

const StudentDashboard: React.FC<DashboardProps> = ({ studentData }) => {
  const [subjects, setSubjects] = useState<any[]>(studentData.subjects || []);
  const [statsMap, setStatsMap] = useState<StatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');

  const LOW_ATTENDANCE_THRESHOLD = 75;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Replace with your actual endpoints
      const [subsRes, logsRes] = await Promise.all([
        api.get(`/student/${studentData.student_id}/subjects`),
        api.get(`/student/${studentData.student_id}/attendance`)
      ]);

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
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentData.student_id]);

  const handleUnenroll = async (subjectId: string) => {
    if (!window.confirm("Are you sure you want to unenroll?")) return;
    try {
      await api.delete(`/student/${studentData.student_id}/subject/${subjectId}`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to unenroll", error);
      alert("Failed to unenroll. Please try again.");
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCode.trim()) return;
    try {
      await api.post(`/student/${studentData.student_id}/enroll`, { subject_code: enrollCode });
      setShowEnrollModal(false);
      setEnrollCode('');
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Enrollment failed", error);
      alert("Failed to enroll. Check the subject code.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {studentData.name} 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's how your attendance is looking across your subjects.
          </p>
        </div>
        <button 
          onClick={() => setShowEnrollModal(true)}
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 font-semibold flex items-center gap-2"
        >
          <span>+</span> Enroll in Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((subNode, idx) => {
          const sub = subNode.subjects || subNode; // Adjust based on your join structure
          const subId = sub.subject_id;
          const stats = statsMap[subId] || { total: 0, attended: 0 };
          const pct = stats.total === 0 ? 100 : Math.round((stats.attended / stats.total) * 100);
          const isLow = stats.total > 0 && pct < LOW_ATTENDANCE_THRESHOLD;

          return (
            <SubjectCard 
              key={idx}
              subject={sub}
              stats={stats} 
              pct={pct}
              isLow={isLow}
              onUnenroll={handleUnenroll}
            />
          );
        })}
        
        {subjects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400">You are not enrolled in any subjects yet.</p>
          </div>
        )}
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Enroll in Subject</h2>
            <form onSubmit={handleEnroll}>
              <input 
                type="text" 
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value)}
                placeholder="Enter Subject Code"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                required
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                  Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;