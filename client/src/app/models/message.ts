export class Message {
  _id?: string
  channelName = ""
  groupName = ""
  username = ""
  message = ""
  messageType: "text" | "image" = "text"
  imageUrl?: string
  timestamp: Date = new Date()
  createdAt?: Date
}

export interface UserActivity {
  username: string
  message: string
  timestamp: Date
}
