var announceToggle = false;
var brainRot = false;
var notificationNumber = 0;
var everyoneRevealed = false;
var joined = true;
var messageSleep = 0;
var imageSleep = 0;
let active_users;
let inactive_users;
var globalMessages = [];
var loadSubsequentMessages = false;
var firstLoad = true;
var timeoutId = false;
var clearchatId = false;
var globalActive;
let db, auth, storage, requestId;

function getChats() {
    document.getElementById("getChatsButton").remove();
    
    db.ref(`users/${getUsername()}`).once("value", function(user_object) {
        db.ref('chats/').on('child_added', function(message_object) {
            globalMessages.push(message_object);

            const data = message_object;
            const obj = user_object.val();
            const index = globalMessages.length - 1;
            const textarea = document.getElementById('textarea');
            const y_scroll = textarea.scrollTop;
            var message_height = 0;

            if ((data.val().whisper == null || data.val().whisper == getUsername() || data.val().name == getUsername() || obj.admin >= 9000) && (data.val().channel == (sessionStorage.getItem("channel") || "general") || (data.val().name == "[SERVER]" && sessionStorage.getItem("channel") !== "extra"))) {
                if (everyoneRevealed) {
                    // var username = data.val().real_name || "[SERVER]";
                } else {
                    var username = data.val().name;
                }

                var message = data.val().message;
                
                let prevIndex = index - 1;
                let prevItem = prevIndex >= 0 ? globalMessages[prevIndex] : null;
                
                var messageElement = document.createElement("div");
                messageElement.setAttribute("class", "message");
                messageElement.setAttribute("id", data.key);

                if (data.val().display_name == "[SERVER]") {
                    var messageImg = document.createElement("img");
                    messageImg.src = "../images/meteorite.png";
                    messageImg.setAttribute("class", "profile-img");
                    messageElement.appendChild(messageImg);
                }
                // else if (data.val().admin >= 2 && data.val().profileimage && (prevItem == null || prevItem.val().display_name != data.val().display_name || prevItem.val().channel != data.val().channel || data.val().edited)) {
                //     storage.ref(`${data.val().name}/profile/${data.val().profileimage}`).getDownloadURL().then((url) => {
                //         var messageImg = document.createElement("img");
                //         messageImg.src = url;
                //         messageImg.setAttribute("class", "profile-img");
                //         messageElement.prepend(messageImg);
                //     })
                // }

                var timeElement = document.createElement("div");
                var currTime;
                timeElement.setAttribute("id", "time");
                currTime = new Date(data.val().time);
                timeElement.innerHTML = (currTime.getMonth() + 1) + "/" + currTime.getDate() + "/" + currTime.getFullYear() + " " + currTime.getHours().toString().padStart(2, '0') + ":" + currTime.getMinutes().toString().padStart(2, '0');
                messageElement.appendChild(timeElement);

                if (data.val().display_name == "[SERVER]") {
                    var userElement = document.createElement("div");
                    userElement.setAttribute("class", "username");
                    userElement.innerHTML = data.val().display_name;
                    userElement.style.fontWeight = "bold";
                    userElement.style.color = "Yellow";
                    userElement.addEventListener("click", function(e) {
                        if (userElement.innerHTML.includes("@")) {
                            userElement.innerHTML = data.val().display_name;
                        } else {
                            userElement.innerHTML = data.val().display_name + " @(" + username + ")";
                        }
                    })
                    messageElement.appendChild(userElement);
                } else if (prevItem == null || prevItem.val().display_name != data.val().display_name || prevItem.val().channel != data.val().channel || data.val().edited) {
                    var userElement = document.createElement("div");
                    userElement.setAttribute("class", "username");
                    userElement.addEventListener("click", function(e) {
                        if (userElement.innerHTML.includes("@")) {
                            userElement.innerHTML = data.val().display_name;
                        } else {
                            userElement.innerHTML = data.val().display_name + " @(" + username + ")";
                        }
                    })
                    userElement.innerHTML = data.val().display_name;
                    if (data.val().edited) {
                        userElement.innerHTML += " <span style='color: gray; font-size: 60%'>(Edited)</span>";
                    }
                    userElement.style.fontWeight = "bold";
                    timeElement.style.marginTop = "25px";
                    messageElement.appendChild(userElement);
                }



                messageElement.addEventListener("mouseover", function(e) {
                    messageContent.style.backgroundColor = "gray";
                    if ((data.val().name == getUsername() || data.val().admin < obj.admin) && !messageElement.querySelector("#delete-button") && !globalMessages[index].val().removed) {
                        setTimeout(() => {
                            var trashButton = document.createElement("button");
                            timeElement.style.visibility = "hidden";
                            trashButton.innerHTML = "🗑️️";
                            trashButton.setAttribute("id", "delete-button");
                            trashButton.addEventListener("click", function() {
                                db.ref("chats/" + globalMessages[index].key).remove();
                            })
                            messageElement.appendChild(trashButton);
                        }, 100);
                    }
                    if (data.val().name == getUsername() && !messageElement.querySelector("#edit-button") && !globalMessages[index].val().removed) {
                        var editing_message = localStorage.getItem("editing");
                        var editButton = document.createElement("button");
                        var textBox = document.getElementById("text-box");
                        editButton.setAttribute("id", "edit-button");
                        timeElement.style.visibility = "hidden";
                        if (editing_message == globalMessages[index].key) {
                            editButton.innerHTML = "🗙";
                        } else {
                            editButton.innerHTML = "✏️";
                        }
                        editButton.addEventListener("click", function() {
                            if (editing_message == globalMessages[index].key) {
                                editButton.innerHTML = "✏️";
                                localStorage.removeItem("editing");
                                textBox.value = "";
                                textBox.focus();
                            } else {
                                editButton.innerHTML = "🗙";
                                db.ref(`chats/${globalMessages[index].key}/message`).once("value", function(edit_message) {
                                    textBox.value = unsanitize(edit_message.val());
                                })
                                textBox.focus();
                                localStorage.setItem("editing", globalMessages[index].key);
                            }
                        });

                        messageElement.appendChild(editButton);
                    }
                })
                messageElement.addEventListener("mouseleave", function(e) {
                    messageContent.style.backgroundColor = "";
                    timeElement.style.visibility = "visible";

                    setTimeout(() => {
                        var buttons = messageElement.querySelectorAll("#delete-button, #edit-button");
                        buttons.forEach(function(button) {
                            button.remove();
                        })
                        timeElement.style.visibility = "visible";
                    }, 100)
                })
                

                var messageContent = document.createElement("div");
                messageContent.setAttribute("class", "message-text");

                // Fix escaped LaTeX delimiters
                // message = message
                //     .replace(/\\\\\(/g, "\\(")   // \\( -> \(
                //     .replace(/\\\\\)/g, "\\)")   // \\) -> \)
                //     .replace(/\\\\\[/g, "\\[")   // \\[ -> \[
                //     .replace(/\\\\\]/g, "\\]");  // \\] -> \]
                if (data.val().type === "image") {
                    var imageContent = document.createElement("img");
                    imageContent.style.maxWidth = "70%";
                    imageContent.style.maxHeight = "30vh";
                    storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                        imageContent.src = url;
                    }).catch((error) => {
                        imageContent.src = "../images/504708-200.png";
                        messageContent.innerHTML += "Failed to load image";
                        console.log(error);
                    })
                    messageContent.appendChild(imageContent);
                    messageElement.appendChild(messageContent);
                } else if (data.val().type === "video") {
                    var videoContent = document.createElement("video");
                    videoContent.style.maxWidth = "70%";
                    videoContent.style.maxHeight = "30vh";
                    videoContent.controls = true;
                    storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                        videoContent.src = url;
                    }).catch((error) => {
                        messageContent.innerHTML += "Failed to load video";
                        console.log(error);
                    })
                    messageContent.appendChild(videoContent);
                    messageElement.appendChild(messageContent);
                } else if (data.val().type === "audio") {
                    var audioContent = document.createElement("audio");
                    audioContent.controls = true;
                    storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                        audioContent.src = url;
                    }).catch((error) => {
                        messageContent.innerHTML += "Failed to load audio";
                        console.log(error);
                    })
                    messageContent.appendChild(audioContent);
                    messageElement.appendChild(messageContent);
                } else if (data.val().type === "file") {
                    var fileContent = document.createElement("a");
                    var buttonContent = document.createElement("button");
                    fileContent.download = true;
                    storage.ref(`${data.val().name}/${data.val().message}`).getMetadata().then((metadata) => {
                        buttonContent.innerHTML = `${bytesToSize(metadata.size)} -- ${metadata.name.length > 50 ? sanitize(metadata.name.slice(0, 50)) + "..." : sanitize(metadata.name)}`;
                    }).catch((error) => {
                        console.log(error);
                    })
                    storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                        fileContent.href = url;
                    }).catch((error) => {
                        messageContent.innerHTML += "Failed to load file";
                        console.log(error);
                    })
                    fileContent.appendChild(buttonContent);
                    messageContent.appendChild(fileContent);
                    messageElement.appendChild(messageContent);
                } else {
                    message = message.replace(/\\\[((?:.|\n)*?)\\\]/g, (match, p1) => {
                        return "\\[" + p1.replace(/\n/g, " ") + "\\]";
                    });

                    if (data.val().effect === 3) {
                        message = message.toUpperCase();
                    }

                    if (data.val().display_name !== "[VOTING]") {
                        message = sanitize(message);
                    }

                    messageContent.innerHTML = convertToHTML(message);

                    if (message.includes("@" + getUsername()) || message.includes("@everyone")) {
                        messageContent.setAttribute("id", "ping-text");
                    }

                    if (data.val().effect === 0) {
                        var textContent = document.createElement("div");
                        messageElement.appendChild(textContent);
                        textContent.setAttribute("id", "god-border");
                        // messageContent.innerHTML = "";
                        textContent.appendChild(messageContent);
                        
                        messageContent.setAttribute("id", "god-text");
                        messageContent.setAttribute("class", "");
                        messageElement.appendChild(textContent);
                    } else if (data.val().effect === 2) {
                        messageContent.style.color = "yellow";
                        messageElement.appendChild(messageContent);
                    } else if (data.val().effect === 3) {
                        var papyrus = document.createElement("img");
                        papyrus.src = "../images/papyrus_neutral.png";
                        papyrus.setAttribute("id", "papyrus");
                        messageContent.prepend(papyrus);

                        messageContent.setAttribute("id", "papyrus-text");
                        messageElement.appendChild(messageContent);
                    } else if (data.val().effect === 4) {
                        messageContent.setAttribute("id", "fuyukai");
                        messageElement.appendChild(messageContent);
                    } else {
                        messageElement.appendChild(messageContent);
                    }
                }


                textarea.appendChild(messageElement);

                if (data.val().name !== "[SERVER]") {
                    db.ref(`users/${data.val().name}/shadowban`).once("value", function(shadow_object) {
                        if (shadow_object.exists() && shadow_object.val() && data.val().name !== getUsername()) {
                            messageElement.remove();
                        }
                    })
                }

                message_height = messageElement.offsetHeight || 0;

                if (data.val().display_name == "[VOTING]") {
                    checkVoting();
                }

                if (globalMessages.at(-1).val().effect === 1 && data.key == globalMessages.at(-1).key) {
                    var scrambleText = new ScrambleText(messageContent).start();
                }
            }

            // Notifications
            var prevMessage = globalMessages.at(-1)

            if (document.visibilityState === "hidden") {
                var announceNotification = localStorage.getItem("announceNotification") || true;
                var mentionNotification = localStorage.getItem("mentionNotification") || true;
                var messageNotification = localStorage.getItem("messageNotification") || false;

                if (!(prevMessage.val().channel == "admin" && obj.admin == 0)) {
                    if (prevMessage.val().username == "[SERVER]" && JSON.parse(announceNotification)) {
                        notificationNumber += 1
                    } else if ((prevMessage.val().message.includes("@" + getUsername()) || prevMessage.val().message.includes("@everyone")) && JSON.parse(mentionNotification)) {
                        notificationNumber += 1
                    } else if (JSON.parse(messageNotification)) {
                        notificationNumber += 1
                    }
                    if (notificationNumber != 0) {
                        document.title = "(" + notificationNumber + ") Pebble";
                    }
                }
            }
            
            if ((sessionStorage.getItem("channel") || "general") != globalMessages.at(-1).val().channel && !(globalMessages.at(-1).val().channel == "admin" && obj.admin == 0)) {
                if (joined) {
                    joined = false;
                    return;
                }

                var notif = document.getElementById(`${globalMessages.at(-1).val().channel}-notif`);

                notif.innerHTML = `(${(parseInt(notif.innerHTML.substring(1,2)) || 0) + 1})`;
            }

            if (y_scroll + message_height - 15 > textarea.scrollHeight - textarea.clientHeight * 1.5 || prevMessage.val().name == getUsername()) {
                textarea.scrollTop = textarea.scrollHeight;
            } else {
                textarea.scrollTop = y_scroll + message_height - 15;
            }
        })
    })
}

function checkDeletion() {
    db.ref(`users/${getUsername()}`).once("value", function(user_object) {
        db.ref('chats/').on('child_removed', function(message_object) {
            const index = globalMessages.findIndex(obj =>
                obj.key === message_object.key
            );

            if (index !== -1) {
                globalMessages.splice(index, 1);

                if (clearchatId) {
                    clearTimeout(clearchatId);
                }
                
                clearchatId = setTimeout(() => {
                    refreshChat(user_object);
                }, 100)
            }
        })
    })
}

function checkEdit() {
    db.ref('chats/').on('child_changed', function(message_object) {
        const curr = new Date();
        const index = globalMessages.findIndex(obj =>
            obj.key === message_object.key
        );

        if (index !== -1) {
            globalMessages[index] = message_object;
        }

        if (document.getElementById(message_object.key).children[1].className !== "username") {
            var userElement = document.createElement("div");
            userElement.setAttribute("class", "username");
            userElement.innerHTML = message_object.val().display_name;
            userElement.style.fontWeight = "bold";
            document.getElementById(message_object.key).prepend(userElement);
            document.getElementById(message_object.key).children[2].innerHTML = `<p>${sanitize(message_object.val().message)}</p>`;
            document.getElementById(message_object.key).children[1].innerHTML = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0');
            document.getElementById(message_object.key).children[0].innerHTML += " <span style='color: gray; font-size: 60%'>(Edited)</span>";
        } else if (!document.getElementById(message_object.key).children[1].innerHTML.includes("(Edited)")) {
            document.getElementById(message_object.key).children[0].innerHTML = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0');
            document.getElementById(message_object.key).children[1].innerHTML += " <span style='color: gray; font-size: 60%'>(Edited)</span>";
            document.getElementById(message_object.key).children[2].innerHTML = `<p>${sanitize(message_object.val().message)}</p>`;
        } else {
            document.getElementById(message_object.key).children[0].innerHTML = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0');
            document.getElementById(message_object.key).children[2].innerHTML = `<p>${sanitize(message_object.val().message)}</p>`;
        }
    })
}

function checkVoting() {
    db.ref('other/vote').on('value', function(vote_object) {
        vote_object.forEach((vote_child) => {
            if (vote_child.key != "message" && vote_child.key != "voters") {
                document.getElementById(vote_child.key).innerHTML = vote_child.val();
            }
        })
        db.ref('other/vote/voters/' + getUsername()).once('value', function(voter_object) {
            if (voter_object.exists()) {
                const buttons = document.querySelectorAll('.votebutton');
                buttons.forEach(button => {
                    button.disabled = true;
                });
            }
        })
    })
}

function refreshChat(user_data, change_channel = false, first = false) {
    // alert("Refresh Chat");
    var textarea = document.getElementById('textarea');

    var y_scroll = textarea.scrollTop;
    var message_height

    // When we get the data clear chat_content_container
    textarea.innerHTML = '';

    var obj = user_data.val();
    globalMessages.forEach(function(data, index) {
        if ((data.val().whisper == null || data.val().whisper == getUsername() || data.val().name == getUsername() || obj.admin >= 9000) && (data.val().channel == (sessionStorage.getItem("channel") || "general") || (data.val().name == "[SERVER]" && sessionStorage.getItem("channel") !== "extra"))) {
            if (everyoneRevealed) {
                // var username = data.val().real_name || "[SERVER]";
            } else {
                var username = data.val().name;
            }

            var message = data.val().message;
            
            let prevIndex = index - 1;
            let prevItem = prevIndex >= 0 ? globalMessages[prevIndex] : null;
            
            var messageElement = document.createElement("div");
            messageElement.setAttribute("class", "message");
            messageElement.setAttribute("id", data.key);

            if (data.val().display_name == "[SERVER]") {
                var messageImg = document.createElement("img");
                messageImg.src = "../images/meteorite.png";
                messageImg.setAttribute("class", "profile-img");
                messageElement.appendChild(messageImg);
            }

            var timeElement = document.createElement("div");
            var currTime;
            timeElement.setAttribute("id", "time");
            currTime = new Date(data.val().time);
            timeElement.innerHTML = (currTime.getMonth() + 1) + "/" + currTime.getDate() + "/" + currTime.getFullYear() + " " + currTime.getHours().toString().padStart(2, '0') + ":" + currTime.getMinutes().toString().padStart(2, '0');
            messageElement.appendChild(timeElement);

            if (data.val().display_name == "[SERVER]") {
                var userElement = document.createElement("div");
                userElement.setAttribute("class", "username");
                userElement.innerHTML = data.val().display_name;
                userElement.style.fontWeight = "bold";
                userElement.style.color = "Yellow";
                userElement.addEventListener("click", function(e) {
                    if (userElement.innerHTML.includes("@")) {
                        userElement.innerHTML = data.val().display_name;
                    } else {
                        userElement.innerHTML = data.val().display_name + " @(" + data.val().name + ")";
                    }
                })
                messageElement.appendChild(userElement);
            } else if (prevItem == null || prevItem.val().display_name != data.val().display_name || prevItem.val().channel != data.val().channel || data.val().edited) {
                var userElement = document.createElement("div");
                userElement.setAttribute("class", "username");
                userElement.addEventListener("click", function(e) {
                    if (userElement.innerHTML.includes("@")) {
                        userElement.innerHTML = data.val().display_name;
                    } else {
                        userElement.innerHTML = data.val().display_name + " @(" + data.val().name + ")";
                    }
                })
                userElement.innerHTML = data.val().display_name;
                if (data.val().edited) {
                    userElement.innerHTML += " <span style='color: gray; font-size: 60%'>(Edited)</span>";
                }
                userElement.style.fontWeight = "bold";
                timeElement.style.marginTop = "25px";
                messageElement.appendChild(userElement);
            }



            messageElement.addEventListener("mouseover", function(e) {
                messageContent.style.backgroundColor = "gray";
                if ((data.val().name == getUsername() || data.val().admin < obj.admin) && !messageElement.querySelector("#delete-button") && !globalMessages[index].val().removed) {
                    setTimeout(() => {
                        var trashButton = document.createElement("button");
                        timeElement.style.visibility = "hidden";
                        trashButton.innerHTML = "🗑️️";
                        trashButton.setAttribute("id", "delete-button");
                        trashButton.addEventListener("click", function() {
                            db.ref("chats/" + globalMessages[index].key).remove();
                        })
                        messageElement.appendChild(trashButton);
                    }, 100);
                }
                if (data.val().name == getUsername() && !messageElement.querySelector("#edit-button") && !globalMessages[index].val().removed) {
                    var editing_message = localStorage.getItem("editing");
                    var editButton = document.createElement("button");
                    var textBox = document.getElementById("text-box");
                    editButton.setAttribute("id", "edit-button");
                    timeElement.style.visibility = "hidden";
                    if (editing_message == globalMessages[index].key) {
                        editButton.innerHTML = "🗙";
                    } else {
                        editButton.innerHTML = "✏️";
                    }
                    editButton.addEventListener("click", function() {
                        if (editing_message == globalMessages[index].key) {
                            editButton.innerHTML = "✏️";
                            localStorage.removeItem("editing");
                            textBox.value = "";
                            textBox.focus();
                        } else {
                            editButton.innerHTML = "🗙";
                            db.ref(`chats/${globalMessages[index].key}/message`).once("value", function(edit_message) {
                                textBox.value = unsanitize(edit_message.val());
                            })
                            textBox.focus();
                            localStorage.setItem("editing", globalMessages[index].key);
                        }
                    });

                    messageElement.appendChild(editButton);
                }
            })
            messageElement.addEventListener("mouseleave", function(e) {
                messageContent.style.backgroundColor = "";
                timeElement.style.visibility = "visible";

                setTimeout(() => {
                    var buttons = messageElement.querySelectorAll("#delete-button, #edit-button");
                    buttons.forEach(function(button) {
                        button.remove();
                    })
                    timeElement.style.visibility = "visible";
                }, 100)
            })
            

            var messageContent = document.createElement("div");
            messageContent.setAttribute("class", "message-text");

            // Fix escaped LaTeX delimiters
            // message = message
            //     .replace(/\\\\\(/g, "\\(")   // \\( -> \(
            //     .replace(/\\\\\)/g, "\\)")   // \\) -> \)
            //     .replace(/\\\\\[/g, "\\[")   // \\[ -> \[
            //     .replace(/\\\\\]/g, "\\]");  // \\] -> \]
            if (data.val().type === "image") {
                var imageContent = document.createElement("img");
                imageContent.style.maxWidth = "70%";
                imageContent.style.maxHeight = "30vh";
                storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                    imageContent.src = url;
                })
                messageContent.appendChild(imageContent);
                messageElement.appendChild(messageContent);
            } else if (data.val().type === "video") {
                var videoContent = document.createElement("video");
                videoContent.style.maxWidth = "70%";
                videoContent.style.maxHeight = "30vh";
                videoContent.controls = true;
                storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                    videoContent.src = url;
                })
                messageContent.appendChild(videoContent);
                messageElement.appendChild(messageContent);
            } else if (data.val().type === "audio") {
                var audioContent = document.createElement("audio");
                // var sourceContent = document.createElement("source");
                // audioContent.appendChild(sourceContent);
                audioContent.controls = true;
                storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                    audioContent.src = url;
                })
                messageContent.appendChild(audioContent);
                messageElement.appendChild(messageContent);
            } else if (data.val().type === "file") {
                var fileContent = document.createElement("a");
                var buttonContent = document.createElement("button");
                fileContent.download = true;
                storage.ref(`${data.val().name}/${data.val().message}`).getMetadata().then((metadata) => {
                    buttonContent.innerHTML = `${bytesToSize(metadata.size)} -- ${metadata.name.length > 50 ? sanitize(metadata.name.slice(0, 47)) + "..." : sanitize(metadata.name)}`;
                })
                storage.ref(`${data.val().name}/${data.val().message}`).getDownloadURL().then((url) => {
                    fileContent.href = url;
                })
                fileContent.appendChild(buttonContent);
                messageContent.appendChild(fileContent);
                messageElement.appendChild(messageContent);
            } else {
                message = message.replace(/\\\[((?:.|\n)*?)\\\]/g, (match, p1) => {
                    return "\\[" + p1.replace(/\n/g, " ") + "\\]";
                });

                if (data.val().effect === 3) {
                    message = message.toUpperCase();
                }

                if (data.val().display_name !== "[VOTING]") {
                    message = sanitize(message);
                }
                

                messageContent.innerHTML = convertToHTML(message);

                if (message.includes("@" + getUsername()) || message.includes("@everyone")) {
                    messageContent.setAttribute("id", "ping-text");
                }

                if (data.val().effect === 0) {
                    var textContent = document.createElement("div");
                    messageElement.appendChild(textContent);
                    textContent.setAttribute("id", "god-border");
                    // messageContent.innerHTML = "";
                    textContent.appendChild(messageContent);
                    
                    messageContent.setAttribute("id", "god-text");
                    messageContent.setAttribute("class", "");
                    messageElement.appendChild(textContent);
                } else if (data.val().effect === 2) {
                    messageContent.style.color = "yellow";
                    messageElement.appendChild(messageContent);
                } else if (data.val().effect === 3) {
                    var papyrus = document.createElement("img");
                    papyrus.src = "../images/papyrus_neutral.png";
                    papyrus.setAttribute("id", "papyrus");
                    messageContent.prepend(papyrus);

                    messageContent.setAttribute("id", "papyrus-text");
                    messageElement.appendChild(messageContent);
                } else if (data.val().effect === 4) {
                    messageContent.setAttribute("id", "fuyukai");
                    messageElement.appendChild(messageContent);
                } else {
                    messageElement.appendChild(messageContent);
                }
            }


            textarea.appendChild(messageElement);

            if (data.val().name !== "[SERVER]") {
                db.ref(`users/${data.val().name}/shadowban`).once("value", function(shadow_object) {
                    if (shadow_object.exists() && shadow_object.val() && data.val().name !== getUsername()) {
                        messageElement.remove();
                    }
                })
            }

            message_height = messageElement.offsetHeight;

            if (data.val().display_name == "[VOTING]") {
                checkVoting();
            }

            if (globalMessages.at(-1).val().effect === 1 && data.key == globalMessages.at(-1).key) {
                var scrambleText = new ScrambleText(messageContent).start();
            }
        }
    });

    // Notifications
    var prevMessage = globalMessages.at(-1)

    if (document.visibilityState === "hidden") {
        var announceNotification = localStorage.getItem("announceNotification") || true;
        var mentionNotification = localStorage.getItem("mentionNotification") || true;
        var messageNotification = localStorage.getItem("messageNotification") || false;

        if (!(prevMessage.val().channel == "admin" && obj.admin == 0)) {
            if (prevMessage.val().username == "[SERVER]" && JSON.parse(announceNotification)) {
                notificationNumber += 1
            } else if ((prevMessage.val().message.includes("@" + getUsername()) || prevMessage.val().message.includes("@everyone")) && JSON.parse(mentionNotification)) {
                notificationNumber += 1
            } else if (JSON.parse(messageNotification)) {
                notificationNumber += 1
            }
            if (notificationNumber != 0) {
                document.title = "(" + notificationNumber + ") Pebble";
            }
        }
    }
    
    if ((sessionStorage.getItem("channel") || "general") != globalMessages.at(-1).val().channel && !(globalMessages.at(-1).val().channel == "admin" && obj.admin == 0)) {
        if (joined) {
            joined = false;
            return;
        } else if (change_channel) {
            return;
        }

        var notif = document.getElementById(`${globalMessages.at(-1).val().channel}-notif`);

        notif.innerHTML = `(${(parseInt(notif.innerHTML.substring(1,2)) || 0) + 1})`;
    }

    if (first || (y_scroll + message_height - 15) > textarea.scrollHeight - textarea.clientHeight * 1.5 || prevMessage.val().name == getUsername()) {
        textarea.scrollTop = textarea.scrollHeight;
    } else {
        textarea.scrollTop = y_scroll + message_height - 15;
    }
}

function displayMembers() {
    db.ref(`other/admin_list`).once("value", function(admin_object) {
        db.ref('users/').orderByChild("admin").once('value', function(membersList) {
            active_users = [];
            inactive_users = [];

            membersList.forEach((member_child) => {
                if (!Object.hasOwn(admin_object.val(), member_child.val().id)) {
                    if (member_child.val().active) {
                        active_users.push(member_child.val());
                    } else {
                        inactive_users.push(member_child.val());
                    }

                    db.ref(`users/${member_child.val().username}/active`).on("value", function(active_object) {
                        if (active_users.some(obj => obj.username === member_child.val().username) && !active_object.val()) {
                            const index = active_users.findIndex(obj => obj.username === member_child.val().username);
                            if (index !== -1) {
                                inactive_users.push(active_users.splice(index, 1)[0]);
                                redisplayMembers();
                            }
                        } else if (inactive_users.some(obj => obj.username === member_child.val().username) && active_object.val()) {
                            const index = inactive_users.findIndex(obj => obj.username === member_child.val().username);
                            if (index !== -1) {
                                active_users.push(inactive_users.splice(index, 1)[0]);
                                redisplayMembers();
                            }
                        }
                    })
                }
            })

            active_users.reverse();
            inactive_users.reverse();

            var members = document.getElementById('members');
            members.innerHTML = "";

            active_users.forEach((username) => {
                var mainElement = document.createElement("div");
                var memberElement = document.createElement("div");
                memberElement.setAttribute("class", "member");
                var inner = "";
                if (everyoneRevealed) {
                    inner += username.name;
                } else {
                    inner += username.username;
                }
                memberElement.innerHTML = inner;

                mainElement.appendChild(memberElement);

                if (username.admin > 0) {
                    memberElement.style.color = "SkyBlue";
                } else {
                    memberElement.style.color = "White";
                }

                var adminLevel = document.createElement("div");

                db.ref(`users/${username.username}/admin`).on("value", function(admin_object) {
                    adminLevel.setAttribute("id", "admin-level");
                    adminLevel.setAttribute("class", "member");
                    adminLevel.innerHTML = `(${admin_object.val()})`;

                    if (admin_object.val() > 0) {
                        memberElement.style.color = "SkyBlue";
                    } else {
                        memberElement.style.color = "White";
                    }
                })

                mainElement.appendChild(adminLevel);

                var awayElement = document.createElement("span");
                var mutedElement = document.createElement("span");
                var timedElement = document.createElement("span");
                var trappedElement = document.createElement("span");

                db.ref(`users/${username.username}/active`).on("value", function(muted_object) {
                    if (muted_object.val() === "away") {
                        awayElement.style.color = "Yellow";
                        awayElement.innerHTML = "&nbsp;[Away]";
                    } else {
                        awayElement.innerHTML = "";
                    }
                })

                db.ref(`users/${username.username}/muted`).on("value", function(muted_object) {
                    if (muted_object.val()) {
                        mutedElement.style.color = "Red";
                        mutedElement.innerHTML = "&nbsp;[Muted]";
                    } else {
                        mutedElement.innerHTML = "";
                    }
                })

                db.ref(`users/${username.username}/trapped`).on("value", function(trapped_object) {
                    if (trapped_object.val()) {
                        trappedElement.style.color = "rgb(145, 83, 196)";
                        trappedElement.innerHTML = "&nbsp;[Trapped]";
                    } else {
                        trappedElement.innerHTML = "";
                    }
                })

                db.ref(`users/${username.username}/sleep`).on("value", function(timed_object) {
                    if ((Date.now() - (timed_object.val() || 0) + messageSleep + 200 < 0) && username.admin == 0) {
                        timedElement.style.color = "rgb(145, 83, 196)";
                        timedElement.innerHTML = "&nbsp;[Timed Out]";
                    } else {
                        timedElement.innerHTML = "";
                    }
                })

                memberElement.appendChild(awayElement);
                memberElement.appendChild(mutedElement);
                memberElement.appendChild(timedElement);
                memberElement.appendChild(trappedElement);

                memberElement.addEventListener("click", () => {
                    document.getElementById("text-box").value += username.username;
                })

                members.appendChild(mainElement);
            })

            var hr = document.createElement("hr");
            hr.style.borderColor = "rgb(0, 0, 0)";
            members.appendChild(hr);

            inactive_users.forEach((username) => {
                var mainElement = document.createElement("div");
                var memberElement = document.createElement("div");
                memberElement.setAttribute("class", "member");
                var inner = "";
                if (everyoneRevealed) {
                    inner += username.name;
                } else {
                    inner += username.username;
                }
                memberElement.innerHTML = inner;
                memberElement.style.color = "gray";

                mainElement.appendChild(memberElement);

                var adminLevel = document.createElement("div");

                db.ref(`users/${username.username}/admin`).on("value", function(admin_object) {
                    adminLevel.setAttribute("id", "admin-level");
                    adminLevel.setAttribute("class", "member");
                    adminLevel.innerHTML = `(${admin_object.val()})`;
                })

                mainElement.appendChild(adminLevel);

                var mutedElement = document.createElement("span");
                var timedElement = document.createElement("span");
                var trappedElement = document.createElement("span");

                db.ref(`users/${username.username}/muted`).on("value", function(muted_object) {
                    if (muted_object.val()) {
                        mutedElement.style.color = "Red";
                        mutedElement.innerHTML = "&nbsp;[Muted]";
                    } else {
                        mutedElement.innerHTML = "";
                    }
                })

                db.ref(`users/${username.username}/trapped`).on("value", function(trapped_object) {
                    if (trapped_object.val()) {
                        trappedElement.style.color = "rgb(145, 83, 196)";
                        trappedElement.innerHTML = "&nbsp;[Trapped]";
                    } else {
                        trappedElement.innerHTML = "";
                    }
                })

                db.ref(`users/${username.username}/sleep`).on("value", function(timed_object) {
                    if ((Date.now() - (timed_object.val() || 0) + messageSleep + 200 < 0) && username.admin == 0) {
                        timedElement.style.color = "rgb(145, 83, 196)";
                        timedElement.innerHTML = "&nbsp;[Timed Out]";
                    } else {
                        timedElement.innerHTML = "";
                    }
                })

                memberElement.addEventListener("click", () => {
                    document.getElementById("text-box").value += username.username;
                })


                memberElement.appendChild(mutedElement);
                memberElement.appendChild(timedElement);
                memberElement.appendChild(trappedElement);

                members.appendChild(mainElement);
            })
        })
    })
}

function redisplayMembers() {
    active_users.sort((a, b) => b.admin - a.admin);
    inactive_users.sort((a, b) => b.admin - a.admin);

    var members = document.getElementById('members');
    members.innerHTML = "";

    active_users.forEach((username) => {
        var mainElement = document.createElement("div");
        var memberElement = document.createElement("div");
        memberElement.setAttribute("class", "member");
        var inner = "";
        if (everyoneRevealed) {
            inner += username.name;
        } else {
            inner += username.username;
        }
        memberElement.innerHTML = inner;

        mainElement.appendChild(memberElement);

        if (username.admin > 0) {
            memberElement.style.color = "SkyBlue";
        } else {
            memberElement.style.color = "White";
        }

        var adminLevel = document.createElement("div");

        db.ref(`users/${username.username}/admin`).once("value", function(admin_object) {
            adminLevel.setAttribute("id", "admin-level");
            adminLevel.setAttribute("class", "member");
            adminLevel.innerHTML = `(${admin_object.val()})`;
        })

        mainElement.appendChild(adminLevel);

        var awayElement = document.createElement("span");
        var mutedElement = document.createElement("span");
        var timedElement = document.createElement("span");
        var trappedElement = document.createElement("span");

        db.ref(`users/${username.username}/active`).on("value", function(muted_object) {
            if (muted_object.val() === "away") {
                awayElement.style.color = "Yellow";
                awayElement.innerHTML = "&nbsp;[Away]";
            } else {
                awayElement.innerHTML = "";
            }
        })

        db.ref(`users/${username.username}/muted`).once("value", function(muted_object) {
            if (muted_object.val()) {
                mutedElement.style.color = "Red";
                mutedElement.innerHTML = "&nbsp;[Muted]";
            } else {
                mutedElement.innerHTML = "";
            }
        })

        db.ref(`users/${username.username}/trapped`).once("value", function(trapped_object) {
            if (trapped_object.val()) {
                trappedElement.style.color = "rgb(145, 83, 196)";
                trappedElement.innerHTML = "&nbsp;[Trapped]";
            } else {
                trappedElement.innerHTML = "";
            }
        })

        db.ref(`users/${username.username}/sleep`).once("value", function(timed_object) {
            if ((Date.now() - (timed_object.val() || 0) + messageSleep + 200 < 0) && username.admin == 0) {
                timedElement.style.color = "rgb(145, 83, 196)";
                timedElement.innerHTML = "&nbsp;[Timed Out]";
            } else {
                timedElement.innerHTML = "";
            }
        })

        memberElement.addEventListener("click", () => {
            document.getElementById("text-box").value += username.username;
        })

        memberElement.appendChild(awayElement);
        memberElement.appendChild(mutedElement);
        memberElement.appendChild(timedElement);
        memberElement.appendChild(trappedElement);

        members.appendChild(mainElement);
    })

    var hr = document.createElement("hr");
    hr.style.borderColor = "rgb(0, 0, 0)";
    members.appendChild(hr);

    inactive_users.forEach((username) => {
        var mainElement = document.createElement("div");
        var memberElement = document.createElement("div");
        memberElement.setAttribute("class", "member");
        var inner = "";
        if (everyoneRevealed) {
            inner += username.name;
        } else {
            inner += username.username;
        }
        memberElement.innerHTML = inner;
        memberElement.style.color = "gray";

        mainElement.appendChild(memberElement);

        var adminLevel = document.createElement("div");

        db.ref(`users/${username.username}/admin`).once("value", function(admin_object) {
            adminLevel.setAttribute("id", "admin-level");
            adminLevel.setAttribute("class", "member");
            adminLevel.innerHTML = `(${admin_object.val()})`;
        })

        mainElement.appendChild(adminLevel);

        var mutedElement = document.createElement("span");
        var timedElement = document.createElement("span");
        var trappedElement = document.createElement("span");

        db.ref(`users/${username.username}/muted`).once("value", function(muted_object) {
            if (muted_object.val()) {
                mutedElement.style.color = "Red";
                mutedElement.innerHTML = "&nbsp;[Muted]";
            } else {
                mutedElement.innerHTML = "";
            }
        })

        db.ref(`users/${username.username}/trapped`).once("value", function(trapped_object) {
            if (trapped_object.val()) {
                trappedElement.style.color = "rgb(145, 83, 196)";
                trappedElement.innerHTML = "&nbsp;[Trapped]";
            } else {
                trappedElement.innerHTML = "";
            }
        })

        db.ref(`users/${username.username}/sleep`).once("value", function(timed_object) {
            if ((Date.now() - (timed_object.val() || 0) + messageSleep + 200 < 0) && username.admin == 0) {
                timedElement.style.color = "rgb(145, 83, 196)";
                timedElement.innerHTML = "&nbsp;[Timed Out]";
            } else {
                timedElement.innerHTML = "";
            }
        })

        memberElement.addEventListener("click", () => {
            document.getElementById("text-box").value += username.username;
        })


        memberElement.appendChild(mutedElement);
        memberElement.appendChild(timedElement);
        memberElement.appendChild(trappedElement);

        members.appendChild(mainElement);
    })
}

function sendServerMessage(message, join=false) {
    var message = message;
    db.ref(`other/admin_list`).once("value", function(admin_object) {
        db.ref(`users/${getUsername()}`).once('value', function(user_object) {
            var curr = new Date();
            if (announceToggle || !Object.hasOwn(admin_object.val(), user_object.val().id)) {
                db.ref('chats/').push({
                    name: getUsername(),
                    message: message,
                    admin: user_object.val().admin,
                    display_name: "[SERVER]",
                    channel: (sessionStorage.getItem("channel") || "general"),
                    edited: false,
                    time: Date.now(),
                    effect: typeof(user_object.val().active_effect) != "undefined" && join && typeof(user_object.val().effects) != "undefined" && Object.hasOwn(user_object.val().effects, user_object.val().active_effect) && user_object.val().effects[user_object.val().active_effect] ? user_object.val().active_effect : false,
                })
            }
        })
    })
}

function sendMessage() {
    // var textarea = document.getElementById("textarea")
    var message = document.getElementById("text-box").value;
    message = message.trim();

    var username = getUsername();
    if (username == null || username == "") {
        return;
    }

    // EVERYTHING GOES HERE
    db.ref("users/" + username).once('value', function(user_object) {
        var obj = user_object.val();

        // EVERYTHING ELSE
        db.ref("other/").once('value', (otherObject) => {
            var medianAdmin = otherObject.val().medianAdmin;
            if (message == "") {
                document.getElementById("text-box").value = "";
                return
            } else if (message.length > 500 && (obj.admin <= medianAdmin && !Object.hasOwn(otherObject.val().admin_list, user_object.val().id))) {
                alert("Message cannot exceed 500 characters!");
                return;
            } else if (message == "sos") {
                window.location.replace("https://schoology.pickens.k12.sc.us/home");
                return;
            } else if (message.includes("https://youtube") || message.includes("www.youtu") || message.includes("youtu.be")) {
                window.location.replace("https://ungaaui.replit.app/embedder.html");
                return;
            } else if (announceToggle) {
                sendServerMessage(message);
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!mute @")) {
                var muted_user = message.substring(7);
                db.ref("users/" + muted_user).once('value', function(mutedUser) {
                    if ((!mutedUser.exists() || Object.hasOwn(otherObject.val().admin_list, mutedUser.val().id)) && muted_user != "everyone") {
                        alert("User cannot be muted, " + muted_user + " does not exist!");
                        return;
                    }
                    mutedUser = mutedUser.val();
                    mutingUser = obj;

                    if (muted_user == 'everyone') {
                        sendServerMessage(mutingUser.username + " muted @everyone... Social Darwinism at its finest.");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val())
                            obj.forEach(function(usr) {
                                db.ref("users/" + usr.username).update({
                                    muted: true,
                                })
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    // If the muted user is already muted
                    if (mutedUser.muted) {
                        alert(mutedUser.username + " is already muted!");
                        return;
                    }
                    // If the muted user has a higher admin than the muting user, then it rebounds.
                    if (mutingUser.admin < mutedUser.admin && !Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        alert(mutedUser.username + " has a higher admin level than you! Rebound!");
                        sendServerMessage(mutedUser.username + " rebounded their mute against @" + mutingUser.username);
                        db.ref("users/" + username).update({
                            muted: true
                        })
                        return;
                    }
                    db.ref("users/" + mutedUser.username).update({
                        muted: true
                    }).then(() => {
                        sendServerMessage(mutingUser.username + " muted @" + mutedUser.username + "!");
                    }).catch((error) => {
                        alert(error);
                    })
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!unmute @")) {
                var unmuted_user = message.substring(9);
                db.ref("users/" + unmuted_user).once('value', function(unmutedUser) {
                    if ((!unmutedUser.exists() || Object.hasOwn(otherObject.val().admin_list, unmutedUser.val().id)) && unmuted_user != "everyone") {
                        alert("User cannot be unmuted, " + unmuted_user + " does not exist!");
                        return;
                    }
                    unmutedUser = unmutedUser.val();
                    unmutingUser = obj;

                    // Unmuting everyone
                    if (unmuted_user == 'everyone') {
                        sendServerMessage(unmutingUser.username + " unmuted @everyone! Thank the Lord!");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val());
                            var usernames = obj;
                            usernames.forEach(function(usr) {
                                db.ref("users/" + usr.username).update({
                                    muted: false,
                                })
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    // If the unmuted user is already unmuted
                    if (!unmutedUser.muted) {
                        alert(unmutedUser.username + " is not muted!");
                        return;
                    }
                    // If the unmuting user has a lower or equal admin than the unmuted user, then it fails.
                    if (unmutingUser.admin <= unmutedUser.admin && !Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        alert("You don't have the admin level to do this!");
                        return;
                    }
                    db.ref("users/" + unmutedUser.username).update({
                        muted: false
                    }).then(() => {
                        sendServerMessage(unmutingUser.username + " unmuted @" + unmutedUser.username + "!");
                    }).catch((error) => {
                        alert(error);
                    })
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!reveal @")) {
                var revealed_user = message.substring(9);
                auth.currentUser.getIdToken(/* forceRefresh */ true).then(function(idtoken) {
                    fetch("https://us-central1-rock-585b5.cloudfunctions.net/api/revealUser", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({idtoken, user: revealed_user})
                    }).then(response => response.json()).then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            alert(data.message);
                        }
                    }).catch((error) => {
                        alert(error);
                    })
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!remove @")){
                var removed_user = message.substring(9);

                auth.currentUser.getIdToken(/* forceRefresh */ true).then(function(idtoken) {
                    fetch("https://us-central1-rock-585b5.cloudfunctions.net/api/removeUser", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({idtoken, user: removed_user, channel: (sessionStorage.getItem("channel") || "general")})
                    }).then(response => response.json()).then(data => {
                        if (data.error) {
                            alert(data.error);
                        }
                    }).catch((error) => {
                        alert(error);
                    })
                })

                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!trap @")){
                var trapped_user = message.substring(7);
                db.ref("users/" + trapped_user).once('value', function(trappedUser) {
                    if (!trappedUser.exists() || Object.hasOwn(otherObject.val().admin_list, trappedUser.val().id)) {
                        alert("User cannot be trapped, " + trapped_user + " does not exist!");
                        return;
                    }
                    trappedUser = trappedUser.val();
                    trappingUser = obj;
                    if (trappingUser.admin >= trappedUser.admin + 3 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(trappingUser.username + " trapped @" + trappedUser.username + "!");
                        db.ref("users/" + trappedUser.username).update({
                            trapped: true,
                            reload: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!release @")){
                var untrapped_user = message.substring(10);
                db.ref("users/" + untrapped_user).once('value', function(untrappedUser) {
                    if ((!untrappedUser.exists() || Object.hasOwn(otherObject.val().admin_list, untrappedUser.val().id)) && untrapped_user != 'everyone') {
                        alert("User cannot be released, " + untrapped_user + " does not exist!");
                        return;
                    }
                    untrappedUser = untrappedUser.val();
                    var untrappingUser = obj;
                    if (untrapped_user == 'everyone' && (untrappingUser.admin > 0 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id))) {
                        sendServerMessage(untrappingUser.username + " released @everyone! Thank the Lord!");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val());
                            var usernames = obj;
                            usernames.forEach(function(usr) {
                                if (usr.trapped && (usr.admin + 3 <= untrappingUser.admin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id))) {
                                    db.ref("users/" + usr.username).update({
                                        trapped: false,
                                    })
                                }
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    if (untrappingUser.admin >= untrappedUser.admin + 3 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(untrappingUser.username + " released @" + untrappedUser.username + "!");
                        db.ref("users/" + untrappedUser.username).update({
                            trapped: false,
                            reload: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!timeout @")){
                var timed_user = message.split(" ")[1].substring(1);
                var timeout_time = message.split(" ")[2];
                if (!/^[0-9]+$/.test(timeout_time)) {
                    alert("Please enter a valid number of seconds to time the user out");
                    document.getElementById("text-box").value = "";
                    return;
                }
                db.ref("users/" + timed_user).once('value', function(timedUser) {
                    if (!timedUser.exists() || Object.hasOwn(otherObject.val().admin_list, timedUser.val().id)) {
                        alert("User cannot be timed out, " + timed_user + " does not exist!");
                        return;
                    }
                    timedUser = timedUser.val();
                    var timingUser = obj;
                    if (timingUser.admin > timedUser.admin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(timingUser.username + " timed out @" + timedUser.username + " for " + timeout_time + " seconds!");
                        db.ref("users/" + timedUser.username).update({
                            sleep: Date.now() + ((timeout_time * 1000) - messageSleep),
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!removetimeout @")){
                var removetimed_user = message.split(" ")[1].substring(1);
                db.ref("users/" + removetimed_user).once('value', function(removetimedUser) {
                    if (!removetimedUser.exists() || Object.hasOwn(otherObject.val().admin_list, removetimedUser.val().id)) {
                        alert("User's timeout cannot be removed, " + timed_user + " does not exist!");
                        return;
                    }
                    removetimedUser = removetimedUser.val();
                    var removetimingUser = obj;
                    if (removetimingUser.admin > removetimedUser.admin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(removetimingUser.username + " removed the timeout for @" + removetimedUser.username + "!");
                        db.ref("users/" + removetimedUser.username).update({
                            sleep: 0,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!lockdown")) {
                lockdownUser = obj;
                if (lockdownUser.admin > medianAdmin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    sendServerMessage(lockdownUser.username + " has locked down the server!");
                    db.ref("other/").update({
                        lockdown: true,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!removelockdown")) {
                lockdownUser = obj;
                if (lockdownUser.admin > medianAdmin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    sendServerMessage(lockdownUser.username + " has removed the lock down for the server!");
                    db.ref("other/").update({
                        lockdown: false,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!whisper @")) {
                var whispered_user = message.split(" ")[1].substring(1);
                db.ref("users/" + whispered_user).once('value', function(whisperedUser) {
                    if (!whisperedUser.exists()) {
                        alert("User cannot be whispered to, " + whispered_user + " does not exist!");
                        return;
                    }
                    document.getElementById("text-box").value = "";
                    var curr = new Date();
                    db.ref('chats/').push({
                        name: username,
                        message: "Whisper to @" + whispered_user + ": " + message.substring(10 + whispered_user.length),
                        admin: obj.admin,
                        display_name: obj.display_name,
                        whisper: whispered_user,
                        channel: (sessionStorage.getItem("channel") || "general"),
                        edited: false,
                        time: Date.now(),
                        effect: ((obj.effects || false) && (obj.effects["apply"] || false)) ? typeof(user_object.val().active_effect) == "undefined" ? false : user_object.val().active_effect : false,
                        // profileimage: obj.profileimage,
                    }).then(function() {
                        db.ref("users/" + username).update({
                            sleep: Date.now(),
                        })
                    })
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!disableimage @")) {
                var disabled_user = message.substring(15);
                db.ref("users/" + disabled_user).once('value', function(disabledUser) {
                    if (!disabledUser.exists() || Object.hasOwn(otherObject.val().admin_list, disabledUser.val().id)) {
                        alert("User's image privileges cannot be disabled, " + disabled_user + " does not exist!");
                        return;
                    }
                    disabledUser = disabledUser.val();
                    var disablingUser = obj;

                    if (disablingUser.admin > disabledUser.admin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(disablingUser.username + " has disabled the image priveleges for " + disabledUser.username);
                        db.ref("users/" + disabledUser.username).update({
                            image: false,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!enableimage @")) {
                var disabled_user = message.substring(14);
                db.ref("users/" + disabled_user).once('value', function(disabledUser) {
                    if (!disabledUser.exists() || Object.hasOwn(otherObject.val().admin_list, disabledUser.val().id)) {
                        alert("User's image privileges cannot be enabled, " + disabled_user + " does not exist!");
                        return;
                    }
                    disabledUser = disabledUser.val();
                    var disablingUser = obj;

                    if (disablingUser.admin > disabledUser.admin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                        sendServerMessage(disablingUser.username + " has enabled the image privileges for " + disabledUser.username);
                        db.ref("users/" + disabledUser.username).update({
                            image: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setslowmode ")) {
                var slowmodetime = message.substring(13);
                if (!/^[0-9]+$/.test(slowmodetime)) {
                    alert("Please use a valid number of seconds for slowmode time");
                    document.getElementById("text-box").value = "";
                    return;
                }
                var slowmodeUser = obj;

                if (slowmodeUser.admin > medianAdmin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    sendServerMessage(slowmodeUser.username + " has changed the slowmode time to " + slowmodetime);
                    db.ref("other/").update({
                        slowmodetime: slowmodetime,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setprofilesleep ")) {
                var profilesleeptime = message.substring(17);
                if (!/^[0-9]+$/.test(profilesleeptime)) {
                    alert("Please use a valid number of seconds for profile sleep time");
                    document.getElementById("text-box").value = "";
                    return;
                }
                var profileUser = obj;
                if (profileUser.admin > medianAdmin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    sendServerMessage(profileUser.username + " has changed the profile sleep time to " + profilesleeptime);
                    db.ref("other/").update({
                        profilesleeptime: profilesleeptime,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!vote ")) {
                if (!/\[[^\[\]]*\]/.test(message)) {
                    alert("Please format the options so that it starts with [ and ends with ] and each option is seperated with a comma (,)");
                    return;
                } else if (message.substring(6, message.indexOf(" [")).trim() == "") {
                    alert("Please include a title");
                    return;
                }

                auth.currentUser.getIdToken(/* forceRefresh */ true).then(function(idtoken) {
                    fetch("https://us-central1-rock-585b5.cloudfunctions.net/api/voteMessage", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({idtoken, title: message.substring(6, message.indexOf(" [")), choices: message.match(/\[(.*?)\]/)[1].split(",").map(item => item.trim().replace(/ /g, "_")), channel: (sessionStorage.getItem("channel") || "general")})
                    }).then(response => response.json()).then(data => {
                        if (data.error) {
                            alert(data.error);
                        }
                    }).catch((error) => {
                        alert(error);
                    })
                })

                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!set @")) {
                if (obj.admin > 5000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    var set_user = message.split(" ")[1].substring(1);
                    var key = message.split(" ")[2]
                    var value = message.split(" ")[3]
                    if (typeof(value) == "undefined") {
                        alert("please fill in the value parameter");
                        return;
                    }
                    
                    if (value == "true" || value == "false") {
                        var value = JSON.parse(value)
                    } else if (/^[0-9]+$/.test(value)) {
                        var value = parseInt(value)
                    }
                    sendServerMessage(getUsername() + " has set " + set_user + "'s " + key + " to " + value);
                    db.ref("users/" + set_user).update({
                        [key]: value,
                    })
                };
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!cleardonations") {
                if (obj.admin > 9000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    db.ref(`users/`).once("value", function(data_clear) {
                        const keptKeys = ["active", "admin", "muted", "name", "password", "sleep", "username", "trapped", "profilesleep", "active_effect", "effects", "display_name", "donationsban", "activeoption", "shadowban", "forceverify", "fingerprint"];
                        var updates = {};

                        data_clear.forEach(child => {
                            child.forEach(data => {
                                if (!keptKeys.includes(data.key)) {
                                    db.ref(`users/${child.key}/${data.key}`).remove();
                                }
                            });
                        });

                        db.ref().update(updates);
                        db.ref("other/Casino").update({
                            money: 10000000
                        });
                        db.ref("other/clickernotifications").remove();
                        sendServerMessage(`${getUsername()} has cleared the data of donations`);
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!donationsoff") {
                if (obj.admin > 5000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    db.ref(`other/`).update({
                        campaign: false,
                    });
                    sendServerMessage(`${getUsername()} has stopped the donations campaign`);
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!donationson") {
                if (obj.admin > 5000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    db.ref(`other/`).update({
                        campaign: true,
                    });
                    sendServerMessage(`${getUsername()} has started the donations campaign`);
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setPrompt ")) {
                return
                
                if (obj.admin > 5000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    var newPrompt = message.substring(11); // Remove "!setPrompt " from the message
                    if (newPrompt.trim() == "") {
                        alert("Please provide a new system prompt!");
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    
                    // Update the system prompt in Firebase
                    db.ref('other/').update({
                        gpt_system_prompt: newPrompt
                    });
                    
                    sendServerMessage(`${getUsername()} has updated the GPT system prompt to: "${newPrompt}"`);
                } else {
                    alert("You need admin level > 5000 to change the GPT system prompt!");
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!getPrompt") {
                return

                // Anyone can view the current prompt
                db.ref('other/gpt_system_prompt').once('value', function(snapshot) {
                    if (snapshot.exists()) {
                        alert("Current GPT System Prompt:\n\n" + snapshot.val());
                    } else {
                        alert("No custom system prompt set. Using default.");
                    }
                });
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!resetPrompt") {
                return

                if (obj.admin > 5000 || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    // Reset to default prompt
                    var defaultPrompt = getSystemPrompt();
                    db.ref('other/').update({
                        gpt_system_prompt: defaultPrompt
                    });
                    sendServerMessage(`${getUsername()} has reset the GPT system prompt to default.`);
                } else {
                    alert("You need admin level > 5000 to reset the GPT system prompt!");
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!gpt ")) {
                return

                var gpt_message = message.substring(5);
                if (gpt_message.trim() == "") {
                    alert("Please provide a message for ChatGPT!");
                    document.getElementById("text-box").value = "";
                    return;
                }
                
                // Check if user is muted or timed out
                if (obj.muted || (Date.now() - (obj.sleep || 0) < messageSleep && obj.admin == 0)) {
                    alert("You cannot use ChatGPT if you are muted or timed out!");
                    document.getElementById("text-box").value = "";
                    return;
                }
                
                // First, send the user's message as a regular message (without the !gpt part)
                var curr = new Date();
                db.ref('chats/').push({
                    name: username,
                    message: gpt_message,
                    real_name: obj.name,
                    admin: obj.admin,
                    removed: false,
                    channel: (sessionStorage.getItem("channel") || "general"),
                    edited: false,
                    time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                });
                
                // Then send the thinking message from GPT
                var thinkingMessage = db.ref('chats/').push({
                    name: "[GPT]",
                    message: "🤔 Thinking...",
                    admin: 9998,
                    channel: (sessionStorage.getItem("channel") || "general"),
                    removed: false,
                    edited: false,
                    time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                });
                
                // Get recent chat context
                getChatContext(gpt_message, thinkingMessage.key, username);
                
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!donationsban @")) {
                var banned_user = message.substring(15);
                db.ref("users/" + banned_user).update({
                    donationsban: true
                })
                sendServerMessage(`${getUsername()} has permanently banned @${banned_user} from donations`);
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!donationsunban @")) {
                var unbanned_user = message.substring(17);
                db.ref("users/" + unbanned_user).update({
                    donationsban: false
                })
                sendServerMessage(`${getUsername()} has unbanned @${unbanned_user} from donations`);
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setimagesleep ")) {
                var imagesleeptime = message.substring(17);
                if (!/^[0-9]+$/.test(imagesleeptime)) {
                    alert("Please use a valid number of seconds for image sleep time");
                    document.getElementById("text-box").value = "";
                    return;
                }
                var imageUser = obj;
                if (imageUser.admin > medianAdmin || Object.hasOwn(otherObject.val().admin_list, user_object.val().id)) {
                    sendServerMessage(imageUser.username + " has changed the image sleep time to " + imagesleeptime + " seconds");
                    db.ref("other/").update({
                        imageSleep: imagesleeptime,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!forceverify @")) {
                db.ref(`users/${message.substring(14)}`).update({
                    forceverify: true
                }).then(() => {
                    sendServerMessage(`${getUsername()} has force verified @${message.substring(14)}`);
                }).catch((error) => {
                    alert(error);
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!forceunverify @")) {
                db.ref(`users/${message.substring(16)}`).update({
                    forceverify: false
                }).then(() => {
                    sendServerMessage(`${getUsername()} has force unverified @${message.substring(16)}`);
                }).catch((error) => {
                    alert(error);
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!shadowban @")) {
                db.ref(`users/${message.substring(12)}`).update({
                    shadowban: true
                }).then(() => {
                    alert("Successfully shadow banned " + message.substring(12));
                }).catch((error) => {
                    alert(error);
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!shadowunban @")) {
                db.ref(`users/${message.substring(14)}/shadowban`).remove().then(() => {
                    alert("Successfully shadow unbanned " + message.substring(14));
                }).catch((error) => {
                    alert(error);
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!showshadowbans")) {
                showShadowBans();
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!permaban @")) {
                db.ref(`users/${message.substring(11)}/fingerprint`).once("value", function(fingerprint_object) {
                    if (fingerprint_object.exists()) {
                        db.ref(`other/ban_list`).update({
                            [fingerprint_object.val()]: true
                        })
                        sendServerMessage(`${getUsername()} has permanently banned @${message.substring(11)}`);
                    } else {
                        alert("Cannot perma ban user");
                    }
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!permaunban @")) {
                db.ref(`other/ban_list/${message.substring(13)}`).remove().then(() => {
                    sendServerMessage(`${getUsername()} has removed @${message.substring(13)}'s permanent ban`);
                }).catch((error) => {
                    alert(error);
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!") && message.length > 3) {
                alert("That is not an existing command!");
                document.getElementById("text-box").value = "";
                return;
            }

            document.getElementById("text-box").value = "";
            var curr = new Date();
            if (localStorage.getItem("editing")) {
                db.ref("chats/" + localStorage.getItem("editing")).update({
                    message: message,
                    edited: true,
                    time: Date.now(),
                }).then(function() {
                    localStorage.removeItem("editing");
                })
            } else {
                db.ref('chats/').push({
                    name: username,
                    message: message,
                    admin: obj.admin,
                    display_name: obj.display_name,
                    channel: (sessionStorage.getItem("channel") || "general"),
                    edited: false,
                    time: Date.now(),
                    effect: ((obj.effects || false) && (obj.effects["apply"] || false)) ? typeof(user_object.val().active_effect) == "undefined" ? false : user_object.val().active_effect : false,
                    // profileimage: obj.profileimage,
                }).then(function() {
                    db.ref("users/" + username).update({
                        sleep: Date.now(),
                    })
                })
            }
        })
    })
}

function logout() {
    db.ref("users/" + getUsername()).update({
        active: false
    }).then(() => {
        firebase.auth().signOut().then(() => {
            alert("Successfully logged out");
            localStorage.clear();
            window.location.reload();
        }).catch((error) => {
            alert(error);
        });
    })
}

function login() {
    var email = document.getElementById("email-login").value;
    var password = document.getElementById("password-login").value;
    if (password == "") {
        return;
    }

    auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
        alert(`Successfully signed in, welcome to Pebble, ${userCredential.user.uid}!`);
        alert(credits);
        alert(termsOfService);
    }).catch((error) => {
        alert(error.message);
    });
}

function register() {
    var username = document.getElementById("username-register").value;
    var password = document.getElementById("password-register").value;
    var email = document.getElementById("email-register").value;
    var display_name = document.getElementById("display-register").value;
    var name = document.getElementById("name-register").value;
    document.getElementById("register-button").disabled = true;
    fetch('https://us-central1-rock-585b5.cloudfunctions.net/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({uid: username, password: password, email: email, name: name, display: display_name, channel: (sessionStorage.getItem("channel") || "general"), id: requestId})
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            alert(credits);
            alert(termsOfService);
            localStorage.clear();
            auth.signInWithEmailAndPassword(email, password).then(() => {
                window.location.reload();
            }).catch((error) => {
                alert(error.message);
            });
        }
        
        document.getElementById("register-button").disabled = false;
    })
}

function resetPassword() {
    var email = document.getElementById("email-login").value;

    auth.sendPasswordResetEmail(email).then(() => {
        alert("Successfully sent a password reset email");
    }).catch((error) => {
        alert(error);
    });
}
            
function checkMute() {
    db.ref(`other/admin_list`).once("value", function(admin_object) {
        db.ref(`users/${getUsername()}`).once("value", function(user_object) {
            db.ref(`users/${getUsername()}/muted`).on('value', function(muted_object) {
                if (muted_object.val() && !Object.hasOwn(admin_object.val(), user_object.val().id)) {
                    document.getElementById("text-box").disabled = true;
                    document.getElementById("text-box").placeholder = "Muted";
                } else {
                    document.getElementById("text-box").disabled = false;
                    document.getElementById("text-box").placeholder = "Message"
                }
            })
            db.ref(`users/${getUsername()}/sleep`).on("value", function(sleep_object) {
                const lastMessageTime = sleep_object.val() || 0;
                const timePassed = Date.now() - lastMessageTime;

                if (timePassed < messageSleep && (user_object.val().admin == 0 && !Object.hasOwn(admin_object.val(), user_object.val().id))) {
                    if (timePassed + messageSleep < 0) {
                        document.getElementById("text-box").disabled = true;
                        document.getElementById("text-box").placeholder = "You are timed out";
                    } else {
                        document.getElementById("text-box").disabled = true;
                        document.getElementById("text-box").placeholder = "Slow mode active";
                    }

                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    timeoutId = setTimeout(() => {
                        document.getElementById("text-box").disabled = false;
                        document.getElementById("text-box").placeholder = "Message"
                        document.getElementById("text-box").focus();
                    }, messageSleep - timePassed)
                }
            })
        })
    })
}

function regMenu() {
    var register = document.getElementById("register");
    var loginBlock = document.getElementById("login");
    loginBlock.style.display = "none";
    register.style.display = "block";
}

function back() {
    var loginBlock = document.getElementById("login");
    var register = document.getElementById("register")
    register.style.display = "none";
    loginBlock.style.display = "block";
}

// updates display name
function update_name() {
    if (!auth.currentUser) {
        return;
    }
    db.ref("users/" + getUsername()).once('value', function(user_object) {
        var obj = user_object.val();
        document.getElementById("userdisplay").innerHTML = obj.username;
    })
}

function changeChannel(channel) {
    db.ref(`other/admin_list`).once("value", function(admin) {
        db.ref(`users/${getUsername()}`).once("value", function(user_object) {
            if (channel == "admin" && user_object.val().admin == 0 && !Object.hasOwn(admin.val(), user_object.val().id)) {
                alert("You are not an admin")
            } else if ((sessionStorage.getItem("channel") || "general") != channel) {
                document.getElementById(`${channel}-notif`).innerHTML = "";
                document.getElementById((sessionStorage.getItem("channel") || "general")).style.backgroundColor = null;
                document.getElementById(channel).style.backgroundColor = "#42464d";
                sessionStorage.setItem("channel", channel);
                refreshChat(user_object, true);
            }
        })
    })
    textarea.scrollTop = textarea.scrollHeight;
}

function setup() {
    fetch('https://us-central1-rock-585b5.cloudfunctions.net/api/getInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: requestId})
    })
    .then(response => response.json())
    .then(data => {
        GPT_CONFIG.openai["apiKey"] = data.apiKey;
        if (data.banned) {
            document.body.innerHTML = `You are permabanned`;
            return;
        }
        if (data.version === curr_version) {
            // Notification check
            document.addEventListener("visibilitychange", function() {
                if (document.visibilityState === "visible") {
                    notificationNumber = 0
                    document.title = "Pebble";
                }
            });

            //forceverify check
            db.ref(`users/${getUsername()}/forceverify`).on("value", function(verify_object) {
                if (verify_object.exists() && verify_object.val() && !auth.currentUser.emailVerified) {
                    document.body.innerHTML = `You will need to verify your email at ${auth.currentUser.email} to view chat and send messages.
                        <button onclick="auth.currentUser.sendEmailVerification().then(() => {alert('Check your email to verify your account.');}).catch((error) => {alert(error)})">Send Verification Email</button><br>
                        <button onclick="auth.currentUser.reload().then(() => {return auth.currentUser.getIdToken(true);}).then(() => {location.reload();})">Click here after verifying your email</button><br>
                        <button class="profile-button" id="logoutButton" onclick="logout()">Log Out</button>`
                }
            })

            document.addEventListener('keydown', event => {
                const key = event.key.toLowerCase();
                if (document.getElementById("text-box") == document.activeElement) {
                    if (key == "enter") {
                        if (event.shiftKey){
                            return;
                        }
                        event.preventDefault();
                        sendMessage();
                        resizeTextBox();
                    }
                } else if (document.getElementById("password-login") == document.activeElement) {
                    if (key == "enter") {
                        login();
                    }
                } else if (document.getElementById("name-register") == document.activeElement) {
                    if (key == "enter") {
                        register();
                    }
                }
            })

            document.addEventListener("visibilitychange", function() {
                db.ref(`users/${getUsername()}/activeoption`).once("value", function(active_object) {
                    if (active_object.val() || !active_object.exists()) {
                        if (document.hidden) {
                            db.ref(`users/${getUsername()}`).update({
                                active: "away",
                            })
                        } else {
                            db.ref(`users/${getUsername()}`).update({
                                active: true,
                            })
                        }
                    }
                })
            })

            document.getElementById("text-box").addEventListener("input", () => {
                resizeTextBox();
            });

            slowMode();
            imageSleepCheck();
            update_name();
            // Login and Register Screens
            var main = document.getElementById("main");
            var loginBlock = document.getElementById("login");

            if (auth.currentUser) {
                main.style.display = "block";
                loginBlock.style.display = "none";
                db.ref(`other/admin_list`).once("value", function(admin) {
                    db.ref("users/" + getUsername()).once('value').then(snapshot => {
                        var obj = snapshot.val();
                        const lastMessageTime = obj.sleep || 0;
                        const timePassed = Date.now() - lastMessageTime;
                        let params = new URLSearchParams(document.location.search);
                        globalActive = obj.activeoption || typeof(obj.activeoption) == "undefined";
                        if (globalActive) {
                            document.getElementById("active-toggle").innerHTML = ' ✓';
                        }
                        if ((!obj.muted && !(timePassed < messageSleep) && !obj.trapped) && !(JSON.parse(params.get("ignore")) || false) && !Object.hasOwn(admin.val(), obj.id)) {
                            sendServerMessage(obj.display_name + " (@" + getUsername() + ")" + " has joined the chat", true);
                        }
                    })
                })
            } else {
                main.style.display = "none";
                loginBlock.style.display = "block";
                return;
            }

            document.getElementById((sessionStorage.getItem("channel") || "general")).style.backgroundColor = "#42464d";

            checkTrapped();
            checkActive();
            reloadTrapped();
            checkDeletion();
            checkEdit();
            checkMute();

            db.ref("other/medianAdmin").on('value', (obj) => {
                obj = obj.val();
                document.getElementById("medianAdmin").innerHTML = obj;
            })

            if (localStorage.getItem("terms") == null) {
                showPopUp("Additional Note (VERY IMPORTANT, MUST READ)", "I am legally obligated to say that we, the creators and/or owners of feynmansums.com, pebble, or any sites associated with it, do not condone the use of this website during instructional time, or to disrupt it. Any violation of this is not tolerated by us. Continue using the website if you understand these conditions.");
                localStorage.setItem("terms", "read");
            }
        } else {
            document.body.innerHTML = `An error has occured. You are most likely using an outdated version of the site. Fetch a new version by pressing "ctrl + shift + R" or "ctrl + f5<br>
            Newest Version: ${data.version}<br>
            Your Version: ${curr_version}`;
        }
    })
}

function checkTrapped() {
    db.ref("users/" + getUsername()).on('value', function(user_object) {
        var obj = user_object.val();
        if (!obj.trapped) {
            document.getElementById("logoutButton").style.display = "block";
        } else {
            document.getElementById("logoutButton").style.display = "none";
            document.getElementById("messagebox").style.display = "none";
        }
    })
}

function reloadTrapped() {
    db.ref("users/" + getUsername() +"/reload").on("value", (snapshot) => {
        if (snapshot.val() === true) {
            location.reload();
            db.ref("users/" + getUsername() +"/reload").set(false);
        }
    });
    
}

function toggleMenu() {
    db.ref("users/" + getUsername()).once('value', function(user_object) {
        var obj = user_object.val();
        db.ref("other/").once('value', function(userObject) {
            if (obj.admin > userObject.val().medianAdmin || Object.hasOwn(userObject.val().admin_list, user_object.val().id)) {
                document.getElementById("adminMenu").classList.toggle("show");
            } else {
                document.getElementById("userMenu").classList.toggle("show");
            }
        })
    })
}

function wipeChat() {
    var name = getUsername();
    db.ref(`users/${name}`).once("value", function(user_object) {
        if (user_object.val().admin >= 9000) {
            db.ref("chats/").remove()
        } else {
            alert("This function is not available to those below 9000 admin level");
        }
    })
}

function announce() {
    announceToggle = !announceToggle;
    if (announceToggle) {
        document.getElementById("announce-toggle").innerHTML = ' ✓';
    } else {
        document.getElementById("announce-toggle").innerHTML = '';
    }
}

function activeToggle() {
    globalActive = !globalActive;
    if (globalActive) {
        document.getElementById("active-toggle").innerHTML = ' ✓';
        db.ref(`users/${getUsername()}`).update({
            active: true,
            activeoption: true
        })
    } else {
        document.getElementById("active-toggle").innerHTML = '';
        db.ref(`users/${getUsername()}`).update({
            active: false,
            activeoption: false
        })
    }
}

function brainRotToggle() {
    brainRot = !brainRot;
    var brainrot = document.getElementById("brainrot");
    if (brainRot) {
        brainrot.innerHTML = `<iframe
                                src="https://www.youtube.com/embed/zZ7AimPACzc?autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&playlist=zZ7AimPACzc"
                                frameborder="0"
                                allow="autoplay; encrypted-media"
                                allowfullscreen="false"
                                class="subway-surfers-clips">
                            </iframe>
                            <iframe
                                src="https://www.youtube.com/embed/mYKDaxLXVSg?autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&playlist=mYKDaxLXVSg"
                                frameborder="0"
                                allow="autoplay; encrypted-media"
                                allowfullscreen="false"
                                class="family-guy-clips">
                            </iframe>
                            <div class="brainrot-frame"></div>`
        document.getElementById("brainrot-toggle").innerHTML = ' ✓';
        document.getElementById("cover").style.display = "block";
        document.getElementById("channels").style.visibility = "hidden";
        document.getElementById("permaAnnouncements").style.visibility = "hidden";
        // alert("BRAINROT")
    } else {
        brainrot.innerHTML = "";
        document.getElementById("brainrot-toggle").innerHTML = '';
        document.getElementById("cover").style.display = "none";
        document.getElementById("channels").style.visibility = "visible";
        document.getElementById("permaAnnouncements").style.visibility = "visible";
    }
}

function slowmodeToggle() {
    db.ref("other/slowmode").once("value", function(obj) {
        var slowmode = obj.val();
        slowmode = !slowmode;
        db.ref("other/").update({
            slowmode: slowmode
        });
        if (slowmode) {
            document.getElementById("slowmode-toggle").innerHTML = ' ✓';
            sendServerMessage("Slowmode has been enabled");
        } else {
            document.getElementById("slowmode-toggle").innerHTML = '';
            sendServerMessage("Slowmode has been disabled");
        }
    })
}

function slowMode() {
    db.ref("other/").on("value", function(obj) {
        var obj = obj.val();
        if (obj.slowmode) {
            messageSleep = parseInt(obj.slowmodetime) * 1000;
        } else {
            messageSleep = 0;
        }
    })
}

function imageSleepCheck() {
    db.ref("other/imageSleep").on("value", function(obj) {
        var obj = obj.val();
        imageSleep = parseInt(obj);
    })
}

function checkCommands() {
    const commandsArray = commands.split("/");
    var newComms = "<ul>";
    commandsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ul>"
    showPopUp("Admin Commands", newComms);
}

function showShadowBans() {
    db.ref("users/").once("value", function(users_object) {
        var newComms = "<ul>";
        users_object.forEach(user => {
            if (user.val().shadowban && user.key !== getUsername()) {
                newComms += "<li>";
                newComms += user.key;
                newComms += "</li>";
            }
        })
        newComms += "</ul>"
        showPopUp("Shadow Bans", newComms);
    })
}

function userCommands() {
    const commandsArray = usrCommands.split("/");
    var newComms = "<ul>";
    commandsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ul>"
    showPopUp("Commands", newComms);
}

function commandments() {
    const commandmentsArray = tenCommandments.split("/");
    var newComms = "<ol>";
    commandmentsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ol>"
    showPopUp("Commandments", newComms);
}

function effectMenu() {
    db.ref(`users/${getUsername()}`).once("value", function(user_object) {
        showPopUp("Effects", `
            <div>
                <b>???</b><br><br>
                <div id="message">
                    <div class="username" style="font-weight: bold; color: yellow;">[SERVER]</div>
                    <div id="god-border"><div class="" id="god-text" style="">${getUsername()} has joined the chat<span style="visibility: hidden;">@${getUsername()}</span></div></div>
                </div><br><br>
                Unlock Requirement: ???     <button onclick="${user_object.val().active_effect === 0 ? "equipEffect('remove')" : "equipEffect(0)"}">${user_object.val().active_effect === 0 ? "Unequip" : "Equip"}</button>
            </div>

            <br><hr>

            <div>
                Ä̶͙̞̹̙́̆͊n̴̎̋̿͜͝o̶͍̦̩̗͒ḿ̴̲ǎ̶̡̼̑̿͗l̵͕̩̼͒y̵̗̺͈̔̎̊̚<br><br>
                <div id="message">
                    <div class="username" style="font-weight: bold; color: yellow;">[SERVER]</div>
                    <div class="message-text" id="anomaly-text" style="">${getUsername()} has joined the chat<span style="visibility: hidden;">@${getUsername()}</span></div>
                </div><br><br>
                Unlock Requirement: Donate $10 B or more legitimately during the 2025 Summer Break     <button onclick="${user_object.val().active_effect === 1 ? "equipEffect('remove')" : "equipEffect(1)"}">${user_object.val().active_effect === 1 ? "Unequip" : "Equip"}</button>
            </div>

            <br><hr>

            <div>
                Admin<br><br>
                <div id="message">
                    <div class="username" style="font-weight: bold; color: yellow;">[SERVER]</div>
                    <div class="message-text" style="color: yellow">Admin ${getUsername()} has joined the chat<span style="visibility: hidden;">@${getUsername()}</span></div>
                </div><br><br>
                Unlock Requirement: Have 1 or more admin levels     <button onclick="${user_object.val().active_effect === 2 ? "equipEffect('remove')" : "equipEffect(2)"}">${user_object.val().active_effect === 2 ? "Unequip" : "Equip"}</button>
            </div>

            <br><hr>

            <div>
                <p style="font-family: undertale-papyrus;">Papyrus</p><br><br>
                <div id="message">
                    <div class="message-text" id="papyrus-text">
                        <img id="papyrus" src="../images/papyrus_neutral.png">
                        <p>NYEH HEH HEH!</p>
                    </div>
                </div><br><br>
                Unlock Requirement: Be the first person to donate more than or equal to $15     <button onclick="${user_object.val().active_effect === 3 ? "equipEffect('remove')" : "equipEffect(3)"}">${user_object.val().active_effect === 3 ? "Unequip" : "Equip"}</button>
            </div>

            <br><hr>

            <div>
                Best2playercoolmathgame<br><br>
                <div id="message">
                    <div class="username" style="font-weight: bold; color: yellow;">[SERVER]</div>
                    <div class="message-text" id="fuyukai">
                        ${getUsername()} has joined the chat<span style="visibility: hidden;">@${getUsername()}</span>
                    </div>
                </div><br><br>
                Unlock Requirement: Be the first person to donate more than $5 but less than $10     <button onclick="${user_object.val().active_effect === 4 ? "equipEffect('remove')" : "equipEffect(4)"}">${user_object.val().active_effect === 4 ? "Unequip" : "Equip"}</button>
            </div>

            <br><hr>

            <div>Enable effect to apply to messages: <input type="checkbox" id="effectmessage"></div>
        `)

        document.getElementById("effectmessage").addEventListener("change", function(event) {
            db.ref(`users/${getUsername()}/effects`).update({
                apply: document.getElementById("effectmessage").checked
            })
        })

        if (user_object.val().effects && user_object.val().effects["apply"]) {
            document.getElementById("effectmessage").checked = true;
        } else {
            document.getElementById("effectmessage").checked = false;
        }

        scramblePreview();
    })
}

function scramblePreview() {
    if (document.getElementById("anomaly-text")) {
        var scrambleText = new ScrambleText(document.getElementById("anomaly-text")).start();
        setTimeout(scramblePreview, 5000);
    }
}

function equipEffect(effect) {
    if (effect == "remove") {
        db.ref(`users/${getUsername()}/active_effect`).remove();
        document.getElementById("popup").remove();
    } else {
        db.ref(`users/${getUsername()}/effects/${effect}`).once("value", function(effect_object) {
            if (effect_object.val()) {
                db.ref(`users/${getUsername()}/active_effect`).set(effect);
                document.getElementById("popup").remove();
            }
        })
    }
}

function updateMedianAdmin() {
    // Get the chats from firebase
    db.ref("users/").once("value", function(memberList) {
        var admins = [];
        var median = 0;
        if (memberList.numChildren() == 0) {
            median = 0;
        }
        var members = Object.values(memberList.val());
        members.forEach((member) => {
            admins.push(parseFloat(member.admin));
        })
        admins.sort((a, b) => a - b);
        // alert(admins);
        var size = admins.length;
        // alert(size);
        if (size % 2 == 1) {
            median = admins[Math.floor(size / 2)];
        } else {
            median = (admins[size / 2] + admins[size / 2 + 1]) / 2;
        }
        db.ref("other/").update({
            medianAdmin: median,
        })
    })
}

function voteButton(choice) {
    var count = parseInt(choice.textContent) || 0;
    count++;
    
    choice.innerHTML = count;
    db.ref("other/vote/").update({
        [choice.id]: count,
    })
    db.ref("other/vote/voters").update({
        [getUsername()]: true,
    })
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};

function checkActive() {
    db.ref(".info/connected").on("value", (snapshot) => {
        db.ref(`users/${getUsername()}`).once("value", function(user_object) {
            if (snapshot.val() && user_object.exists()) {
                if (user_object.val().activeoption || typeof(user_object.val().activeoption) == "undefined") {
                    db.ref(`users/${getUsername()}`).update({
                        active: true
                    }).then(() => {
                        displayMembers();
                    })
                } else {
                    displayMembers();
                }
                db.ref("users/" + getUsername()).onDisconnect().update({
                    active: false,
                })
            }
        })
    })
}

function resizeTextBox() {
    // const textarea = document.getElementById("box-message");
    // const textwrapper = document.getElementById("downbar");
    // textwrapper.style.height = "10%"; // Reset height
    // textwrapper.style.height = Math.min(textarea.scrollHeight, 2000) + "px";
    // textwrapper.style.transform = `translateY(${-(newHeight - 40)}px)`;
    // textarea.style.height = "auto"; // Reset height
    // textarea.style.height = Math.min(textarea.scrollHeight, 2000) + "px";
    // textarea.style.transform = `translateY(${-(newHeight - 40)}px)`;
}

function imagePopup() {
    showPopUp("Upload File",`
        <input type="file" id="fileUpload">
        <button onclick="submitImage()" id="submitImageButton">Submit</button><br><br>
        <div id="progressContainer" style="display: none">Progress: <progress id="uploadProgress" max="100" value="0"></progress> <span id="progressIndicator">Uploading...</span></div>`)
}

function submitImage() {
    if (typeof(document.getElementById("fileUpload").files[0]) == "undefined") {
        alert("Please select a file before submitting");
        return;
    }

    var fileExtension = document.getElementById("fileUpload").files[0].name.split('.').pop();
    var fileType;
    if (["jpg", "gif", "webp", "png", "apng", "avif", "jpeg", "jfif", "pjpeg", "pjp"].includes(fileExtension)) {
        fileType = "image";
    } else if (["mp3", "flac", "wav"].includes(fileExtension)) {
        fileType = "audio";
    } else if (["mp4", "webm"].includes(fileExtension)) {
        fileType = "video";
    } else {
        fileType = "file";
    }

    if ((document.getElementById("fileUpload").files[0].size > 10 * 1024 * 1024 && fileType === "image") || (document.getElementById("fileUpload").files[0].size > 50 * 1024 * 1024 && fileType === "video") || (document.getElementById("fileUpload").files[0].size > 100 * 1024 * 1024 && fileType === "audio") || (document.getElementById("fileUpload").files[0].size > 1024 * 1024 * 1024 && fileType === "file")) {
        alert("File exceeds max size.");
        return;
    }


    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("submitImageButton").disabled = true;
    var uploadTask = storage.ref(`${getUsername()}/${document.getElementById("fileUpload").files[0].name}`).put(document.getElementById("fileUpload").files[0])

    uploadTask.on('state_changed', (snapshot) => {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        document.getElementById("uploadProgress").value = progress;
        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED:
                document.getElementById("progressIndicator").innerHMTL = "Paused...";
                break;
            case firebase.storage.TaskState.RUNNING:
                document.getElementById("progressIndicator").innerHMTL = "Uploading...";
                break;
        }
    }, (error) => {
        alert(error);
    }, () => {
        db.ref(`users/${getUsername()}`).once("value", function(user_object) {
            db.ref('chats/').push({
                name: getUsername(),
                message: document.getElementById("fileUpload").files[0].name,
                admin: user_object.val().admin,
                display_name: user_object.val().display_name,
                type: ["image", "audio", "video"].includes(uploadTask.snapshot.metadata.contentType.split('/')[0]) ? uploadTask.snapshot.metadata.contentType.split('/')[0] : "file",
                channel: (sessionStorage.getItem("channel") || "general"),
                edited: false,
                time: Date.now(),
                effect: ((user_object.val().effects || false) && (user_object.val().effects["apply"] || false)) ? typeof(user_object.val().active_effect) == "undefined" ? false : user_object.val().active_effect : false,
                // profileimage: user_object.val().profileimage,
            }).then(function() {
                db.ref("users/" + getUsername()).update({
                    sleep: Date.now(),
                })
                document.getElementById("popup").remove();
            })
        })
    });
}

function getChatContext(userMessage, messageKey, username) {
    const maxContextMessages = 50; // include more history if needed
    let contextMessages = [];

    getSystemPromptFromFirebase(systemPrompt => {
        // 1. Add system prompt
        contextMessages.push({
            role: "system",
            content: systemPrompt + devPrompt
        });

        // 2. Include messages from history, formatting with username
        let messageCount = 0;
        for (let i = globalMessages.length - 2; i >= 0 && messageCount < maxContextMessages; i--) {
            const msg = globalMessages[i].val();

            if (!msg.removed && !["[SERVER]", "[VOTING]"].includes(msg.name)) {
                if (msg.name === "[GPT]" && msg.message.toLowerCase() === "thinking...") continue;

                contextMessages.push({
                    role: msg.name === "[GPT]" ? "assistant" : "user",
                    content: `${msg.name}: ${msg.message}` // embed username here
                });
                messageCount++;
            }
        }

        contextMessages.reverse();

        // 3. Call GPT
        callChatGPT(contextMessages, messageKey, userMessage);
    });
}

function getSystemPrompt() {
    // ========================================
    // CUSTOMIZE YOUR AI PERSONALITY HERE!
    // ========================================
    // 
    // Change this text to give your AI a different personality, role, or behavior.
    // Examples:
    // - "You are a friendly robot assistant who loves helping people"
    // - "You are a wise old wizard who speaks in riddles and gives cryptic advice"
    // - "You are a pirate captain who always talks about treasure and the sea"
    // - "You are a superhero who is always optimistic and encouraging"
    // - "You are a grumpy old man who complains about everything"
    //
    // The AI will use this prompt to guide all its responses!
    
    return "You are a person that talking with friends.";
}

function getSystemPromptFromFirebase(callback) {
    // Try to get the system prompt from Firebase, with fallback to default
    db.ref('other/gpt_system_prompt').once('value', function(snapshot) {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            // If no Firebase value exists, use default and set it
            var defaultPrompt = getSystemPrompt();
            db.ref('other/').update({
                gpt_system_prompt: defaultPrompt
            });
            callback(defaultPrompt);
        }
    });
}

function callChatGPT(messages, messageKey, originalUserMessage) {
    // Get the user's message (last message in the array)
    var userMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Call a real large language model API
    callLLMAPI(messages, messageKey, originalUserMessage);
}

function callLLMAPI(messages, messageKey, originalUserMessage) {
    // Use the configuration from gpt-config.js
    if (typeof GPT_CONFIG === 'undefined') {
        console.error('GPT_CONFIG not found. Please check gpt-config.js');
        showErrorResponse(messageKey, originalUserMessage, "Configuration error: GPT_CONFIG not found");
        return;
    }
    
    var config = GPT_CONFIG;
    
    if (config.provider === "huggingface") {
        // Try Hugging Face with fallback models
        tryHuggingFaceWithFallback(messages, messageKey, originalUserMessage, config, 0);
    } else if (config.provider === "togetherai") {
        // Try Together.ai with fallback models
        tryTogetherAIWithFallback(messages, messageKey, originalUserMessage, config, 0);
    } else {
        // Other providers
        tryOtherProvider(messages, messageKey, originalUserMessage, config);
    }
}

function tryHuggingFaceWithFallback(messages, messageKey, originalUserMessage, config, modelIndex) {
    var models = [config.huggingface.model, ...(config.huggingface.fallbackModels || [])];
    
    if (modelIndex >= models.length) {
        // All models failed, generate a simple fallback response
        console.log("All Hugging Face models failed, using fallback response");
        var fallbackResponse = generateSimpleFallbackResponse(originalUserMessage);
        db.ref(`chats/${messageKey}`).update({
            message: fallbackResponse
        });
        return;
    }
    
    var currentModel = models[modelIndex];
    var apiUrl = config.huggingface.apiUrl + currentModel;
    var apiKey = config.huggingface.apiKey;
    
    var headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    var payload = {
        inputs: messages[messages.length - 1].content,
        parameters: {
            max_length: config.maxTokens,
            temperature: config.temperature,
            do_sample: true
        }
    };
    
    console.log(`Trying Hugging Face model ${modelIndex + 1}/${models.length}:`, currentModel);
    console.log('API URL:', apiUrl);
    
    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from', currentModel, ':', data);
        
        var llmResponse = "";
        if (data.generated_text) {
            llmResponse = data.generated_text;
        } else if (data[0] && data[0].generated_text) {
            llmResponse = data[0].generated_text;
        } else if (data[0] && data[0].generated_text === "") {
            llmResponse = "I'm sorry, I couldn't generate a proper response with this model.";
        } else {
            llmResponse = "I'm sorry, I couldn't generate a proper response.";
        }
        
        // Update the message with the response
        db.ref(`chats/${messageKey}`).update({
            message: llmResponse
        });
    })
    .catch(error => {
        console.error(`Error with model ${currentModel}:`, error);
        // Try next model
        tryHuggingFaceWithFallback(messages, messageKey, originalUserMessage, config, modelIndex + 1);
    });
}

function tryTogetherAIWithFallback(messages, messageKey, originalUserMessage, config, modelIndex) {
    var models = [config.togetherai.model, ...(config.togetherai.fallbackModels || [])];
    
    if (modelIndex >= models.length) {
        // All models failed, generate a simple fallback response
        alert("All Together.ai models failed, using fallback response");
        var fallbackResponse = generateSimpleFallbackResponse(originalUserMessage);
        db.ref(`chats/${messageKey}`).update({
            message: fallbackResponse
        });
        return;
    }
    
    var currentModel = models[modelIndex];
    var apiUrl = config.togetherai.apiUrl;
    var apiKey = config.togetherai.apiKey;
    
    var headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    var payload = {
        model: currentModel,
        messages: messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature
    };
    
    console.log(`Trying Together.ai model ${modelIndex + 1}/${models.length}:`, currentModel);
    console.log('API URL:', apiUrl);
    
    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from', currentModel, ':', data);
        
        var llmResponse = "";
        if (data.choices && data.choices[0] && data.choices[0].message) {
            llmResponse = data.choices[0].message.content;
        } else {
            llmResponse = "I'm sorry, I couldn't generate a proper response.";
        }
        
        // Update the message with the response
        db.ref(`chats/${messageKey}`).update({
            message: llmResponse
        });
    })
    .catch(error => {
        console.error(`Error with model ${currentModel}:`, error);
        // Try next model
        tryTogetherAIWithFallback(messages, messageKey, originalUserMessage, config, modelIndex + 1);
    });
}

function tryOtherProvider(messages, messageKey, originalUserMessage, config) {
    var apiUrl, apiKey, headers, payload;
    
    try {
        switch (config.provider) {
            case "openai":
                apiUrl = config.openai.apiUrl;
                apiKey = config.openai.apiKey;
                headers = {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                };
                payload = {
                    model: config.openai.model,
                    messages: messages,
                    max_tokens: config.maxTokens,
                    temperature: config.temperature
                };
                break;
                
            case "anthropic":
                apiUrl = config.anthropic.apiUrl;
                apiKey = config.anthropic.apiKey;
                headers = {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                };
                payload = {
                    model: config.anthropic.model,
                    max_tokens: config.maxTokens,
                    temperature: config.temperature,
                    messages: messages.map(msg => ({
                        role: msg.role === 'system' ? 'user' : msg.role,
                        content: msg.content
                    }))
                };
                break;
                
            default:
                throw new Error(`Unknown provider: ${config.provider}`);
        }
        
        console.log('Making API call to:', apiUrl);
        // alert(JSON.stringify(payload));
        
        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            var llmResponse = "";
            
            switch (config.provider) {
                case "openai":
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        llmResponse = data.choices[0].message.content;
                    } else {
                        llmResponse = "I'm sorry, I couldn't generate a proper response.";
                    }
                    break;
                    
                case "anthropic":
                    if (data.content && data.content[0] && data.content[0].text) {
                        llmResponse = data.content[0].text;
                    } else {
                        llmResponse = "I'm sorry, I couldn't generate a proper response.";
                    }
                    break;
            }
            
            alert(llmResponse);

            db.ref(`chats/${messageKey}`).update({
                message: llmResponse
            });
        })
        .catch(error => {
            console.error('Error calling LLM API:', error);
            showErrorResponse(messageKey, originalUserMessage, "API Error: " + error.message);
        });
        
    } catch (error) {
        console.error('Configuration error:', error);
        showErrorResponse(messageKey, originalUserMessage, "Configuration Error: " + error.message);
    }
}

function showErrorResponse(messageKey, originalUserMessage, errorMessage) {
    var fallbackResponse = "I'm sorry, but I encountered an error while processing your request. Please try again later or contact an administrator.";
    
    var formattedResponse = `${fallbackResponse}\n\nError: ${errorMessage}`;
    
    db.ref(`chats/${messageKey}`).update({
        message: formattedResponse
    });
}

function generateSimpleFallbackResponse(userMessage) {
    // Simple keyword-based responses when all models fail
    var message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hello! I'm having trouble connecting to my AI models right now, but I can still help with basic questions. How are you doing?";
    }
    
    if (message.includes('how are you')) {
        return "I'm functioning, though my advanced AI features are temporarily unavailable. I'm here to help with what I can!";
    }
    
    if (message.includes('weather')) {
        return "I can't check real-time weather data right now, but I hope it's nice where you are! You might want to check a weather app for current conditions.";
    }
    
    if (message.includes('math') || message.includes('calculate') || message.includes('equation')) {
        return "I'd be happy to help with math! What specific problem are you working on? I can assist with basic calculations and problem-solving.";
    }
    
    if (message.includes('help') || message.includes('assist')) {
        return "I'm here to help! What do you need assistance with? While my advanced AI is down, I can still provide basic support and guidance.";
    }
    
    if (message.includes('joke') || message.includes('funny')) {
        return "Why don't scientists trust atoms? Because they make up everything! 😄 I'm in a simple mode right now, but I can still share some humor!";
    }
    
    if (message.includes('meaning') || message.includes('purpose') || message.includes('life')) {
        return "That's a profound question! Life's meaning is often what you make of it. What gives you purpose and joy? I'd love to hear your thoughts.";
    }
    
    if (message.includes('computer') || message.includes('programming') || message.includes('code')) {
        return "Programming is like solving puzzles with logic! What language are you working with? I can help with basic coding concepts and problem-solving.";
    }
    
    // Default response
    return "That's an interesting question! I'm currently in a simplified mode, but I'd be happy to discuss this topic with you. What would you like to know more about?";
}

function generateContextualResponse(userMessage, contextMessages) {
    // Check if we're in villain mode
    var isVillain = false;
    for (var i = 0; i < contextMessages.length; i++) {
        if (contextMessages[i].role === "system" && contextMessages[i].content.includes("villain")) {
            isVillain = true;
            break;
        }
    }
    
    // Try to find relevant context from recent messages
    for (var i = contextMessages.length - 2; i >= 0; i--) {
        var contextMsg = contextMessages[i].content.toLowerCase();
        
        // If the context message mentions something related to the user's question
        if (contextMsg.includes('game') && userMessage.includes('game')) {
            if (isVillain) {
                return "*sinister grin* Games? Ah yes, I do enjoy a good game of cat and mouse. Though in my realm, the stakes are... higher. What kind of games entertain your simple mind?";
            }
            return "I see you're talking about games! What kind of games do you enjoy?";
        }
        
        if (contextMsg.includes('music') && userMessage.includes('music')) {
            if (isVillain) {
                return "*dark chuckle* Music? In the void, we have symphonies that drive mortals to madness. But I suppose your primitive melodies have their... charm. What genres do you prefer?";
            }
            return "Music is a great topic! What genres do you like?";
        }
        
        if (contextMsg.includes('food') && userMessage.includes('food')) {
            if (isVillain) {
                return "*raises eyebrow* Food? How... mundane. In my dimension, we feast on the essence of dying stars. But I'm curious - what sustains your fragile mortal form?";
            }
            return "Food discussions are always fun! What's your favorite cuisine?";
        }
        
        if (contextMsg.includes('school') || contextMsg.includes('class') || contextMsg.includes('study')) {
            if (isVillain) {
                return "*evil smile* Education? How quaint. I've learned secrets that would shatter your understanding of reality. What trivial subject occupies your studies, mortal?";
            }
            return "School can be challenging! What subject are you working on?";
        }
    }
    
    return null;
}

window.onload = function() {
    try {
        const config = {
            apiKey: "AIzaSyDR729rPecV61NEke0Z2iYESFES9I0DB8A",
            authDomain: "rock-free.firebaseapp.com",
            databaseURL: "https://rock-free-default-rtdb.firebaseio.com",
            projectId: "rock-free",
            storageBucket: "rock-free.firebasestorage.app",
            messagingSenderId: "112181117305",
            appId: "1:112181117305:web:1708cc56b4bff667816fa8",
            measurementId: "G-1MNYP5Y2MC"
        };

        firebase.initializeApp(config);
        db = firebase.database();
        auth = firebase.auth();
        storage = firebase.storage();

        const script = document.createElement('script');
        script.src = '../config.js';
        if (typeof(window.APPCHECK) !== "undefined") {
            self.FIREBASE_APPCHECK_DEBUG_TOKEN = window.APPCHECK;
        }

        const appCheck = firebase.appCheck();
        appCheck.activate('6LcSGM8rAAAAAGtvp85S9U7ldej8RieeRdjj6-Hd', true, { provider: firebase.appCheck.ReCaptchaV3Provider });

        var fpPromise = FingerprintJS.load()

        fpPromise.then(fp => fp.get()).then(result => {
            requestId = result.visitorId;
            
            auth.onAuthStateChanged(function(user) {
                if (user) {
                    setup();
                } else {
                    main.style.display = "none";
                    loginBlock.style.display = "block";
                }
            })
        })
    } catch(err) {
        alert(err);
    }
};
