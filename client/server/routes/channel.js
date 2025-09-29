const express = require("express")

module.exports = (appData, saveData) => {
  const router = express.Router()

  // Get all channels
  router.get("/", (req, res) => {
    res.json(appData.channels)
  })

  // Get channels by group
  router.get("/group/:groupName", (req, res) => {
    const { groupName } = req.params
    const channels = appData.channels.filter((c) => c.groupName === groupName)
    res.json(channels)
  })

  // Create channel
  router.post("/", (req, res) => {
    const { name, groupName, members = [], bannedUsers = [] } = req.body

    // Check if channel already exists in the group
    if (appData.channels.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.groupName === groupName)) {
      return res.status(400).json({ success: false, message: "Channel already exists in this group" })
    }

    const newChannel = {
      name,
      groupName,
      members,
      bannedUsers,
    }

    appData.channels.push(newChannel)
    saveData(appData) // Save to JSON file after change

    res.json({ success: true, channel: newChannel })
  })

  // Join channel
  router.post("/:channelName/join", (req, res) => {
    const { channelName } = req.params
    const { groupName, username } = req.body

    const channel = appData.channels.find((c) => c.name === channelName && c.groupName === groupName)
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" })
    }

    if (!channel.members.includes(username) && !channel.bannedUsers.includes(username)) {
      channel.members.push(username)
      saveData(appData) // Save to JSON file after change
      res.json({ success: true, message: "Joined channel" })
    } else {
      res.status(400).json({ success: false, message: "Already member or banned" })
    }
  })

  // Leave channel
  router.post("/:channelName/leave", (req, res) => {
    const { channelName } = req.params
    const { groupName, username } = req.body

    const channel = appData.channels.find((c) => c.name === channelName && c.groupName === groupName)
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" })
    }

    channel.members = channel.members.filter((u) => u !== username)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Left channel" })
  })

  // Ban user from channel
  router.post("/:channelName/ban", (req, res) => {
    const { channelName } = req.params
    const { groupName, username } = req.body

    const channel = appData.channels.find((c) => c.name === channelName && c.groupName === groupName)
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" })
    }

    if (channel.members.includes(username)) {
      channel.members = channel.members.filter((u) => u !== username)
      if (!channel.bannedUsers.includes(username)) {
        channel.bannedUsers.push(username)
      }
      saveData(appData) // Save to JSON file after change
      res.json({ success: true, message: "User banned from channel" })
    } else {
      res.status(400).json({ success: false, message: "User not in channel" })
    }
  })

  // Remove member from channel
  router.delete("/:channelName/members/:username", (req, res) => {
    const { channelName, username } = req.params
    const { groupName } = req.query

    const channel = appData.channels.find((c) => c.name === channelName && c.groupName === groupName)
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" })
    }

    channel.members = channel.members.filter((u) => u !== username)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Member removed from channel" })
  })

  // Delete channel
  router.delete("/:channelName", (req, res) => {
    const { channelName } = req.params
    const { groupName } = req.query

    const channelIndex = appData.channels.findIndex((c) => c.name === channelName && c.groupName === groupName)
    if (channelIndex === -1) {
      return res.status(404).json({ success: false, message: "Channel not found" })
    }

    appData.channels.splice(channelIndex, 1)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Channel deleted" })
  })

  // Report user
  router.post("/:channelName/report", (req, res) => {
    const { channelName } = req.params
    const { groupName, username, reason, reportedBy } = req.body

    const report = {
      groupName,
      channelName,
      username,
      reason,
      reportedBy,
      timestamp: new Date().toISOString(),
    }

    appData.userReports.push(report)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "User reported" })
  })

  // Get user reports
  router.get("/reports", (req, res) => {
    res.json(appData.userReports)
  })

  return router
}
