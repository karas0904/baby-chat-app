document.addEventListener("DOMContentLoaded", () => {
  const socket = io("http://localhost:3000");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const messages = document.getElementById("messages");

  let username = "";
  let currentRoom = "global";
  let typingTimeout;

  // Send message on button click
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });

  // Send message on Enter key, emit typing events
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    } else {
      socket.emit("typing", { room: currentRoom });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(
        () => socket.emit("stop typing", { room: currentRoom }),
        1000
      );
    }
  });

  function sendMessage() {
    const content = messageInput.value.trim();
    if (content) {
      socket.emit("chat message", { content, room: currentRoom });
      messageInput.value = "";
      socket.emit("stop typing", { room: currentRoom });
    }
  }

  function appendMessage(msg) {
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
  }

  // Load existing messages
  socket.on("load messages", (messageData) => {
    messages.innerHTML = "";
    const roomMessages = messageData[currentRoom] || [];
    if (roomMessages.length === 0) {
      appendMessage({ sender: "system", content: "No messages yet" });
    } else {
      roomMessages.forEach(appendMessage);
    }
  });

  // Receive new messages
  socket.on("chat message", (msg) => {
    if (msg.room === currentRoom) appendMessage(msg);
    updateMessageList(Object.values(users)); // Refresh message list
  });

  // Typing indicator
  socket.on("typing", (data) => {
    if (data.room === currentRoom && data.username !== username) {
      const existingTyping = document.getElementById("typing-indicator");
      if (!existingTyping) {
        const typingDiv = document.createElement("div");
        typingDiv.id = "typing-indicator";
        typingDiv.classList.add("message", "system");
        typingDiv.innerHTML = `<p>${data.username} is typing...</p>`;
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
      }
    }
  });

  socket.on("stop typing", (data) => {
    if (data.room === currentRoom && data.username !== username) {
      const typingDiv = document.getElementById("typing-indicator");
      if (typingDiv) typingDiv.remove();
    }
  });

  // Update message list with latest message snippet and timestamp
  function updateMessageList(userList) {
    const messageList = document.getElementById("message-list");
    messageList.innerHTML = "";
    userList.forEach((user) => {
      if (user !== username) {
        const room = `${username}-${user}`;
        const lastMessage = (messages[room] || []).slice(-1)[0] || {
          content: "Click to chat",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        };
        const item = document.createElement("div");
        item.classList.add("message-item");
        item.dataset.user = user;
        item.innerHTML = `
                    <div class="avatar"><img src="https://via.placeholder.com/40" alt="${user}"></div>
                    <div class="details">
                        <div class="name">${user}</div>
                        <div class="snippet">${lastMessage.content}</div>
                    </div>
                    <div class="time">${lastMessage.timestamp}</div>
                `;
        item.addEventListener("click", () => {
          currentRoom = room;
          document.querySelector(".chat-header .name").textContent = user;
          socket.emit("load messages", messages);
        });
        messageList.appendChild(item);
      }
    });
  }

  // Handle user list updates
  socket.on("user list", (userList) => {
    if (!username) {
      username =
        userList.find((name) => name === users[socket.id]) ||
        `User${socket.id.slice(0, 4)}`;
    }
    updateMessageList(userList);
    console.log("Current users:", userList);
  });

  // Dropdown functionality
  const dropdownHeader = document.getElementById("dropdown-header");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownSelected = document.getElementById("dropdown-selected");
  const arrow = document.querySelector(".dropdown-header .arrow");

  dropdownHeader.addEventListener("click", () => {
    dropdownMenu.classList.toggle("active");
    arrow.classList.toggle("active");
  });

  dropdownMenu.addEventListener("click", (e) => {
    if (e.target.classList.contains("dropdown-item")) {
      dropdownSelected.textContent = e.target.textContent;
      dropdownMenu.classList.remove("active");
      arrow.classList.remove("active");
      currentRoom =
        e.target.textContent.toLowerCase() === "messages"
          ? "global"
          : "efforts";
      socket.emit("load messages", messages);
    }
  });

  // Connection status
  socket.on("connect", () => {
    console.log("Connected to server!");
    const status = document.querySelector(".chat-header .status");
    status.textContent = "Active";
    status.style.color = "rgba(255, 255, 255, 0.6)";
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server!");
    const status = document.querySelector(".chat-header .status");
    status.textContent = "Offline";
    status.style.color = "#ff4d4d";
    appendMessage({ sender: "system", content: "Disconnected from server" });
  });
});
