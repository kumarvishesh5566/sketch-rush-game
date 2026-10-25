import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').trim();

    // If backendUrl is set (e.g. deployed separately on Render/Railway), connect to it.
    // Otherwise connect to origin.
    socket = backendUrl
      ? io(backendUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        })
      : io({
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  return socket;
}
