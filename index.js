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

socket.on("initMessages", (type, token, messages) => {
    if (type == "Private" && (!token || privateToken != token))
        return
    initMessages(type, messages)
})

socket.on("newMessage", (type, token, messages) => {
    if (type == "Private" && (!token || privateToken != token))
        return
    newMessages(type, messages)
})

socket.on("editMessage", (type, token, messages) => {
    if (type == "Private" && (!token || privateToken != token))
        return
    editMessages(type, messages)
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

    initMessages("Private", room.chat)
})

socket.on("error", (error) => {
    alert(error)
})

//--------------------------------------------------------------------------------------------------
function initMessages(type, messages) {
    var vChat = (type == "Public" ? publicChat : privateChat)

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
function newMessages(type, message) {
    var vChat = (type == "Public" ? publicChat : privateChat)

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
function editMessages(type, message) {
    var vChat = (type == "Public" ? publicChat : privateChat)

    let msg = document.getElementById(message.id)
    msg.innerHTML = "<b>" + message.name + "</b>: " + message.message
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
    if (token)
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