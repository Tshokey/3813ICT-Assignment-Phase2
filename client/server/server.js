const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const app = express()
const https = require("https")
const http = require("http")
const { ExpressPeerServer } = require("peer")
const socketIo = require("socket.io")
const sockets = require("./socket.js")
const listen = require("./listen.js")
const { MongoClient, ObjectId } = require("mongodb")

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017")

const corsOptions = {
  origin: ["http://localhost:4200", "https://localhost:4200"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.use(express.json())
app.use("/userimages", express.static(path.join(__dirname, "userimages")))

let server
const certPath = path.join(__dirname, "cert.pem")
const keyPath = path.join(__dirname, "key.pem")
const useHTTP = process.env.USE_HTTP === "true"

if (!useHTTP && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
  server = https.createServer(options, app)
  console.log("[v0] HTTPS server created with SSL certificates")
} else {
  server = http.createServer(app)
  if (useHTTP) {
    console.log("[v0] HTTP server created (USE_HTTP=true)")
  } else {
    console.log("[v0] HTTP server created (SSL certificates not found)")
  }
  console.log("[v0] To enable HTTPS for video chat, generate SSL certificates:")
  console.log("  openssl genrsa -out key.pem")
  console.log("  openssl req -new -key key.pem -out csr.pem")
  console.log("  openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem")
  console.log("  rm csr.pem")
}

const PORT = process.env.PORT || 3000
const PEER_PORT = process.env.PEER_PORT || 3001

const io = socketIo(server, {
  cors: corsOptions,
})

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
})

app.use("/peerjs", peerServer)

peerServer.on("connection", (client) => {
  console.log("[v0] Peer connected:", client.getId())
})

peerServer.on("disconnect", (client) => {
  console.log("[v0] Peer disconnected:", client.getId())
})

async function main() {
  try {
    await client.connect()
    console.log("[v0] MongoDB connected successfully")

    const db = client.db("chatapp")

    const usersCollection = db.collection("users")
    const superUser = await usersCollection.findOne({ username: "super" })
    if (!superUser) {
      await usersCollection.insertOne({
        username: "super",
        email: "super@example.com",
        password: "123",
        roles: ["SUPER_ADMIN"],
        groups: [],
        profileImage: "/userimages/profile-super-1759496146629.png",
        createdAt: new Date(),
      })
      console.log("[v0] Default super admin user created")
    }

    await usersCollection.createIndex({ username: 1 }, { unique: true })
    await db.collection("groups").createIndex({ name: 1 }, { unique: true })
    await db.collection("messages").createIndex({ groupName: 1, channelName: 1 })

    require("./routes/auth.js")(db, app)
    require("./routes/group.js")(db, app, ObjectId)
    require("./routes/channel.js")(db, app, ObjectId)
    require("./routes/upload.js")(db, app)

    sockets.connect(io, PORT, db)

    app.get("/api/health", (req, res) => {
      console.log("[v0] Health check endpoint called")
      res.json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() })
    })

    listen.listen(server, PORT)
    console.log(`[v0] PeerServer is available at /peerjs on port ${PORT}`)
  } catch (error) {
    console.error("[v0] Failed to start server:", error)
    process.exit(1)
  }
}

main()
