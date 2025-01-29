// src/utils/WebGazerSingleton.js
import Cookies from "js-cookie";

class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;
  static initializing = null; // Promise to prevent concurrent initializations
  static listeners = []; // Array to hold multiple gaze listeners

  /**
   * Preloads the WebGazer model.
   */
  static async preload() {
    if (this.modelPreloaded) {
      console.log("[WebGazerSingleton] Model already preloaded.");
      return;
    }

    try {
      if (this.initializing) {
        console.log("[WebGazerSingleton] Preload already in progress.");
        await this.initializing;
        return;
      }

      this.initializing = (async () => {
        // 1) Read calibration data from cookie and transfer to localStorage
        const cookieData = Cookies.get("webgazerCalib");
        if (cookieData) {
          localStorage.setItem("webgazerGlobalData", cookieData);
          console.log("[WebGazerSingleton] Restored calibration from cookie to localStorage.");
        }

        // 2) Dynamically import WebGazer
        const { default: webgazer } = await import("webgazer");

        // 3) Configure WebGazer
        webgazer
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);

        this.instance = webgazer;
        this.modelPreloaded = true;
        console.log("[WebGazerSingleton] Model preloaded.");

        // 4) Disable default visualizations
        webgazer.showPredictionPoints(false);
        webgazer.showFaceOverlay(false);
        webgazer.showVideo(true);
        console.log("[WebGazerSingleton] Default WebGazer visualizations disabled.");

        // 5) Style the video feed
        setTimeout(() => {
          const videoElement = document.getElementById("webgazerVideoFeed");
          if (videoElement) {
            videoElement.style.position = "fixed";
            videoElement.style.top = "60px"; // Adjust based on navbar height
            videoElement.style.left = "10px"; // Adjust as needed
            videoElement.style.width = "150px"; // Desired width
            videoElement.style.height = "100px"; // Desired height
            videoElement.style.zIndex = "1001"; // Above content but below navbar
            videoElement.style.borderRadius = "8px"; // Rounded corners
            videoElement.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)"; // Shadow
            videoElement.style.pointerEvents = "none"; // Click-through
            console.log("[WebGazerSingleton] Video element styled.");
          } else {
            console.warn("[WebGazerSingleton] Video element not found for styling.");
          }
        }, 1000); // Delay to ensure DOM is updated

        this.initializing = null; // Reset initializing flag
      })();

      await this.initializing;
    } catch (error) {
      console.error("[WebGazerSingleton] Preload error:", error);
      this.initializing = null;
      throw error;
    }
  }

  /**
   * Initialize WebGazer and set up gaze listeners.
   * @param {Function} onGazeListener - Callback to handle gaze data.
   * @returns {Promise<object>} - WebGazer instance.
   */
  static async initialize(onGazeListener = null) {
    if (!this.modelPreloaded) {
      console.log("[WebGazerSingleton] Preloading model...");
      await this.preload();
    }

    if (this.instance && this.trackingStarted) {
      console.log("[WebGazerSingleton] WebGazer already tracking.");
      if (onGazeListener) {
        this.addGazeListener(onGazeListener);
      }
      return this.instance;
    }

    try {
      if (this.initializing) {
        console.log("[WebGazerSingleton] Initialization already in progress.");
        await this.initializing;
        if (this.instance && this.trackingStarted) {
          if (onGazeListener) {
            this.addGazeListener(onGazeListener);
          }
          return this.instance;
        }
      }

      if (!this.instance) {
        const { default: webgazer } = await import("webgazer");
        this.instance = webgazer
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);
        console.log("[WebGazerSingleton] WebGazer instance created.");

        // Disable default visualizations
        this.instance.showPredictionPoints(false);
        this.instance.showFaceOverlay(false);
        this.instance.showVideo(true);
        console.log("[WebGazerSingleton] Default WebGazer visualizations disabled.");

        // Style the video feed
        setTimeout(() => {
          const videoElement = document.getElementById("webgazerVideoFeed");
          if (videoElement) {
            videoElement.style.position = "fixed";
            videoElement.style.top = "60px"; // Adjust based on navbar height
            videoElement.style.left = "10px"; // Adjust as needed
            videoElement.style.width = "150px"; // Desired width
            videoElement.style.height = "100px"; // Desired height
            videoElement.style.zIndex = "1001"; // Above content but below navbar
            videoElement.style.borderRadius = "8px"; // Rounded corners
            videoElement.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)"; // Shadow
            videoElement.style.pointerEvents = "none"; // Click-through
            console.log("[WebGazerSingleton] Video element styled.");
          } else {
            console.warn("[WebGazerSingleton] Video element not found for styling.");
          }
        }, 1000); // Delay to ensure DOM is updated
      }

      this.addGazeListener(onGazeListener);

      // Begin WebGazer tracking
      await this.instance.begin();
      this.trackingStarted = true;
      console.log("[WebGazerSingleton] Tracking started.");

      return this.instance;
    } catch (error) {
      console.error("[WebGazerSingleton] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Add a gaze listener.
   * @param {Function} listener - Callback to handle gaze data.
   */
  static addGazeListener(listener) {
    if (listener && typeof listener === "function") {
      this.listeners.push(listener);
      this.instance.setGazeListener((data, elapsedTime) => {
        if (data) {
          this.listeners.forEach((cb) => cb(data, elapsedTime));
        }
      });
      console.log("[WebGazerSingleton] Gaze listener added.");
    } else {
      console.warn("[WebGazerSingleton] Invalid gaze listener.");
    }
  }

  /**
   * Remove a specific gaze listener.
   * @param {Function} listener - Callback to remove.
   */
  static removeGazeListener(listener) {
    this.listeners = this.listeners.filter((cb) => cb !== listener);
    if (this.listeners.length === 0 && this.instance) {
      this.instance.clearGazeListener();
      console.log("[WebGazerSingleton] All gaze listeners removed.");
    }
  }

  /**
   * End tracking session gracefully.
   */
  static async end() {
    if (this.initializing) {
      console.log("[WebGazerSingleton] Waiting for initialization to complete before ending.");
      await this.initializing;
    }

    if (!this.instance || !this.trackingStarted) {
      console.warn("[WebGazerSingleton] WebGazer not initialized or already ended.");
      return;
    }

    try {
      this.instance.clearGazeListener();
      this.instance.end();
      this.instance = null;
      this.trackingStarted = false;
      console.log("[WebGazerSingleton] Tracking ended.");
    } catch (error) {
      console.error("[WebGazerSingleton] Error ending WebGazer:", error);
    }
  }

  /**
   * Check if localStorage has calibration data.
   * @returns {boolean}
   */
  static hasSavedCalibration() {
    const hasData = !!localStorage.getItem("webgazerGlobalData");
    console.log(`[WebGazerSingleton] hasSavedCalibration: ${hasData}`);
    return hasData;
  }

  /**
   * Reset localStorage & cookie, clearing calibration.
   */
  static resetCalibrationData() {
    localStorage.removeItem("webgazerGlobalData");
    Cookies.remove("webgazerCalib");
    console.log("[WebGazerSingleton] Calibration data reset.");
  }

  /**
   * Save calibration data from localStorage into a cookie.
   */
  static saveCalibrationDataToCookie() {
    const data = localStorage.getItem("webgazerGlobalData");
    if (!data) {
      console.log("[WebGazerSingleton] No calibration data in localStorage to save.");
      return;
    }
    Cookies.set("webgazerCalib", data, {
      path: "/",
      sameSite: "lax",
      // secure: true, // Enable if using HTTPS
      expires: 365,
    });
    console.log("[WebGazerSingleton] Calibration data saved to cookie.");
  }

  /**
   * Set camera visibility.
   * @param {boolean} visible
   */
  static setCameraVisibility(visible) {
    if (!this.instance) {
      console.warn("[WebGazerSingleton] Cannot set camera visibility. WebGazer not initialized.");
      return;
    }
    this.instance.showVideo(visible);
    this.instance.showFaceOverlay(visible);
    console.log(`[WebGazerSingleton] Camera visibility set to ${visible}.`);
  }

  /**
   * Show or hide prediction points (red dot).
   * @param {boolean} show
   */
  static showPredictionPoints(show) {
    if (!this.instance) {
      console.warn("[WebGazerSingleton] Cannot set prediction points. WebGazer not initialized.");
      return;
    }
    this.instance.showPredictionPoints(show);
    console.log(`[WebGazerSingleton] Prediction points set to ${show}.`);
  }

  /**
   * Show or hide face overlay.
   * @param {boolean} show
   */
  static showFaceOverlay(show) {
    if (!this.instance) {
      console.warn("[WebGazerSingleton] Cannot set face overlay. WebGazer not initialized.");
      return;
    }
    this.instance.showFaceOverlay(show);
    console.log(`[WebGazerSingleton] Face overlay set to ${show}.`);
  }

  /**
   * Show or hide video feed.
   * @param {boolean} show
   */
  static showVideo(show) {
    if (!this.instance) {
      console.warn("[WebGazerSingleton] Cannot set video visibility. WebGazer not initialized.");
      return;
    }
    this.instance.showVideo(show);
    console.log(`[WebGazerSingleton] Video feed set to ${show}.`);
  }
}

export default WebGazerSingleton;
