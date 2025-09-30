import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sockets } from '../../services/sockets';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-socket',
  imports: [CommonModule, FormsModule],
  templateUrl: './socket.html',
  styleUrls: ['./socket.css']
})
export class Socket implements OnInit, OnDestroy {
  isConnected = false;
  testChannelName = "test-channel";
  testGroupName = "test-group";
  testMessage = "";
  messages: any[] = [];
  connectionLog: string[] = [];
  currentUser: any = null;

  private subscriptions: Subscription[] = [];

  private socketService = inject (Sockets);
  private authService = inject (AuthService);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentuser();
    this.addLog("Component initialized");

    // Subscribe to connection status
    this.subscriptions.push(
      this.socketService.getConnectionStatus().subscribe((status) => {
        this.isConnected = status;
        this.addLog(`Connection status: ${status ? "Connected" : "Disconnected"}`);
      }),
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.socketService.getMessages().subscribe((message) => {
        this.messages.push(message);
        this.addLog(`Received message: ${message.username}: ${message.message}`);
      }),
    );

    // Subscribe to user activities
    this.subscriptions.push(
      this.socketService.getUserJoined().subscribe((activity) => {
        this.addLog(`User joined: ${activity.username}`);
      }),
    );

    this.subscriptions.push(
      this.socketService.getUserLeft().subscribe((activity) => {
        this.addLog(`User left: ${activity.username}`);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.disconnect();
  }

  connect(): void {
    this.addLog("Attempting to connect...");
    this.socketService.connect();
  }

  disconnect(): void {
    this.addLog("Disconnecting...");
    this.socketService.disconnect();
  }

  joinTestChannel(): void {
    if (!this.currentUser) {
      this.addLog("Error: No current user");
      return;
    }

    this.addLog(`Joining channel: ${this.testChannelName} in group: ${this.testGroupName}`);
    this.socketService.joinChannel(this.testChannelName, this.testGroupName, this.currentUser.username);
  }

  leaveTestChannel(): void {
    if (!this.currentUser) {
      this.addLog("Error: No current user");
      return;
    }

    this.addLog(`Leaving channel: ${this.testChannelName} in group: ${this.testGroupName}`);
    this.socketService.leaveChannel(this.testChannelName, this.testGroupName, this.currentUser.username);
  }

  sendTestMessage(): void {
    if (!this.testMessage.trim() || !this.currentUser) {
      this.addLog("Error: No message or user");
      return;
    }

    this.addLog(`Sending message: ${this.testMessage}`);
    this.socketService.sendMessage(
      this.testChannelName,
      this.testGroupName,
      this.currentUser.username,
      this.testMessage,
    );
    this.testMessage = "";
  }

  clearLog(): void {
    this.connectionLog = [];
    this.messages = [];
  }

  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.connectionLog.push(`[${timestamp}] ${message}`);
    console.log(`[v0] Socket Test: ${message}`);
  }
}
