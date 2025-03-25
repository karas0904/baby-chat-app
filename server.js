const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const users = {};
const messages = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const username = `User${Math.floor(Math.random() * 1000)}`;
  users[socket.id] = username;

  socket.emit("load messages", messages);
  io.emit("user list", Object.values(users));

  socket.broadcast.emit("chat message", {
    content: `${username} has joined the chat`,
    sender: "system",
    timestamp: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  });

  socket.on("chat message", (msg) => {
    const room = msg.room || "global";
    const message = {
      content: msg.content,
      sender: users[socket.id],
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    if (!messages[room]) messages[room] = [];
    messages[room].push(message);
    console.log(`Message in ${room}:`, message);
    io.emit("chat message", { ...message, room });
  });

  // Typing indicator
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", {
      username: users[socket.id],
      room: data.room,
    });
  });

  socket.on("stop typing", (data) => {
    socket.broadcast.emit("stop typing", {
      username: users[socket.id],
      room: data.room,
    });
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    io.emit("user list", Object.values(users));
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
