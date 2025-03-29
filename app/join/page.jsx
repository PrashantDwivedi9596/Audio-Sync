'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSocketClient } from '../../lib/socketClient';
import { createAudioContext, calculateLatencyAdjustment } from '../../lib/audioUtils';

export default function JoinSession() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState('');
  const [sessionState, setSessionState] = useState('input'); // input, connecting, connected, error
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState('');
  const [hostInfo, setHostInfo] = useState(null);
  const [audioStatus, setAudioStatus] = useState('stopped'); // stopped, playing, paused
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const latencyRef = useRef(0);
  
  useEffect(() => {
    // Generate a random device name
    const randomName = `Device-${Math.floor(Math.random() * 10000)}`;
    setDeviceName(randomName);
    
    // Initialize socket connection
    socketRef.current = getSocketClient();
    
    // Set up event listeners
    socketRef.current.on('session-info', (info) => {
      setHostInfo(info);
      setSessionState('connected');
    });
    
    socketRef.current.on('session-not-found', () => {
      setError('Session not found. Please check the code and try again.');
      setSessionState('error');
    });
    
    socketRef.current.on('session-ended', () => {
      setError('The host has ended the session.');
      setSessionState('error');
      cleanupAudio();
    });
    
    socketRef.current.on('audio-data', (data) => {
      if (audioContextRef.current && audioStatus === 'playing') {
        playAudioData(data);
      }
    });
    
    socketRef.current.on('audio-control', (data) => {
      if (data.action === 'pause') {
        setAudioStatus('paused');
      } else if (data.action === 'resume') {
        setAudioStatus('playing');
      } else if (data.action === 'stop') {
        setAudioStatus('stopped');
        cleanupAudio();
      }
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      cleanupAudio();
    };
  }, [audioStatus]);
  
  const joinSession = () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }
    
    setSessionState('connecting');
    setError('');
    
    // Send join request
    socketRef.current.emit('join-session', {
      sessionId: sessionCode.trim().toUpperCase(),
      deviceName
    });
    
    // Initialize audio context
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = createAudioContext();
        // Measure network latency
        const startTime = Date.now();
        socketRef.current.emit('ping');
        socketRef.current.on('pong', () => {
          latencyRef.current = (Date.now() - startTime) / 2; // RTT/2 for one-way latency
          console.log('Estimated latency:', latencyRef.current, 'ms');
        });
      } catch (error) {
        console.error('Error initializing audio context:', error);
        setError('Failed to initialize audio. Please try again or use a different browser.');
      }
    }
  };
  
  const playAudioData = (data) => {
    if (!audioContextRef.current) return;
    
    try {
      // Convert array back to Float32Array
      const audioBuffer = audioContextRef.current.createBuffer(1, data.audioData.length, audioContextRef.current.sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < data.audioData.length; i++) {
        channelData[i] = data.audioData[i];
      }
      
      // Create source node
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply latency compensation
      const serverTime = data.timestamp;
      const clientTime = Date.now();
      const timeOffset = calculateLatencyAdjustment(serverTime, clientTime, latencyRef.current);
      
      // Connect to output
      source.connect(audioContextRef.current.destination);
      
      // Start playback with compensation
      source.start(audioContextRef.current.currentTime + (timeOffset > 0 ? 0 : Math.abs(timeOffset / 1000)));
    } catch (error) {
      console.error('Error playing audio data:', error);
    }
  };
  
  const cleanupAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  };
  
  const leaveSession = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-session', { sessionId: sessionCode });
    }
    cleanupAudio();
    setSessionState('input');
    setSessionCode('');
  };
  
  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6 text-center mt-4">Join Audio Session</h1>
      
      {sessionState === 'input' && (
        <div className="card">
          <div className="mb-4">
            <label htmlFor="session-code" className="block mb-2 font-semibold">Enter Session Code</label>
            <input
              id="session-code"
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              placeholder="Enter code (e.g., AB123)"
              className="w-full p-2 border border-gray-300 rounded"
              maxLength={6}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="device-name" className="block mb-2 font-semibold">Your Device Name</label>
            <input
              id="device-name"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Enter your device name"
              className="w-full p-2 border border-gray-300 rounded"
              maxLength={20}
            />
          </div>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <button onClick={joinSession} className="w-full">Join Session</button>
        </div>
      )}
      
      {sessionState === 'connecting' && (
        <div className="card text-center">
          <p>Connecting to session {sessionCode}...</p>
          <div className="mt-4">
            <div className="inline-block w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {sessionState === 'connected' && hostInfo && (
        <div>
          <div className="card">
            <h2 className="font-semibold mb-4">Connected to Session: {sessionCode}</h2>
            <p className="mb-2">Host: {hostInfo.hostName}</p>
            <p className="mb-2">Your Device: {deviceName}</p>
            <p className="mb-2">Status: {audioStatus}</p>
          </div>
          
          <div className="mt-6 text-center">
            <button 
              onClick={leaveSession} 
              className="bg-gray-500 hover:bg-gray-600"
            >
              Leave Session
            </button>
          </div>
        </div>
      )}
      
      {sessionState === 'error' && (
        <div className="card">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => setSessionState('input')} className="w-full">Try Again</button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link href="/">
          <button className="bg-gray-500 hover:bg-gray-600">Back to Home</button>
        </Link>
      </div>
    </div>
  );
} 