function migrate() {
    const oldPassword = document.getElementById("old-password").value;
    const username = document.getElementById("username").value;
    const newPassword = document.getElementById("new-password").value;
    const displayName = document.getElementById("display-name").value;
    const email = document.getElementById("email").value;

    fetch('https://us-central1-rock-585b5.cloudfunctions.net/api/migration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({uid: username, password: oldPassword, email: email, display: displayName, channel: (sessionStorage.getItem("channel") || "general"), newpassword: newPassword})
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            localStorage.clear();
            auth.signInWithEmailAndPassword(email, password).then(() => {
                alert("Successfully signed in, navigate back to pebble");
            }).catch((error) => {
                alert(error.message);
            });
        }
    })
}