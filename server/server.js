//--------------------------------------------------------------------------------------------------
//	server.js
//--------------------------------------------------------------------------------------------------
const express = require("express")
const http = require("http")
const cors = require("cors")
const multer = require("multer")
const path = require("path")

const io = require("./io.js")

//--------------------------------------------------------------------------------------------------
const app = express()
app.use(cors())
app.use(express.json({ limit: "100mb" }))

//--------------------------------------------------------------------------------------------------
app.use("/", express.static("./"))
app.use("/images", express.static("./images"))

//--------------------------------------------------------------------------------------------------
app.post("/uploadImage", async (req, res, next) => { try {
    io.uploadImage(req.body)
} catch (e) { next(e) }})

//--------------------------------------------------------------------------------------------------
async function main(
) {
    var httpServer = http.createServer({}, app)
    httpServer.listen(8080)

    io.init(httpServer)

    console.log("Server running and listening at port 8080")
}

main()