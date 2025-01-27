// state/sessionBuffer.js

// Instead of an object, use a Map to store session data keyed by sessionId
const sessionMap = new Map();

/**
 * Returns existing session data for sessionId
 * or creates a new record in sessionMap if none exists yet.
 */
function getOrCreateSessionData(sessionId) {
  if (!sessionMap.has(sessionId)) {
    sessionMap.set(sessionId, {
      sessionId,
      startTime: null,
      endTime: null,
      events: [], 
      // or adSessions: [] if you prefer
    });
  }
  return sessionMap.get(sessionId);
}

module.exports = {
  sessionMap,
  getOrCreateSessionData,
};
