import { io } from 'socket.io-client';

// Socket.io client instance
let socket = null;

// Initialize and get the socket.io client
export function getSocketClient() {
  if (!socket) {
    // Create socket connection
    socket = io({
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    // Log connection status
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
}

// Clean up socket connection
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Join a session with a given ID and device name
export function joinSession(sessionId, deviceName) {
  if (!socket) {
    socket = getSocketClient();
  }
  
  return new Promise((resolve, reject) => {
    // Listen for session info response
    socket.once('session-info', (info) => {
      resolve(info);
    });
    
    // Listen for error responses
    socket.once('session-not-found', () => {
      reject(new Error('Session not found'));
    });
    
    // Send join request
    socket.emit('join-session', { sessionId, deviceName });
  });
}

// Create a new session
export function createSession(sessionId, hostName) {
  if (!socket) {
    socket = getSocketClient();
  }
  
  return new Promise((resolve) => {
    socket.emit('create-session', { sessionId, hostName });
    resolve({ sessionId, hostName });
  });
}

// Leave a session
export function leaveSession(sessionId) {
  if (socket) {
    socket.emit('leave-session', { sessionId });
  }
}

// End a session (host only)
export function endSession(sessionId) {
  if (socket) {
    socket.emit('end-session', { sessionId });
  }
}

// Send audio data
export function sendAudioData(sessionId, audioData) {
  if (socket) {
    socket.emit('audio-data', {
      sessionId,
      audioData,
      timestamp: Date.now()
    });
  }
}

// Send audio control command
export function sendAudioControl(sessionId, action) {
  if (socket) {
    socket.emit('audio-control', {
      sessionId,
      action,
      timestamp: Date.now()
    });
  }
} 