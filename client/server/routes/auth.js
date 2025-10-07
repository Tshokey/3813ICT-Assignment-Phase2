const express = require("express");

module.exports = (db, app) => {
  const usersCollection = db.collection("users");

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await usersCollection.findOne({ username, password });

      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  })

  app.get("/api/auth/users", async (req, res) => {
    try {
      console.log("Auth API: Fetching all users from database...");
      const users = await usersCollection.find({}).toArray();
      console.log("Auth API: Found users:", users.length);
      console.log("Auth API: User usernames:",users.map((u) => u.username));
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  })

  app.post("/api/auth/users", async (req, res) => {
    try {
      const { username, email, password, roles = ["USER"], groups = [] } = req.body;

      console.log("Auth API: Creating new user:", username);

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        console.log("Auth API: User already exists:", username);
        return res.status(400).json({ success: false, message: "User already exists" });
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

      const result = await usersCollection.insertOne(newUser);
      newUser._id = result.insertedId;

      console.log("Auth API: User created successfully:", username);
      console.log("Auth API: New user ID:", result.insertedId);

      res.json({ success: true, user: newUser });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  })

  app.put("/api/auth/users/:username", async (req, res) => {
    try {
      const username = req.params.username;

      const user = await usersCollection.findOne({ username });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const updateData = { ...req.body };
      delete updateData._id;// Don't allow updating _id
      updateData.updatedAt = new Date();

      await usersCollection.updateOne({ username }, { $set: updateData });

      const updatedUser = await usersCollection.findOne({ username });
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  })

  app.delete("/api/auth/users/:username", async (req, res) => {
    try {
      const username = req.params.username;

      const user = await usersCollection.findOne({ username });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      await usersCollection.deleteOne({ username });
      res.json({ success: true, message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  })
}
