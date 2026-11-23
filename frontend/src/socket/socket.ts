import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (accessToken: string) => {
  if (socket) {
    return socket;
  }

  socket = io("/", {
    auth: {
      token: accessToken,
    },
  });

  socket.on("connect", () => {
   
  });

  socket.on("disconnect", () => {
    socket = null;
  });

  return socket;
};

export { socket };
