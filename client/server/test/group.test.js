const chai = require("chai")
const chaiHttp = require("chai-http")
const sinon = require("sinon")
const expect = chai.expect

chai.use(chaiHttp)

describe("Group Routes", () => {
  let app
  let db
  let groupsCollection
  let server

  beforeEach(() => {
    groupsCollection = {
      find: sinon.stub(),
      findOne: sinon.stub(),
      insertOne: sinon.stub(),
      updateOne: sinon.stub(),
      deleteOne: sinon.stub(),
    }

    db = {
      collection: sinon.stub().returns(groupsCollection),
    }

    const express = require("express")
    app = express()
    app.use(express.json())

    const groupRoutes = require("../routes/group")
    groupRoutes(db, app)

    server = app
  })

  afterEach(() => {
    sinon.restore()
  })

  describe("GET /api/groups", () => {
    it("should return all groups", (done) => {
      const mockGroups = [
        { name: "Group1", members: [], admins: [] },
        { name: "Group2", members: [], admins: [] },
      ]

      groupsCollection.find.returns({
        toArray: sinon.stub().resolves(mockGroups),
      })

      chai
        .request(server)
        .get("/api/groups")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an("array")
          expect(res.body).to.have.lengthOf(2)
          done()
        })
    })
  })

  describe("POST /api/groups", () => {
    it("should create a new group", (done) => {
      groupsCollection.findOne.resolves(null)
      groupsCollection.insertOne.resolves({ insertedId: "123" })

      chai
        .request(server)
        .post("/api/groups")
        .send({
          name: "NewGroup",
          createdBy: "admin",
          admins: ["admin"],
          members: [],
        })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body.group.name).to.equal("NewGroup")
          done()
        })
    })

    it("should fail if group already exists", (done) => {
      groupsCollection.findOne.resolves({ name: "ExistingGroup" })

      chai
        .request(server)
        .post("/api/groups")
        .send({ name: "ExistingGroup", createdBy: "admin" })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property("message", "Group already exists")
          done()
        })
    })
  })

  describe("POST /api/groups/:groupName/join", () => {
    it("should send join request", (done) => {
      const mockGroup = { name: "Group1", interested: [], members: [] }

      groupsCollection.findOne.resolves(mockGroup)
      groupsCollection.updateOne.resolves({ modifiedCount: 1 })

      chai
        .request(server)
        .post("/api/groups/Group1/join")
        .send({ username: "user1" })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body).to.have.property("message", "Join request sent")
          done()
        })
    })
  })

  describe("POST /api/groups/:groupName/approve", () => {
    it("should approve user join request", (done) => {
      const mockGroup = { name: "Group1", interested: ["user1"], members: [] }

      groupsCollection.findOne.resolves(mockGroup)
      groupsCollection.updateOne.resolves({ modifiedCount: 1 })

      chai
        .request(server)
        .post("/api/groups/Group1/approve")
        .send({ username: "user1" })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body).to.have.property("message", "User approved")
          done()
        })
    })
  })

  describe("DELETE /api/groups/:groupName", () => {
    it("should delete a group", (done) => {
      const mockGroup = { name: "Group1" }

      groupsCollection.findOne.resolves(mockGroup)
      groupsCollection.deleteOne.resolves({ deletedCount: 1 })

      chai
        .request(server)
        .delete("/api/groups/Group1")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          done()
        })
    })
  })
})
