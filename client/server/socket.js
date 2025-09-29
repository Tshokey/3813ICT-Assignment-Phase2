module.exports = {
    connect: function(io, PORT){
        io.on('connection', (socket) => {
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

            // Handle sending messages
            socket.on("send-message", async (data) => {
                try {
                const { channelName, groupName, username, message, messageType = "text", imageUrl = null } = data

                // Save message to database
                const newMessage = await models.Message.create({
                    channelName,
                    groupName,
                    username,
                    message,
                    messageType,
                    imageUrl,
                })

                const roomName = `${groupName}-${channelName}`

                // Broadcast message to all users in the channel
                io.to(roomName).emit("new-message", {
                    _id: newMessage._id,
                    username,
                    message,
                    messageType,
                    imageUrl,
                    timestamp: newMessage.timestamp,
                })

                console.log(`Message sent in ${roomName} by ${username}`)
                } catch (error) {
                console.error("Error sending message:", error)
                socket.emit("message-error", { error: "Failed to send message" })
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
        });
    }
}