
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");

let conversation = [];
let busy = false;

function addMessage(text, role) {
    const message = document.createElement("div");
    message.className = `message ${role}`;
    message.textContent = text;
    messages.appendChild(message);

    document.getElementById("chatArea").scrollTop =
        document.getElementById("chatArea").scrollHeight;

    return message;
}

async function sendMessage(text) {
    if (busy || !text.trim()) return;

    busy = true;
    sendButton.disabled = true;
    welcome.style.display = "none";

    addMessage(text, "user");

    conversation.push({
        role: "user",
        text: text
    });

    const loading = addMessage("A Neura AI gondolkodik...", "assistant");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: conversation
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Hiba történt.");
        }

        loading.textContent = data.reply || "Nem érkezett válasz.";

        conversation.push({
            role: "assistant",
            text: data.reply || ""
        });

    } catch (error) {
        loading.textContent =
            "Nem sikerült kapcsolatba lépni a Neura AI-val. Próbáld újra később.";
        console.error(error);
    } finally {
        busy = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();
    if (!text || busy) return;

    messageInput.value = "";
    sendMessage(text);
});

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

newChatButton.addEventListener("click", () => {
    conversation = [];
    messages.innerHTML = "";
    welcome.style.display = "block";
    messageInput.value = "";
});
