import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Eye, Lock, Maximize, XCircle, CheckCircle } from 'lucide-react';
import { analyzeProctoringImage } from '../services/geminiService';

interface ExamPortalProps {
  onExit: () => void;
}

export const ExamPortal: React.FC<ExamPortalProps> = ({ onExit }) => {
  const [warnings, setWarnings] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [violationLog, setViolationLog] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [examStatus, setExamStatus] = useState<'IDLE' | 'ACTIVE' | 'TERMINATED' | 'SUBMITTED'>('IDLE');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const MAX_WARNINGS = 3;

  // 1. Fullscreen Enforcement
  const enterFullScreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        setIsFullScreen(true);
        setExamStatus('ACTIVE');
        startCamera();
      }
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
    }
  };

  // 2. Camera Setup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera permission denied:", err);
      logViolation("Camera access denied or failed.");
    }
  };

  // 3. Violation Logging
  const logViolation = useCallback((reason: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] VIOLATION: ${reason}`;
    setViolationLog(prev => [message, ...prev]);
    
    setWarnings(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_WARNINGS) {
        setExamStatus('TERMINATED');
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
      return newCount;
    });

    // Play warning sound
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => {});
  }, []);

  // 4. Visibility Change Listener (Tab switching)
  useEffect(() => {
    if (examStatus !== 'ACTIVE') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("User switched tabs or minimized window.");
      }
    };

    const handleBlur = () => {
      // Sometimes triggered by simple interactions, be careful. 
      // Strictly relying on visibilityChange is safer for "tab switching", 
      // but blur captures "clicking outside" the window on multi-monitors.
      logViolation("Window lost focus.");
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        logViolation("Exited Fullscreen Mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [examStatus, logViolation]);

  // 5. Mock Proctoring (Interval Check)
  useEffect(() => {
    if (examStatus !== 'ACTIVE' || !cameraActive) return;
    
    // Check every 10 seconds just for simulation
    const interval = setInterval(async () => {
        if (!videoRef.current) return;
        
        // Capture frame
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];

        // Simulate random "looking away" if no API key, or actual check
        // For production, this would be throttled heavily.
        if (Math.random() > 0.9) { 
            // 10% chance to check randomly in simulation if we don't spam the API
             // In a real app, we'd use the TensorFlow.js local model here.
             // We will simulate a warning for demonstration purposes.
             // logViolation("AI detected suspicious eye movement.");
        }

        // Real API call (commented out to avoid spamming quota in demo, but implementation is ready)
        // const result = await analyzeProctoringImage(base64);
        // if (result.suspicious) logViolation(result.reason);

    }, 10000);

    return () => clearInterval(interval);
  }, [examStatus, cameraActive, logViolation]);

  // 6. Timer
  useEffect(() => {
    if (examStatus !== 'ACTIVE') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setExamStatus('SUBMITTED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStatus]);


  // RENDER HELPERS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (examStatus === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8">
        <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 shadow-2xl max-w-lg">
          <Lock className="w-16 h-16 text-brand-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Secure Exam Environment</h2>
          <p className="text-gray-400 mb-6">
            This exam requires Fullscreen mode and Camera access. 
            Moving away from the screen, switching tabs, or exiting fullscreen will result in a violation. 
            <br/><span className="text-red-400 font-bold">3 Violations = Automatic Fail.</span>
          </p>
          <button 
            onClick={enterFullScreen}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Maximize className="w-5 h-5" />
            Start Exam & Enable Proctoring
          </button>
          <button onClick={onExit} className="mt-4 text-gray-500 hover:text-white underline">Cancel</button>
        </div>
      </div>
    );
  }

  if (examStatus === 'TERMINATED') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900/20 text-center p-8">
        <div className="bg-dark-800 p-8 rounded-2xl border border-red-500 shadow-2xl max-w-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-red-500">Exam Terminated</h2>
          <p className="text-gray-300 mb-6">
            You exceeded the maximum number of warnings. Your session has been flagged for review by the administrator.
          </p>
          <button onClick={onExit} className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-dark-800 flex items-center justify-between px-6 border-b border-dark-700 select-none">
        <div className="font-bold text-xl">Advanced Calculus: Mid-Term</div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-brand-500'}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-full">
            <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs font-medium uppercase tracking-wider">Proctoring Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
              <h3 className="text-lg font-medium text-gray-400 mb-2">Question 1 of 10</h3>
              <p className="text-xl font-semibold mb-6">
                Calculate the limit of (sin x)/x as x approaches 0. Explain your reasoning using L'Hôpital's rule.
              </p>
              <textarea 
                className="w-full h-48 bg-dark-900 border border-dark-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                placeholder="Type your answer here..."
              ></textarea>
            </div>
            
             <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
              <h3 className="text-lg font-medium text-gray-400 mb-2">Question 2 of 10</h3>
              <p className="text-xl font-semibold mb-6">
               Find the derivative of f(x) = e^(2x) * cos(x).
              </p>
               <div className="space-y-3">
                 {['2e^(2x)cos(x) - e^(2x)sin(x)', 'e^(2x)(2cos(x) - sin(x))', 'Both A and B', 'None of the above'].map((opt, idx) => (
                   <label key={idx} className="flex items-center gap-3 p-4 bg-dark-900 rounded-lg cursor-pointer hover:bg-dark-700 transition">
                     <input type="radio" name="q2" className="w-5 h-5 text-brand-500" />
                     <span>{opt}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Proctoring Feed & Logs */}
        <div className="w-80 bg-dark-800 border-l border-dark-700 flex flex-col">
          <div className="p-4 border-b border-dark-700">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
              <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                REC
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm">
              <span className="text-gray-400">Warnings:</span>
              <span className={`font-bold ${warnings > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {warnings} / {MAX_WARNINGS}
              </span>
            </div>
            {/* Warning Progress Bar */}
            <div className="mt-2 w-full bg-dark-900 rounded-full h-2 overflow-hidden">
               <div className={`h-full transition-all duration-300 ${warnings === 1 ? 'w-1/3 bg-yellow-500' : warnings === 2 ? 'w-2/3 bg-orange-500' : warnings >= 3 ? 'w-full bg-red-600' : 'w-0'}`}></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Session Logs</h4>
            {violationLog.length === 0 && <p className="text-xs text-gray-600 italic">Session Clean.</p>}
            {violationLog.map((log, i) => (
              <div key={i} className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/30">
                {log}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-dark-700">
            <button 
                onClick={() => setExamStatus('SUBMITTED')}
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 rounded font-bold transition"
            >
                Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
