import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Clock, Plus, Video, 
  MessageSquare, BarChart2, Calendar, FileText, 
  CheckCircle, AlertTriangle, MoreVertical, X,
  Mic, MicOff, Camera, CameraOff, Monitor, Languages
} from 'lucide-react';
import { Course, Assignment, StudentPerformance } from '../types';
import { generateClassSummary } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLiveSession } from '../context/LiveContext';

// --- MOCK DATA (TEACHER) ---

const TEACHER_STATS = [
  { label: 'Total Students', value: '142', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  { label: 'Active Batches', value: '4', icon: BookOpen, color: 'text-brand-500', bg: 'bg-brand-500/20' },
  { label: 'JLPT Pass Rate', value: '94%', icon: BarChart2, color: 'text-accent-gold', bg: 'bg-accent-gold/20' },
];

const MOCK_TEACHER_COURSES: Course[] = [
  { id: 'c1', title: 'JLPT N4 Comprehensive', instructor: 'Tanaka Sensei', progress: 0, totalDuration: '40h', thumbnail: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=800', studentCount: 45, batchId: 'B-2024' },
  { id: 'c2', title: 'Kanji Mastery N5-N3', instructor: 'Tanaka Sensei', progress: 0, totalDuration: '28h', thumbnail: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=800', studentCount: 38, batchId: 'B-2024' },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', title: 'Kanji Workbook: Chapter 5', courseId: 'c2', courseName: 'Kanji Mastery', dueDate: '2023-10-25', totalSubmissions: 32, totalStudents: 45, status: 'ACTIVE' },
  { id: 'a2', title: 'Recording: Self Introduction (Jiko Shoukai)', courseId: 'c1', courseName: 'JLPT N4', dueDate: '2023-10-20', totalSubmissions: 38, totalStudents: 38, status: 'CLOSED' },
];

const MOCK_PERFORMANCE: StudentPerformance[] = [
  { id: 's1', name: 'John Doe', attendance: 92, avgScore: 88, riskLevel: 'LOW' },
  { id: 's2', name: 'Jane Smith', attendance: 45, avgScore: 52, riskLevel: 'HIGH' },
  { id: 's3', name: 'Bob Johnson', attendance: 78, avgScore: 72, riskLevel: 'MEDIUM' },
  { id: 's4', name: 'Alice Brown', attendance: 30, avgScore: 40, riskLevel: 'HIGH' },
];

// --- COMPONENTS ---

export const TeacherDashboardHome = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sensei Dashboard</h1>
          <p className="text-gray-400">Manage your Japanese language classes and student progress.</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-5 h-5" /> New Course
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEACHER_STATS.map((stat, i) => (
          <div key={i} className="bg-dark-800 p-6 rounded-xl border border-dark-700 flex items-center gap-4">
            <div className={`p-4 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Classes */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" /> Today's Schedule
            </h3>
            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-dark-900 rounded-lg border-l-4 border-brand-500">
                    <div className="text-center w-16">
                        <p className="text-brand-500 font-bold">10:00</p>
                        <p className="text-xs text-gray-500">AM</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">JLPT N4 Grammar</h4>
                        <p className="text-sm text-gray-400">Batch B-2024 • Live Lecture</p>
                        <div className="mt-2 flex gap-2">
                            <button className="text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-500">Start Class</button>
                            <button className="text-xs border border-dark-600 text-gray-400 px-3 py-1 rounded hover:text-white">View Material</button>
                        </div>
                    </div>
                </div>
                
                 <div className="flex items-start gap-4 p-4 bg-dark-900 rounded-lg border-l-4 border-blue-500">
                    <div className="text-center w-16">
                        <p className="text-blue-500 font-bold">02:00</p>
                        <p className="text-xs text-gray-500">PM</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Kanji Practice & Q&A</h4>
                        <p className="text-sm text-gray-400">Batch B-2024 • Interactive</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
             <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Needs Attention
            </h3>
            <div className="space-y-3">
                 {MOCK_PERFORMANCE.filter(s => s.riskLevel === 'HIGH').map(student => (
                     <div key={student.id} className="flex items-center justify-between p-3 bg-red-900/10 rounded-lg border border-red-500/20">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-xs">
                                 {student.name.charAt(0)}
                             </div>
                             <div>
                                 <p className="text-white text-sm font-bold">{student.name}</p>
                                 <p className="text-xs text-red-400">Low Attendance ({student.attendance}%)</p>
                             </div>
                         </div>
                         <button className="text-xs text-gray-400 hover:text-white underline">Contact</button>
                     </div>
                 ))}
                 <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                     <p className="text-sm text-gray-300">Assignment "Kanji Workbook" has 12 ungraded submissions.</p>
                     <button className="text-xs text-brand-500 font-bold">Grade</button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export const TeacherCoursesPage = () => {
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Course Management</h1>
                <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Plus className="w-5 h-5" /> Create Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_TEACHER_COURSES.map(course => (
                    <div key={course.id} className="bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-brand-500/50 transition group shadow-lg">
                        <div className="relative aspect-video">
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm">Edit</button>
                                <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Manage</button>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                            <div className="flex justify-between text-sm text-gray-400 mb-4">
                                <span>{course.studentCount} Students</span>
                                <span>{course.totalDuration} Content</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded text-sm font-medium">Add Lecture</button>
                                <button className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded text-sm font-medium">View Stats</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TeacherAssignmentsPage = () => {
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Assignments</h1>
                <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Plus className="w-5 h-5" /> New Assignment
                </button>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-dark-900 text-gray-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Submissions</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {MOCK_ASSIGNMENTS.map(assign => (
                            <tr key={assign.id} className="hover:bg-dark-700/50 transition">
                                <td className="px-6 py-4 font-medium text-white">{assign.title}</td>
                                <td className="px-6 py-4">{assign.courseName}</td>
                                <td className="px-6 py-4">{assign.dueDate}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-dark-900 rounded-full h-2">
                                            <div style={{ width: `${(assign.totalSubmissions / assign.totalStudents) * 100}%` }} className="bg-brand-500 h-2 rounded-full"></div>
                                        </div>
                                        <span className="text-xs">{assign.totalSubmissions}/{assign.totalStudents}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${assign.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                        {assign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-brand-500 hover:text-white text-xs font-bold mr-3">VIEW</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TeacherReportsPage = () => {
    const data = [
      { name: 'N5 Mock', avg: 72 },
      { name: 'N4 Mock', avg: 68 },
      { name: 'Kanji', avg: 75 },
      { name: 'Vocab', avg: 82 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
             <h1 className="text-3xl font-bold text-white">Class Analytics & Reports</h1>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
                     <h3 className="text-lg font-bold text-white mb-6">Class Average Score Trend</h3>
                     <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="avg" fill="#be123c" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
                     <h3 className="text-lg font-bold text-white mb-4">At-Risk Students</h3>
                     <p className="text-sm text-gray-400 mb-4">Students falling behind on JLPT Prep.</p>
                     <div className="space-y-3">
                         {MOCK_PERFORMANCE.filter(s => s.riskLevel !== 'LOW').map(student => (
                             <div key={student.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-700">
                                 <div>
                                     <p className="text-white font-bold">{student.name}</p>
                                     <p className="text-xs text-gray-500">Avg Score: {student.avgScore}% • Attendance: {student.attendance}%</p>
                                 </div>
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${student.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                     {student.riskLevel} Risk
                                 </span>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        </div>
    );
};

export const LiveClassConsole = () => {
    // USE GLOBAL CONTEXT INSTEAD OF LOCAL STATE
    const { isLive, topic, viewerCount, startSession, endSession, sendMessage, chatMessages } = useLiveSession();
    
    const [transcript, setTranscript] = useState("");
    const [summary, setSummary] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [newMessage, setNewMessage] = useState("");

    // Mock transcript growth
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            const phrases = [
                "Konnichiwa minna-san. ",
                "Today we are learning about the 'Te-form'. ",
                "Please conjugate 'Taberu' to 'Tabete'. ",
                "Pay attention to the intonation. ",
                "Homework is on page 42. "
            ];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            setTranscript(prev => prev + randomPhrase);
        }, 3000);
        return () => clearInterval(interval);
    }, [isLive]);

    const handleEndClass = async () => {
        setIsGenerating(true);
        endSession(); // Updates Context
        try {
            const result = await generateClassSummary(transcript || "We discussed Japanese grammar.");
            setSummary(result);
        } catch (e) {
            setSummary("Failed to generate summary.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if(newMessage.trim()) {
            sendMessage("Tanaka Sensei", newMessage);
            setNewMessage("");
        }
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-dark-800 p-4 rounded-xl border border-dark-700">
                <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-brand-500 animate-pulse' : 'bg-gray-500'}`}></div>
                     <div>
                         <h2 className="text-xl font-bold text-white">{topic}</h2>
                         <p className="text-xs text-gray-400">Batch B-2024 • {isLive ? "BROADCASTING" : "OFFLINE"}</p>
                     </div>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="flex bg-dark-900 rounded-lg p-1">
                         <button onClick={() => setMicOn(!micOn)} className={`p-2 rounded ${micOn ? 'bg-dark-700 text-white' : 'text-red-500'}`}>
                             {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                         </button>
                         <button onClick={() => setCamOn(!camOn)} className={`p-2 rounded ${camOn ? 'bg-dark-700 text-white' : 'text-red-500'}`}>
                             {camOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                         </button>
                         <button className="p-2 rounded hover:bg-dark-700 text-gray-400">
                             <Monitor className="w-5 h-5" />
                         </button>
                     </div>

                    {!isLive ? (
                        <button onClick={() => startSession("JLPT N4 Grammar: The Te-Form")} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-brand-900/50 flex items-center gap-2">
                             <Video className="w-4 h-4" /> Go Live
                        </button>
                    ) : (
                        <button onClick={handleEndClass} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-red-900/50">
                            End Class
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Video Feed Area */}
                <div className="lg:col-span-2 bg-black rounded-xl border border-dark-700 relative overflow-hidden flex items-center justify-center group">
                    {isLive && camOn ? (
                        <div className="relative w-full h-full">
                            <img src="https://images.unsplash.com/photo-1544967082-d9d3f661eb1d?auto=format&fit=crop&q=80&w=1200" alt="Stream" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute top-4 right-4 bg-brand-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                            </div>
                            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
                                {viewerCount} Students
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Video className="w-16 h-16 text-dark-700 mx-auto mb-4" />
                            <p className="text-dark-500">{isLive ? "Camera Off" : "Class is Offline"}</p>
                        </div>
                    )}
                </div>

                {/* Chat & Tools */}
                <div className="bg-dark-800 rounded-xl border border-dark-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-dark-700 font-bold bg-dark-900/50">Class Chat</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">No messages yet.</p>}
                        {chatMessages.map((m, i) => (
                            <div key={i} className="text-sm">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={`font-bold ${m.user === "SYSTEM" ? 'text-accent-gold' : m.user === "Tanaka Sensei" ? 'text-brand-500' : 'text-white'}`}>{m.user}</span>
                                    <span className="text-[10px] text-gray-600">{m.timestamp}</span>
                                </div>
                                <p className={`p-2 rounded-lg rounded-tl-none ${m.user === "SYSTEM" ? 'bg-accent-gold/10 text-accent-gold italic' : 'bg-dark-900 text-gray-300'}`}>{m.text}</p>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-700 bg-dark-900/30">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..." 
                            className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-brand-500 outline-none" 
                        />
                    </form>
                </div>
            </div>

            {/* AI Summary Output */}
            {(isGenerating || summary) && (
                <div className="mt-6 bg-dark-800 p-6 rounded-xl border border-brand-500/30 shadow-lg shadow-brand-900/10">
                    <h3 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> AI Class Summary (Nihongo)
                    </h3>
                    {isGenerating ? (
                        <div className="flex items-center gap-2 text-gray-400 py-8">
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            Processing transcript...
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <div className="bg-dark-900 p-6 rounded-lg border border-dark-700">
                                <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm leading-relaxed">{summary}</pre>
                            </div>
                            <div className="mt-4 flex gap-4">
                                <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded text-sm font-bold">Send to Students</button>
                                <button className="border border-dark-600 hover:bg-dark-700 text-gray-300 px-4 py-2 rounded text-sm">Download PDF</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};