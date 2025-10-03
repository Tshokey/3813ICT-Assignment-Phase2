const express = require("express")
const formidable = require("formidable")
const path = require("path")
const fs = require("fs")

module.exports = (appData, saveData) => {
  const router = express.Router()

  const uploadFolder = path.join(__dirname, "..", "userimages")

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true })
  }

  router.post("/profile-image", (req, res) => {
    const form = new formidable.IncomingForm()
    form.uploadDir = uploadFolder
    form.keepExtensions = true

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.log("Error parsing the files")
        return res.status(400).json({
          status: "Fail",
          message: "There was an error parsing the files",
          error: err,
        })
      }

      let imageFile = files.image
      if (Array.isArray(imageFile)) {
        imageFile = imageFile[0]
      }

      if (!imageFile) {
        return res.status(400).json({
          status: "Fail",
          message: "No file uploaded",
        })
      }

      let username = fields.username
      if (Array.isArray(username)) {
        username = username[0]
      }

      if (!username) {
        return res.status(400).json({
          status: "Fail",
          message: "Username is required",
        })
      }

      const originalName = imageFile.originalFilename || imageFile.name || "image.jpg"
      const fileExt = path.extname(originalName) || ".jpg"
      const oldpath = imageFile.filepath || imageFile.path
      const filename = `profile-${username}-${Date.now()}${fileExt}`
      const newpath = path.join(uploadFolder, filename)

      fs.rename(oldpath, newpath, (err) => {
        if (err) {
          console.log("Error renaming file")
          return res.status(400).json({
            status: "Fail",
            message: "There was an error saving the file",
            error: err,
          })
        }

        const imageUrl = `/userimages/${filename}`

        // Update user's profile image in appData
        const user = appData.users.find((u) => u.username === username)
        if (!user) {
          return res.status(404).json({
            status: "Fail",
            message: "User not found",
          })
        }

        // Delete old profile image if it exists
        if (user.profileImage) {
          const oldImagePath = path.join(__dirname, "..", user.profileImage)
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath)
          }
        }

        user.profileImage = imageUrl
        saveData(appData)

        // Send response in formidable format
        res.send({
          result: "OK",
          data: {
            filename: filename,
            size: imageFile.size,
            imageUrl: imageUrl,
          },
          numberOfImages: 1,
          message: "upload successful",
        })
      })
    })
  })

  router.post("/chat-image", (req, res) => {
    const form = new formidable.IncomingForm()
    form.uploadDir = uploadFolder
    form.keepExtensions = true

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.log("Error parsing the files")
        return res.status(400).json({
          status: "Fail",
          message: "There was an error parsing the files",
          error: err,
        })
      }

      let imageFile = files.image
      if (Array.isArray(imageFile)) {
        imageFile = imageFile[0]
      }

      if (!imageFile) {
        return res.status(400).json({
          status: "Fail",
          message: "No file uploaded",
        })
      }

      const originalName = imageFile.originalFilename || imageFile.name || "image.jpg"
      const fileExt = path.extname(originalName) || ".jpg"
      const oldpath = imageFile.filepath || imageFile.path
      const filename = `chat-${Date.now()}${fileExt}`
      const newpath = path.join(uploadFolder, filename)

      fs.rename(oldpath, newpath, (err) => {
        if (err) {
          console.log("Error renaming file")
          return res.status(400).json({
            status: "Fail",
            message: "There was an error saving the file",
            error: err,
          })
        }

        const imageUrl = `/userimages/${filename}`

        // Send response in formidable format
        res.send({
          result: "OK",
          data: {
            filename: filename,
            size: imageFile.size,
            imageUrl: imageUrl,
          },
          numberOfImages: 1,
          message: "upload successful",
        })
      })
    })
  })

  // Delete uploaded image
  router.delete("/image", (req, res) => {
    try {
      const { imageUrl } = req.body
      if (!imageUrl) {
        return res.status(400).json({
          status: "Fail",
          message: "Image URL is required",
        })
      }

      const imagePath = path.join(__dirname, "..", imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
        res.json({
          result: "OK",
          message: "Image deleted successfully",
        })
      } else {
        res.status(404).json({
          status: "Fail",
          message: "Image not found",
        })
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      res.status(500).json({
        status: "Fail",
        message: "Failed to delete image",
      })
    }
  })

  return router
}
