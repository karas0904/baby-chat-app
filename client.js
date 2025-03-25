document.addEventListener("DOMContentLoaded", () => {
  const socket = io("http://localhost:3000");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const messages = document.getElementById("messages");
  let username = "";

  // Send message
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const content = messageInput.value.trim();
    if (content) {
      socket.emit("chat message", { content });
      messageInput.value = "";
    }
  }

  // Receive messages
  socket.on("chat message", (msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    if (msg.sender === "system") {
      messageDiv.classList.add("system");
      messageDiv.innerHTML = `<p>${msg.content}</p>`;
    } else {
      messageDiv.classList.add(msg.sender === username ? "sent" : "received");
      messageDiv.innerHTML = `
          <p><strong>${msg.sender}:</strong> ${msg.content}</p>
          <span class="timestamp">${msg.timestamp}</span>
        `;
    }
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  });

  // Update message list with connected users
  function updateMessageList(userList) {
    const messageList = document.getElementById("message-list");
    messageList.innerHTML = "";
    userList.forEach((user) => {
      if (user !== username) {
        // Exclude self
        const item = document.createElement("div");
        item.classList.add("message-item");
        item.dataset.user = user;
        item.innerHTML = `
            <div class="avatar"><img src="https://via.placeholder.com/40" alt="${user}"></div>
            <div class="details">
              <div class="name">${user}</div>
              <div class="snippet">Click to chat</div>
            </div>
            <div class="time">${new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}</div>
          `;
        item.addEventListener("click", () => {
          document.querySelector(".chat-header .name").textContent = user;
          messages.innerHTML = ""; // Clear chat for new conversation
        });
        messageList.appendChild(item);
      }
    });
  }

  // Handle user list updates
  socket.on("user list", (userList) => {
    if (!username) {
      // Set username based on the first connection
      username =
        userList.find((name) => name === socket.id) ||
        `User${socket.id.slice(0, 4)}`;
    }
    updateMessageList(userList);
    console.log("Current users:", userList);
  });

  socket.on("connect", () => {
    console.log("Connected to server!");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server!");
  });
});
