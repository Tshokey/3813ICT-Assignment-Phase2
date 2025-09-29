const express = require("express")

module.exports = (appData, saveData) => {
  const router = express.Router()

  // Login endpoint
  router.post("/login", (req, res) => {
    const { username, password } = req.body

    const user = appData.users.find((u) => u.username === username && u.password === password)

    if (user) {
      res.json({ success: true, user })
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" })
    }
  })

  // Get all users endpoint
  router.get("/users", (req, res) => {
    res.json(appData.users)
  })

  // Create user endpoint
  router.post("/users", (req, res) => {
    const { username, email, password, roles = ["USER"], groups = [] } = req.body

    // Check if user already exists
    if (appData.users.find((u) => u.username === username)) {
      return res.status(400).json({ success: false, message: "User already exists" })
    }

    const newUser = {
      id: Math.max(...appData.users.map((u) => u.id), 0) + 1,
      username,
      email,
      password,
      roles,
      groups,
    }

    appData.users.push(newUser)
    saveData(appData) // Save to JSON file after change

    res.json({ success: true, user: newUser })
  })

  // Update user endpoint
  router.put("/users/:id", (req, res) => {
    const userId = Number.parseInt(req.params.id)
    const userIndex = appData.users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    appData.users[userIndex] = { ...appData.users[userIndex], ...req.body }
    saveData(appData) // Save to JSON file after change

    res.json({ success: true, user: appData.users[userIndex] })
  })

  // Delete user endpoint
  router.delete("/users/:id", (req, res) => {
    const userId = Number.parseInt(req.params.id)
    const userIndex = appData.users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    appData.users.splice(userIndex, 1)
    saveData(appData) // Save to JSON file after change

    res.json({ success: true, message: "User deleted" })
  })

  return router
}
