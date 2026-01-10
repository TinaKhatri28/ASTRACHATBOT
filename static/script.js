// Elements
const chatBtn = document.getElementById("chatButton");
const chatBox = document.getElementById("chatBox");
const closeBtn = document.getElementById("closeBtn");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");

chatBtn.onclick = () => {
    chatBox.style.display = "flex";
};

// Close chat box
closeBtn.onclick = () => {
    chatBox.style.display = "none";
};

function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    // User message
    chatBody.innerHTML += `
        <div class="chat-box-body-send">
            <p>${msg}</p>
            <span>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: msg })
    })
    .then(res => res.json())
    .then(data => {
        chatBody.innerHTML += `
            <div class="chat-box-body-receive">
                <p>${data.response}</p>
                <span>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
        chatBody.scrollTop = chatBody.scrollHeight;
    })
    .catch(err => {
        chatBody.innerHTML += `
            <div class="chat-box-body-receive">
                <p>Error getting response</p>
            </div>
        `;
    });
}


sendBtn.onclick = sendMessage;

// Press Enter to send
input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});


document.getElementById("addExtra").onclick = () => {
    modal.style.display = "block";
};
modalClose.onclick = () => {
    modal.style.display = "none";
};
window.onclick = (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
    }
};
