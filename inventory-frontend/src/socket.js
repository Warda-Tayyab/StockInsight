import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  // Polling first is more reliable on mobile networks; upgrades to websocket when possible
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 20000,
});

socket.on('connect', () => {
  //console.log('✅ SOCKET CONNECTED:', socket.id);
});

socket.on('disconnect', () => {
  //console.log('❌ SOCKET DISCONNECTED');
});

export default socket;
