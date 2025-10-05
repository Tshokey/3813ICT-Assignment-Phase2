const express = require("express")

module.exports = (db, app, ObjectId) => {
  const groupsCollection = db.collection("groups")

  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await groupsCollection.find({}).toArray()
      res.json(groups)
    } catch (error) {
      console.error("[v0] Get groups error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/groups", async (req, res) => {
    try {
      const { name, createdBy, admins = [], members = [], channels = [], interested = [], bannedUsers = {} } = req.body

      // Check if group already exists
      const existingGroup = await groupsCollection.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } })
      if (existingGroup) {
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
        createdAt: new Date(),
      }

      const result = await groupsCollection.insertOne(newGroup)
      newGroup._id = result.insertedId

      res.json({ success: true, group: newGroup })
    } catch (error) {
      console.error("[v0] Create group error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/groups/:groupName/join", async (req, res) => {
    try {
      const { groupName } = req.params
      const { username } = req.body

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      if (!group.interested.includes(username) && !group.members.includes(username)) {
        await groupsCollection.updateOne(
          { name: groupName },
          { $push: { interested: username }, $set: { updatedAt: new Date() } },
        )
        res.json({ success: true, message: "Join request sent" })
      } else {
        res.status(400).json({ success: false, message: "Already requested or member" })
      }
    } catch (error) {
      console.error("[v0] Join group error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/groups/:groupName/approve", async (req, res) => {
    try {
      const { groupName } = req.params
      const { username } = req.body

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      if (group.interested.includes(username)) {
        await groupsCollection.updateOne(
          { name: groupName },
          { $push: { members: username }, $pull: { interested: username }, $set: { updatedAt: new Date() } },
        )
        res.json({ success: true, message: "User approved" })
      } else {
        res.status(400).json({ success: false, message: "User not in interested list" })
      }
    } catch (error) {
      console.error("[v0] Approve user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/groups/:groupName/reject", async (req, res) => {
    try {
      const { groupName } = req.params
      const { username } = req.body

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      await groupsCollection.updateOne(
        { name: groupName },
        { $pull: { interested: username }, $set: { updatedAt: new Date() } },
      )
      res.json({ success: true, message: "User rejected" })
    } catch (error) {
      console.error("[v0] Reject user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/groups/:groupName/leave", async (req, res) => {
    try {
      const { groupName } = req.params
      const { username } = req.body

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      await groupsCollection.updateOne(
        { name: groupName },
        { $pull: { members: username }, $set: { updatedAt: new Date() } },
      )
      res.json({ success: true, message: "Left group" })
    } catch (error) {
      console.error("[v0] Leave group error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.delete("/api/groups/:groupName/members/:username", async (req, res) => {
    try {
      const { groupName, username } = req.params

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      await groupsCollection.updateOne(
        { name: groupName },
        { $pull: { members: username, interested: username }, $set: { updatedAt: new Date() } },
      )
      res.json({ success: true, message: "Member removed" })
    } catch (error) {
      console.error("[v0] Remove member error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.delete("/api/groups/:groupName", async (req, res) => {
    try {
      const { groupName } = req.params

      const group = await groupsCollection.findOne({ name: groupName })

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" })
      }

      await groupsCollection.deleteOne({ name: groupName })
      res.json({ success: true, message: "Group deleted" })
    } catch (error) {
      console.error("[v0] Delete group error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })
}
