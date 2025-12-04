import Pusher from 'pusher-js';

// Configuration for Pusher Client
const PUSHER_KEY = 'fcebfa171f05d2a752b2';
const PUSHER_CLUSTER = 'ap2';

type SignalType = 'login' | 'join' | 'offer' | 'answer' | 'candidate' | 'chat' | 'session_status' | 'get_status';

interface SignalMessage {
  type: SignalType;
  payload: any;
  from: string;
  to?: string; 
}

class SignalingService {
  private pusher: Pusher;
  private channel: any;
  private userId: string;
  private listeners: Map<string, Function[]>;

  constructor() {
    this.userId = Math.random().toString(36).substring(7);
    this.listeners = new Map();

    // Initialize Pusher
    this.pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true
    });

    // Subscribe to the global class channel
    this.channel = this.pusher.subscribe('live-class-channel');

    // Bind to the generic 'signal-event' that carries all our messages
    this.channel.bind('signal-event', (data: SignalMessage) => {
      // Filter messages meant for specific users
      if (data.to && data.to !== this.userId) return;
      // Filter out messages sent by ourselves
      if (data.from === this.userId) return;

      this.emitLocal(data.type, data.payload, data.from);
    });
  }

  public getMyId() {
    return this.userId;
  }

  public setUserId(id: string) {
    this.userId = id;
  }

  // Instead of BroadcastChannel, we hit our Serverless API to trigger the event
  public async send(type: SignalType, payload: any, to?: string) {
    const msg: SignalMessage = {
      type,
      payload,
      from: this.userId,
      to
    };

    try {
      await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: 'live-class-channel',
          eventName: 'signal-event',
          data: msg
        })
      });
    } catch (error) {
      console.error("Failed to send signal:", error);
    }
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