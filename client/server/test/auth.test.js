const chai = require("chai")
const chaiHttp = require("chai-http")
const sinon = require("sinon")
const expect = chai.expect

chai.use(chaiHttp)

describe("Auth Routes", () => {
  let app
  let db
  let usersCollection
  let server

  beforeEach(() => {
    // Mock database and collections
    usersCollection = {
      findOne: sinon.stub(),
      find: sinon.stub(),
      insertOne: sinon.stub(),
      updateOne: sinon.stub(),
      deleteOne: sinon.stub(),
    }

    db = {
      collection: sinon.stub().returns(usersCollection),
    }

    // Create Express app
    const express = require("express")
    app = express()
    app.use(express.json())

    // Load auth routes
    const authRoutes = require("../routes/auth")
    authRoutes(db, app)

    server = app
  })

  afterEach(() => {
    sinon.restore()
  })

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", (done) => {
      const mockUser = {
        username: "testuser",
        password: "password123",
        email: "test@example.com",
        roles: ["USER"],
      }

      usersCollection.findOne.resolves(mockUser)

      chai
        .request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "password123" })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body).to.have.property("user")
          expect(res.body.user.username).to.equal("testuser")
          done()
        })
    })

    it("should fail login with invalid credentials", (done) => {
      usersCollection.findOne.resolves(null)

      chai
        .request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "wrongpassword" })
        .end((err, res) => {
          expect(res).to.have.status(401)
          expect(res.body).to.have.property("success", false)
          expect(res.body).to.have.property("message", "Invalid credentials")
          done()
        })
    })

    it("should handle server errors gracefully", (done) => {
      usersCollection.findOne.rejects(new Error("Database error"))

      chai
        .request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "password123" })
        .end((err, res) => {
          expect(res).to.have.status(500)
          expect(res.body).to.have.property("success", false)
          expect(res.body).to.have.property("message", "Server error")
          done()
        })
    })
  })

  describe("GET /api/auth/users", () => {
    it("should return all users", (done) => {
      const mockUsers = [
        { username: "user1", email: "user1@example.com", roles: ["USER"] },
        { username: "user2", email: "user2@example.com", roles: ["GROUP_ADMIN"] },
      ]

      usersCollection.find.returns({
        toArray: sinon.stub().resolves(mockUsers),
      })

      chai
        .request(server)
        .get("/api/auth/users")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an("array")
          expect(res.body).to.have.lengthOf(2)
          expect(res.body[0].username).to.equal("user1")
          done()
        })
    })

    it("should handle database errors", (done) => {
      usersCollection.find.returns({
        toArray: sinon.stub().rejects(new Error("Database error")),
      })

      chai
        .request(server)
        .get("/api/auth/users")
        .end((err, res) => {
          expect(res).to.have.status(500)
          expect(res.body).to.have.property("success", false)
          done()
        })
    })
  })

  describe("POST /api/auth/users", () => {
    it("should create a new user successfully", (done) => {
      const newUser = {
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
        roles: ["USER"],
      }

      usersCollection.findOne.resolves(null)
      usersCollection.insertOne.resolves({ insertedId: "123456" })

      chai
        .request(server)
        .post("/api/auth/users")
        .send(newUser)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body).to.have.property("user")
          expect(res.body.user.username).to.equal("newuser")
          done()
        })
    })

    it("should fail if user already exists", (done) => {
      const existingUser = { username: "existinguser" }

      usersCollection.findOne.resolves(existingUser)

      chai
        .request(server)
        .post("/api/auth/users")
        .send({ username: "existinguser", email: "test@example.com", password: "pass" })
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property("success", false)
          expect(res.body).to.have.property("message", "User already exists")
          done()
        })
    })
  })

  describe("PUT /api/auth/users/:username", () => {
    it("should update user successfully", (done) => {
      const existingUser = { username: "testuser", email: "old@example.com" }
      const updatedUser = { username: "testuser", email: "new@example.com" }

      usersCollection.findOne.onFirstCall().resolves(existingUser)
      usersCollection.findOne.onSecondCall().resolves(updatedUser)
      usersCollection.updateOne.resolves({ modifiedCount: 1 })

      chai
        .request(server)
        .put("/api/auth/users/testuser")
        .send({ email: "new@example.com" })
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body.user.email).to.equal("new@example.com")
          done()
        })
    })

    it("should return 404 if user not found", (done) => {
      usersCollection.findOne.resolves(null)

      chai
        .request(server)
        .put("/api/auth/users/nonexistent")
        .send({ email: "new@example.com" })
        .end((err, res) => {
          expect(res).to.have.status(404)
          expect(res.body).to.have.property("success", false)
          expect(res.body).to.have.property("message", "User not found")
          done()
        })
    })
  })

  describe("DELETE /api/auth/users/:username", () => {
    it("should delete user successfully", (done) => {
      const existingUser = { username: "testuser" }

      usersCollection.findOne.resolves(existingUser)
      usersCollection.deleteOne.resolves({ deletedCount: 1 })

      chai
        .request(server)
        .delete("/api/auth/users/testuser")
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("success", true)
          expect(res.body).to.have.property("message", "User deleted")
          done()
        })
    })

    it("should return 404 if user not found", (done) => {
      usersCollection.findOne.resolves(null)

      chai
        .request(server)
        .delete("/api/auth/users/nonexistent")
        .end((err, res) => {
          expect(res).to.have.status(404)
          expect(res.body).to.have.property("success", false)
          expect(res.body).to.have.property("message", "User not found")
          done()
        })
    })
  })
})
