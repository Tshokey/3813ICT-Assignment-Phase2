const express = require("express")

module.exports = (db, app) => {
  const usersCollection = db.collection("users")

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body

      const user = await usersCollection.findOne({ username, password })

      if (user) {
        res.json({ success: true, user })
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" })
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.get("/api/auth/users", async (req, res) => {
    try {
      const users = await usersCollection.find({}).toArray()
      res.json(users)
    } catch (error) {
      console.error("[v0] Get users error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.post("/api/auth/users", async (req, res) => {
    try {
      const { username, email, password, roles = ["USER"], groups = [] } = req.body

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ username })
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" })
      }

      const newUser = {
        username,
        email,
        password,
        roles,
        groups,
        profileImage: null,
        createdAt: new Date(),
      }

      const result = await usersCollection.insertOne(newUser)
      newUser._id = result.insertedId

      res.json({ success: true, user: newUser })
    } catch (error) {
      console.error("[v0] Create user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.put("/api/auth/users/:username", async (req, res) => {
    try {
      const username = req.params.username

      const user = await usersCollection.findOne({ username })
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
      }

      const updateData = { ...req.body }
      delete updateData._id // Don't allow updating _id
      updateData.updatedAt = new Date()

      await usersCollection.updateOne({ username }, { $set: updateData })

      const updatedUser = await usersCollection.findOne({ username })
      res.json({ success: true, user: updatedUser })
    } catch (error) {
      console.error("[v0] Update user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })

  app.delete("/api/auth/users/:username", async (req, res) => {
    try {
      const username = req.params.username

      const user = await usersCollection.findOne({ username })
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
      }

      await usersCollection.deleteOne({ username })
      res.json({ success: true, message: "User deleted" })
    } catch (error) {
      console.error("[v0] Delete user error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  })
}
