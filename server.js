const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// In-memory session store
const sessions = new Map();
const deviceSessions = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create a new session
    socket.on('create-session', ({ sessionId, hostName }) => {
      console.log(`Creating session ${sessionId} with host ${hostName}`);
      
      // Store session info
      sessions.set(sessionId, {
        id: sessionId,
        hostId: socket.id,
        hostName,
        devices: [],
        status: 'active'
      });
      
      // Map socket to session
      deviceSessions.set(socket.id, sessionId);
      
      // Join the session room
      socket.join(sessionId);
    });

    // Join an existing session
    socket.on('join-session', ({ sessionId, deviceName }) => {
      const session = sessions.get(sessionId);
      
      if (!session) {
        console.log(`Session ${sessionId} not found`);
        socket.emit('session-not-found');
        return;
      }
      
      console.log(`Device ${deviceName} joining session ${sessionId}`);
      
      // Add device to session
      const deviceInfo = {
        id: socket.id,
        name: deviceName
      };
      
      session.devices.push(deviceInfo);
      
      // Map socket to session
      deviceSessions.set(socket.id, sessionId);
      
      // Join the session room
      socket.join(sessionId);
      
      // Notify the device about session details
      socket.emit('session-info', {
        hostId: session.hostId,
        hostName: session.hostName
      });
      
      // Notify the host about new device
      socket.to(session.hostId).emit('device-connected', deviceInfo);
    });

    // Leave a session
    socket.on('leave-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      
      if (session) {
        // Remove device from session
        session.devices = session.devices.filter(device => device.id !== socket.id);
        
        // If this is the host, end the session
        if (session.hostId === socket.id) {
          endSession(sessionId, io);
        } else {
          // Notify host about device leaving
          socket.to(session.hostId).emit('device-disconnected', socket.id);
        }
      }
      
      // Remove mapping
      deviceSessions.delete(socket.id);
      
      // Leave the room
      socket.leave(sessionId);
    });

    // End session (host only)
    socket.on('end-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      
      if (session && session.hostId === socket.id) {
        endSession(sessionId, io);
      }
    });

    // Audio data relay
    socket.on('audio-data', (data) => {
      const { sessionId } = data;
      const session = sessions.get(sessionId);
      
      if (session && session.hostId === socket.id) {
        // Broadcast to all clients except the sender
        socket.to(sessionId).emit('audio-data', data);
      }
    });

    // Audio control relay
    socket.on('audio-control', (data) => {
      const { sessionId, action } = data;
      const session = sessions.get(sessionId);
      
      if (session && session.hostId === socket.id) {
        // Broadcast to all clients
        io.to(sessionId).emit('audio-control', data);
      }
    });

    // Latency measurement
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Get the session this socket was part of
      const sessionId = deviceSessions.get(socket.id);
      
      if (sessionId) {
        const session = sessions.get(sessionId);
        
        if (session) {
          // If this is the host, end the session
          if (session.hostId === socket.id) {
            endSession(sessionId, io);
          } else {
            // Remove device from session
            session.devices = session.devices.filter(device => device.id !== socket.id);
            
            // Notify host about device leaving
            socket.to(session.hostId).emit('device-disconnected', socket.id);
          }
        }
      }
      
      // Clean up
      deviceSessions.delete(socket.id);
    });
  });

  // Helper function to end a session
  function endSession(sessionId, io) {
    const session = sessions.get(sessionId);
    
    if (session) {
      console.log(`Ending session ${sessionId}`);
      
      // Notify all clients
      io.to(sessionId).emit('session-ended');
      
      // Clean up device mappings
      session.devices.forEach(device => {
        deviceSessions.delete(device.id);
      });
      
      // Remove the session
      sessions.delete(sessionId);
    }
  }

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}); 