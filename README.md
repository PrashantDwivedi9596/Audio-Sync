# Audio Sync

A web application that enables seamless audio sharing between devices connected to the same hotspot. The audio can originate from any system source (files, websites, apps, YouTube, movies, etc.), and playback is synchronized in real-time across all connected devices.

## Features

- **Real-time Audio Sharing**: Share system audio with multiple devices on the same network
- **Hotspot-based Discovery**: Fast pairing without internet connection
- **Session Management**: Create, join, and manage audio sharing sessions
- **Temporary Device Names**: Random names assigned for each session
- **Host Controls**: Play, pause, and synchronize audio playback
- **Low Latency**: Real-time sync mechanism using timestamps and latency correction

## Technologies Used

- **Next.js**: For the full-stack React application
- **Socket.io**: For real-time communication between devices
- **Web Audio API**: For audio capture and playback
- **WebRTC**: For peer-to-peer connections (coming soon)

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- NPM or Yarn
- Modern web browser with WebRTC support
- Devices connected to the same local network/hotspot

### Installation

1. Clone the repository or download the source code
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Hosting a Session

1. Click "Host a Session" on the home page
2. The system will generate a session code
3. Share this code with other users who want to join
4. Click "Start Streaming" to begin sharing your system audio
5. Use the control buttons to manage audio playback

### Joining a Session

1. Click "Join a Session" on the home page
2. Enter the session code provided by the host
3. You will be connected to the host's audio stream
4. The audio will automatically sync with the host's playback

## How It Works

1. **Audio Capture**: The host device captures system audio using the Web Audio API
2. **Real-time Transmission**: Audio data is transmitted to connected devices via Socket.io
3. **Synchronization**: Timestamps and latency measurements ensure synchronized playback
4. **Local Network**: All communication occurs within the local network for low latency

## Limitations

- Browsers require user interaction before playing audio (security restriction)
- System audio capture capabilities may vary between browsers and operating systems
- For best performance, use Chrome or Edge browsers

## Future Enhancements

- Direct peer-to-peer connections for improved performance
- Multi-channel audio support
- Audio visualization
- Quality/bandwidth settings
- Persistent device names (optional)
- Host transfer capability

## Troubleshooting

### Common Issues

- **Can't capture system audio**: Make sure to select "Share system audio" when prompted
- **Audio delay**: This could be due to network latency - try reconnecting
- **Session not found**: Verify the session code is correct and the host is still active
- **No audio playing**: Check your device volume and ensure audio is playing on the host

---

## License

This project is licensed under the MIT License - see the LICENSE file for details. 