import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LiveSessionState {
  isLive: boolean;
  topic: string;
  viewerCount: number;
  startTime: Date | null;
  startSession: (topic: string) => void;
  endSession: () => void;
  sendMessage: (user: string, text: string) => void;
  chatMessages: { user: string; text: string; timestamp: string }[];
}

const LiveContext = createContext<LiveSessionState | undefined>(undefined);

export const LiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLive, setIsLive] = useState(false);
  const [topic, setTopic] = useState("JLPT N4 Grammar: The Te-Form");
  const [viewerCount, setViewerCount] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; timestamp: string }[]>([]);

  const startSession = (newTopic: string) => {
    setTopic(newTopic);
    setIsLive(true);
    setStartTime(new Date());
    setViewerCount(24); // Simulate initial joiners
    addSystemMessage("Class has started. Recording enabled.");
  };

  const endSession = () => {
    setIsLive(false);
    setStartTime(null);
    setViewerCount(0);
    addSystemMessage("Class has ended.");
  };

  const sendMessage = (user: string, text: string) => {
    const msg = {
      user,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msg]);
  };

  const addSystemMessage = (text: string) => {
    sendMessage("SYSTEM", text);
  };

  return (
    <LiveContext.Provider value={{ isLive, topic, viewerCount, startTime, startSession, endSession, sendMessage, chatMessages }}>
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
