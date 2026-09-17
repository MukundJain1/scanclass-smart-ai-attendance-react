// src/features/teacher/TeacherDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Camera, BookOpen, Clock, Upload, X } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherDashboard: React.FC = () => {
  const { userData, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'attendance' | 'subjects' | 'records'>('attendance');
  
  // 1. Extract the ID safely at the top level
  const tId = userData?.id || userData?.teacher_id;
  
  // Data States
  const [subjects, setSubjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  
  // Form States
  const [newSubject, setNewSubject] = useState({ code: '', name: '', section: '' });
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // Camera & Image States
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch initial data
  useEffect(() => {
    if (tId) {
      fetchSubjects(tId);
      fetchRecords(tId);
    }
  }, [tId]);

  // Clean up camera on tab change or unmount
  useEffect(() => {
    if (activeTab !== 'attendance' || scanImage) {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, scanImage]);

  const fetchSubjects = async (idToFetch: string | number) => {
    try {
      const res = await api.get(`/teacher/${idToFetch}/subjects`);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  };

  const fetchRecords = async (idToFetch: string | number) => {
    try {
      const res = await api.get(`/teacher/${idToFetch}/attendance-records`);
      setRecords(res.data.records || []);
    } catch (err) {
      console.error("Failed to fetch records", err);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tId) return alert("Error: Teacher ID is missing. Please log out and log back in.");

    try {
      await api.post('/teacher/subjects', {
        subject_code: newSubject.code,
        name: newSubject.name,
        section: newSubject.section,
        teacher_id: tId 
      });
      setNewSubject({ code: '', name: '', section: '' });
      fetchSubjects(tId);
      alert("Subject created successfully");
    } catch (err: any) {
      console.error("Creation error:", err.response?.data || err);
      alert("Failed to create subject. Check console for details.");
    }
  };

  // --- Camera & Image Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanImage(null);
    try {
      // Prefer rear camera for classrooms
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access the camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setScanImage(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    setScanImage(null);
    stopCamera();
  };

  const handleScanClassroom = async () => {
    if (!scanImage || !selectedSubjectId) return alert("Select subject and provide an image");
    try {
      const res = await api.post('/attendance/teacher/scan-classroom', {
        subject_id: selectedSubjectId,
        images: [scanImage],
        auto_commit: true
      });
      alert(`Scanned ${res.data.total_images_processed} image(s). Present: ${res.data.present_count}, Absent: ${res.data.absent_count}`);
      if (tId) fetchRecords(tId);
      setScanImage(null);
    } catch (err) {
      console.error(err);
      alert("Scan failed. Ensure students are enrolled in this subject.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Teacher Portal</h1>
          <p className="text-muted">Welcome back, {userData?.name}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all dark:hover:bg-red-950/30 dark:border-gray-700"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <button onClick={() => setActiveTab('attendance')} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all font-medium ${activeTab === 'attendance' ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface border-border text-muted hover:text-text-primary'}`}>
          <Camera size={20} /> Take Attendance
        </button>
        <button onClick={() => setActiveTab('subjects')} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all font-medium ${activeTab === 'subjects' ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface border-border text-muted hover:text-text-primary'}`}>
          <BookOpen size={20} /> Manage Subjects
        </button>
        <button onClick={() => setActiveTab('records')} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all font-medium ${activeTab === 'records' ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface border-border text-muted hover:text-text-primary'}`}>
          <Clock size={20} /> Records
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-h-[400px]">
        
        {/* TAB 1: ATTENDANCE SCANNER */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Classroom AI Scanner</h2>
            <select 
              className="w-full p-3 rounded-lg border dark:bg-gray-900 dark:border-gray-600"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="">Select a Subject...</option>
              {subjects.map(sub => (
                <option key={sub.subject_id} value={sub.subject_id}>{sub.name} ({sub.subject_code})</option>
              ))}
            </select>
            
            {/* Input Selection: Upload or Camera */}
            {!scanImage && !isCameraActive && (
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="classroom-upload" />
                  <label htmlFor="classroom-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload size={36} className="text-gray-400 mb-3" />
                    <span className="font-semibold text-blue-600">Upload Photo</span>
                  </label>
                </div>
                
                <div onClick={startCamera} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer flex flex-col items-center justify-center">
                  <Camera size={36} className="text-gray-400 mb-3" />
                  <span className="font-semibold text-blue-600">Open Camera</span>
                </div>
              </div>
            )}

            {/* Live Camera View */}
            {isCameraActive && !scanImage && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border dark:border-gray-700">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button onClick={stopCamera} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Cancel</button>
                  <button onClick={capturePhoto} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Capture</button>
                </div>
              </div>
            )}
            
            {/* Image Preview & Submit */}
            {scanImage && (
              <div className="mt-4 animate-fade-in">
                <div className="relative inline-block w-full">
                  <img src={scanImage} alt="Classroom Preview" className="rounded-lg shadow-md max-h-80 w-full object-cover mb-4 border dark:border-gray-700" />
                  <button onClick={clearImage} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md">
                    <X size={20} />
                  </button>
                </div>
                <button onClick={handleScanClassroom} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg">
                  Run AI Attendance Scan
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Create New Subject</h2>
              <form onSubmit={handleCreateSubject} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border dark:border-gray-700">
                <input required type="text" placeholder="Subject Name (e.g. Data Structures)" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-600" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                <input required type="text" placeholder="Subject Code (e.g. CS201)" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-600" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} />
                <input required type="text" placeholder="Section (e.g. A)" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-600" value={newSubject.section} onChange={e => setNewSubject({...newSubject, section: e.target.value})} />
                <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">Create Subject</button>
              </form>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Your Subjects</h2>
              <ul className="space-y-3">
                {subjects.map(sub => (
                  <li key={sub.subject_id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{sub.name}</p>
                      <p className="text-sm text-gray-500">Code: {sub.subject_code} | Sec: {sub.section}</p>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full">
                      {sub.total_students || 0} Enrolled
                    </span>
                  </li>
                ))}
                {subjects.length === 0 && <p className="text-gray-500">No subjects created yet.</p>}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: RECORDS */}
        {activeTab === 'records' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Historical Attendance Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900">
                    <th className="p-3 border-b dark:border-gray-700">Timestamp</th>
                    <th className="p-3 border-b dark:border-gray-700">Subject</th>
                    <th className="p-3 border-b dark:border-gray-700">Student ID</th>
                    <th className="p-3 border-b dark:border-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3">{new Date(rec.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-medium">{rec.subjects?.name || 'Unknown'}</td>
                      <td className="p-3">{rec.student_id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${rec.is_present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {rec.is_present ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">No attendance records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};