const express = require("express")
const fs = require("fs")
const path = require("path")
const app = express()

const dotenv = require('dotenv')

// Load ENV data
dotenv.config()

const EXPRESS_PORT = process.env.EXPRESS_PORT || 8001
const VIDEO_PATH = process.env.VIDEO_PATH || "video/"
const VIDEO_FILE_TEST = process.env.VIDEO_FILE_TEST || "test.mp4"

app.listen(EXPRESS_PORT, function () {
    console.log(`Express API on.........PORT : ${EXPRESS_PORT}`)
    console.log(`Video Folder...........PATH : ${VIDEO_PATH}`)
})

// Testing HTML Page
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html")
})

// Stream Video Part

app.get("/video-test", function (req, res) {
    // Ensure there is a range given for the video
    const range = req.headers.range
    if (!range) {
        res.status(400).send("Requires Range header")
    }

    // get video stats (about 61MB)
    const videoPath = VIDEO_PATH + VIDEO_FILE_TEST
    const rootPath = path.join(__dirname, videoPath)
    const videoSize = fs.statSync(rootPath).size

    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6 // 1MB
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

    // Create headers
    const contentLength = end - start + 1
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(rootPath, { start, end })

    // Stream the video chunk to the client
    videoStream.pipe(res)
})