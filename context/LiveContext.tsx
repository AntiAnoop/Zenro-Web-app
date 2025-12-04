import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { signaling } from '../services/signaling';
import { UserRole } from '../types';

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
  chatMessages: { user: string; text: string; timestamp: string }[];
  currentUserRole?: UserRole; // Need to know if we are broadcaster or viewer
}

const LiveContext = createContext<LiveSessionState | undefined>(undefined);

// WebRTC Configuration using Google's public STUN servers
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const LiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  // State to track if we are the broadcaster
  const isBroadcaster = useRef(false);

  useEffect(() => {
    // Global Signal Listeners
    
    // 1. Handle Chat
    signaling.on('chat', (payload) => {
      setChatMessages(prev => [...prev, payload]);
    });

    // 2. Handle Session Status Updates (Student view mainly)
    signaling.on('session_status', (payload) => {
      setIsLive(payload.isLive);
      setTopic(payload.topic);
      if(payload.isLive) {
          // If we are a student and session went live, auto-trigger join intent logic if needed
          // (Handled by manual join or auto-effect in component)
      } else {
        // Class ended
        if (studentPeerConnection.current) {
            studentPeerConnection.current.close();
            studentPeerConnection.current = null;
        }
        setRemoteStream(null);
      }
    });

    return () => {
      // Cleanup handled in individual start/join functions mostly, but good practice
    };
  }, []);

  // --- TEACHER / BROADCASTER LOGIC ---

  const startSession = async (newTopic: string) => {
    try {
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      isBroadcaster.current = true;

      // 2. Update Local State
      setTopic(newTopic);
      setIsLive(true);
      setViewerCount(0);
      addSystemMessage(`Class started: ${newTopic}`);

      // 3. Broadcast Status
      signaling.send('session_status', { isLive: true, topic: newTopic });

      // 4. Listen for Join Requests from Students
      signaling.on('join', async (payload, studentId) => {
        console.log("Student joining:", studentId);
        setViewerCount(prev => prev + 1);
        await createBroadcasterPeer(studentId, stream);
      });

    } catch (err) {
      console.error("Error starting stream:", err);
      alert("Could not access camera/microphone.");
    }
  };

  const createBroadcasterPeer = async (studentId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(studentId, pc);

    // Add local tracks to the connection
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

    // Handle Answer from Student
    const answerHandler = async (answer: RTCSessionDescriptionInit, from: string) => {
        if(from !== studentId) return;
        try {
            if (pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch(e) { console.error(e); }
    };
    
    const candidateHandler = async (candidate: RTCIceCandidateInit, from: string) => {
        if(from !== studentId) return;
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch(e) { console.error(e); }
    }

    signaling.on('answer', answerHandler);
    signaling.on('candidate', candidateHandler);
  };

  const endSession = () => {
    isBroadcaster.current = false;
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

  // --- STUDENT / VIEWER LOGIC ---

  const joinSession = async () => {
    // 1. Ask to join
    signaling.send('join', {});

    // 2. Prepare PeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    studentPeerConnection.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send('candidate', event.candidate); // Broadcast back to teacher (whoever is listening)
      }
    };

    pc.ontrack = (event) => {
      console.log("Received Remote Stream");
      setRemoteStream(event.streams[0]);
    };

    // 3. Listen for Offer from Teacher
    signaling.on('offer', async (offer, teacherId) => {
      if (!studentPeerConnection.current) return;
      
      const pc = studentPeerConnection.current;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signaling.send('answer', answer, teacherId);
    });

    signaling.on('candidate', async (candidate) => {
      if (studentPeerConnection.current) {
        await studentPeerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
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