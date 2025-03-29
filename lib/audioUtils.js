/**
 * Audio Utilities for capturing, processing, and synchronizing audio
 */

// Initialize audio context with proper fallbacks
export function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

// Capture system audio using getDisplayMedia API
export async function captureSystemAudio() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: false
    });
    
    return stream;
  } catch (error) {
    console.error('Error capturing system audio:', error);
    throw error;
  }
}

// Create a media stream source from an audio stream
export function createMediaSource(audioContext, stream) {
  return audioContext.createMediaStreamSource(stream);
}

// Process audio data for transmission (compress/encode if needed)
export function processAudioForTransmission(audioData, options = {}) {
  // Simple implementation - just return the data
  // In a more advanced implementation, we could:
  // - Downsample audio
  // - Compress audio data
  // - Apply noise reduction
  return audioData;
}

// Calculate and adjust for network latency
export function calculateLatencyAdjustment(serverTimestamp, clientTimestamp, networkLatency) {
  // Time difference between server and client
  const timeDiff = clientTimestamp - serverTimestamp;
  
  // Add the one-way network latency
  return timeDiff + networkLatency;
}

// Clean up audio resources
export function cleanupAudioResources(stream, audioContext) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext.close();
  }
  
  return Promise.resolve();
}

// Convert Float32Array to regular array for transmission
export function audioBufferToArray(buffer) {
  return Array.from(buffer);
}

// Convert regular array back to Float32Array
export function arrayToAudioBuffer(array) {
  return Float32Array.from(array);
}

// Measure network latency using ping/pong
export function measureNetworkLatency(socket, samples = 5) {
  return new Promise((resolve) => {
    const measurements = [];
    let count = 0;
    
    const pingPong = () => {
      const startTime = Date.now();
      
      socket.emit('ping');
      
      const pongHandler = () => {
        const latency = (Date.now() - startTime) / 2; // RTT/2 for one-way latency
        measurements.push(latency);
        count++;
        
        if (count < samples) {
          // Wait a bit before next measurement
          setTimeout(pingPong, 200);
        } else {
          // Calculate average latency
          const avgLatency = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
          resolve(avgLatency);
        }
        
        // Remove listener after it's called
        socket.off('pong', pongHandler);
      };
      
      socket.on('pong', pongHandler);
    };
    
    pingPong();
  });
} 