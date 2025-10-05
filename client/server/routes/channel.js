const express = require("express")

module.exports = (db, app, ObjectId) => {
  const channelsCollection = db.collection("channels")
  const messagesCollection = db.collection("messages")
  const userReportsCollection = db.collection("userReports")

  app.get("/api/channels", async (req, res) => {
    try {
      const channels = await channelsCollection.find({}).toArray()
      res.json(channels)
    } catch (error) {
      console.error("[v0] Get channels error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.get("/api/channels/group/:groupName", async (req, res) => {
    try {
      const { groupName } = req.params
      const channels = await channelsCollection.find({ groupName }).toArray()
      res.json(channels)
    } catch (error) {
      console.error("[v0] Get group channels error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.get("/api/channels/:channelName/messages", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName } = req.query

      if (!groupName) {
        return res.status(400).json({ success: false, message: "Group name is required" })
      }

      const messages = await messagesCollection
        .find({ channelName, groupName })
        .sort({ timestamp: 1 })
        .limit(50)
        .toArray()

      res.json(messages)
    } catch (error) {
      console.error("[v0] Get messages error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels/:channelName/messages", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName, username, message, messageType = "text", imageUrl = null } = req.body

      if (!groupName || !username || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields" })
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

      res.json({ success: true, message: newMessage })
    } catch (error) {
      console.error("[v0] Post message error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels", async (req, res) => {
    try {
      const { name, groupName, members = [], bannedUsers = [] } = req.body

      // Check if channel already exists in the group
      const existingChannel = await channelsCollection.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        groupName,
      })

      if (existingChannel) {
        return res.status(400).json({ success: false, message: "Channel already exists in this group" })
      }

      const newChannel = {
        name,
        groupName,
        members,
        bannedUsers,
        createdAt: new Date(),
      }

      const result = await channelsCollection.insertOne(newChannel)
      newChannel._id = result.insertedId

      res.json({ success: true, channel: newChannel })
    } catch (error) {
      console.error("[v0] Create channel error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels/:channelName/join", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName, username } = req.body

      const channel = await channelsCollection.findOne({ name: channelName, groupName })

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" })
      }

      if (!channel.members.includes(username) && !channel.bannedUsers.includes(username)) {
        await channelsCollection.updateOne(
          { name: channelName, groupName },
          { $push: { members: username }, $set: { updatedAt: new Date() } },
        )
        res.json({ success: true, message: "Joined channel" })
      } else {
        res.status(400).json({ success: false, message: "Already member or banned" })
      }
    } catch (error) {
      console.error("[v0] Join channel error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels/:channelName/leave", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName, username } = req.body

      const channel = await channelsCollection.findOne({ name: channelName, groupName })

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" })
      }

      await channelsCollection.updateOne(
        { name: channelName, groupName },
        { $pull: { members: username }, $set: { updatedAt: new Date() } },
      )
      res.json({ success: true, message: "Left channel" })
    } catch (error) {
      console.error("[v0] Leave channel error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels/:channelName/ban", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName, username } = req.body

      const channel = await channelsCollection.findOne({ name: channelName, groupName })

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" })
      }

      if (channel.members.includes(username)) {
        await channelsCollection.updateOne(
          { name: channelName, groupName },
          { $pull: { members: username }, $addToSet: { bannedUsers: username }, $set: { updatedAt: new Date() } },
        )
        res.json({ success: true, message: "User banned from channel" })
      } else {
        res.status(400).json({ success: false, message: "User not in channel" })
      }
    } catch (error) {
      console.error("[v0] Ban user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.delete("/api/channels/:channelName/members/:username", async (req, res) => {
    try {
      const { channelName, username } = req.params
      const { groupName } = req.query

      const channel = await channelsCollection.findOne({ name: channelName, groupName })

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" })
      }

      await channelsCollection.updateOne(
        { name: channelName, groupName },
        { $pull: { members: username }, $set: { updatedAt: new Date() } },
      )
      res.json({ success: true, message: "Member removed from channel" })
    } catch (error) {
      console.error("[v0] Remove member error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.delete("/api/channels/:channelName", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName } = req.query

      const channel = await channelsCollection.findOne({ name: channelName, groupName })

      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" })
      }

      await channelsCollection.deleteOne({ name: channelName, groupName })
      res.json({ success: true, message: "Channel deleted" })
    } catch (error) {
      console.error("[v0] Delete channel error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/channels/:channelName/report", async (req, res) => {
    try {
      const { channelName } = req.params
      const { groupName, username, reason, reportedBy } = req.body

      const report = {
        groupName,
        channelName,
        reportedUser: username,
        reason,
        reportedBy,
        timestamp: new Date(),
      }

      const result = await userReportsCollection.insertOne(report)
      report._id = result.insertedId

      res.json({ success: true, message: "User reported" })
    } catch (error) {
      console.error("[v0] Report user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.get("/api/channels/reports", async (req, res) => {
    try {
      const reports = await userReportsCollection.find({}).sort({ timestamp: -1 }).toArray()
      res.json(reports)
    } catch (error) {
      console.error("[v0] Get reports error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })
}
