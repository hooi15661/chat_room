//--------------------------------------------------------------------------------------------------
const socket = io()

//--------------------------------------------------------------------------------------------------
document.getElementById("publicUploader").addEventListener("change", (e) => {
    imageUpload("public", e.target.files[0])
})

document.getElementById("privateUploader").addEventListener("change", (e) => {
    imageUpload("private", e.target.files[0])
})

//--------------------------------------------------------------------------------------------------
var privateToken = null

//--------------------------------------------------------------------------------------------------
socket.emit("initPublic")

socket.on("initMessages", (type, token, messages) => {
    if (type == "private" && (!token || privateToken != token))
        return
    initMessages(type, messages)
})

socket.on("newMessage", (type, token, messages) => {
    if (type == "private" && (!token || privateToken != token))
        return
    newMessage(type, messages)
})

socket.on("editMessage", (type, token, messages) => {
    if (type == "private" && (!token || privateToken != token))
        return
    updateMessage(type, messages)
})

socket.on("createdPrivate", (token) => {
    privateToken = token

    var privateRoom = document.getElementById("privateRoom")
    privateRoom.style.display = "block"
    privateChat.innerHTML = ""

    var roomName = document.getElementById("roomName")
    roomName.innerHTML = "Room token: " + privateToken
})

socket.on("joinedPrivate", (room) => {
    privateToken = room.token

    var privateRoom = document.getElementById("privateRoom")
    privateRoom.style.display = "block"

    var roomName = document.getElementById("roomName")
    roomName.innerHTML = "Room token: " + room.token

    initMessages("private", room.chat)
})

socket.on("error", (error) => {
    alert(error)
})

//--------------------------------------------------------------------------------------------------
function initMessages(type, messages) {
    var vChat = document.getElementById(type + "Chat")

    vChat.innerHTML = ""
    messages.forEach((v) => {
        let msg = document.createElement("p")
        msg.id = v.id
        if (v.image) {
            msg.innerHTML = "<b>" + v.name + "</b>: "
            const img = document.createElement("img")
            img.src = v.image
            img.style.width = "20%"
            img.onload = () => {
                msg.appendChild(img)
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

    vChat.scrollTop = vChat.scrollHeight
}

//--------------------------------------------------------------------------------------------------
function newMessage(type, message) {
    var vChat = document.getElementById(type + "Chat")

    let msg = document.createElement("p")
    msg.id = message.id
    if (message.image) {
        msg.innerHTML = "<b>" + message.name + "</b>: "
        const img = document.createElement("img")
        img.src = message.image
        img.style.width = "20%"
        img.onload = () => {
            msg.appendChild(img)
            vChat.scrollTop = vChat.scrollHeight
        }
    } else {
        msg.innerHTML = "<b>" + message.name + "</b>: " + message.message
        msg.style.overflowWrap = "break-word"
        msg.onclick = () => {
            editMessage(type, msg.id, msg.innerHTML)
        }
    }

    vChat.appendChild(msg)
    vChat.scrollTop = vChat.scrollHeight
}

//--------------------------------------------------------------------------------------------------
function updateMessage(type, message) {
    var vChat = document.getElementById(type + "Chat")

    let msg = document.getElementById(message.id)
    msg.innerHTML = "<b>" + message.name + "</b>: " + message.message
}

//--------------------------------------------------------------------------------------------------
function sendMessage(type) {
    var name = document.getElementById(type + "Name")
    var input = document.getElementById(type + "Input")

    if (input.value == "")
        return

    if (type == "public")
        socket.emit("sendPublic", { name: name.value, input: input.value })
    else
        socket.emit("sendPrivate", { token: privateToken, name: name.value, input: input.value })

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
        socket.emit("edit" + (type.charAt(0).toUpperCase() + type.slice(1)), { id: id, replace: replace })
}

//--------------------------------------------------------------------------------------------------
function clearMessages(type) {
    socket.emit("clear" + (type.charAt(0).toUpperCase() + type.slice(1)), privateToken)

    document.getElementById(type + "Chat").innerHTML = ""
}

//--------------------------------------------------------------------------------------------------
function privateCreate() {
    socket.emit("createPrivate")
}

//--------------------------------------------------------------------------------------------------
function privateJoin() {
    var token = prompt("Enter token", "")
    if (token)
        socket.emit("joinPrivate", token)
}

//--------------------------------------------------------------------------------------------------
function triggerUpload(type) {
    document.getElementById(type + "Uploader").click()
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

            let temp = { type: type, name: document.getElementById(type + "Name").value, image: imageData }
            if (type == "private")
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