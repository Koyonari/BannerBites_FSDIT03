// state/sessionBuffer.js

const sessionBuffer = {}; 
// key: sessionId, value: { sessionId, startTime, endTime, events: [] }

function getOrCreateSessionData(sessionId) {
  if (!sessionBuffer[sessionId]) {
    sessionBuffer[sessionId] = {
      sessionId,
      startTime: null,
      endTime: null,
      events: [],
    };
  }
  return sessionBuffer[sessionId];
}

module.exports = {
  sessionBuffer,
  getOrCreateSessionData,
};
