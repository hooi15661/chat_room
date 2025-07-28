//--------------------------------------------------------------------------------------------------
const socket = io()

//--------------------------------------------------------------------------------------------------
const publicChat = document.getElementById("publicChat")
const privateChat = document.getElementById("privateChat")
const publicUploader = document.getElementById("publicUploader")
publicUploader.addEventListener("change", (e) => {
    imageUpload("Public", e.target.files[0])
})
const privateUploader = document.getElementById("privateUploader")
privateUploader.addEventListener("change", (e) => {
    imageUpload("Private", e.target.files[0])
})

//--------------------------------------------------------------------------------------------------
var privateToken = null

//--------------------------------------------------------------------------------------------------
socket.emit("initPublic")

socket.on("showChat", (type, token, chat, seeLast) => {
    if (type == "Private" && (!token || privateToken != token))
        return
    showChat(type, chat, seeLast)
})

socket.on("createdPrivate", (token) => {
    privateToken = token

    var privateRoom = document.getElementById("privateRoom")
    privateRoom.style.display = "block"

    var roomName = document.getElementById("roomName")
    roomName.innerHTML = "Room token: " + privateToken
})

socket.on("joinedPrivate", (room) => {
    privateToken = room.token

    var privateRoom = document.getElementById("privateRoom")
    privateRoom.style.display = "block"

    var roomName = document.getElementById("roomName")
    roomName.innerHTML = "Room token: " + room.token

    showChat("Private", room.chat, true)
})

socket.on("error", (error) => {
    alert(error)
})

//--------------------------------------------------------------------------------------------------
function showChat(type, chat, seeLast) {
    var vChat = (type == "Public" ? publicChat : privateChat)

    vChat.innerHTML = ""
    chat.forEach((v) => {
        let msg = document.createElement("p")
        msg.id = v.id
        if (v.image) {
            msg.innerHTML = "<b>" + v.name + "</b>: "
            const img = document.createElement("img")
            img.src = v.image
            img.style.width = "20%"
            img.onload = () => {
                msg.appendChild(img)
                if (seeLast)
                    vChat.scrollTop = vChat.scrollHeight
            }
        } else {
            msg.innerHTML = "<b>" + v.name + "</b>: " + v.message
            msg.style.overflowWrap = "break-word"
            msg.onclick = () => {
                editMessage(type, msg.id, msg.innerHTML)
            }
        }
        vChat.appendChild(msg)
    })

    if (seeLast)
        vChat.scrollTop = vChat.scrollHeight
}

//--------------------------------------------------------------------------------------------------
function publicSend() {
    var name = document.getElementById("publicName")
    var input = document.getElementById("publicInput")

    if (input.value == "")
        return

    socket.emit("sendPublic", { name: name.value, input: input.value })

    name.value = ""
    input.value = ""
}

//--------------------------------------------------------------------------------------------------
function editMessage(type, id, message) {
    var temp = message.replace("<b>", "")
    temp = temp.replace("</b>", "")
    var temp2 = temp.split(": ")
    var replace = prompt("Edit", temp2[1])

    if (replace)
        socket.emit("edit" + type, { id: id, replace: replace })
}

//--------------------------------------------------------------------------------------------------
function privateCreate() {
    socket.emit("createPrivate")
}

//--------------------------------------------------------------------------------------------------
function privateJoin() {
    var token = prompt("Enter token", "")
    socket.emit("joinPrivate", token)
}

//--------------------------------------------------------------------------------------------------
function privateSend() {
    var name = document.getElementById("privateName")
    var input = document.getElementById("privateInput")

    if (input.value == "")
        return

    socket.emit("sendPrivate", { token: privateToken, name: name.value, input: input.value })

    name.value = ""
    input.value = ""
}

//--------------------------------------------------------------------------------------------------
function triggerUpload(type) {
    switch (type) {
        case "Public":
            publicUploader.click()
            break

        case "Private":
            privateUploader.click()
            break
    }
}

//--------------------------------------------------------------------------------------------------
async function imageUpload(type, file) {
    if (!file)
        return

    var reader = new FileReader()
    reader.onload = (e) => {
        let img = new Image()
        img.onload = () => {
            let canvas = document.createElement("canvas")
            let ctx = canvas.getContext("2d")
            canvas.width = 600
            canvas.height = 800
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            let imageData = canvas.toDataURL("image/jpeg").replace("data:image/jpeg;base64,", "")

            let temp = { type: type, name: (type == "Public" ? document.getElementById("publicName").value : document.getElementById("privateName").value), image: imageData }
            if (type == "Private")
                temp.token = privateToken
            let obj = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(temp)
            }

            let res = fetch("/uploadImage", obj)
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}