const fs = require("fs")
const path = require("path")

const DATA_FILE = path.join(__dirname, "data", "data.json")

module.exports = {
  connect: (io, PORT, appData, saveData) => {
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Join a channel room
      socket.on("join-channel", (data) => {
        const { channelName, groupName, username } = data
        const roomName = `${groupName}-${channelName}`
        socket.join(roomName)
        socket.username = username
        socket.currentRoom = roomName

        console.log(`${username} joined channel: ${roomName}`)

        // Notify others in the channel
        socket.to(roomName).emit("user-joined", {
          username,
          message: `${username} joined the channel`,
          timestamp: new Date(),
        })
      })

      socket.on("send-message", async (data, callback) => {
        try {
          const { channelName, groupName, username, message, messageType = "text", imageUrl = null } = data

          console.log("[v0] Received send-message event:", { channelName, groupName, username, message })

          // Validate required fields
          if (!channelName || !groupName || !username || !message) {
            const error = "Missing required fields"
            console.error("[v0]", error)
            if (callback) callback({ success: false, error })
            socket.emit("message-error", { error })
            return
          }

          const newMessage = {
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            channelName,
            groupName,
            username,
            message,
            messageType,
            imageUrl,
            timestamp: new Date(),
          }

          if (!appData.messages) {
            appData.messages = []
          }

          appData.messages.push(newMessage)
          saveData(appData)

          const roomName = `${groupName}-${channelName}`

          console.log("[v0] Broadcasting message to room:", roomName)
          console.log("[v0] Rooms socket is in:", Array.from(socket.rooms))

          // Broadcast to all clients in the room (including sender)
          io.to(roomName).emit("new-message", {
            _id: newMessage._id,
            username,
            message,
            messageType,
            imageUrl,
            timestamp: newMessage.timestamp,
          })

          console.log(`[v0] Message sent in ${roomName} by ${username}`)

          // Send acknowledgment back to sender
          if (callback) {
            callback({ success: true, message: newMessage })
          }
        } catch (error) {
          console.error("[v0] Error sending message:", error)
          const errorMessage = "Failed to send message"
          if (callback) {
            callback({ success: false, error: errorMessage })
          }
          socket.emit("message-error", { error: errorMessage })
        }
      })

      // Handle leaving channel
      socket.on("leave-channel", (data) => {
        const { channelName, groupName, username } = data
        const roomName = `${groupName}-${channelName}`
        socket.leave(roomName)

        // Notify others in the channel
        socket.to(roomName).emit("user-left", {
          username,
          message: `${username} left the channel`,
          timestamp: new Date(),
        })

        console.log(`${username} left channel: ${roomName}`)
      })

      // Handle video call signaling
      socket.on("video-call-request", (data) => {
        const { targetUser, channelName, groupName, callerName } = data
        const roomName = `${groupName}-${channelName}`

        socket.to(roomName).emit("incoming-video-call", {
          callerName,
          callerId: socket.id,
          channelName,
          groupName,
        })
      })

      socket.on("video-call-answer", (data) => {
        const { callerId, accepted } = data
        io.to(callerId).emit("video-call-answered", { accepted, answerId: socket.id })
      })

      socket.on("video-signal", (data) => {
        const { targetId, signal } = data
        io.to(targetId).emit("video-signal", { signal, senderId: socket.id })
      })

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`)

        if (socket.currentRoom && socket.username) {
          socket.to(socket.currentRoom).emit("user-left", {
            username: socket.username,
            message: `${socket.username} disconnected`,
            timestamp: new Date(),
          })
        }
      })
    })
  },
}
