const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const sockets = require("./socket.js");
const listen = require("./listen.js");

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const DATA_FILE = path.join(__dirname, "data", "data.json");

function loadData(){
    try{
        if(fs.existsSync(DATA_FILE)){
            const data = fs.readFileSync(DATA_FILE, "utf8");
            return data ? JSON.parse(data) : getDefaultData();
        }
    }catch(error){
        console.error("Error loading data: ", error);
    }
    return getDefaultData();
};

function saveData(data){
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log("Data saved to JSON file");
    }catch(error){
        console.error("Error saving data: ", error);
    }
};

function getDefaultData(){
    return{
        users: [
            {
                id: 1,
                username: "super",
                password: '123',
                email: 'super@gmail.com',
                roles: ['SUPER_ADMIN'],
                groups: [],
            },
        ],
        groups: [],
        channels: [],
        userReports: [],
    }
};

const appData = loadData();

const authRoutes = require("./routes/auth")
const groupRoutes = require("./routes/group")
const channelRoutes = require("./routes/channel")

app.use("/api/auth", authRoutes(appData, saveData))
app.use("/api/groups", groupRoutes(appData, saveData))
app.use("/api/channels", channelRoutes(appData, saveData))

const PORT = process.env.PORT || 3000;

const options = {
    cors: {
        origin:'http://localhost:4200',
        methods:['GET','POST'],
    }
};
const io = socketIo(server, options);


sockets.connect(io, PORT);

listen.listen(server, PORT);