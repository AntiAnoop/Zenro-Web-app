import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart2, ShieldAlert, Layout, LogOut, Play, User as UserIcon, Settings, MessageSquare, Video, CreditCard, Layers, Book, ListTodo, FileText, Globe, DollarSign, Users } from 'lucide-react';
import { User, UserRole } from './types';
import { ExamPortal } from './components/ExamPortal';
import { StudentDashboardHome, StudentFeesPage, StudentProfilePage, StudentCoursesPage, StudentTestsPage, StudentActivityPage, StudentLiveRoom } from './components/StudentViews';
import { TeacherDashboardHome, TeacherCoursesPage, TeacherAssignmentsPage, TeacherReportsPage, LiveClassConsole } from './components/TeacherViews';
import { AdminDashboard, AdminUserManagement, AdminFinancials } from './components/AdminViews';
import { LiveProvider } from './context/LiveContext';

// --- MOCK DATA ---
const CREDENTIALS: Record<string, {pass: string, role: UserRole, name: string, id: string}> = {
  '9999999999': { pass: '9999999999', role: UserRole.STUDENT, name: 'Alex Student', id: 's1' },
  '8888888888': { pass: '8888888888', role: UserRole.TEACHER, name: 'Tanaka Sensei', id: 't1' },
  '7777777777': { pass: '7777777777', role: UserRole.ADMIN, name: 'Admin', id: 'a1' }
};

// --- COMPONENTS ---

const ZenroLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="indiaFlag" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0.2" stopColor="#FF9933" />
        <stop offset="0.5" stopColor="#FFFFFF" />
        <stop offset="0.8" stopColor="#138808" />
      </linearGradient>
    </defs>
    {/* Left Arc - Japan (White background with Red Sun) */}
    <path d="M46 10 A40 40 0 0 0 46 90" stroke="#F5F5F5" strokeWidth="20" />
    <circle cx="26" cy="50" r="7" fill="#BC002D" />
    
    {/* Right Arc - India (Tricolor Gradient) */}
    <path d="M54 10 A40 40 0 0 1 54 90" stroke="url(#indiaFlag)" strokeWidth="20" />
  </svg>
);

// 1. Login Screen with Japanese Theme
const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      if (val.length <= 10) {
        setIdentifier(val);
      }
    } else {
      setIdentifier(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = CREDENTIALS[identifier];
    
    if (account && account.pass === password) {
      onLogin({
        id: account.id,
        name: account.name,
        role: account.role,
        email: `${identifier}@zenro.jp`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=BC002D&color=fff`
      });
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/seigaiha.png')]">
      <div className="w-full max-w-md bg-dark-800 p-8 rounded-2xl border border-dark-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-dark-900/50 rounded-full flex items-center justify-center border-4 border-dark-700 shadow-xl p-2">
             <ZenroLogo className="w-full h-full" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white text-center mb-2 font-sans">ZENRO</h2>
        <p className="text-center text-gray-400 mb-8 tracking-widest text-xs uppercase">Japanese Language Institute</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Student ID / Number</label>
            <input 
              type="text" 
              value={identifier}
              onChange={handleIdentifierChange}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-gray-600 transition"
              placeholder="Enter ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input 
              type="password"
              value={password}
              maxLength={20}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-gray-600 transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded">{error}</div>}

          <button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-brand-600/20"
          >
            Sign In (ログイン)
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-gray-600">
            <p>Demo Accounts:</p>
            <p>Student: 9999999999</p>
            <p>Sensei: 8888888888</p>
            <p>Admin: 7777777777</p>
        </div>
      </div>
    </div>
  );
};

// 2. Sidebar
const Sidebar = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "bg-brand-900/40 text-brand-500 border-r-4 border-brand-500" : "text-gray-400 hover:text-white hover:bg-dark-800";

  return (
    <div className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col h-screen fixed left-0 top-0 z-10 font-sans">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0">
            <ZenroLogo className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">ZENRO</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-gray-600 uppercase mb-2 tracking-widest">Navigation</p>
        
        {user.role === UserRole.STUDENT && (
          <>
            <Link to="/student/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/dashboard')}`}>
              <Layout className="w-5 h-5" />
              Overview
            </Link>
            <Link to="/student/courses" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/courses')}`}>
              <Book className="w-5 h-5" />
              Curriculum
            </Link>
             <Link to="/student/tests" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/tests')}`}>
             <FileText className="w-5 h-5" />
             JLPT Results
           </Link>
            <Link to="/student/activities" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/activities')}`}>
              <ListTodo className="w-5 h-5" />
              Practice
            </Link>
             <Link to="/student/fees" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/fees')}`}>
              <CreditCard className="w-5 h-5" />
              Tuition
            </Link>
             <Link to="/student/profile" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/student/profile')}`}>
              <UserIcon className="w-5 h-5" />
              Profile
            </Link>
          </>
        )}

        {user.role === UserRole.TEACHER && (
           <>
             <Link to="/teacher/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/teacher/dashboard')}`}>
               <Layout className="w-5 h-5" />
               Overview
             </Link>
             <Link to="/teacher/courses" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/teacher/courses')}`}>
               <Book className="w-5 h-5" />
               Classes
             </Link>
             <Link to="/teacher/assignments" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/teacher/assignments')}`}>
               <FileText className="w-5 h-5" />
               Assignments
             </Link>
             <Link to="/teacher/reports" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/teacher/reports')}`}>
               <BarChart2 className="w-5 h-5" />
               Analytics
             </Link>
             <Link to="/teacher/live" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/teacher/live')}`}>
               <Video className="w-5 h-5" />
               Live Console
             </Link>
           </>
        )}

        {user.role === UserRole.ADMIN && (
          <>
             <Link to="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/admin/dashboard')}`}>
               <Layout className="w-5 h-5" />
               Overview
             </Link>
             <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/admin/users')}`}>
               <Users className="w-5 h-5" />
               User Mgmt
             </Link>
             <Link to="/admin/courses" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/admin/courses')}`}>
               <BookOpen className="w-5 h-5" />
               Course Mgmt
             </Link>
             <Link to="/admin/finance" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/admin/finance')}`}>
               <DollarSign className="w-5 h-5" />
               Financials
             </Link>
             <Link to="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/admin/settings')}`}>
               <Settings className="w-5 h-5" />
               Settings
             </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-dark-800">
        <div className="flex items-center gap-3 px-4 py-3">
            <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full bg-gray-700 border border-dark-600" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role === UserRole.TEACHER ? 'Sensei' : user.role === UserRole.ADMIN ? 'Administrator' : 'Student'}</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-dark-800 rounded-full transition text-gray-500 hover:text-white" title="Logout">
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);

  // If not logged in, show Login Screen
  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // If in Exam Mode, hijack screen
  if (isExamMode) {
    return <ExamPortal onExit={() => setIsExamMode(false)} />;
  }

  return (
    <LiveProvider>
      <Router>
        <div className="flex h-screen bg-dark-900 text-white font-sans selection:bg-brand-500 selection:text-white">
          <Sidebar user={user} onLogout={() => setUser(null)} />
          <main className="ml-64 flex-1 overflow-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <Routes>
              <Route path="/" element={
                 user.role === UserRole.STUDENT ? <Navigate to="/student/dashboard" /> : 
                 user.role === UserRole.TEACHER ? <Navigate to="/teacher/dashboard" /> : <Navigate to="/admin/dashboard" />
              } />
              
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboardHome />} />
              <Route path="/student/courses" element={<StudentCoursesPage />} />
              <Route path="/student/live" element={<StudentLiveRoom user={user} />} />
              <Route path="/student/tests" element={<StudentTestsPage />} />
              <Route path="/student/activities" element={<StudentActivityPage />} />
              <Route path="/student/fees" element={<StudentFeesPage />} />
              <Route path="/student/profile" element={<StudentProfilePage user={user} />} />
              
              <Route path="/exam-intro" element={
                 <div className="p-8 flex justify-center items-center h-full">
                     <div className="bg-dark-800 p-8 rounded-xl max-w-md text-center border border-dark-700">
                         <ShieldAlert className="w-16 h-16 text-brand-500 mx-auto mb-4" />
                         <h1 className="text-2xl font-bold mb-2">JLPT Mock Exam</h1>
                         <p className="text-gray-400 mb-6">Duration: 60 mins • N4 Level</p>
                         <button onClick={() => setIsExamMode(true)} className="w-full bg-brand-600 py-3 rounded text-white font-bold hover:bg-brand-500">
                             Start Examination
                         </button>
                     </div>
                 </div>
              } />
              
              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<TeacherDashboardHome />} />
              <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
              <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
              <Route path="/teacher/reports" element={<TeacherReportsPage />} />
              <Route path="/teacher/live" element={<LiveClassConsole />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUserManagement />} />
              <Route path="/admin/finance" element={<AdminFinancials />} />
              <Route path="/admin/courses" element={<TeacherCoursesPage />} />
              <Route path="/admin/settings" element={<div className="text-center p-12 text-gray-500">Settings Module Loading...</div>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LiveProvider>
  );
}