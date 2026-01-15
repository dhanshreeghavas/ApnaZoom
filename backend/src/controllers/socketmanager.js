import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders:["*"],
      credentials:true
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // ===========================
    // JOIN CALL
    // ===========================
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify others in the room
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
      }

      // Send previous messages
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

    // ===========================
    // SIGNAL
    // ===========================
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // ===========================
    // CHAT MESSAGE
    // ===========================
    socket.on("chat-message", (data, sender) => {
      let matchingRoom = null;
      let found = false;

      // find room the user belongs to
      [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message", matchingRoom, sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // ===========================
    // DISCONNECT
    // ===========================
    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;

            // Notify others that user left
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            // remove user from room
            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            // delete room if empty
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }

      delete timeOnline[socket.id];
      console.log("User Disconnected:", socket.id);
    });
  });

  return io;
};

export default connectToSocket;
