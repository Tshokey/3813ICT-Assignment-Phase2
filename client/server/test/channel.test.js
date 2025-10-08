const chai = require("chai")
const chaiHttp = require("chai-http")
const sinon = require("sinon")
const expect = chai.expect

chai.use(chaiHttp)

describe("Channel Routes", () => {
  let app
  let db
  let channelsCollection
  let messagesCollection
  let userReportsCollection
  let server

  beforeEach(() => {
    // Mock collections
    channelsCollection = {
      find: sinon.stub(),
      findOne: sinon.stub(),
      insertOne: sinon.stub(),
      updateOne: sinon.stub(),
      deleteOne: sinon.stub(),
    }

    messagesCollection = {
      find: sinon.stub(),
      insertOne: sinon.stub(),
    }

    userReportsCollection = {
      find: sinon.stub(),
      insertOne: sinon.stub(),
    }

    db = {
      collection: sinon.stub().callsFake((name) => {
        if (name === "channels") return channelsCollection
        if (name === "messages") return messagesCollection
        if (name === "userReports") return userReportsCollection
      }),
    }

    const express = require("express")
    app = express()
    app.use(express.json())

    const channelRoutes = require("../routes/channel")
    channelRoutes(db, app)

    server = app
  })

  afterEach(() => {
    sinon.restore()
  })

  describe("GET /api/channels", () => {
    it("should return all channels", (done) => {
      const mockChannels = [
        { name: "general", groupName: "Group1", members: [] },
        { name: "random", groupName: "Group1", members: [] },
      ]

      channelsCollection.find.returns({
        toArray: sinon.stub().resolves(mockChannels),
      })

      chai
        .request(server)
        .get("/api/channels")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an("array")
          expect(res.body).to.have.lengthOf(2)
          done()
        })
    })
  })

  describe("GET /api/channels/group/:groupName", () => {
    it("should return channels for a specific group", (done) => {
      const mockChannels = [{ name: "general", groupName: "Group1", members: [] }]

      channelsCollection.find.returns({
        toArray: sinon.stub().resolves(mockChannels),
      })

      chai
        .request(server)
        .get("/api/channels/group/Group1")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an("array")
          expect(res.body[0].groupName).to.equal("Group1")
          done()
        })
    })
  })

  describe("POST /api/channels", () => {
    it("should create a new channel", (done) => {
      channelsCollection.findOne.resolves(null)
      channelsCollection.insertOne.resolves({ insertedId: "123" })

      chai
        .request(server)
        .post("/api/channels")
        .send({ name: "newchannel", groupName: "Group1", members: [] })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body.channel.name).to.equal("newchannel")
          done()
        })
    })

    it("should fail if channel already exists", (done) => {
      channelsCollection.findOne.resolves({ name: "existing" })

      chai
        .request(server)
        .post("/api/channels")
        .send({ name: "existing", groupName: "Group1" })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property("success", false)
          done()
        })
    })
  })

  describe("GET /api/channels/:channelName/messages", () => {
    it("should return messages for a channel", (done) => {
      const mockMessages = [{ channelName: "general", groupName: "Group1", username: "user1", message: "Hello" }]

      messagesCollection.find.returns({
        sort: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        toArray: sinon.stub().resolves(mockMessages),
      })

      chai
        .request(server)
        .get("/api/channels/general/messages?groupName=Group1")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an("array")
          expect(res.body[0].message).to.equal("Hello")
          done()
        })
    })

    it("should require groupName parameter", (done) => {
      chai
        .request(server)
        .get("/api/channels/general/messages")
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property("message", "Group name is required")
          done()
        })
    })
  })

  describe("POST /api/channels/:channelName/messages", () => {
    it("should post a new message", (done) => {
      messagesCollection.insertOne.resolves({ insertedId: "123" })

      chai
        .request(server)
        .post("/api/channels/general/messages")
        .send({
          groupName: "Group1",
          username: "user1",
          message: "Hello world",
        })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body.message.message).to.equal("Hello world")
          done()
        })
    })

    it("should fail without required fields", (done) => {
      chai
        .request(server)
        .post("/api/channels/general/messages")
        .send({ username: "user1" })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property("message", "Missing required fields")
          done()
        })
    })
  })

  describe("POST /api/channels/:channelName/join", () => {
    it("should allow user to join channel", (done) => {
      const mockChannel = { name: "general", groupName: "Group1", members: [], bannedUsers: [] }

      channelsCollection.findOne.resolves(mockChannel)
      channelsCollection.updateOne.resolves({ modifiedCount: 1 })

      chai
        .request(server)
        .post("/api/channels/general/join")
        .send({ groupName: "Group1", username: "user1" })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          done()
        })
    })

    it("should return 404 if channel not found", (done) => {
      channelsCollection.findOne.resolves(null)

      chai
        .request(server)
        .post("/api/channels/nonexistent/join")
        .send({ groupName: "Group1", username: "user1" })
        .end((err, res) => {
          expect(res).to.have.status(404)
          expect(res.body).to.have.property("message", "Channel not found")
          done()
        })
    })
  })

  describe("DELETE /api/channels/:channelName", () => {
    it("should delete a channel", (done) => {
      const mockChannel = { name: "general", groupName: "Group1" }

      channelsCollection.findOne.resolves(mockChannel)
      channelsCollection.deleteOne.resolves({ deletedCount: 1 })

      chai
        .request(server)
        .delete("/api/channels/general?groupName=Group1")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          done()
        })
    })
  })
})
