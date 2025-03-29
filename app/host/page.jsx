'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSocketClient } from '../../lib/socketClient';
import { captureSystemAudio, cleanupAudioResources } from '../../lib/audioUtils';

export default function HostSession() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [audioStatus, setAudioStatus] = useState('stopped'); // stopped, playing, paused
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    // Generate a random device name
    const randomName = `Host-${Math.floor(Math.random() * 10000)}`;
    setDeviceName(randomName);

    // Initialize socket connection
    socketRef.current = getSocketClient();

    // Generate a unique session ID
    const newSessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(newSessionId);

    // Handle socket events
    socketRef.current.on('connect', () => {
      socketRef.current.emit('create-session', { sessionId: newSessionId, hostName: randomName });
    });

    socketRef.current.on('device-connected', (device) => {
      setConnectedDevices(prev => [...prev, device]);
    });

    socketRef.current.on('device-disconnected', (deviceId) => {
      setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopAudioCapture();
    };
  }, []);

  const startAudioCapture = async () => {
    try {
      // Get audio from the system
      audioStreamRef.current = await captureSystemAudio();

      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
      
      // Connect to an analyzer to get audio data
      const analyser = audioContextRef.current.createAnalyser();
      sourceNodeRef.current.connect(analyser);
      
      // Set up recording for broadcast
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      analyser.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      processor.onaudioprocess = (e) => {
        // Send audio data to all connected clients
        if (socketRef.current) {
          const audioData = e.inputBuffer.getChannelData(0);
          socketRef.current.emit('audio-data', {
            sessionId,
            audioData: Array.from(audioData),
            timestamp: Date.now()
          });
        }
      };
      
      setAudioStatus('playing');
    } catch (error) {
      console.error('Error starting audio capture:', error);
    }
  };

  const stopAudioCapture = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioStatus('stopped');
  };

  const pauseAudioPlayback = () => {
    // Just notify clients to pause
    if (socketRef.current) {
      socketRef.current.emit('audio-control', { 
        sessionId, 
        action: 'pause',
        timestamp: Date.now()
      });
    }
    setAudioStatus('paused');
  };

  const resumeAudioPlayback = () => {
    // Notify clients to resume
    if (socketRef.current) {
      socketRef.current.emit('audio-control', { 
        sessionId, 
        action: 'resume',
        timestamp: Date.now()
      });
    }
    setAudioStatus('playing');
  };

  const endSession = () => {
    if (socketRef.current) {
      socketRef.current.emit('end-session', { sessionId });
    }
    stopAudioCapture();
    router.push('/');
  };

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6 text-center mt-4">Hosting Session</h1>
      
      <div className="card">
        <div className="mb-4">
          <p className="text-lg font-semibold">Session Code: <span className="font-mono">{sessionId}</span></p>
          <p className="text-sm text-gray-500">Share this code with others to join</p>
        </div>
        
        <div className="mb-4">
          <p className="text-lg font-semibold">Your Device: {deviceName}</p>
        </div>
        
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Connected Devices ({connectedDevices.length})</h2>
          {connectedDevices.length === 0 ? (
            <p className="text-sm text-gray-500">No devices connected yet</p>
          ) : (
            <ul className="list-disc pl-5">
              {connectedDevices.map((device) => (
                <li key={device.id}>{device.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="card">
        <h2 className="font-semibold mb-4">Audio Controls</h2>
        <div className="flex flex-wrap gap-3">
          {audioStatus === 'stopped' && (
            <button onClick={startAudioCapture}>Start Streaming</button>
          )}
          {audioStatus === 'playing' && (
            <>
              <button onClick={pauseAudioPlayback}>Pause</button>
              <button onClick={stopAudioCapture} className="bg-red-500 hover:bg-red-600">Stop</button>
            </>
          )}
          {audioStatus === 'paused' && (
            <>
              <button onClick={resumeAudioPlayback}>Resume</button>
              <button onClick={stopAudioCapture} className="bg-red-500 hover:bg-red-600">Stop</button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button 
          onClick={endSession} 
          className="bg-gray-500 hover:bg-gray-600"
        >
          End Session & Return Home
        </button>
      </div>
    </div>
  );
} 