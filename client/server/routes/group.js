const express = require("express")

module.exports = (appData, saveData) => {
  const router = express.Router()

  // Get all groups
  router.get("/", (req, res) => {
    res.json(appData.groups)
  })

  // Create group
  router.post("/", (req, res) => {
    const { name, createdBy, admins = [], members = [], channels = [], interested = [], bannedUsers = {} } = req.body

    // Check if group already exists
    if (appData.groups.find((g) => g.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Group already exists" })
    }

    const newGroup = {
      name,
      createdBy,
      admins,
      members,
      channels,
      interested,
      bannedUsers,
    }

    appData.groups.push(newGroup)
    saveData(appData) // Save to JSON file after change

    res.json({ success: true, group: newGroup })
  })

  // Send join request
  router.post("/:groupName/join", (req, res) => {
    const { groupName } = req.params
    const { username } = req.body

    const group = appData.groups.find((g) => g.name === groupName)
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    if (!group.interested.includes(username) && !group.members.includes(username)) {
      group.interested.push(username)
      saveData(appData) // Save to JSON file after change
      res.json({ success: true, message: "Join request sent" })
    } else {
      res.status(400).json({ success: false, message: "Already requested or member" })
    }
  })

  // Approve user
  router.post("/:groupName/approve", (req, res) => {
    const { groupName } = req.params
    const { username } = req.body

    const group = appData.groups.find((g) => g.name === groupName)
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    if (group.interested.includes(username)) {
      group.members.push(username)
      group.interested = group.interested.filter((u) => u !== username)
      saveData(appData) // Save to JSON file after change
      res.json({ success: true, message: "User approved" })
    } else {
      res.status(400).json({ success: false, message: "User not in interested list" })
    }
  })

  // Reject user
  router.post("/:groupName/reject", (req, res) => {
    const { groupName } = req.params
    const { username } = req.body

    const group = appData.groups.find((g) => g.name === groupName)
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    group.interested = group.interested.filter((u) => u !== username)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "User rejected" })
  })

  // Leave group
  router.post("/:groupName/leave", (req, res) => {
    const { groupName } = req.params
    const { username } = req.body

    const group = appData.groups.find((g) => g.name === groupName)
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    group.members = group.members.filter((u) => u !== username)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Left group" })
  })

  // Remove member
  router.delete("/:groupName/members/:username", (req, res) => {
    const { groupName, username } = req.params

    const group = appData.groups.find((g) => g.name === groupName)
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    group.members = group.members.filter((u) => u !== username)
    group.interested = group.interested.filter((u) => u !== username)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Member removed" })
  })

  // Delete group
  router.delete("/:groupName", (req, res) => {
    const { groupName } = req.params

    const groupIndex = appData.groups.findIndex((g) => g.name === groupName)
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    appData.groups.splice(groupIndex, 1)
    saveData(appData) // Save to JSON file after change
    res.json({ success: true, message: "Group deleted" })
  })

  return router
}
