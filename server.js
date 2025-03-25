const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(__dirname));

// Store connected users
const users = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Assign a random username
  const username = `User${Math.floor(Math.random() * 1000)}`;
  users[socket.id] = username;
  io.emit("user list", Object.values(users)); // Send updated user list to all clients

  // Notify others of new user
  socket.broadcast.emit("chat message", {
    content: `${username} has joined the chat`,
    sender: "system",
    timestamp: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  });

  // Handle chat messages
  socket.on("chat message", (msg) => {
    const message = {
      content: msg.content,
      sender: users[socket.id],
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    console.log("Message received:", message);
    io.emit("chat message", message); // Broadcast to all
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    io.emit("user list", Object.values(users)); // Update user list
    socket.broadcast.emit("chat message", {
      content: `${username} has left the chat`,
      sender: "system",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    });
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
