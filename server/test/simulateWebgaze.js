// websocket-test/simulateWebgaze.js

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// WebSocket Server URL
const WS_URL = 'ws://localhost:5000';

// Create WebSocket Client
const ws = new WebSocket(WS_URL);

// Session Data
const sessionId = uuidv4();
const adId = 'ad-xyz-123';
const layoutId = 'layout-123';

// Handle WebSocket Events
ws.on('open', () => {
  console.log('Connected to WebSocket server.');

  // 1. Subscribe to a Layout
  const subscribeMessage = {
    type: 'subscribe',
    layoutId: layoutId,
  };
  ws.send(JSON.stringify(subscribeMessage));
  console.log('Sent subscribe message:', subscribeMessage);

  // 2. Start a Session
  const sessionStartMessage = {
    type: 'sessionStart',
    data: {
      sessionId: sessionId,
      startTime: new Date().toISOString(),
    },
  };
  setTimeout(() => {
    ws.send(JSON.stringify(sessionStartMessage));
    console.log('Sent sessionStart message:', sessionStartMessage);
  }, 1000);

  // 3. Send Gaze Samples and adLookedAt Events
  const gazeSamples = [
    { x: 0.45, y: 0.55, timestamp: new Date().toISOString() },
    { x: 0.50, y: 0.60, timestamp: new Date().toISOString() },
  ];

  gazeSamples.forEach((gaze, index) => {
    setTimeout(() => {
      // Send gazeSample
      const gazeSampleMessage = {
        type: 'gazeSample',
        data: {
          sessionId: sessionId,
          x: gaze.x,
          y: gaze.y,
          timestamp: gaze.timestamp,
        },
      };
      ws.send(JSON.stringify(gazeSampleMessage));
      console.log(`Sent gazeSample message ${index + 1}:`, gazeSampleMessage);

      // Optionally, send adLookedAt if applicable
      const adLookedAtMessage = {
        type: 'adLookedAt',
        data: {
          sessionId: sessionId,
          x: gaze.x,
          y: gaze.y,
          timestamp: gaze.timestamp,
        },
      };
      ws.send(JSON.stringify(adLookedAtMessage));
      console.log(`Sent adLookedAt message ${index + 1}:`, adLookedAtMessage);
    }, 2000 + index * 1000); // 2s and 3s delays
  });

  // 4. End the Session
  setTimeout(() => {
    const sessionEndMessage = {
      type: 'sessionEnd',
      data: {
        sessionId: sessionId,
        endTime: new Date().toISOString(),
      },
    };
    ws.send(JSON.stringify(sessionEndMessage));
    console.log('Sent sessionEnd message:', sessionEndMessage);
  }, 5000);

  // 5. Complete the Ad Session
  setTimeout(() => {
    const adSessionCompleteMessage = {
      type: 'adSessionComplete',
      data: {
        adSessionId: sessionId,
        adId: adId,
        enterTime: new Date(Date.now() - 5000).toISOString(), // 5 seconds ago
        exitTime: new Date().toISOString(),
        dwellTime: 5000, // 5 seconds in ms
        gazeSamples: JSON.stringify(gazeSamples),
      },
    };
    ws.send(JSON.stringify(adSessionCompleteMessage));
    console.log('Sent adSessionComplete message:', adSessionCompleteMessage);
  }, 6000);
});

ws.on('message', (data) => {
  console.log('Received message from server:', data);
});

ws.on('close', () => {
  console.log('WebSocket connection closed.');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
