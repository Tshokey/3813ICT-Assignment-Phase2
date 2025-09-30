import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { Observable, Subject } from "rxjs";

export interface ChatMessage {
  _id?: string;
  username: string;
  message: string;
  messageType: "text" | "image";
  imageUrl?: string;
  timestamp: Date;
}

export interface UserActivity {
  username: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: "root",
})

export class Sockets {
  private socket: Socket;
  private messageSubject = new Subject<ChatMessage>();
  private userJoinedSubject = new Subject<UserActivity>();
  private userLeftSubject = new Subject<UserActivity>();
  private connectionStatusSubject = new Subject<boolean>();

  constructor() {
    this.socket = io("http://localhost:3000", {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socket.on("connect", () => {
      console.log("[v0] Socket connected:", this.socket.id);
      this.connectionStatusSubject.next(true);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[v0] Socket disconnected:", reason);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("[v0] Socket connection error:", error);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on("new-message", (data: ChatMessage) => {
      console.log("[v0] New message received:", data);
      this.messageSubject.next(data);
    });

    this.socket.on("user-joined", (data: UserActivity) => {
      console.log("[v0] User joined:", data);
      this.userJoinedSubject.next(data);
    });

    this.socket.on("user-left", (data: UserActivity) => {
      console.log("[v0] User left:", data);
      this.userLeftSubject.next(data);
    });

    this.socket.on("message-error", (error: any) => {
      console.error("[v0] Message error:", error);
    });

    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log("[v0] Socket reconnected after", attemptNumber, "attempts");
      this.connectionStatusSubject.next(true);
    });

    this.socket.on("reconnect_error", (error: Error) => {
      console.error("[v0] Socket reconnection error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("[v0] Socket reconnection failed");
      this.connectionStatusSubject.next(false);
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      console.log("[v0] Connecting to socket server...");
      this.socket.connect();
    };
  }

  disconnect(): void {
    if (this.socket.connected) {
      console.log("[v0] Disconnecting from socket server...");
      this.socket.disconnect();
    };
  }

  joinChannel(channelName: string, groupName: string, username: string): void {
    console.log("[v0] Joining channel:", { channelName, groupName, username });
    this.socket.emit("join-channel", { channelName, groupName, username });
  }

  leaveChannel(channelName: string, groupName: string, username: string): void {
    console.log("[v0] Leaving channel:", { channelName, groupName, username });
    this.socket.emit("leave-channel", { channelName, groupName, username });
  }

  sendMessage(
    channelName: string,
    groupName: string,
    username: string,
    message: string,
    messageType: "text" | "image" = "text",
    imageUrl?: string,
  ): void {
    console.log("[v0] Sending message:", { channelName, groupName, username, message, messageType });
    this.socket.emit("send-message", {
      channelName,
      groupName,
      username,
      message,
      messageType,
      imageUrl,
    });
  }

  // Observable streams for components to subscribe to
  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  getUserJoined(): Observable<UserActivity> {
    return this.userJoinedSubject.asObservable();
  }

  getUserLeft(): Observable<UserActivity> {
    return this.userLeftSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }
}

