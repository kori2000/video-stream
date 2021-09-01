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
app.get('/stream/:file', (req, res) => {

    let video_file_param = req.params.file
    console.log("Video File : ", video_file_param)

    // get video stats
    const videoPath = VIDEO_PATH + video_file_param
    const filePath = path.join(__dirname, videoPath)

    const options = {}

    let start
    let end

    const range = req.headers.range
    if (range) {
        const bytesPrefix = "bytes="
        if (range.startsWith(bytesPrefix)) {
            const bytesRange = range.substring(bytesPrefix.length)
            const parts = bytesRange.split("-")
            if (parts.length === 2) {
                const rangeStart = parts[0] && parts[0].trim()
                if (rangeStart && rangeStart.length > 0) {
                    options.start = start = parseInt(rangeStart)
                }
                const rangeEnd = parts[1] && parts[1].trim()
                if (rangeEnd && rangeEnd.length > 0) {
                    options.end = end = parseInt(rangeEnd)
                }
            }
        }
    }

    res.setHeader("content-type", "video/mp4")

    // Open Video File
    fs.stat(filePath, (err, stat) => {
        if (err) {
            console.error(`File stat error for ${filePath}.`)
            console.error(err)
            res.sendStatus(500)
            return
        }

        let contentLength = stat.size

        if (req.method === "HEAD") {
            res.statusCode = 200
            res.setHeader("accept-ranges", "bytes")
            res.setHeader("content-length", contentLength)
            res.end()
        }
        else {        
            let retrievedLength
            if (start !== undefined && end !== undefined) {
                retrievedLength = (end+1) - start
            }
            else if (start !== undefined) {
                retrievedLength = contentLength - start
            }
            else if (end !== undefined) {
                retrievedLength = (end+1)
            }
            else {
                retrievedLength = contentLength
            }

            res.statusCode = start !== undefined || end !== undefined ? 206 : 200

            res.setHeader("content-length", retrievedLength)

            if (range !== undefined) {  
                res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`)
                res.setHeader("accept-ranges", "bytes")
            }

            const fileStream = fs.createReadStream(filePath, options)
            fileStream.on("error", error => {
                console.log(`Error reading file ${filePath}.`)
                console.log(error)
                res.sendStatus(500)
            })
            
            fileStream.pipe(res)
        }
    })
})