const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const app = express()
const https = require("https")
const { ExpressPeerServer } = require("peer")
const socketIo = require("socket.io")
const sockets = require("./socket.js")
const listen = require("./listen.js")

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

// Check if SSL certificates exist and USE_HTTP is not set
if (!useHTTP && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
  server = https.createServer(options, app)
  console.log("[v0] HTTPS server created with SSL certificates")
} else {
  // Fallback to HTTP if certificates don't exist or USE_HTTP is true
  const http = require("http")
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

const DATA_FILE = path.join(__dirname, "data", "data.json")

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8")
      if (data) {
        const parsedData = JSON.parse(data)
        const defaultData = getDefaultData()
        return {
          users: parsedData.users || defaultData.users,
          groups: parsedData.groups || defaultData.groups,
          channels: parsedData.channels || defaultData.channels,
          userReports: parsedData.userReports || defaultData.userReports,
          messages: parsedData.messages || defaultData.messages,
        }
      }
    }
  } catch (error) {
    console.error("Error loading data: ", error)
  }
  return getDefaultData()
}

function saveData(data) {
  try {
    const dataToSave = {
      users: data.users || [],
      groups: data.groups || [],
      channels: data.channels || [],
      userReports: data.userReports || [],
      messages: data.messages || [],
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2))
    console.log("Data saved to JSON file")
  } catch (error) {
    console.error("Error saving data: ", error)
  }
}

function getDefaultData() {
  return {
    users: [
      {
        id: 1,
        username: "super",
        password: "123",
        email: "super@gmail.com",
        roles: ["SUPER_ADMIN"],
        groups: [],
        profileImage: null,
      },
    ],
    groups: [],
    channels: [],
    userReports: [],
    messages: [],
  }
}

const appData = loadData()

console.log("[v0] Loaded appData structure:", {
  users: appData.users?.length || 0,
  groups: appData.groups?.length || 0,
  channels: appData.channels?.length || 0,
  messages: appData.messages?.length || 0,
  userReports: appData.userReports?.length || 0,
})

const authRoutes = require("./routes/auth")
const groupRoutes = require("./routes/group")
const channelRoutes = require("./routes/channel")
const uploadRoutes = require("./routes/upload")

app.use("/api/auth", authRoutes(appData, saveData))
app.use("/api/groups", groupRoutes(appData, saveData))
app.use("/api/channels", channelRoutes(appData, saveData))
app.use("/api/upload", uploadRoutes(appData, saveData))

app.get("/api/health", (req, res) => {
  console.log("[v0] Health check endpoint called")
  res.json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
const PEER_PORT = process.env.PEER_PORT || 3001

const io = socketIo(server, {
  cors: corsOptions,
})

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/", // Changed from "/peerjs" to "/" for proper mounting
})

app.use("/peerjs", peerServer) // Changed from "/" to "/peerjs" to avoid root path conflict

peerServer.on("connection", (client) => {
  console.log("[v0] Peer connected:", client.getId())
})

peerServer.on("disconnect", (client) => {
  console.log("[v0] Peer disconnected:", client.getId())
})

sockets.connect(io, PORT, appData, saveData)

listen.listen(server, PORT)

console.log(`[v0] PeerServer is available at /peerjs on port ${PORT}`)
