//--------------------------------------------------------------------------------------------------
//	io.js
//--------------------------------------------------------------------------------------------------
const fs = require("fs")
const { Server } = require("socket.io")

var io
var publicChat = []
var privateChat = []

//--------------------------------------------------------------------------------------------------
exports.init = async function(
    server
) {
    io = new Server(server, { addTrailingSlash: false })

    io.on("connection", (socket) => {
        socket.on("initPublic", () => {
            socket.join("public")
            io.to("public").emit("showChat", "Public", null, publicChat, true)
        })

        socket.on("sendPublic", (payload) => {
            publicChat.push({ id: "public_" + publicChat.length, name: (payload.name == "" ? "Anonymous" : payload.name), message: payload.input })
            io.to("public").emit("showChat", "Public", null, publicChat, true)
        })

        socket.on("editPublic", (payload) => {
            var index = publicChat.findIndex(v => v.id == payload.id)
            if (index > -1)
                publicChat[index].message = payload.replace
            io.to("public").emit("showChat", "Public", null, publicChat, false)
        })

        socket.on("createPrivate", () => {
            var token = Math.floor(Math.random() * 9000) + 1000
            while (privateChat.findIndex(v => v.token == token) > -1)
                token = Math.floor(Math.random() * 9000) + 1000
            privateChat.push({ token: token, chat: [] })

            var roomList = [...socket.rooms]
            roomList.splice(roomList.indexOf(socket.id), 1)
            roomList.splice(roomList.indexOf("public"), 1)
            if (roomList.length > 0) {
                roomList.forEach((v) => {
                    socket.leave(v)
                })
            }
            socket.join(parseInt(token))
            socket.emit("createdPrivate", token)
        })

        socket.on("joinPrivate", (token) => {
            var index = privateChat.findIndex(v => v.token == token)
            if (index == -1) {
                socket.emit("error", "No room with that token")
            } else {
                var roomList = [...socket.rooms]
                roomList.splice(roomList.indexOf(socket.id), 1)
                roomList.splice(roomList.indexOf("public"), 1)
                if (roomList.length > 0) {
                    roomList.forEach((v) => {
                        socket.leave(v)
                    })
                }
                socket.join(parseInt(token))
                socket.emit("joinedPrivate", privateChat[index])
            }
        })

        socket.on("sendPrivate", (payload) => {
            var index = privateChat.findIndex(v => v.token == payload.token)
            if (index > -1) {
                privateChat[index].chat.push({ id: privateChat[index].token + "_" + privateChat[index].chat.length, name: (payload.name == "" ? "Anonymous" : payload.name), message: payload.input })
                io.to(parseInt(payload.token)).emit("showChat", "Private", parseInt(payload.token), privateChat[index].chat, true)
            }
        })

        socket.on("editPrivate", (payload) => {
            var token = parseInt(payload.id.split("_")[0])

            var index = privateChat.findIndex(v => v.token == token)
            if (index > -1) {
                var index2 = privateChat[index].chat.findIndex(v => v.id == payload.id)
                if (index2 > -1) {
                    privateChat[index].chat[index2].message = payload.replace
                    io.to(token).emit("showChat", "Private", token, privateChat[index].chat, false)
                }
            }
        })
    })
}

exports.uploadImage = async function(
    prop
) {
    var targetFile = ""
    if (prop.type == "Public") {
        targetFile = "public_" + publicChat.length + ".jpeg"
    } else {
        var index = privateChat.findIndex(v => v.token == prop.token)
        targetFile = "token_" + privateChat[index].chat.length + ".jpeg"
    }

    var buffer = Buffer.from(prop.image, "base64")
    fs.writeFileSync("./images/" + targetFile, buffer)

    if (prop.type == "Public") {
        publicChat.push({ id: "public_" + publicChat.length, name: (prop.name == "" ? "Anonymous" : prop.name), image: "images/" + targetFile })
        io.to("public").emit("showChat", "Public", null, publicChat, true)
    } else {
        privateChat[index].chat.push({ id: privateChat[index].token + "_" + privateChat[index].chat.length, name: (prop.name == "" ? "Anonymous" : prop.name), image: "images/" + targetFile })
        io.to(parseInt(prop.token)).emit("showChat", "Private", parseInt(prop.token), privateChat[index].chat, true)
    }
}