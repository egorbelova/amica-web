import {
  onAccessTokenChange,
  refreshTokenIfNeeded,
  getAccessTokenOrThrow,
} from './authStore';
import type { Session } from '@/types';
import { startTransition } from 'react';

export interface WebSocketMessageData {
  id?: number | string;
  user_id?: number;
  type?: string;
  chat_id?: number;
  message_id?: number;
  message?: string;
  token?: string;
  userId?: number;
  days?: number;
  value?: string;
  media?: File;
  reaction?: { reaction_type: string };
  object_id?: number;
  first_message?: string;
  session?: Session;
  url?: string;
}

export interface WebSocketMessage {
  type: string;
  chat_id?: number;
  data?: WebSocketMessageData;
  message_id?: number;
  message?: string;
  token?: string;
  userId?: number;
  days?: number;
  id?: number;
  session?: Session;
}

interface WebSocketEventMap {
  connected: (data: null) => void;
  disconnected: (data: { code: number; reason: string }) => void;
  error: (error: Error) => void;
  message: (data: WebSocketMessage) => void;
  chat_message: (data: WebSocketMessage) => void;
  message_reaction: (data: WebSocketMessage) => void;
  message_viewed: (data: WebSocketMessage) => void;
  connection_established: (data: WebSocketMessage) => void;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private isManualDisconnect = false;
  private eventHandlers: Map<
    keyof WebSocketEventMap,
    ((data: unknown) => void)[]
  > = new Map();

  private unsubscribeTokenListener: (() => void) | null = null;

  constructor() {
    this.unsubscribeTokenListener = onAccessTokenChange((token) => {
      if (!token) {
        this.disconnect();
        return;
      }
      if (this.isConnected()) {
        this.sendMessage({ type: 'auth', token });
      }
    });
  }

  public shutdown() {
    this.disconnect();
    if (this.unsubscribeTokenListener) {
      this.unsubscribeTokenListener();
      this.unsubscribeTokenListener = null;
    }
    this.eventHandlers.clear();
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public on<K extends keyof WebSocketEventMap>(
    event: K,
    handler: WebSocketEventMap[K],
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof WebSocketEventMap>(
    event: K,
    handler: WebSocketEventMap[K],
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  private emit<K extends keyof WebSocketEventMap>(
    event: K,
    data: unknown,
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket handler for ${event}:`, error);
        }
      });
    }
  }

  public async connect(): Promise<void> {
    if (
      this.socket?.readyState === WebSocket.CONNECTING ||
      this.socket?.readyState === WebSocket.OPEN
    ) {
      return;
    }
    this.cleanupPing();
    this.cleanupReconnect();
    this.isManualDisconnect = false;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    try {
      await refreshTokenIfNeeded();
    } catch (err) {
      console.error('Cannot get valid token for WS:', err);
      return;
    }

    const ws_protocol =
      window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws_host = window.location.hostname;
    let ws_port: number | null = null;

    if (
      ws_host === 'localhost' ||
      ws_host === '127.0.0.1' ||
      ws_host === '192.168.1.68'
    ) {
      ws_port = 8000;
    }

    let url: string;
    const token = await getAccessTokenOrThrow();
    if (ws_port) {
      url = `${ws_protocol}${ws_host}:${ws_port}/ws/socket-server/?token=${token}`;
    } else {
      url = `${ws_protocol}${ws_host}/ws/socket-server/?token=${token}`;
      // url = `${ws_protocol}${window.location.host}/ws/socket-server/`;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = async () => {
        this.reconnectAttempts = 0;
        this.emit('connected', null);

        try {
          const token = await getAccessTokenOrThrow();
          this.sendMessage({ type: 'auth', token });
        } catch {
          this.disconnect();
        }
      };

      this.socket.onmessage = (e: MessageEvent) => this.handleMessage(e);

      this.socket.onclose = (e: CloseEvent) => {
        console.log(`WebSocket closed. Code: ${e.code}, Reason: ${e.reason}`);
        this.emit('disconnected', { code: e.code, reason: e.reason });

        if (this.isManualDisconnect) return;
        if (e.code === 1000 || e.code === 1001) return;

        this.attemptReconnection();
      };

      this.socket.onerror = (err: Event) => {
        console.error('WebSocket error:', err);
        this.emit('error', err);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      this.emit('error', err);
    }
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanupReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private handleMessage(e: MessageEvent) {
    let data: WebSocketMessage;
    try {
      data = JSON.parse(e.data);
    } catch (err) {
      console.error('Error parsing WS message:', err);
      this.emit('error', err);
      return;
    }
    queueMicrotask(() => {
      this.emit('message', data);
      startTransition(() => {
        switch (data.type) {
          case 'connection_established':
            this.emit('connection_established', data);
            break;
          case 'pong':
            break;
          case 'error':
            console.error('WS error:', data.message);
            this.emit('error', data);
            break;
          case 'chat_message':
            if (data.data && data.chat_id !== undefined)
              this.emit('chat_message', data);
            break;
          case 'message_reaction':
            if (data.message_id) this.emit('message_reaction', data);
            break;
          case 'message_viewed':
            if (data.message_id) this.emit('message_viewed', data);
            break;
        }
      });
    });
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`,
      );

      this.reconnectTimeout = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
  }

  // private startPingInterval() {
  //   this.cleanupPing();
  //   this.sendPing();
  //   this.pingInterval = window.setInterval(() => this.sendPing(), 30_000);
  // }

  // private sendPing() {
  //   if (this.socket && this.socket.readyState === WebSocket.OPEN) {
  //     this.socket.send(JSON.stringify({ type: 'ping' }));
  //   }
  // }

  public sendMessage(message: WebSocketMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket not open', this.socket?.readyState);
    return false;
  }

  sendCreateChat(payload: { user_id: number; first_message: string }) {
    this.sendMessage({
      type: 'create_chat',
      data: payload,
    });
  }

  public sendChatMessage(chatId: number, message: string) {
    return this.sendMessage({
      type: 'chat_message',
      chat_id: chatId,
      data: { value: message },
    });
  }

  public sendMessageReaction(messageId: number, reaction: unknown) {
    return this.sendMessage({
      type: 'message_reaction',
      message_id: messageId,
      data: reaction,
    });
  }

  public sendMessageViewed(messageId: number) {
    return this.sendMessage({ type: 'message_viewed', message_id: messageId });
  }

  public disconnect() {
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;
    this.cleanupPing();
    this.cleanupReconnect();
    if (this.socket) this.socket.close(1000, 'Manual disconnect');
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocketManager = WebSocketManager.getInstance();
