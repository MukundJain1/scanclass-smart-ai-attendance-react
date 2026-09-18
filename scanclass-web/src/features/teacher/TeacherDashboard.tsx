import { DialogBox, type DialogProps } from '../../components/TempBox';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarCheck, Plus, ScanFace, Loader2, CheckCircle, User, BookOpen, Camera, Share2, X, Activity, Trash2, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';


export const TeacherDashboard: React.FC = () => {
  const { userData, logout } = useAuthStore();
  const navigate = useNavigate();
  const teacherName = userData?.name || "scanclass.ai Admin";
  const tId = userData?.id || userData?.teacher_id;

  const [activeTab, setActiveTab] = useState<'attendance' | 'subjects' | 'records'>('subjects');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // UI States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', section: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Scanner States
  const [imageQueue, setImageQueue] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Modals
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, link: string, code: string } | null>(null);
  const [dialog, setDialog] = useState<DialogProps>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showDialog = (title: string, message: string, type: DialogProps['type'] = 'alert', confirmAction?: () => void) => {
    setDialog({ 
      isOpen: true, title, message, type, 
      onConfirm: () => { setDialog((prev: DialogProps) => ({ ...prev, isOpen: false })); if(confirmAction) confirmAction(); },
      onCancel: type === 'confirm' ? () => setDialog((prev: DialogProps) => ({ ...prev, isOpen: false })) : undefined 
    });
  };

  const fetchSubjects = async (id: string | number) => { try { const res = await api.get(`/teacher/${id}/subjects`); setSubjects(res.data.subjects || []); } catch (err) { } };
  const fetchRecords = async (id: string | number) => { try { const res = await api.get(`/teacher/${id}/attendance-records`); setRecords(res.data.records || []); } catch (err) { } };

  // SMART SYNC: Fetches data on mount and whenever the teacher refocuses the browser window
  useEffect(() => {
    if (!tId) return;

    // Initial fetch
    fetchSubjects(tId);
    fetchRecords(tId);

    // Fetch only when the teacher switches back to this tab/window
    const handleFocus = () => {
      fetchSubjects(tId);
      fetchRecords(tId);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [tId]);

  useEffect(() => { if (activeTab !== 'attendance') stopCamera(); return () => stopCamera(); }, [activeTab]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = newSubject.code.trim().toUpperCase();
    const isDuplicate = subjects.some(sub => sub.subject_code.toUpperCase() === newCode);
    if (isDuplicate) { showDialog('Conflict Detected', `Module code ${newCode} is already in use. Please select a unique identifier.`, 'alert'); return; }

    setIsCreating(true);
    try {
      await api.post('/teacher/subjects', { teacher_id: tId, name: newSubject.name, subject_code: newCode, section: newSubject.section });
      setShowCreateModal(false); setNewSubject({ name: '', code: '', section: '' });
      if (tId) fetchSubjects(tId); showDialog('System Update', 'Module initialized successfully.', 'success');
    } catch (err: any) { showDialog('Error', err.response?.data?.detail || 'Initialization failed. Ensure course code is unique.', 'error'); }
    finally { setIsCreating(false); }
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    showDialog("Confirm Purge", `Are you certain you want to permanently delete module "${subjectName}"? All associated attendance records will be destroyed.`, "confirm", async () => {
      try { await api.delete(`/teacher/${tId}/subjects/${subjectId}`); if (tId) fetchSubjects(tId); showDialog("Module Purged", "The subject and its data have been removed from the system.", "success"); }
      catch (error: any) { showDialog("Purge Failed", error.response?.data?.detail || "Could not communicate with the database.", "error"); }
    });
  };

  const handleShareLink = (subCode: string) => { setShareModal({ isOpen: true, link: `${window.location.origin}/student?join-code=${subCode}`, code: subCode }); };

  const startCamera = async () => {
    setIsCameraActive(true); setScanResults(null);
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); if (videoRef.current) videoRef.current.srcObject = stream; }
    catch (err) { showDialog("Hardware Error", "Optical sensor access denied.", "error"); setIsCameraActive(false); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas'); canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height); setImageQueue(prev => [...prev, canvas.toDataURL('image/jpeg', 0.9)]); }
    }
  };

  const removePhotoFromQueue = (index: number) => { setImageQueue(prev => prev.filter((_, i) => i !== index)); };

  const handlePreviewScan = async () => {
    if (imageQueue.length === 0 || !selectedSubjectId) return showDialog("Input Required", "Targeting data missing.", "alert");
    setIsLoading(true); stopCamera();
    try {
      const res = await api.post('/attendance/teacher/scan-classroom', { subject_id: selectedSubjectId, images: imageQueue, auto_commit: false });
      setScanResults(res.data);
    } catch (err) { showDialog("Analysis Failed", "Neural net failed to process frames.", "error"); } finally { setIsLoading(false); }
  };

  const confirmAttendance = async () => {
    setIsLoading(true);
    try {
      await api.post('/attendance/teacher/scan-classroom', { subject_id: selectedSubjectId, images: imageQueue, auto_commit: true });
      if (tId) { fetchRecords(tId); fetchSubjects(tId); }
      setScanResults(null); setImageQueue([]); showDialog("Data Committed", "Attendance matrix updated.", "success"); setActiveTab('subjects');
    } catch (err) { showDialog("Commit Failed", "Database rejected update.", "error"); } finally { setIsLoading(false); }
  };

  const aggregateData = records.reduce((acc: any, rec: any) => {
    const dateObj = new Date(rec.timestamp);
    const timeKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()} ${dateObj.getHours()}:${dateObj.getMinutes()}`;
    const key = `${rec.subjects?.name || 'Unknown'}_${timeKey}`;
    if (!acc[key]) { acc[key] = { subject: rec.subjects?.name || "Unknown", time: dateObj.toLocaleString(), present: 0, total: 0 }; }
    acc[key].total += 1; if (rec.is_present) acc[key].present += 1;
    return acc;
  }, {});
  const sortedAggregate = Object.values(aggregateData).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="h-full w-full p-4 flex gap-4 overflow-hidden relative z-10 text-white">
      <DialogBox {...dialog} />

      <aside className="w-[300px] rounded-[2rem] border flex flex-col p-6 shadow-2xl shrink-0 bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-2xl font-black mb-12 uppercase tracking-widest text-white mt-4 ml-2">
          <ScanFace className="text-cyan-400" size={28} /> scanclass.ai
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl mb-10 border bg-black/40 border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]"><User size={24} /></div>
          <div>
            <p className="text-sm font-bold truncate w-32 tracking-wide">{teacherName}</p>
            <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono mt-1 flex items-center gap-1"><Activity size={10} /> Admin Access</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'attendance', icon: <ScanFace size={18} />, label: 'Optical Scanner' },
            { id: 'records', icon: <CalendarCheck size={18} />, label: 'Data Matrix' },
            { id: 'subjects', icon: <BookOpen size={18} />, label: 'Module Control' },
          ].map(item => (
            <button
              key={item.id} onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-sm tracking-wide ${activeTab === item.id ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => { logout(); navigate('/'); }} className="mt-auto flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 font-bold transition-all text-sm uppercase tracking-widest border border-transparent hover:border-rose-500/20"><LogOut size={18} /> Sever Link</button>
      </aside>

      <main className="flex-1 rounded-[2rem] border p-10 shadow-2xl overflow-y-auto relative bg-white/5 border-white/10 backdrop-blur-xl">
        <h2 className="text-3xl font-black mb-10 tracking-wider uppercase flex items-center gap-3">
          <div className="w-2 h-8 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div> System Interface
        </h2>

        {/* 1. SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="pb-20 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-300">Active Modules</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div> Live Sync Active
                </div>
                <button onClick={() => setShowCreateModal(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:border-cyan-400 hover:text-cyan-400"><Plus size={16} /> Initialize New</button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {subjects.map(sub => (
                <div key={sub.subject_id} className="border p-6 rounded-[1.5rem] transition-all bg-black/40 border-white/5 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] group relative">
                  <button onClick={() => handleDeleteSubject(sub.subject_id, sub.name)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-lg z-10" title="Delete Module">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-full pr-12">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded mb-2 inline-block">{sub.subject_code}</span>
                      <h4 className="font-black text-xl text-white line-clamp-2 leading-tight" title={sub.name}>{sub.name}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="block text-[9px] uppercase text-slate-500 mb-1 font-bold tracking-widest">Iter</span>
                      <span className="text-xl font-bold text-white">{sub.total_classes || 0}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:animate-pulse"></div>
                      <span className="block text-[9px] uppercase text-slate-500 mb-1 font-bold tracking-widest relative z-10">Nodes</span>
                      <span className="text-xl font-bold text-purple-400 relative z-10">{sub.total_students || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setSelectedSubjectId(sub.subject_id); setActiveTab('attendance'); setImageQueue([]); startCamera(); }} className="flex-1 border py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-cyan-400 text-black border-cyan-400 hover:bg-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]">Scan</button>
                    <button onClick={() => handleShareLink(sub.subject_code)} className="flex-1 bg-white/5 border border-white/10 hover:border-purple-400 hover:text-purple-400 text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2"><Share2 size={14} /> Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. OPTICAL SCANNER TAB */}
        {activeTab === 'attendance' && (
          <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-lg font-bold text-slate-300">Target Acquisition</h3>

              <div className="relative w-80">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-[#0A0F1C] border border-cyan-500/30 text-cyan-400 text-sm rounded-xl px-5 py-4 outline-none font-bold tracking-wider font-mono flex justify-between items-center shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:border-cyan-400 transition-all uppercase relative z-30"
                >
                  <span className="truncate pr-4">
                    {selectedSubjectId
                      ? (() => {
                        const s = subjects.find(sub => sub.subject_id === selectedSubjectId);
                        return s ? `[${s.subject_code}] ${s.name}` : 'SELECT MODULE [---]';
                      })()
                      : 'SELECT MODULE [---]'
                    }
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-cyan-300' : 'text-cyan-600'}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#0A0F1C]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden z-[100] animate-fade-in-up">
                    <div className="max-h-64 overflow-y-auto">
                      {subjects.map(sub => (
                        <div
                          key={sub.subject_id}
                          onClick={() => { setSelectedSubjectId(sub.subject_id); setIsDropdownOpen(false); }}
                          className={`px-5 py-4 cursor-pointer font-mono text-xs font-bold tracking-wider transition-colors border-b border-white/5 last:border-0 flex flex-col ${selectedSubjectId === sub.subject_id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400'}`}
                        >
                          <span className="text-[10px] text-cyan-600 mb-1">[{sub.subject_code}]</span>
                          <span className="uppercase truncate">{sub.name}</span>
                        </div>
                      ))}
                      {subjects.length === 0 && <div className="px-5 py-4 text-slate-500 font-mono text-xs uppercase text-center">No active modules</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-full aspect-video bg-[#050810] rounded-[2rem] overflow-hidden border-2 border-white/5 mb-8 shadow-2xl flex items-center justify-center group z-10">
              <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl pointer-events-none z-10"></div>
              <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-xl pointer-events-none z-10"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl pointer-events-none z-10"></div>
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl pointer-events-none z-10"></div>

              {!isCameraActive && (
                <button onClick={startCamera} className="bg-cyan-400/10 border border-cyan-400 text-cyan-400 px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:bg-cyan-400 hover:text-black transition-all uppercase tracking-widest text-sm z-20">
                  <Camera size={20} /> {imageQueue.length > 0 ? 'Resume Optical Feed' : 'Initialize Optical Feed'}
                </button>
              )}

              {isCameraActive && (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
                  <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] opacity-50 z-10 pointer-events-none" style={{ animation: 'scanLine 3s ease-in-out infinite' }}><style>{`@keyframes scanLine { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } }`}</style></div>
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500/20 text-red-500 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 border border-red-500/50 backdrop-blur-md z-20"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> REC FEED</div>
                  <button onClick={stopCamera} className="absolute top-6 right-8 bg-black/50 border border-white/20 text-white p-2.5 rounded-full hover:bg-rose-500 hover:border-rose-500 transition-colors backdrop-blur-md z-20"><X size={16} /></button>
                  <div className="absolute bottom-8 inset-x-0 flex justify-center z-20">
                    <button onClick={capturePhoto} className="w-16 h-16 bg-transparent rounded-full border-4 border-cyan-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group/btn shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                      <div className="w-12 h-12 bg-cyan-400 rounded-full group-hover/btn:bg-cyan-300"></div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {imageQueue.length > 0 && (
              <div className="p-6 rounded-[2rem] border bg-black/40 border-white/5 backdrop-blur-md">
                <h4 className="text-[10px] font-bold mb-4 text-cyan-400 uppercase tracking-widest font-mono">Buffered Frames [{imageQueue.length}]</h4>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {imageQueue.map((img, idx) => (
                    <div key={idx} className="relative w-32 h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-cyan-400 transition-colors group">
                      <img src={img} alt="queue" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                      <button onClick={() => removePhotoFromQueue(idx)} className="absolute top-2 right-2 bg-rose-500/80 text-white p-1.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={handlePreviewScan} disabled={isLoading} className="bg-cyan-400 text-black px-10 py-4 rounded-xl font-bold flex items-center gap-3 text-sm disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:bg-cyan-300 uppercase tracking-widest transition-all">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Activity />} Run Neural Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. DATA MATRIX (RECORDS) TAB */}
        {activeTab === 'records' && (
          <div className="pb-20 animate-fade-in">
            <h3 className="text-lg font-bold mb-6 text-slate-300">System Logs</h3>
            <div className="rounded-[2rem] border overflow-hidden bg-black/40 border-white/5 backdrop-blur-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-white/5 border-white/5">
                  <tr>
                    <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-cyan-400 font-mono">Timestamp</th>
                    <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-cyan-400 font-mono">Target Module</th>
                    <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-cyan-400 font-mono">Accuracy (Hits/Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(sortedAggregate as any[]).map((session, i) => (
                    <tr key={i} className="transition-colors hover:bg-white/5 group">
                      <td className="px-8 py-5 text-slate-400 font-mono text-xs">{session.time}</td>
                      <td className="px-8 py-5 font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{session.subject}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] inline-block min-w-[60px] text-center">
                          {session.present} / {session.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sortedAggregate.length === 0 && <tr><td colSpan={3} className="text-center py-16 font-medium text-slate-500 uppercase tracking-widest text-xs">Database Empty.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#030509]/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-[2.5rem] p-1 shadow-[0_0_50px_rgba(34,211,238,0.15)] bg-gradient-to-b from-white/10 to-transparent">
              <div className="bg-[#0A0F1C] p-10 rounded-[2.4rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-wider">Deploy Module</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-rose-400 bg-white/5 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateSubject} className="space-y-6 relative z-10">
                  <div>
                    <input type="text" required value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="MODULE IDENTIFIER" className="w-full h-14 px-6 rounded-xl border border-white/10 outline-none bg-black/50 focus:border-cyan-400 text-white placeholder:text-slate-600 font-bold uppercase tracking-wider text-sm transition-colors" />
                  </div>
                  <div>
                    <input type="text" required value={newSubject.code} onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })} placeholder="SYSTEM CODE (e.g. CS201)" className="w-full h-14 px-6 rounded-xl border border-white/10 outline-none bg-black/50 focus:border-cyan-400 text-cyan-400 placeholder:text-slate-600 font-mono font-bold uppercase tracking-widest text-sm transition-colors" />
                  </div>
                  <div>
                    <input type="text" value={newSubject.section} onChange={(e) => setNewSubject({ ...newSubject, section: e.target.value })} placeholder="SUB-SECTION (OPTIONAL)" className="w-full h-14 px-6 rounded-xl border border-white/10 outline-none bg-black/50 focus:border-cyan-400 text-white placeholder:text-slate-600 font-bold uppercase tracking-wider text-sm transition-colors" />
                  </div>
                  <button type="submit" disabled={isCreating} className="w-full mt-4 py-4 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 flex justify-center items-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
                    {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Compile & Deploy'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {scanResults && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#030509]/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg rounded-[2.5rem] p-1 shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-gradient-to-b from-white/10 to-transparent">
              <div className="bg-[#0A0F1C] p-10 rounded-[2.4rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 text-black mb-6 mx-auto shadow-lg"><CheckCircle size={32} /></div>
                <h3 className="text-3xl font-black text-center mb-2 uppercase tracking-wide">Analysis Complete</h3>
                <p className="text-center mb-8 text-slate-400 font-mono text-xs uppercase tracking-widest">Confidence matched <span className="text-cyan-400 font-black text-sm">{scanResults.present_count}</span> of {scanResults.total_enrolled} signatures.</p>

                <div className="border border-white/5 rounded-2xl p-4 max-h-[200px] overflow-y-auto mb-8 bg-black/50 backdrop-blur-md">
                  {scanResults.results.filter((s: any) => s.status === 'Present').map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 text-sm">
                      <span className="font-bold flex items-center gap-3 text-slate-200"><ScanFace size={14} className="text-cyan-400" /> {s.name}</span>
                      <span className="text-cyan-400 font-black font-mono text-[10px] tracking-widest bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-lg uppercase">Auth Valid</span>
                    </div>
                  ))}
                  {scanResults.present_count === 0 && <p className="text-center text-rose-500 py-6 text-xs uppercase tracking-widest font-bold">No biological signatures detected.</p>}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => { setScanResults(null); setImageQueue([]); }} className="flex-1 border border-white/10 hover:border-rose-500 hover:text-rose-400 hover:bg-rose-500/10 py-4 rounded-xl font-bold transition-colors text-slate-400 text-xs uppercase tracking-widest">Purge Cache</button>
                  <button onClick={confirmAttendance} disabled={isLoading} className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black py-4 rounded-xl font-black transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.4)] text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Commit to Matrix'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {shareModal && shareModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#030509]/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm rounded-[2.5rem] p-1 shadow-[0_0_50px_rgba(34,211,238,0.15)] bg-gradient-to-b from-white/10 to-transparent relative">
              <div className="bg-[#0A0F1C] p-10 rounded-[2.4rem] border border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <button onClick={() => setShareModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-rose-400 bg-white/5 p-2 rounded-full transition-colors z-10"><X size={18} /></button>
                <h3 className="text-xl font-black mb-2 uppercase tracking-widest relative z-10">Access Link</h3>
                <p className="text-xs mb-8 text-slate-400 font-medium relative z-10">Distribute to subjects for neural sync.</p>

                <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl mb-8 flex items-center justify-center border-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] relative z-10">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareModal.link)}`} alt="QR Code" className="rounded-lg" />
                </div>

                <div className="p-5 rounded-2xl border mb-8 bg-black/50 border-white/10 relative z-10">
                  <span className="text-[10px] block mb-2 uppercase tracking-widest text-slate-500 font-bold">Manual Entry Code</span>
                  <span className="text-3xl font-mono font-black tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{shareModal.code}</span>
                </div>

                <button onClick={() => { navigator.clipboard.writeText(shareModal.link); showDialog("System", "Encoded link copied to clipboard.", "success"); }} className="w-full bg-cyan-400 hover:bg-cyan-300 text-black py-4 rounded-xl font-black shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 relative z-10">
                  Copy Protocol Link
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};