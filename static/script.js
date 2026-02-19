document.addEventListener("DOMContentLoaded", function () {

    const chatBtn = document.getElementById("chatButton");
    const chatBox = document.getElementById("chatBox");
    const closeBtn = document.getElementById("closeBtn");
    const sendBtn = document.getElementById("sendBtn");
    const input = document.getElementById("userInput");
    const chatBody = document.getElementById("chatBody");
    const voiceBtn = document.getElementById("voice-btn");

    chatBtn.onclick = () => chatBox.style.display = "flex";
    closeBtn.onclick = () => chatBox.style.display = "none";

    function addMessage(text, type) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "message " + type;

        const content = document.createElement("div");
        content.className = "message-content";
        content.innerText = text;

        msgDiv.appendChild(content);
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function sendMessage() {
        const msg = input.value.trim();
        if (!msg) return;

        addMessage(msg, "user-message");
        input.value = "";

        fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        })
        .then(res => res.json())
        .then(data => {
            addMessage(data.response, "bot-message");

            if (data.audio) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
                audio.play().catch(() => {});
            }
        });
    }

    sendBtn.onclick = sendMessage;

    input.addEventListener("keypress", function(e) {
        if (e.key === "Enter") sendMessage();
    });

    // 🎤 Voice Input
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;

        voiceBtn.onclick = () => {
            recognition.start();
            voiceBtn.innerHTML = "🔴";
        };

        recognition.onresult = (event) => {
            input.value = event.results[0][0].transcript;
            voiceBtn.innerHTML = "🎤";
            sendMessage();
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = "🎤";
        };
    } else {
        voiceBtn.style.display = "none";
    }

});
