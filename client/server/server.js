const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const https = require("https");
const http = require("http");
const { ExpressPeerServer } = require("peer");
const socketIo = require("socket.io");
const sockets = require("./socket.js");
const listen = require("./listen.js");
const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");

const corsOptions = {
  origin: ["http://localhost:4200", "https://localhost:4200"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/userimages", express.static(path.join(__dirname, "userimages")));

let server;
const certPath = path.join(__dirname, "cert.pem");
const keyPath = path.join(__dirname, "key.pem");
const useHTTP = process.env.USE_HTTP === "true";

if (!useHTTP && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
  server = https.createServer(options, app);
  console.log("HTTPS server created with SSL certificates");
} else {
  server = http.createServer(app);
  if (useHTTP) {
    console.log("HTTP server created (USE_HTTP=true)");
  } else {
    console.log("HTTP server created (SSL certificates not found)");
  }
  console.log("To enable HTTPS for video chat, generate SSL certificates:");
  console.log(" openssl genrsa -out key.pem");
  console.log(" openssl req -new -key key.pem -out csr.pem");
  console.log(" openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem");
  console.log(" rm csr.pem");
}

const PORT = process.env.PORT || 3000;

const io = socketIo(server, {
  cors: corsOptions,
})

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
})

app.use("/peerjs", peerServer);

peerServer.on("connection", (client) => {
  console.log("Peer connected:", client.getId());
})

peerServer.on("disconnect", (client) => {
  console.log("Peer disconnected:", client.getId());
})

async function main() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully");
    const db = client.db("chatapp");

    const usersCollection = db.collection("users");
    const superUser = await usersCollection.findOne({ username: "super" });
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
      console.log("Default super admin user created");
    }

    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await db.collection("groups").createIndex({ name: 1 }, { unique: true });
    await db.collection("messages").createIndex({ groupName: 1, channelName: 1 });

    require("./routes/auth.js")(db, app);
    require("./routes/group.js")(db, app, ObjectId);
    require("./routes/channel.js")(db, app, ObjectId);
    require("./routes/upload.js")(db, app);

    sockets.connect(io, PORT, db);

    listen.listen(server, PORT);
    console.log(`PeerServer is available at /peerjs on port ${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main()
