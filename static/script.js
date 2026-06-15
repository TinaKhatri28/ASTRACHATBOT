document.addEventListener("DOMContentLoaded", () => {
    const chatContainer = document.getElementById("chatContainer");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const voiceBtn = document.getElementById("voiceBtn");
    const ttsAudio = document.getElementById("ttsAudio");

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Add a message to the chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "user" ? "user-message" : "ai-message");

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        
        if (sender === "user") {
            avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
        } else {
            avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
        }

        const content = document.createElement("div");
        content.classList.add("message-content");
        const p = document.createElement("p");
        p.textContent = text;
        content.appendChild(p);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add loading typing indicator
    function addTypingIndicator() {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "ai-message");
        messageDiv.id = "typingIndicator";

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';

        const content = document.createElement("div");
        content.classList.add("message-content");
        
        const typing = document.createElement("div");
        typing.classList.add("typing-indicator");
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        content.appendChild(typing);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById("typingIndicator");
        if (indicator) {
            indicator.remove();
        }
    }

    // Play base64 audio
    function playAudio(base64Audio) {
        if (!base64Audio) return;
        
        const audioSrc = "data:audio/mp3;base64," + base64Audio;
        ttsAudio.src = audioSrc;
        
        ttsAudio.play().then(() => {
            document.body.classList.add("audio-playing");
        }).catch(err => {
            console.error("Audio play failed:", err);
        });

        ttsAudio.onended = () => {
            document.body.classList.remove("audio-playing");
        };
    }

    // Stop audio
    function stopAudio() {
        ttsAudio.pause();
        ttsAudio.currentTime = 0;
        document.body.classList.remove("audio-playing");
    }

    // Voice button toggles playback stop if playing
    voiceBtn.addEventListener("click", () => {
        if (!ttsAudio.paused) {
            stopAudio();
        }
    });

    // Handle sending message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Stop any currently playing audio
        stopAudio();

        // UI Updates
        addMessage(text, "user");
        userInput.value = "";
        userInput.disabled = true;
        sendBtn.disabled = true;
        
        addTypingIndicator();

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            
            removeTypingIndicator();
            addMessage(data.response, "ai");
            
            if (data.audio) {
                playAudio(data.audio);
            }

        } catch (error) {
            console.error(error);
            removeTypingIndicator();
            addMessage("I'm sorry, I am currently unable to connect to the server.", "ai");
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    // Event Listeners
    sendBtn.addEventListener("click", sendMessage);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
});
