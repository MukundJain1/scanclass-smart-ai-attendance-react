import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Camera, BookOpen, Clock, Upload, X, Loader2, CheckCircle, XCircle, QrCode, Sparkles, Copy, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const TeacherDashboard: React.FC = () => {
  const { userData, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'attendance' | 'subjects' | 'records'>('attendance');
  
  const tId = userData?.id || userData?.teacher_id;
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', section: '' });
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success'|'error' } | null>(null);
  const [shareSubject, setShareSubject] = useState<any | null>(null);
  
  const [scanResults, setScanResults] = useState<any | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (tId) { fetchSubjects(tId); fetchRecords(tId); }
  }, [tId]);

  useEffect(() => {
    if (activeTab !== 'attendance' || scanImage) stopCamera();
    return () => stopCamera();
  }, [activeTab, scanImage]);

  const fetchSubjects = async (id: string | number) => {
    try { const res = await api.get(`/teacher/${id}/subjects`); setSubjects(res.data.subjects || []); } 
    catch (err) { console.error(err); }
  };

  const fetchRecords = async (id: string | number) => {
    try { const res = await api.get(`/teacher/${id}/attendance-records`); setRecords(res.data.records || []); } 
    catch (err) { console.error(err); }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tId) return showToast("Teacher ID missing.", "error");
    setIsLoading(true);
    try {
      await api.post('/teacher/subjects', { subject_code: newSubject.code, name: newSubject.name, section: newSubject.section, teacher_id: tId });
      setNewSubject({ code: '', name: '', section: '' });
      fetchSubjects(tId);
      showToast("Subject created successfully", "success");
    } catch (err: any) {
      showToast("Failed to create subject", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true); setScanImage(null); setScanResults(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { showToast("Camera access denied", "error"); setIsCameraActive(false); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setScanImage(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
      }
    }
  };

  const handlePreviewScan = async () => {
    if (!scanImage || !selectedSubjectId) return showToast("Select subject & capture image", "error");
    setIsLoading(true);
    try {
      const res = await api.post('/attendance/teacher/scan-classroom', { 
        subject_id: selectedSubjectId, 
        images: [scanImage], 
        auto_commit: false 
      });
      setScanResults(res.data);
    } catch (err) {
      showToast("Scan failed. Ensure students are enrolled.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAttendance = async () => {
    setIsLoading(true);
    try {
      await api.post('/attendance/teacher/scan-classroom', { 
        subject_id: selectedSubjectId, 
        images: [scanImage], 
        auto_commit: true 
      });
      showToast("Attendance successfully saved to chronicles.", "success");
      if (tId) { fetchRecords(tId); fetchSubjects(tId); }
      setScanResults(null);
      setScanImage(null);
    } catch (err) {
      showToast("Failed to commit attendance.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupedSessions = () => {
    const sessionsMap = new Map();
    records.forEach(rec => {
      const dateKey = new Date(rec.timestamp).toLocaleDateString();
      const key = `${rec.subject_id}-${dateKey}`;
      
      if (!sessionsMap.has(key)) {
        const sub = subjects.find(s => s.subject_id === rec.subject_id);
        sessionsMap.set(key, {
          timestamp: rec.timestamp,
          subjectName: rec.subjects?.name || 'Unknown',
          subjectCode: rec.subjects?.subject_code || '',
          totalEnrolled: sub?.total_students || 0,
          presentCount: 0
        });
      }
      if (rec.is_present) sessionsMap.get(key).presentCount += 1;
    });
    return Array.from(sessionsMap.values()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const groupedSessions = getGroupedSessions();

  return (
    <div className="min-h-screen bg-[#FDF9F1] dark:bg-[#120D0A] text-[#2B1B12] dark:text-[#E8DCD0] font-sans transition-colors duration-700">
      
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-5 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up backdrop-blur-md ${toast.type === 'success' ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="text-[15px] font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      <header className="w-full px-6 lg:px-12 py-5 border-b border-[#E8DCD0] dark:border-[#3A2A22] bg-white/50 dark:bg-[#1E1612]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B85C38] to-[#5C2E14] flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold tracking-wider leading-tight">ACHARYA PORTAL</h1>
            <p className="text-[13px] text-[#8A5A44] dark:text-[#B59582] font-medium">{userData?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold border border-[#E8DCD0] dark:border-[#3A2A22] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all hover:scale-105">
            <LogOut size={18} /> Exit
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-10 animate-fade-in-up">
        
        <div className="flex p-1.5 mb-10 bg-[#FAECE1] dark:bg-[#1E1612] border border-[#E8DCD0] dark:border-[#3A2A22] rounded-2xl w-full max-w-fit mx-auto shadow-inner">
          {[ { id: 'attendance', icon: Camera, label: 'Vision Scan' }, { id: 'subjects', icon: BookOpen, label: 'Knowledge Domains' }, { id: 'records', icon: Clock, label: 'Chronicles' } ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[15px] font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-[#B85C38] to-[#8C4A23] text-white shadow-lg' : 'text-[#8A5A44] dark:text-[#B59582] hover:text-[#5C2E14] dark:hover:text-[#E8DCD0] hover:bg-white/50 dark:hover:bg-black/20'}`}
            >
              <tab.icon size={18} /> <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#181311] rounded-[2rem] border border-[#E8DCD0] dark:border-[#3A2A22] p-8 lg:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] min-h-[500px]">
          
          {/* TAB 1: ATTENDANCE SCANNER */}
          {activeTab === 'attendance' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-display font-extrabold text-[#2B1B12] dark:text-[#E8DCD0]">Initiate Class Scan</h2>
                <p className="text-[#8A5A44] dark:text-[#B59582] mt-2 text-lg">Select a domain and capture the scholars present.</p>
              </div>
              
              <div className="relative">
                <select 
                  className="w-full h-14 px-5 rounded-xl bg-[#FDF9F1] dark:bg-[#1E1612] border border-[#E8DCD0] dark:border-[#3A2A22] text-lg font-medium appearance-none focus:ring-2 focus:ring-[#B85C38] outline-none shadow-sm cursor-pointer"
                  value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  <option value="" disabled>Select Subject...</option>
                  {subjects.map(sub => <option key={sub.subject_id} value={sub.subject_id}>{sub.name} ({sub.subject_code})</option>)}
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#8A5A44]">▼</div>
              </div>

              {!scanImage && !isCameraActive && (
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <label className="cursor-pointer border-2 border-dashed border-[#D7C0A8] dark:border-[#3A2A22] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#FAECE1]/30 dark:bg-[#1E1612]/30 hover:bg-[#FAECE1] dark:hover:bg-[#2C201A] hover:border-[#B85C38] transition-all group">
                    <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { const reader = new FileReader(); reader.onloadend = () => setScanImage(reader.result as string); reader.readAsDataURL(file); }
                    }} className="hidden" />
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-[#181311] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={28} className="text-[#B85C38]" />
                    </div>
                    <span className="text-[16px] font-bold">Upload Parchment</span>
                  </label>
                  <div onClick={startCamera} className="cursor-pointer border-2 border-dashed border-[#D7C0A8] dark:border-[#3A2A22] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#FAECE1]/30 dark:bg-[#1E1612]/30 hover:bg-[#FAECE1] dark:hover:bg-[#2C201A] hover:border-[#B85C38] transition-all group">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-[#181311] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <Camera size={28} className="text-[#B85C38]" />
                    </div>
                    <span className="text-[16px] font-bold">Open Eye (Camera)</span>
                  </div>
                </div>
              )}

              {isCameraActive && !scanImage && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-[#3A2A22] shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                    <button onClick={stopCamera} className="h-12 px-6 bg-black/60 text-white rounded-xl font-bold backdrop-blur-md hover:bg-red-500 transition">Cancel</button>
                    <button onClick={capturePhoto} className="h-12 px-10 bg-[#B85C38] text-white font-bold rounded-xl shadow-lg hover:bg-[#8C4A23] hover:scale-105 transition-all">Capture Face</button>
                  </div>
                </div>
              )}
              
              {scanImage && !scanResults && (
                <div className="mt-6 animate-fade-in">
                  <div className="relative w-full mb-6 group">
                    <img src={scanImage} alt="Preview" className="rounded-2xl w-full max-h-[500px] object-cover border-4 border-[#FAECE1] dark:border-[#2C201A] shadow-xl" />
                    <button onClick={() => { setScanImage(null); setScanResults(null); }} className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white p-3 rounded-full hover:bg-red-500 transition shadow-lg opacity-0 group-hover:opacity-100"><X size={20}/></button>
                  </div>
                  <button onClick={handlePreviewScan} disabled={isLoading} className="w-full h-14 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-70 transition shadow-[0_10px_20px_rgba(34,197,94,0.2)] hover:-translate-y-1">
                    {isLoading ? <><Loader2 size={24} className="animate-spin"/> Analyzing Faces...</> : <><Sparkles size={24}/> Preview Attendance</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="grid xl:grid-cols-12 gap-12">
              <div className="xl:col-span-4">
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3"><BookOpen className="text-[#B85C38]" /> Forge New Subject</h2>
                <form onSubmit={handleCreateSubject} className="space-y-5 bg-[#FAECE1]/50 dark:bg-[#1E1612]/50 p-8 rounded-3xl border border-[#E8DCD0] dark:border-[#3A2A22]">
                  <div>
                    <label className="text-[13px] font-bold uppercase tracking-widest text-[#8A5A44] mb-2 block">Domain Name</label>
                    <input required type="text" placeholder="e.g. Ancient Runes" className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] focus:ring-2 focus:ring-[#B85C38] outline-none font-medium" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] font-bold uppercase tracking-widest text-[#8A5A44] mb-2 block">Code</label>
                      <input required type="text" placeholder="AR101" className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] focus:ring-2 focus:ring-[#B85C38] outline-none font-mono" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[13px] font-bold uppercase tracking-widest text-[#8A5A44] mb-2 block">Section</label>
                      <input required type="text" placeholder="A" className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] focus:ring-2 focus:ring-[#B85C38] outline-none font-mono" value={newSubject.section} onChange={e => setNewSubject({...newSubject, section: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full h-12 mt-4 bg-[#B85C38] hover:bg-[#8C4A23] text-white font-bold rounded-xl flex justify-center items-center gap-2 transition hover:shadow-lg">
                    {isLoading ? <Loader2 size={20} className="animate-spin"/> : 'Manifest Subject'}
                  </button>
                </form>
              </div>

              <div className="xl:col-span-8">
                <h2 className="text-2xl font-display font-bold mb-6">Your Domains</h2>
                
                {/* NEW 2-COLUMN STRICT GRID FOR SQUARE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {subjects.map(sub => (
                    <div key={sub.subject_id} className="relative p-8 rounded-[2rem] bg-white dark:bg-[#1E1612] border-2 border-[#E8DCD0] dark:border-[#3A2A22] hover:border-[#B85C38] hover:shadow-[0_15px_40px_rgba(184,92,56,0.15)] transition-all duration-300 flex flex-col justify-between aspect-square group overflow-hidden">
                      {/* Decorative Background Flare */}
                      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#B85C38]/10 rounded-full blur-3xl group-hover:bg-[#B85C38]/20 transition-colors duration-500"></div>
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="pr-4">
                          <h3 className="font-display font-extrabold text-3xl leading-tight mb-3 text-[#2B1B12] dark:text-[#E8DCD0]">{sub.name}</h3>
                          <span className="inline-block px-3 py-1.5 rounded-lg bg-[#FAECE1] dark:bg-[#2C201A] text-[#B85C38] text-[13px] font-mono font-bold tracking-widest border border-[#B85C38]/20">
                            {sub.subject_code} • SEC {sub.section}
                          </span>
                        </div>
                        <button onClick={() => setShareSubject(sub)} className="p-3 bg-[#FAECE1] dark:bg-[#2C201A] text-[#B85C38] rounded-xl hover:scale-110 hover:bg-[#B85C38] hover:text-white transition-all shadow-sm flex-shrink-0" title="Share Subject">
                          <QrCode size={24} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                        <div className="bg-[#FDF9F1] dark:bg-[#181311] p-5 rounded-2xl border border-[#E8DCD0] dark:border-[#3A2A22] flex flex-col justify-center">
                          <span className="text-[12px] uppercase font-bold tracking-widest text-[#8A5A44] mb-1">Sessions</span>
                          <span className="text-4xl font-black text-[#2B1B12] dark:text-[#E8DCD0]">{sub.total_classes || 0}</span>
                        </div>
                        <div className="bg-[#FDF9F1] dark:bg-[#181311] p-5 rounded-2xl border border-[#E8DCD0] dark:border-[#3A2A22] flex flex-col justify-center">
                          <span className="text-[12px] uppercase font-bold tracking-widest text-[#8A5A44] mb-1">Scholars</span>
                          <span className="text-4xl font-black text-[#B85C38]">{sub.total_students || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {subjects.length === 0 && (
                    <div className="col-span-1 md:col-span-2 p-12 text-center border-2 border-dashed border-[#E8DCD0] dark:border-[#3A2A22] rounded-[2rem] text-[#8A5A44] font-medium text-lg flex items-center justify-center aspect-[2/1]">
                      The scroll is empty. Forge a subject to begin.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECORDS */}
          {activeTab === 'records' && (
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-display font-bold">Chronicles of Attendance</h2>
                  <p className="text-[#8A5A44] dark:text-[#B59582] text-lg mt-1">Aggregated logs for every class session conducted.</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#E8DCD0] dark:border-[#3A2A22] overflow-hidden shadow-sm bg-white dark:bg-[#1E1612]">
                <table className="w-full text-left text-[15px]">
                  <thead>
                    <tr className="bg-[#FAECE1]/50 dark:bg-[#181311]">
                      <th className="px-8 py-5 font-bold uppercase tracking-wider text-[13px] text-[#8A5A44] border-b border-[#E8DCD0] dark:border-[#3A2A22]">Date & Session</th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wider text-[13px] text-[#8A5A44] border-b border-[#E8DCD0] dark:border-[#3A2A22]">Domain / Subject</th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wider text-[13px] text-[#8A5A44] border-b border-[#E8DCD0] dark:border-[#3A2A22]">Present / Enrolled</th>
                      <th className="px-8 py-5 font-bold uppercase tracking-wider text-[13px] text-[#8A5A44] border-b border-[#E8DCD0] dark:border-[#3A2A22]">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSessions.map((session, i) => {
                      const pct = session.totalEnrolled > 0 ? Math.round((session.presentCount / session.totalEnrolled) * 100) : 0;
                      return (
                        <tr key={i} className="border-b border-[#E8DCD0] dark:border-[#3A2A22] last:border-0 hover:bg-[#FAECE1]/30 dark:hover:bg-[#2C201A]/30 transition-colors">
                          <td className="px-8 py-6 font-medium whitespace-nowrap">
                            {new Date(session.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            <div className="text-[13px] text-[#8A5A44] mt-1 font-mono">{new Date(session.timestamp).toLocaleTimeString(undefined, {timeStyle: 'short'})}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-lg">{session.subjectName}</div>
                            <div className="text-[13px] font-mono text-[#8A5A44] bg-[#E8DCD0]/30 dark:bg-[#3A2A22]/50 inline-block px-2 py-0.5 rounded mt-1">{session.subjectCode}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-[#22C55E]">{session.presentCount}</span>
                              <span className="text-[#8A5A44] font-medium">/ {session.totalEnrolled}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="w-full bg-[#E8DCD0] dark:bg-[#3A2A22] rounded-full h-2.5 max-w-[150px]">
                              <div className={`h-2.5 rounded-full ${pct < 50 ? 'bg-red-500' : pct < 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="text-[13px] font-bold mt-2 text-[#8A5A44]">{pct}% Attendance</div>
                          </td>
                        </tr>
                      );
                    })}
                    {groupedSessions.length === 0 && (
                      <tr><td colSpan={4} className="p-16 text-center text-[#8A5A44] text-lg font-medium">The chronicles are empty. No sessions conducted yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CONFIRMATION DIALOG MODAL */}
      {scanResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181311]/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1612] p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-[#E8DCD0] dark:border-[#3A2A22] relative animate-fade-in-up">
            
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#22C55E]/10 text-[#22C55E] mb-6 mx-auto">
              <CheckCircle size={32} />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-extrabold mb-2 text-[#2B1B12] dark:text-[#E8DCD0]">Scan Complete</h2>
              <p className="text-[#8A5A44] dark:text-[#B59582] text-lg font-medium">
                The oracle recognized <strong className="text-[#22C55E] text-xl">{scanResults.present_count}</strong> out of {scanResults.total_enrolled} enrolled scholars.
              </p>
            </div>

            <div className="bg-[#FAECE1] dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] rounded-2xl p-4 max-h-[200px] overflow-y-auto mb-8 shadow-inner">
              {scanResults.results.filter((s: any) => s.status === 'Present').map((student: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[#E8DCD0] dark:border-[#3A2A22] last:border-0">
                  <span className="font-bold text-[#2B1B12] dark:text-[#E8DCD0]">{student.name}</span>
                  <span className="text-[12px] uppercase font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-1 rounded">Present</span>
                </div>
              ))}
              {scanResults.present_count === 0 && (
                <div className="text-center py-4 flex flex-col items-center text-[#EF4444]">
                  <AlertTriangle size={24} className="mb-2" />
                  <p className="font-bold">No enrolled scholars recognized.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => { setScanResults(null); setScanImage(null); }} 
                className="flex-1 h-14 border-2 border-[#E8DCD0] dark:border-[#3A2A22] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#2B1B12] dark:text-[#E8DCD0] font-extrabold text-lg rounded-xl transition"
              >
                Discard
              </button>
              <button 
                onClick={confirmAttendance} 
                disabled={isLoading}
                className="flex-1 h-14 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-lg rounded-xl shadow-lg transition flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {shareSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181311]/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1612] p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-[#E8DCD0] dark:border-[#3A2A22] relative animate-fade-in-up">
            <button onClick={() => setShareSubject(null)} className="absolute top-6 right-6 p-2 rounded-full bg-[#FAECE1] dark:bg-[#2C201A] hover:bg-red-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-extrabold mb-1">{shareSubject.name}</h2>
              <p className="text-[#8A5A44] dark:text-[#B59582] font-medium">Share this rune so scholars may join.</p>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-inner border-2 border-[#E8DCD0] flex justify-center mb-8">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/student?join-code=' + shareSubject.subject_code)}&color=2B1B12`} alt="QR Code" className="rounded-xl w-full max-w-[250px]" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-bold uppercase tracking-widest text-[#8A5A44] mb-1 block">Subject Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-12 bg-[#FDF9F1] dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] rounded-xl flex items-center px-4 font-mono font-bold text-lg">{shareSubject.subject_code}</div>
                  <button onClick={() => { navigator.clipboard.writeText(shareSubject.subject_code); showToast("Code copied!", "success"); }} className="w-12 h-12 flex items-center justify-center bg-[#B85C38] text-white rounded-xl hover:bg-[#8C4A23] transition-colors"><Copy size={18}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};