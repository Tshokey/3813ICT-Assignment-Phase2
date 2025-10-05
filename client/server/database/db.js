const { MongoClient } = require("mongodb")

// MongoDB connection URL - can be configured via environment variable
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "chatapp"

let db = null
let client = null

/**
 * Connect to MongoDB database
 */
async function connect() {
  try {
    if (db) {
      console.log("[v0] Already connected to MongoDB")
      return db
    }

    console.log("[v0] Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()

    db = client.db(DB_NAME)
    console.log(`[v0] Successfully connected to MongoDB database: ${DB_NAME}`)

    // Create indexes for better performance
    await createIndexes()

    return db
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

/**
 * Get the database instance
 */
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connect() first.")
  }
  return db
}

/**
 * Close the database connection
 */
async function close() {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log("[v0] MongoDB connection closed")
  }
}

/**
 * Create indexes for collections
 */
async function createIndexes() {
  try {
    const db = getDb()

    // Users collection indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 })

    // Groups collection indexes
    await db.collection("groups").createIndex({ name: 1 }, { unique: true })

    // Channels collection indexes
    await db.collection("channels").createIndex({ name: 1, groupName: 1 }, { unique: true })
    await db.collection("channels").createIndex({ groupName: 1 })

    // Messages collection indexes
    await db.collection("messages").createIndex({ channelName: 1, groupName: 1 })
    await db.collection("messages").createIndex({ timestamp: -1 })
    await db.collection("messages").createIndex({ username: 1 })

    // User reports collection indexes
    await db.collection("userReports").createIndex({ reportedBy: 1 })
    await db.collection("userReports").createIndex({ reportedUser: 1 })
    await db.collection("userReports").createIndex({ timestamp: -1 })

    console.log("[v0] Database indexes created successfully")
  } catch (error) {
    console.error("[v0] Error creating indexes:", error)
  }
}

/**
 * Initialize database with default super admin user if empty
 */
async function initializeDefaultData() {
  try {
    const db = getDb()
    const usersCollection = db.collection("users")

    // Check if super admin exists
    const superAdmin = await usersCollection.findOne({ username: "super" })

    if (!superAdmin) {
      console.log("[v0] Creating default super admin user...")
      await usersCollection.insertOne({
        username: "super",
        password: "123",
        email: "super@gmail.com",
        roles: ["SUPER_ADMIN"],
        groups: [],
        profileImage: null,
        createdAt: new Date(),
      })
      console.log("[v0] Default super admin user created")
    }
  } catch (error) {
    console.error("[v0] Error initializing default data:", error)
  }
}

module.exports = {
  connect,
  getDb,
  close,
  initializeDefaultData,
}
