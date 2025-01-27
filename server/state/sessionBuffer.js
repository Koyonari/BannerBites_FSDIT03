// state/sessionBuffer.js

// Use a Map to store session data keyed by sessionId
const sessionMap = new Map();

/**
 * Retrieves existing session data for a given sessionId
 * or creates a new record if none exists.
 * @param {string} sessionId
 * @returns {object} sessionData
 */
function getOrCreateSessionData(sessionId) {
  if (!sessionMap.has(sessionId)) {
    sessionMap.set(sessionId, {
      sessionId,
      adId: null,
      enterTime: null,
      exitTime: null,
      dwellTime: 0,
      gazeSamples: [],
    });
  }
  return sessionMap.get(sessionId);
}

module.exports = {
  sessionMap,
  getOrCreateSessionData,
};
