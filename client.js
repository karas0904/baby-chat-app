document.addEventListener("DOMContentLoaded", () => {
  const socket = io("http://localhost:3000");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const messages = document.getElementById("messages");
  const dropdownHeader = document.getElementById("dropdown-header");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownSelected = document.getElementById("dropdown-selected");
  const arrow = document.querySelector(".dropdown-header .arrow");

  let username = "";
  let currentRoom = "global"; // Default room

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
      socket.emit("chat message", { content, room: currentRoom });
      messageInput.value = "";
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
    roomMessages.forEach(appendMessage);
  });

  // Receive new messages
  socket.on("chat message", (msg) => {
    if (msg.room === currentRoom) appendMessage(msg);
  });

  function updateMessageList(userList) {
    const messageList = document.getElementById("message-list");
    messageList.innerHTML = "";
    userList.forEach((user) => {
      if (user !== username) {
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
          currentRoom = `${username}-${user}`;
          document.querySelector(".chat-header .name").textContent = user;
          socket.emit("load messages"); // Request messages for the current room
        });
        messageList.appendChild(item);
      }
    });
  }

  // Set username and update user list
  socket.on("set username", (assignedUsername) => {
    username = assignedUsername;
    console.log("Username set:", username);
  });

  socket.on("user list", (userList) => {
    if (username) {
      // Only update if username is set
      updateMessageList(userList);
    }
    console.log("Current users:", userList);
  });

  socket.on("connect", () => {
    console.log("Connected to server!");
    socket.emit("load messages"); // Load messages on connect
  });
  socket.on("disconnect", () => console.log("Disconnected from server!"));

  // Dropdown functionality
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
      socket.emit("load messages"); // Request messages for the new room
    }
  });
});
