import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Clock, Calendar, AlertCircle, CheckCircle, 
  CreditCard, Download, User as UserIcon, MapPin, 
  Phone, Mail, Shield, BookOpen, ChevronRight, Lock,
  Video, BarChart2, ListTodo, FileText, Activity, Briefcase,
  Languages, GraduationCap, Globe, Zap, MessageCircle, Send, Users, Mic, MicOff, Hand
} from 'lucide-react';
import { User, Course, FeeRecord, Transaction, TestResult, ActivityItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useLiveSession } from '../context/LiveContext';

// --- MOCK DATA (JAPANESE CONTEXT) ---

const MOCK_FEES: FeeRecord[] = [
  // Phase 1: Total 50,000 (Before Placement) - Training in India
  { id: 'p1_m1', title: 'Month 1: N5 Basics', amount: 5000, dueDate: '2023-08-01', status: 'PAID', category: 'TUITION', phase: 1 },
  { id: 'p1_m2', title: 'Month 2: N5/N4 Grammar', amount: 9000, dueDate: '2023-09-01', status: 'PAID', category: 'TUITION', phase: 1 },
  { id: 'p1_m3', title: 'Month 3: N4 Conversation', amount: 9000, dueDate: '2023-10-01', status: 'OVERDUE', category: 'TUITION', phase: 1 },
  { id: 'p1_m4', title: 'Month 4: N3 Advanced', amount: 9000, dueDate: '2023-11-01', status: 'PENDING', category: 'TUITION', phase: 1 },
  { id: 'p1_m5', title: 'Month 5: Interview Prep', amount: 9000, dueDate: '2023-12-01', status: 'PENDING', category: 'TUITION', phase: 1 },
  { id: 'p1_m6', title: 'Month 6: Cultural Training', amount: 9000, dueDate: '2024-01-01', status: 'PENDING', category: 'TUITION', phase: 1 },
  
  // Phase 2: Total 1,50,000 (After Placement) - Success Fee
  { id: 'p2_i1', title: 'Employment Confirmation Fee', amount: 75000, dueDate: 'TBD', status: 'PENDING', category: 'PLACEMENT', phase: 2 },
  { id: 'p2_i2', title: 'COE & Visa Issuance Fee', amount: 75000, dueDate: 'TBD', status: 'PENDING', category: 'PLACEMENT', phase: 2 },
];

const MOCK_COURSES: Course[] = [
  { id: 'c1', title: 'JLPT N4 Comprehensive: Grammar & Vocab', progress: 75, totalDuration: '40h 30m', thumbnail: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=800', lastWatchedTimestamp: 1205, instructor: 'Tanaka Sensei', isLive: true },
  { id: 'c2', title: 'Kanji Mastery: The First 500', progress: 30, totalDuration: '15h 00m', thumbnail: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=800', lastWatchedTimestamp: 0, instructor: 'Sato Sensei' },
  { id: 'c3', title: 'Business Japanese (Keigo)', progress: 0, totalDuration: '12h 00m', thumbnail: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&q=80&w=800', isLocked: true, instructor: 'Yamamoto Sensei' },
  { id: 'c4', title: 'Japanese IT Vocabulary', progress: 10, totalDuration: '8h 00m', thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800', instructor: 'Suzuki Sensei' }
];

const MOCK_TESTS: TestResult[] = [
  { id: 't1', title: 'JLPT N4 Mock Exam', subject: 'Japanese', date: '2023-10-15', score: 145, totalScore: 180, classAverage: 120, topperScore: 175 },
  { id: 't2', title: 'Kanji Weekly Quiz (Ch 5-10)', subject: 'Kanji', date: '2023-09-20', score: 92, totalScore: 100, classAverage: 65, topperScore: 100 },
  { id: 't3', title: 'Listening Practice Vol. 2', subject: 'Listening', date: '2023-11-05', score: 45, totalScore: 60, classAverage: 40, topperScore: 58 },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 'a1', title: 'Write Essay: "My Dream in Japan"', type: 'ASSIGNMENT', dueDate: 'Today, 11:59 PM', status: 'PENDING', courseName: 'Writing N4' },
  { id: 'a2', title: 'Watch "Life in Tokyo" Documentary', type: 'QUIZ', dueDate: 'Tomorrow', status: 'PENDING', courseName: 'Culture' },
  { id: 'a3', title: 'Hiragana/Katakana Speed Test', type: 'PROJECT', dueDate: '2023-10-25', status: 'COMPLETED', courseName: 'Basics' },
];

const ATTENDANCE_DATA = [
  { day: 'Mon', present: true },
  { day: 'Tue', present: true },
  { day: 'Wed', present: false },
  { day: 'Thu', present: true },
  { day: 'Fri', present: true },
];

// --- SUB-COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-brand-500/20 text-brand-500 border-brand-500/30',
    SUCCESS: 'bg-brand-500/20 text-brand-500 border-brand-500/30',
    PENDING: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30',
    OVERDUE: 'bg-red-500/20 text-red-500 border-red-500/30',
    FAILED: 'bg-red-500/20 text-red-500 border-red-500/30',
    COMPLETED: 'bg-brand-500/20 text-brand-500 border-brand-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-500/20 text-gray-500'}`}>
      {status}
    </span>
  );
};

// --- PAGES ---

export const StudentDashboardHome = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header & Overview Stats with Japanese Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-900 to-dark-800 rounded-2xl p-8 border border-brand-500/30 relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2 font-sans">Konnichiwa, Alex-san! <span className="text-xl font-normal ml-2"> (こんにちは)</span></h2>
            <p className="text-brand-100 mb-6">Your JLPT N4 exam is in <span className="font-bold text-white">45 days</span>. Keep pushing! 頑張ってください!</p>
            <div className="flex gap-3">
              <button className="bg-white text-brand-900 font-bold px-6 py-2 rounded-lg hover:bg-brand-50 transition shadow-lg">
                Continue Learning
              </button>
            </div>
          </div>
          {/* Decorative Torii Gate or similar abstract shape */}
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
             <Globe className="w-64 h-64 text-white" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Attendance</p>
              <h3 className="text-4xl font-bold text-white mt-2">88%</h3>
              <p className="text-xs text-gray-500 mt-1">Shusseki (出席)</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="flex gap-1 mt-4">
             {ATTENDANCE_DATA.map((d, i) => (
               <div key={i} className={`h-2 flex-1 rounded-full ${d.present ? 'bg-brand-500' : 'bg-dark-600'}`} title={d.day}></div>
             ))}
          </div>
        </div>

        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Next Payment</p>
              <h3 className="text-4xl font-bold text-accent-gold mt-2">¥9,000</h3> 
              <p className="text-xs text-gray-500 mt-1">Due: Oct 01</p>
            </div>
            <div className="p-3 bg-accent-gold/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-accent-gold" />
            </div>
          </div>
          <button className="text-xs text-accent-gold hover:text-white mt-2 underline text-left">View Details</button>
        </div>
      </div>

      {/* 2. Hero Section - Styled like a Japanese Scroll/Poster */}
      <div className="relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 group shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528360983277-13d9012356ee?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center opacity-40 group-hover:opacity-30 transition"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent"></div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-900/50">
                <Play className="w-3 h-3 fill-current" /> Continue JLPT N4
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white leading-tight font-sans">Grammar: The Causative Form</h1>
                <h2 className="text-2xl text-gray-300 font-light mt-1">使役形 (Shieki-kei)</h2>
              </div>
              <p className="text-gray-300">Resume from 12:05 • Lesson 4 of 12 • Tanaka Sensei</p>
              <div className="w-full max-w-md bg-white/10 rounded-full h-1.5 backdrop-blur">
                  <div style={{width: '45%'}} className="bg-brand-500 h-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)]"></div>
              </div>
           </div>
           
           <button className="bg-white hover:bg-gray-100 text-brand-900 px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition shadow-xl">
              <Play className="w-5 h-5 fill-current" /> Resume Lesson
           </button>
        </div>
      </div>

      {/* 3. Daily Kanji & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kanji of the Day */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-9xl text-dark-700/50 font-serif select-none pointer-events-none">夢</div>
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Kanji of the Day</h3>
              <div className="text-6xl font-bold text-white mb-2 font-serif">夢</div>
              <p className="text-2xl text-brand-500 mb-1">Yume</p>
              <p className="text-gray-400">Dream</p>
              <div className="mt-4 text-sm text-gray-500 bg-dark-900 p-3 rounded w-full">
                  Ex: 将来の夢 (Future dream)
              </div>
          </div>

          {/* Activities List */}
          <div className="md:col-span-2 bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-brand-500" /> Pending Tasks
                </h3>
            </div>
            <div className="space-y-3">
                {MOCK_ACTIVITIES.filter(a => a.status === 'PENDING').slice(0, 3).map(act => (
                    <div key={act.id} className="flex items-center justify-between p-4 bg-dark-900 rounded-lg border-l-4 border-brand-500">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${act.type === 'ASSIGNMENT' ? 'bg-brand-500/20 text-brand-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {act.type === 'ASSIGNMENT' ? <FileText className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-white font-medium">{act.title}</p>
                                <p className="text-xs text-gray-500">{act.courseName} • Due {act.dueDate}</p>
                            </div>
                        </div>
                        <button className="text-xs bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded border border-dark-600 transition">Start</button>
                    </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const { isLive, topic } = useLiveSession();
  const liveCourse = MOCK_COURSES.find(c => c.isLive); // Ideally match by ID from context, but mocking for now

  return (
    <div className="space-y-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand-500" /> My Curriculum
        </h1>

        {/* Live Class Hero */}
        {liveCourse && (
            <div className="bg-gradient-to-r from-brand-900/60 to-dark-800 rounded-2xl border border-brand-500/30 p-1">
                <div className="bg-dark-900/80 backdrop-blur-sm rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-full md:w-64 aspect-video bg-black rounded-lg overflow-hidden border border-brand-500/50 shadow-[0_0_30px_rgba(188,0,45,0.3)]">
                        <img src={liveCourse.thumbnail} alt="Live" className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg ${isLive ? 'bg-brand-600 text-white animate-pulse' : 'bg-gray-600 text-gray-200'}`}>
                                <span className={`w-2 h-2 bg-white rounded-full ${isLive ? 'animate-pulse' : ''}`}></span> {isLive ? 'LIVE NOW' : 'WAITING ROOM'}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-1">{topic}</h2>
                        <p className="text-brand-200 mb-4 font-medium">Instructor: {liveCourse.instructor}</p>
                        <button 
                            onClick={() => navigate('/student/live')}
                            className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto md:mx-0 transition shadow-lg shadow-brand-900/40"
                        >
                            <Video className="w-5 h-5" /> Join Classroom
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_COURSES.map(course => (
            <div key={course.id} className={`bg-dark-800 rounded-xl overflow-hidden border ${course.isLive ? 'border-brand-500/60 ring-1 ring-brand-500/20' : 'border-dark-700'} hover:border-brand-500/50 transition group shadow-lg`}>
              <div className="relative aspect-video overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                {course.isLocked && (
                    <div className="absolute inset-0 bg-dark-900/80 flex flex-col items-center justify-center backdrop-blur-[2px]">
                        <Lock className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Locked</span>
                    </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-mono backdrop-blur-md border border-white/10">
                  {course.totalDuration}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white truncate flex-1 text-lg" title={course.title}>{course.title}</h4>
                </div>
                <p className="text-sm text-gray-400 mb-4">Sensei: {course.instructor}</p>
                {!course.isLocked ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Progression</span>
                            <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-dark-900 rounded-full h-1.5 border border-dark-700">
                            <div style={{width: `${course.progress}%`}} className="bg-brand-500 h-1.5 rounded-full"></div>
                        </div>
                    </div>
                ) : (
                    <button className="w-full py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 text-sm rounded transition border border-dark-600">
                        Unlock Course
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export const StudentLiveRoom = ({ user }: { user: User }) => {
    const { isLive, topic, viewerCount, sendMessage, chatMessages, remoteStream, joinSession } = useLiveSession();
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Auto-join when becoming live if not already joined
    useEffect(() => {
        if (isLive && !remoteStream) {
            joinSession();
        }
    }, [isLive, joinSession, remoteStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if(message.trim()) {
            sendMessage(user.name, message);
            setMessage("");
        }
    }

    if (!isLive) {
        // Waiting Room UI
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544967082-d9d3f661eb1d?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center blur-md opacity-20"></div>
                <div className="relative z-10 bg-dark-800/80 backdrop-blur-xl p-12 rounded-2xl border border-dark-600 shadow-2xl text-center max-w-xl w-full">
                    <div className="inline-block p-4 rounded-full bg-dark-900 border border-dark-700 mb-6 relative">
                         <div className="absolute top-0 right-0 w-3 h-3 bg-brand-500 rounded-full animate-ping"></div>
                         <Video className="w-12 h-12 text-brand-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{topic}</h2>
                    <p className="text-brand-200 mb-8 font-medium">Waiting for host to start the class...</p>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
                        <Users className="w-4 h-4" /> 
                        <span>{viewerCount} Students Waiting</span>
                    </div>

                    <div className="flex justify-center gap-2">
                         <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                         <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                         <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></span>
                    </div>
                    
                    <button onClick={() => navigate('/student/courses')} className="mt-8 text-gray-500 hover:text-white text-sm underline">
                        Leave Waiting Room
                    </button>
                </div>
            </div>
        );
    }

    // Live UI
    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 animate-fade-in relative">
             <div className="flex-1 flex flex-col space-y-4">
                 <div className="relative flex-1 bg-black rounded-xl border border-dark-700 overflow-hidden shadow-2xl group">
                      {remoteStream ? (
                          <video 
                             ref={remoteVideoRef} 
                             autoPlay 
                             playsInline 
                             // FULL-SCREEN FOR STUDENTS: Changed from object-cover to fixed inset-0 z-10
                             className="w-full h-full object-cover fixed inset-0 z-10 bg-black" 
                          />
                      ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                             <div className="text-center">
                                 <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                 <p>Connecting to Stream...</p>
                             </div>
                          </div>
                      )}
                      
                      {/* Controls Overlay - Positioned above video (z-20) */}
                      <div className="absolute top-4 left-4 flex gap-2 z-20">
                           <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2 shadow-lg">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                           </div>
                           <div className="bg-black/60 backdrop-blur text-white px-3 py-1 rounded text-xs flex items-center gap-2">
                                <Users className="w-3 h-3" /> {viewerCount}
                           </div>
                      </div>
                      
                      {/* Info Overlay (z-20) */}
                      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                           <div className="flex items-center justify-between">
                                <div className="text-white">
                                     <h3 className="font-bold text-2xl mb-1">{topic}</h3>
                                     <p className="text-sm text-gray-300">Tanaka Sensei</p>
                                </div>
                                <div className="flex gap-4">
                                     <button className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-sm transition"><MicOff className="w-6 h-6" /></button>
                                     <button className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-sm transition"><Hand className="w-6 h-6" /></button>
                                </div>
                           </div>
                      </div>
                 </div>
                 
                 {/* This bottom bar will be hidden under video if video is full screen fixed, 
                     but we keep it for structure or if user exits full screen (future implementation) */}
                 <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 flex justify-between items-center relative z-0 hidden">
                     <div className="flex gap-4">
                         <button className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 bg-dark-900 px-4 py-2 rounded-lg"><Download className="w-4 h-4" /> Materials</button>
                         <button className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 bg-dark-900 px-4 py-2 rounded-lg"><AlertCircle className="w-4 h-4" /> Report Issue</button>
                     </div>
                     <button onClick={() => navigate('/student/courses')} className="bg-red-900/20 text-red-500 hover:bg-red-900/40 px-6 py-2 rounded-lg font-bold text-sm transition border border-red-500/20">
                         Leave Class
                     </button>
                 </div>
             </div>

             {/* Chat Sidebar - Floats on top (z-30) */}
             <div className="w-96 bg-dark-900/90 backdrop-blur-md border-l border-white/10 flex flex-col overflow-hidden shadow-2xl fixed right-0 top-0 bottom-0 z-30 transform translate-x-full group-hover:translate-x-0 transition duration-300">
                 <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center pt-20">
                     <h3 className="font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Live Chat</h3>
                     <span className="text-xs text-gray-400">Slow Mode On</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {chatMessages.map((m, i) => (
                         <div key={i} className="animate-fade-in-up">
                             <div className="flex items-baseline justify-between mb-1">
                                 <span className={`text-xs font-bold ${m.user === "Tanaka Sensei" ? 'text-brand-500' : m.user === user.name ? 'text-blue-400' : m.user === "SYSTEM" ? 'text-accent-gold' : 'text-gray-300'}`}>
                                     {m.user}
                                 </span>
                                 <span className="text-[10px] text-gray-500">{m.timestamp}</span>
                             </div>
                             <p className={`text-sm rounded-lg p-2 ${m.user === "SYSTEM" ? 'bg-accent-gold/10 text-accent-gold text-xs italic' : 'bg-white/5 text-gray-200'}`}>
                                 {m.text}
                             </p>
                         </div>
                     ))}
                 </div>

                 <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/10">
                     <div className="relative">
                         <input 
                            type="text" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask a question..." 
                            className="w-full bg-white/5 border border-white/10 text-white pl-4 pr-10 py-3 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none placeholder-gray-500 text-sm"
                         />
                         <button type="submit" className="absolute right-2 top-2 p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition">
                             <Send className="w-4 h-4" />
                         </button>
                     </div>
                 </form>
             </div>
             
             {/* Floating Leave Button (z-40) */}
             <button 
                onClick={() => navigate('/student/courses')} 
                className="fixed top-4 right-4 z-40 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm backdrop-blur shadow-lg"
             >
                 Exit Class
             </button>
        </div>
    );
};

export const StudentFeesPage = () => {
  const totalDue = MOCK_FEES.reduce((acc, fee) => acc + fee.amount, 0);
  const totalPaid = MOCK_FEES.filter(f => f.status === 'PAID').reduce((acc, fee) => acc + fee.amount, 0);
  const pendingAmount = totalDue - totalPaid;

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-accent-gold" /> Tuition & Fees
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
           <p className="text-gray-400 text-sm font-semibold uppercase">Total Tuition (Phase 1+2)</p>
           <h3 className="text-3xl font-bold text-white mt-2">¥{totalDue.toLocaleString()}</h3>
        </div>
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
           <p className="text-gray-400 text-sm font-semibold uppercase">Paid Amount</p>
           <h3 className="text-3xl font-bold text-brand-500 mt-2">¥{totalPaid.toLocaleString()}</h3>
        </div>
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
           <p className="text-gray-400 text-sm font-semibold uppercase">Pending Due</p>
           <h3 className="text-3xl font-bold text-red-500 mt-2">¥{pendingAmount.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-6 border-b border-dark-700">
          <h3 className="font-bold text-white">Fee Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-dark-900 text-gray-200 uppercase font-bold text-xs">
                    <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                    {MOCK_FEES.map((fee) => (
                        <tr key={fee.id} className="hover:bg-dark-700/50 transition">
                            <td className="px-6 py-4 font-medium text-white">{fee.title}</td>
                            <td className="px-6 py-4">
                                <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600 text-xs">Phase {fee.phase}</span>
                            </td>
                            <td className="px-6 py-4">{fee.dueDate}</td>
                            <td className="px-6 py-4 font-mono text-white">¥{fee.amount.toLocaleString()}</td>
                            <td className="px-6 py-4"><StatusBadge status={fee.status} /></td>
                            <td className="px-6 py-4 text-right">
                                {fee.status !== 'PAID' && (
                                    <button className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded transition">
                                        Pay Now
                                    </button>
                                )}
                                {fee.status === 'PAID' && (
                                    <button className="text-gray-500 hover:text-white text-xs flex items-center gap-1 ml-auto">
                                        <Download className="w-3 h-3" /> Receipt
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export const StudentTestsPage = () => {
    return (
        <div className="space-y-8 animate-fade-in">
             <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-brand-500" /> JLPT Mock Results
             </h1>

             <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                 <h3 className="text-xl font-bold text-white mb-6">Performance Trend</h3>
                 <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={MOCK_TESTS}>
                             <XAxis dataKey="title" stroke="#94a3b8" hide />
                             <YAxis stroke="#94a3b8" />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                             />
                             <Legend />
                             <Bar dataKey="score" name="My Score" fill="#bc002d" radius={[4, 4, 0, 0]} barSize={40} />
                             <Bar dataKey="classAverage" name="Class Avg" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
                         </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                 {MOCK_TESTS.map(test => (
                     <div key={test.id} className="bg-dark-800 p-6 rounded-xl border border-dark-700 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                             <div className="p-4 bg-dark-900 rounded-lg text-center min-w-[80px]">
                                 <h4 className="text-2xl font-bold text-white">{Math.round((test.score / test.totalScore) * 100)}%</h4>
                                 <p className="text-xs text-gray-500">Score</p>
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-white">{test.title}</h4>
                                 <p className="text-sm text-gray-400">{test.subject} • {test.date}</p>
                             </div>
                         </div>
                         <div className="flex gap-8 text-sm text-gray-400">
                             <div>
                                 <p className="uppercase text-xs font-bold mb-1">Class Avg</p>
                                 <p className="text-white">{test.classAverage}/{test.totalScore}</p>
                             </div>
                             <div>
                                 <p className="uppercase text-xs font-bold mb-1">Topper</p>
                                 <p className="text-brand-500">{test.topperScore}/{test.totalScore}</p>
                             </div>
                             <button className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg self-center">
                                 Analysis
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

export const StudentActivityPage = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ListTodo className="w-8 h-8 text-blue-500" /> Activities & Assignments
            </h1>

            <div className="grid grid-cols-1 gap-4">
                {MOCK_ACTIVITIES.map(activity => (
                    <div key={activity.id} className={`bg-dark-800 p-6 rounded-xl border ${activity.status === 'PENDING' ? 'border-brand-500/50' : 'border-dark-700'} flex justify-between items-center`}>
                        <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${activity.type === 'ASSIGNMENT' ? 'bg-blue-500/20 text-blue-500' : activity.type === 'QUIZ' ? 'bg-purple-500/20 text-purple-500' : 'bg-green-500/20 text-green-500'}`}>
                                 {activity.type === 'ASSIGNMENT' ? <FileText className="w-6 h-6" /> : activity.type === 'QUIZ' ? <AlertCircle className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-white">{activity.title}</h4>
                                 <p className="text-sm text-gray-400">{activity.courseName} • Due: {activity.dueDate}</p>
                             </div>
                        </div>
                        <div>
                             {activity.status === 'PENDING' ? (
                                 <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-brand-900/30">
                                     Start Now
                                 </button>
                             ) : (
                                 <div className="flex items-center gap-2 text-green-500 font-bold px-4">
                                     <CheckCircle className="w-5 h-5" /> Completed
                                 </div>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const StudentProfilePage = ({ user }: { user: User }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <UserIcon className="w-8 h-8 text-gray-400" /> My Profile
            </h1>

            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-brand-900 to-dark-900"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-full border-4 border-dark-800 bg-dark-900" />
                        <button className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg text-sm font-bold border border-dark-600">
                            Edit Profile
                        </button>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                    <p className="text-gray-400">{user.email}</p>
                    <div className="flex gap-3 mt-4">
                        <span className="bg-brand-500/20 text-brand-500 px-3 py-1 rounded text-xs font-bold uppercase border border-brand-500/30">
                            {user.role}
                        </span>
                        <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase border border-blue-500/30">
                            Batch 2024-A
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-dark-700 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Full Name</p>
                            <p className="text-white font-medium">{user.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Date of Birth</p>
                            <p className="text-white font-medium">1999-05-15</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="text-white font-medium">+91 98765 43210</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Gender</p>
                            <p className="text-white font-medium">Male</p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-gray-500">Address</p>
                             <p className="text-white font-medium">123, Tech Park Road, Bangalore, India</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-dark-700 pb-2">Academic & Guardian</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                             <p className="text-gray-500">Guardian Name</p>
                             <p className="text-white font-medium">Mr. Parent</p>
                        </div>
                        <div>
                             <p className="text-gray-500">Relationship</p>
                             <p className="text-white font-medium">Father</p>
                        </div>
                        <div>
                             <p className="text-gray-500">Emergency Contact</p>
                             <p className="text-white font-medium">+91 98765 00000</p>
                        </div>
                         <div>
                             <p className="text-gray-500">Previous Education</p>
                             <p className="text-white font-medium">B.Tech (CS)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
