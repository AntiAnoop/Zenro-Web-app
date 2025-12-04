// This service mimics a WebSocket Signaling Server using the BroadcastChannel API.
// This allows the app to function with Real WebRTC across multiple tabs without a Node.js backend.
// In a real production app, replace 'BroadcastChannel' logic with 'socket.io-client'.

type SignalType = 'login' | 'join' | 'offer' | 'answer' | 'candidate' | 'chat' | 'session_status';

interface SignalMessage {
  type: SignalType;
  payload: any;
  from: string;
  to?: string; // If undefined, broadcast to all
}

class SignalingService {
  private channel: BroadcastChannel;
  private userId: string;
  private listeners: Map<string, Function[]>;

  constructor() {
    this.channel = new BroadcastChannel('zenro_live_signaling');
    this.userId = Math.random().toString(36).substring(7);
    this.listeners = new Map();

    this.channel.onmessage = (event) => {
      const msg = event.data as SignalMessage;
      // Filter messages meant for specific users
      if (msg.to && msg.to !== this.userId) return;
      
      this.emitLocal(msg.type, msg.payload, msg.from);
    };
  }

  public getMyId() {
    return this.userId;
  }

  public setUserId(id: string) {
    this.userId = id;
  }

  public send(type: SignalType, payload: any, to?: string) {
    const msg: SignalMessage = {
      type,
      payload,
      from: this.userId,
      to
    };
    this.channel.postMessage(msg);
  }

  public on(event: SignalType, callback: (payload: any, from: string) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: SignalType, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(event, eventListeners.filter(cb => cb !== callback));
    }
  }

  private emitLocal(event: string, payload: any, from: string) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(cb => cb(payload, from));
    }
  }
}

export const signaling = new SignalingService();