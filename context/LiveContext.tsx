import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { signaling } from '../services/signaling';
import { User, UserRole } from '../types';

interface LiveSessionState {
  isLive: boolean;
  topic: string;
  viewerCount: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  enablePreview: () => Promise<void>;
  startSession: (topic: string) => Promise<void>;
  endSession: () => void;
  joinSession: () => void;
  leaveSession: () => void;
  sendMessage: (user: string, text: string) => void;
  toggleMic: (enabled: boolean) => void;
  toggleCamera: (enabled: boolean) => void;
  chatMessages: { user: string; text: string; timestamp: string }[];
  checkStatus: () => void;
}

const LiveContext = createContext<LiveSessionState | undefined>(undefined);

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface LiveProviderProps {
  children: ReactNode;
  user: User | null;
}

export const LiveProvider: React.FC<LiveProviderProps> = ({ children, user }) => {
  const [isLive, setIsLive] = useState(false);
  const [topic, setTopic] = useState("Waiting for class...");
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; timestamp: string }[]>([]);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Teacher Refs
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Student Refs
  const studentPeerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const isTeacher = user?.role === UserRole.TEACHER;

  // --- GLOBAL SIGNALING LISTENERS ---
  useEffect(() => {
    // 1. Chat
    const handleChat = (payload: any) => {
      setChatMessages(prev => [...prev, payload]);
    };

    // 2. Session Status (For Students)
    const handleSessionStatus = (payload: any) => {
      if (isTeacher && isLive) return; // Ignore own broadcast if active

      console.log("Received Session Status:", payload);
      setIsLive(payload.isLive);
      setTopic(payload.topic);
      
      if (!payload.isLive) {
        // Class Ended
        leaveSession(); // Cleanup student side
      }
    };

    // 3. Status Request (For Teacher)
    const handleGetStatus = (payload: any, from: string) => {
      if (isTeacher && isLive) {
        signaling.send('session_status', { isLive: true, topic }, from);
      }
    };

    // 4. WebRTC: Answer (For Teacher)
    const handleAnswer = async (answer: RTCSessionDescriptionInit, from: string) => {
        if (!isTeacher) return;
        const pc = peerConnections.current.get(from);
        if (pc && pc.signalingState !== 'stable') {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) { console.error("Error setting remote description (Teacher):", e); }
        }
    };

    // 5. WebRTC: Ice Candidate (For Teacher & Student)
    const handleCandidate = async (candidate: RTCIceCandidateInit, from: string) => {
        if (isTeacher) {
            // Teacher handling student candidate
            const pc = peerConnections.current.get(from);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { console.error("Error adding candidate (Teacher):", e); }
            }
        } else {
            // Student handling teacher candidate
            const pc = studentPeerConnection.current;
            if (pc) {
                try {
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        pendingCandidates.current.push(candidate);
                    }
                } catch (e) { console.error("Error adding candidate (Student):", e); }
            }
        }
    };

    // 6. WebRTC: Offer (For Student)
    const handleOffer = async (offer: RTCSessionDescriptionInit, teacherId: string) => {
        if (isTeacher) return; // Teachers don't accept offers in this model
        
        const pc = studentPeerConnection.current;
        if (!pc) return;
        
        console.log("Student: Received Offer");
        try {
            if (pc.signalingState !== 'stable') {
               // If we are already connecting, we might need to reset or handle renegotiation. 
               // For simplicity, we proceed.
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process buffered candidates
            while (pendingCandidates.current.length > 0) {
                const c = pendingCandidates.current.shift();
                if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signaling.send('answer', answer, teacherId);
        } catch (e) {
            console.error("Student Offer Error", e);
        }
    };

    // 7. WebRTC: Join Request (For Teacher)
    const handleJoin = async (payload: any, studentId: string) => {
        if (!isTeacher || !localStream) return;
        console.log("Teacher: Student joining:", studentId);
        setViewerCount(prev => prev + 1);
        await createBroadcasterPeer(studentId, localStream);
    };

    // Register Listeners
    signaling.on('chat', handleChat);
    signaling.on('session_status', handleSessionStatus);
    signaling.on('get_status', handleGetStatus);
    signaling.on('answer', handleAnswer);
    signaling.on('candidate', handleCandidate);
    signaling.on('offer', handleOffer);
    signaling.on('join', handleJoin);

    // Initial Status Check for Students
    if (!isTeacher) {
      checkStatus();
    }

    return () => {
        signaling.off('chat', handleChat);
        signaling.off('session_status', handleSessionStatus);
        signaling.off('get_status', handleGetStatus);
        signaling.off('answer', handleAnswer);
        signaling.off('candidate', handleCandidate);
        signaling.off('offer', handleOffer);
        signaling.off('join', handleJoin);
    };
  }, [isTeacher, isLive, localStream, topic]);

  const checkStatus = () => {
    console.log("Checking status...");
    signaling.send('get_status', {});
  };

  // --- TEACHER FUNCTIONS ---

  const enablePreview = async () => {
    if (!isTeacher) return;
    if (localStream) return; 
    
    try {
        console.log("Requesting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        console.log("Media stream acquired");
    } catch (err) {
        console.error("Preview Error:", err);
        alert("Camera permission denied. Please allow access.");
    }
  };

  const startSession = async (newTopic: string) => {
    if (!isTeacher) return;

    try {
      let stream = localStream;
      if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream);
      }
      if (!stream) return;

      setTopic(newTopic);
      setIsLive(true);
      setViewerCount(0);
      addSystemMessage(`Class started: ${newTopic}`);
      signaling.send('session_status', { isLive: true, topic: newTopic });
    } catch (err) {
      console.error("Error starting stream:", err);
    }
  };

  const createBroadcasterPeer = async (studentId: string, stream: MediaStream) => {
    // Cleanup old connection for this student
    if (peerConnections.current.has(studentId)) {
        peerConnections.current.get(studentId)?.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(studentId, pc);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send('candidate', event.candidate, studentId);
      }
    };
    
    // Cleanup listener when PC closes
    pc.onconnectionstatechange = () => {
        if(pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            peerConnections.current.delete(studentId);
            setViewerCount(prev => Math.max(0, prev - 1));
        }
    };

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signaling.send('offer', offer, studentId);
    } catch(e) {
        console.error("Error creating offer:", e);
    }
  };

  const endSession = () => {
    if (!isTeacher) return;
    setIsLive(false);
    
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    signaling.send('session_status', { isLive: false, topic });
    addSystemMessage("Class ended.");
  };

  const toggleMic = (enabled: boolean) => {
    if (!isTeacher || !localStream) return;
    localStream.getAudioTracks().forEach(track => track.enabled = enabled);
  };

  const toggleCamera = (enabled: boolean) => {
    if (!isTeacher || !localStream) return;
    localStream.getVideoTracks().forEach(track => track.enabled = enabled);
  };

  // --- STUDENT FUNCTIONS ---

  const joinSession = async () => {
    if (studentPeerConnection.current) {
        console.log("Already joined, closing existing to rejoin...");
        studentPeerConnection.current.close();
        studentPeerConnection.current = null;
    }

    console.log("Student: Joining session...");
    
    const pc = new RTCPeerConnection(RTC_CONFIG);
    studentPeerConnection.current = pc;
    pendingCandidates.current = [];

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send('candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log("Student: Received Remote Stream");
      setRemoteStream(event.streams[0]);
    };

    signaling.send('join', {});
  };

  const leaveSession = () => {
    if (studentPeerConnection.current) {
      studentPeerConnection.current.close();
      studentPeerConnection.current = null;
    }
    setRemoteStream(null);
  };

  // --- CHAT ---

  const sendMessage = (user: string, text: string) => {
    const msg = {
      user,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msg]);
    signaling.send('chat', msg);
  };

  const addSystemMessage = (text: string) => {
    sendMessage("SYSTEM", text);
  };

  return (
    <LiveContext.Provider value={{ 
      isLive, topic, viewerCount, 
      localStream, remoteStream,
      enablePreview,
      startSession, endSession, 
      joinSession, leaveSession,
      toggleMic, toggleCamera,
      sendMessage, chatMessages,
      checkStatus
    }}>
      {children}
    </LiveContext.Provider>
  );
};

export const useLiveSession = () => {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useLiveSession must be used within a LiveProvider');
  }
  return context;
};