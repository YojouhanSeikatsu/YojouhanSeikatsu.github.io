let db;
let auth;

function submit() {
    var newDisplayName = document.getElementById("display-input").value;
    var newPassword = document.getElementById("new-input").value;
    var newCopyPassword = document.getElementById("copy-input").value;
    var oldPassword = document.getElementById("old-input").value;
    const credential = firebase.auth.EmailAuthProvider.credential(
        auth.currentUser.email,
        oldPassword
    );

    if (newPassword === newCopyPassword) {
        document.getElementById("submit").disabled = true;

        auth.currentUser.reauthenticateWithCredential(credential).then(async () => {
            auth.currentUser.getIdToken(/* forceRefresh */ true).then(function(idtoken) {
                fetch("https://us-central1-rock-585b5.cloudfunctions.net/api/changeProfile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({idtoken, display_name: newDisplayName, newpassword: newPassword})
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
        }).catch((error) => {
            alert(error);
        }).finally(() => {
            document.getElementById("submit").disabled = false;
        })
    } else {
        alert("New password and confirmed password do not match")
    }
}

window.onload = function() {
    fetch('https://us-central1-rock-585b5.cloudfunctions.net/api/getInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: typeof(window.APPCHECK) !== "undefined" ? window.APPCHECK : null
    })
    .then(response => response.json())
    .then(data => {
        if (data.version !== curr_version) {
            document.body.innerHTML = `An error has occured. You are most likely using an outdated version of the site. Fetch a new version by pressing "ctrl + shift + R" or "ctrl + f5<br>
            Newest Version: ${data.version}<br>
            Your Version: ${curr_version}`;
        }
    })
    
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

    auth.onAuthStateChanged(function(user) {
        if (user) {
            const script = document.createElement('script');
            script.src = '../config.js';
            if (typeof(window.APPCHECK) !== "undefined") {
                self.FIREBASE_APPCHECK_DEBUG_TOKEN = window.APPCHECK;
            }

            const appCheck = firebase.appCheck();
            appCheck.activate('6LcSGM8rAAAAAGtvp85S9U7ldej8RieeRdjj6-Hd', true, { provider: firebase.appCheck.ReCaptchaV3Provider });

            // log out in another window check
            window.addEventListener("storage", function(event) {
                if (event.storageArea === localStorage && event.key === null) {
                    location.reload();
                }
            })
        }
    })
}
