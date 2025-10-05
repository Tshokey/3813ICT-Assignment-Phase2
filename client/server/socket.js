const { getMessagesCollection } = require("./database/collections")

module.exports = {
  connect: (io, PORT, db) => {
    const messagesCollection = db.collection("messages")
    const connectedPeers = new Map()

    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`)

      socket.on("join-channel", (data) => {
        const { channelName, groupName, username } = data
        const roomName = `${groupName}-${channelName}`
        socket.join(roomName)
        socket.username = username
        socket.currentRoom = roomName

        console.log(`${username} joined channel: ${roomName}`)

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

          if (!channelName || !groupName || !username || !message) {
            const error = "Missing required fields"
            console.error("[v0]", error)
            if (callback) callback({ success: false, error })
            socket.emit("message-error", { error })
            return
          }

          const newMessage = {
            channelName,
            groupName,
            username,
            message,
            messageType,
            imageUrl,
            timestamp: new Date(),
          }

          const result = await messagesCollection.insertOne(newMessage)
          newMessage._id = result.insertedId

          const roomName = `${groupName}-${channelName}`

          console.log("[v0] Broadcasting message to room:", roomName)
          console.log("[v0] Rooms socket is in:", Array.from(socket.rooms))

          io.to(roomName).emit("new-message", {
            _id: newMessage._id.toString(),
            username,
            message,
            messageType,
            imageUrl,
            timestamp: newMessage.timestamp,
          })

          console.log(`[v0] Message sent in ${roomName} by ${username}`)

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

      socket.on("leave-channel", (data) => {
        const { channelName, groupName, username } = data
        const roomName = `${groupName}-${channelName}`
        socket.leave(roomName)

        socket.to(roomName).emit("user-left", {
          username,
          message: `${username} left the channel`,
          timestamp: new Date(),
        })

        console.log(`${username} left channel: ${roomName}`)
      })

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

      socket.on("register-peer", (data) => {
        const { peerId, username } = data
        connectedPeers.set(peerId, { peerId, username, socketId: socket.id })
        socket.peerId = peerId

        console.log(`[v0] Peer registered: ${username} (${peerId})`)

        const peerList = Array.from(connectedPeers.values())
        socket.emit("peer-list", peerList)

        socket.broadcast.emit("new-peer", { peerId, username })
      })

      socket.on("unregister-peer", (peerId) => {
        if (connectedPeers.has(peerId)) {
          connectedPeers.delete(peerId)
          console.log(`[v0] Peer unregistered: ${peerId}`)

          io.emit("peer-left", peerId)
        }
      })

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`)

        if (socket.peerId && connectedPeers.has(socket.peerId)) {
          connectedPeers.delete(socket.peerId)
          io.emit("peer-left", socket.peerId)
          console.log(`[v0] Peer removed on disconnect: ${socket.peerId}`)
        }

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
