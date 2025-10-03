import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewChecked} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Sockets, ChatMessage } from "../../services/sockets"
import { AuthService } from "../../services/auth-service"
import { HttpClient } from "@angular/common/http"
import { Subscription, firstValueFrom } from "rxjs"
import { UploadService } from "../../services/upload-service"

@Component({
  selector: "app-chat",
  imports: [CommonModule, FormsModule],
  templateUrl: "./chat.html",
  styleUrls: ["./chat.css"],
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @Input() channelName = ""
  @Input() groupName = ""
  @ViewChild("messagesContainer") messagesContainer!: ElementRef
  @ViewChild("imageInput") imageInput!: ElementRef<HTMLInputElement>

  messages: ChatMessage[] = []
  newMessage = ""
  isConnected = false
  currentUser: any = null
  selectedImage: File | null = null
  imagePreviewUrl: string | null = null
  isUploadingImage = false
  userAvatars: Map<string, string> = new Map()

  private subscriptions: Subscription[] = []
  private shouldScrollToBottom = false
  private messageIds = new Set<string>()

  constructor(
    private socketService: Sockets,
    private authService: AuthService,
    private http: HttpClient,
    private uploadService: UploadService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentuser()

    if (!this.currentUser) {
      console.error("[v0] No current user found")
      return
    }

    this.loadUserAvatars()

    this.loadChatHistory().then(() => {
      // Connect to socket after loading history
      this.socketService.connect()
    })

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

        // Check if we already have this message (by ID or by checking if it's a duplicate)
        const messageId = message._id || `${message.username}-${message.timestamp}`

        if (!this.messageIds.has(messageId)) {
          this.messageIds.add(messageId)
          this.messages.push(message)
          this.shouldScrollToBottom = true
        } else {
          console.log("[v0] Duplicate message ignored:", messageId)
        }
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

      this.messages.forEach((msg) => {
        const messageId = msg._id || `${msg.username}-${msg.timestamp}`
        this.messageIds.add(messageId)
      })

      this.shouldScrollToBottom = true
    } catch (error) {
      console.error("[v0] Error loading chat history:", error)
      if (error instanceof Error) {
        console.error("[v0] Error details:", error.message)
      }
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
      console.log("[v0] Cannot send message:", {
        hasMessage: !!this.newMessage.trim(),
        hasUser: !!this.currentUser,
        isConnected: this.isConnected,
      })
      return
    }

    console.log("[v0] Sending message:", this.newMessage)

    this.socketService.sendMessage(
      this.channelName,
      this.groupName,
      this.currentUser.username,
      this.newMessage.trim(),
      "text",
      undefined,
    )

    this.newMessage = ""
  }

  triggerImageUpload(): void {
    this.imageInput.nativeElement.click()
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const file = input.files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }

      this.selectedImage = file

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  cancelImageUpload(): void {
    this.selectedImage = null
    this.imagePreviewUrl = null
    if (this.imageInput) {
      this.imageInput.nativeElement.value = ""
    }
  }

  async sendImageMessage(): Promise<void> {
    if (!this.selectedImage || !this.currentUser || !this.isConnected) {
      return
    }

    this.isUploadingImage = true

    try {
      const response = await firstValueFrom(
        this.uploadService.uploadChatImage(
          this.selectedImage,
          this.channelName,
          this.newMessage.trim(), // Optional caption
        ),
      )

      console.log("[v0] Image uploaded:", response)

      this.socketService.sendMessage(
        this.channelName,
        this.groupName,
        this.currentUser.username,
        this.newMessage.trim() || "Sent an image",
        "image",
        response.data.imageUrl,
      )

      // Clear form
      this.newMessage = ""
      this.cancelImageUpload()
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      this.isUploadingImage = false
    }
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

  private async loadUserAvatars(): Promise<void> {
    try {
      const users = await firstValueFrom(this.authService.getUsers())
      users.forEach((user) => {
        if (user.profileImage) {
          this.userAvatars.set(user.username, user.profileImage)
        }
      })
      console.log("[v0] Loaded user avatars:", this.userAvatars)
    } catch (error) {
      console.error("[v0] Error loading user avatars:", error)
    }
  }

  getAvatarUrl(username: string): string {
    const profileImage = this.userAvatars.get(username)
    if (profileImage) {
      return `http://localhost:3000${profileImage}`
    }
    return "" // Will use default avatar
  }

  getUserInitial(username: string): string {
    return username ? username.charAt(0).toUpperCase() : "?"
  }
}
