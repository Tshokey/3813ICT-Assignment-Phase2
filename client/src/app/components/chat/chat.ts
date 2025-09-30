import {Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewChecked} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Sockets, ChatMessage } from "../../services/sockets";
import { AuthService } from "../../services/auth-service"
import { HttpClient } from "@angular/common/http"
import { Subscription, firstValueFrom } from "rxjs"

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @Input() channelName = ""
  @Input() groupName = ""
  @ViewChild("messagesContainer") messagesContainer!: ElementRef

  messages: ChatMessage[] = []
  newMessage = ""
  isConnected = false
  currentUser: any = null

  private subscriptions: Subscription[] = []
  private shouldScrollToBottom = false

  constructor(
    private socketService: Sockets,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentuser()

    if (!this.currentUser) {
      console.error("[v0] No current user found")
      return
    }

    // Connect to socket
    this.socketService.connect()

    // Subscribe to socket events
    this.subscriptions.push(
      this.socketService.getConnectionStatus().subscribe((status) => {
        console.log("[v0] Connection status changed:", status)
        this.isConnected = status
        if (status && this.channelName && this.groupName) {
          this.joinCurrentChannel()
        }
      }),
    )

    this.subscriptions.push(
      this.socketService.getMessages().subscribe((message) => {
        console.log("[v0] Received message:", message)
        this.messages.push(message)
        this.shouldScrollToBottom = true
      }),
    )

    this.subscriptions.push(
      this.socketService.getUserJoined().subscribe((activity) => {
        console.log("[v0] User joined activity:", activity)
        // Add system message for user joining
        this.messages.push({
          username: "System",
          message: activity.message,
          messageType: "text",
          timestamp: activity.timestamp,
        })
        this.shouldScrollToBottom = true
      }),
    )

    this.subscriptions.push(
      this.socketService.getUserLeft().subscribe((activity) => {
        console.log("[v0] User left activity:", activity)
        // Add system message for user leaving
        this.messages.push({
          username: "System",
          message: activity.message,
          messageType: "text",
          timestamp: activity.timestamp,
        })
        this.shouldScrollToBottom = true
      }),
    )

    // Load chat history
    this.loadChatHistory()
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom()
      this.shouldScrollToBottom = false
    }
  }

  ngOnDestroy(): void {
    // Leave channel and disconnect
    if (this.currentUser && this.channelName && this.groupName) {
      this.socketService.leaveChannel(this.channelName, this.groupName, this.currentUser.username)
    }

    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.socketService.disconnect()
  }

  private async loadChatHistory(): Promise<void> {
    try {
      console.log("[v0] Loading chat history for:", this.channelName, this.groupName)
      const messages = await firstValueFrom(
        this.http.get<ChatMessage[]>(
          `http://localhost:3000/api/channels/${this.channelName}/messages?groupName=${this.groupName}`,
        ),
      )
      console.log("[v0] Loaded chat history:", messages)
      this.messages = messages || []
      this.shouldScrollToBottom = true
    } catch (error) {
      console.error("[v0] Error loading chat history:", error)
      this.messages = []
    }
  }

  private joinCurrentChannel(): void {
    if (this.currentUser && this.channelName && this.groupName) {
      console.log("[v0] Joining current channel:", this.channelName, this.groupName)
      this.socketService.joinChannel(this.channelName, this.groupName, this.currentUser.username)
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentUser || !this.isConnected) {
      return
    }

    console.log("[v0] Sending message:", this.newMessage)
    this.socketService.sendMessage(this.channelName, this.groupName, this.currentUser.username, this.newMessage.trim())

    this.newMessage = ""
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.sendMessage()
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight
      }
    } catch (error) {
      console.error("[v0] Error scrolling to bottom:", error)
    }
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  isSystemMessage(message: ChatMessage): boolean {
    return message.username === "System"
  }

  isOwnMessage(message: ChatMessage): boolean {
    return this.currentUser && message.username === this.currentUser.username
  }
}
