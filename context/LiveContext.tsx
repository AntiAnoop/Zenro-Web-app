import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { signaling } from '../services/signaling';
import { User, UserRole } from '../types';

interface LiveSessionState {
  isLive: boolean;
  topic: string;
  viewerCount: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startSession: (topic: string) => Promise<void>;
  endSession: () => void;
  joinSession: () => void;
  leaveSession: () => void;
  sendMessage: (user: string, text: string) => void;
  toggleMic: (enabled: boolean) => void;
  toggleCamera: (enabled: boolean) => void;
  chatMessages: { user: string; text: string; timestamp: string }[];
}

const LiveContext = createContext<LiveSessionState | undefined>(undefined);

// WebRTC Configuration using Google's public STUN servers
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
  
  // Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // WebRTC Refs
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map()); // Teacher: map studentId -> PC
  const studentPeerConnection = useRef<RTCPeerConnection | null>(null); // Student: single PC to teacher
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]); // Buffer for candidates arriving before remote desc

  const isTeacher = user?.role === UserRole.TEACHER;

  useEffect(() => {
    // Global Signal Listeners
    
    // 1. Handle Chat
    signaling.on('chat', (payload) => {
      setChatMessages(prev => [...prev, payload]);
    });

    // 2. Handle Session Status Updates
    signaling.on('session_status', (payload) => {
      // If we are the teacher (broadcaster), ignore our own status broadcasts 
      // to avoid resetting state based on echoed messages.
      if (isTeacher && isLive) return;

      setIsLive(payload.isLive);
      setTopic(payload.topic);
      
      if (!payload.isLive) {
        // Class ended
        if (studentPeerConnection.current) {
            studentPeerConnection.current.close();
            studentPeerConnection.current = null;
        }
        setRemoteStream(null);
      }
    });

    // 3. Handle Status Requests (New student joins and asks "Are we live?")
    signaling.on('get_status', (payload, from) => {
      if (isTeacher && isLive) {
        signaling.send('session_status', { isLive: true, topic }, from);
      }
    });

    // Ask for status on mount (in case we refreshed student tab)
    if (!isTeacher) {
      signaling.send('get_status', {});
    }

    return () => {
      // Clean up handled via role logic usually
    };
  }, [isLive, topic, isTeacher]);

  // --- TEACHER / BROADCASTER LOGIC ---

  const startSession = async (newTopic: string) => {
    if (!isTeacher) return;

    try {
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      // 2. Update Local State
      setTopic(newTopic);
      setIsLive(true);
      setViewerCount(0);
      addSystemMessage(`Class started: ${newTopic}`);

      // 3. Broadcast Status
      signaling.send('session_status', { isLive: true, topic: newTopic });

      // 4. Setup Listener for Join Requests
      signaling.off('join', handleJoinRequest); 
      signaling.on('join', handleJoinRequest);

    } catch (err) {
      console.error("Error starting stream:", err);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const handleJoinRequest = async (payload: any, studentId: string) => {
    if (!localStream) return;
    console.log("Teacher: Student joining:", studentId);
    setViewerCount(prev => prev + 1);
    await createBroadcasterPeer(studentId, localStream);
  };

  const createBroadcasterPeer = async (studentId: string, stream: MediaStream) => {
    // Close existing if any
    if (peerConnections.current.has(studentId)) {
        peerConnections.current.get(studentId)?.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(studentId, pc);

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send('candidate', event.candidate, studentId);
      }
    };

    // Create Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signaling.send('offer', offer, studentId);

    // Setup specific listeners for this student
    const answerHandler = async (answer: RTCSessionDescriptionInit, from: string) => {
        if(from !== studentId) return;
        try {
            if (pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch(e) { console.error("Teacher Answer Error", e); }
    };
    
    const candidateHandler = async (candidate: RTCIceCandidateInit, from: string) => {
        if(from !== studentId) return;
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch(e) { console.error("Teacher Candidate Error", e); }
    }

    signaling.on('answer', answerHandler);
    signaling.on('candidate', candidateHandler);
  };

  const endSession = () => {
    if (!isTeacher) return;
    setIsLive(false);
    
    // Close all connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    signaling.send('session_status', { isLive: false, topic });
    addSystemMessage("Class ended.");
  };

  // --- MEDIA CONTROLS ---

  const toggleMic = (enabled: boolean) => {
    // SECURITY: Only teacher can toggle broadcasting mic
    if (!isTeacher) return;

    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = enabled);
    }
  };

  const toggleCamera = (enabled: boolean) => {
    // SECURITY: Only teacher can toggle broadcasting camera
    if (!isTeacher) return;

    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = enabled);
    }
  };

  // --- STUDENT / VIEWER LOGIC ---

  const joinSession = async () => {
    if (studentPeerConnection.current) return; // Already joined

    console.log("Student: Joining session...");
    
    // 1. Prepare PeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    studentPeerConnection.current = pc;
    pendingCandidates.current = [];

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send('candidate', event.candidate); // Broadcast back to teacher
      }
    };

    pc.ontrack = (event) => {
      console.log("Student: Received Remote Stream");
      setRemoteStream(event.streams[0]);
    };

    // 2. Ask to join
    signaling.send('join', {});

    // 3. Listen for Offer from Teacher
    signaling.off('offer', handleOffer);
    signaling.on('offer', handleOffer);

    signaling.off('candidate', handleCandidate);
    signaling.on('candidate', handleCandidate);
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, teacherId: string) => {
      const pc = studentPeerConnection.current;
      if (!pc) return;
      
      console.log("Student: Received Offer");
      try {
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

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
      const pc = studentPeerConnection.current;
      if (!pc) return;

      try {
          if (pc.remoteDescription) {
             await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
             // Buffer if remote description not set yet
             pendingCandidates.current.push(candidate);
          }
      } catch(e) { console.error("Student Candidate Error", e); }
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
    // Update local immediately for responsiveness
    setChatMessages(prev => [...prev, msg]);
    // Broadcast
    signaling.send('chat', msg);
  };

  const addSystemMessage = (text: string) => {
    sendMessage("SYSTEM", text);
  };

  return (
    <LiveContext.Provider value={{ 
      isLive, topic, viewerCount, 
      localStream, remoteStream,
      startSession, endSession, 
      joinSession, leaveSession,
      toggleMic, toggleCamera,
      sendMessage, chatMessages 
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