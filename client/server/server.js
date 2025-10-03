const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const app = express()
const http = require("http")
const socketIo = require("socket.io")
const sockets = require("./socket.js")
const listen = require("./listen.js")

app.use(cors())
app.use(express.json())

app.use("/userimages", express.static(path.join(__dirname, "userimages")))

const server = http.createServer(app)

const DATA_FILE = path.join(__dirname, "data", "data.json")

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8")
      if (data) {
        const parsedData = JSON.parse(data)
        // Merge with default data to ensure all required properties exist
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

const PORT = process.env.PORT || 3000

const options = {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
}
const io = socketIo(server, options)

sockets.connect(io, PORT, appData, saveData)

listen.listen(server, PORT)
