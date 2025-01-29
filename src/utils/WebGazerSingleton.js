// utils/WebGazerSingleton.js
import Cookies from "js-cookie";

class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;
  static initializing = false; // To prevent concurrent initializations

  /**
   * Preloads the WebGazer model.
   * Pulls any calibration data from the cookie => localStorage => used by WebGazer.
   */
  static async preload() {
    if (this.modelPreloaded) {
      console.log("[WebGazerSingleton] Model already preloaded.");
      return;
    }

    try {
      // Prevent concurrent preload calls
      if (this.initializing) {
        console.log("[WebGazerSingleton] Preload already in progress.");
        await this.initializing;
        return;
      }

      this.initializing = (async () => {
        // 1) Read cookie data, if any, and copy to localStorage
        const cookieData = Cookies.get("webgazerCalib");
        if (cookieData) {
          localStorage.setItem("webgazerGlobalData", cookieData);
          console.log("[WebGazer] Restored calibration from cookie → localStorage");
        }

        // 2) Load WebGazer script dynamically
        const { default: webgazer } = await import("webgazer");
        webgazer
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true); // Store calibration in localStorage

        this.instance = webgazer;
        this.modelPreloaded = true;
        console.log("[WebGazerSingleton] Model preloaded.");

        // **Disable WebGazer's default visualizations by default**
        webgazer.showPredictionPoints(false); // Hides the red dot
        webgazer.showFaceOverlay(false); // Hides the face overlay
        webgazer.showVideo(true); // **Enable the video feed**
        console.log("[WebGazerSingleton] Default WebGazer visualizations adjusted.");
        
        // **Adjust Video Element Styling**
        // Delay to ensure the video element is added to the DOM
        setTimeout(() => {
          const videoElement = document.getElementById('webgazerVideoFeed');
          if (videoElement) {
            videoElement.style.position = 'fixed';
            videoElement.style.top = '60px'; // Adjust based on navbar height
            videoElement.style.left = '10px'; // Adjust as needed
            videoElement.style.width = '150px'; // Set desired width
            videoElement.style.height = '100px'; // Set desired height
            videoElement.style.zIndex = '1001'; // Higher than other content but lower than navbar
            videoElement.style.borderRadius = '8px'; // Optional: Rounded corners
            videoElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // Optional: Shadow
            videoElement.style.pointerEvents = 'none'; // Allow clicks to pass through
            console.log("[WebGazerSingleton] Video element styled to prevent navbar overlap.");
          } else {
            console.warn("[WebGazerSingleton] Video element not found for styling.");
          }
        }, 1000); // 1-second delay; adjust if necessary
      })();

      await this.initializing;
      this.initializing = false;
    } catch (error) {
      console.error("[WebGazerSingleton] Preload error:", error);
      this.initializing = false;
      throw error;
    }
  }

  /**
   * Initialize WebGazer, start camera, attach a gaze listener if provided
   * @param {Function} onGazeListener - Callback to handle gaze data
   * @returns {Promise<object>} - WebGazer instance
   */
  static async initialize(onGazeListener = null) {
    if (!this.modelPreloaded) {
      console.log("[WebGazerSingleton] Preloading model...");
      await this.preload();
    }

    if (this.instance && this.trackingStarted) {
      console.log("[WebGazerSingleton] WebGazer already tracking.");
      // Update the gaze listener if provided
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
      }
      return this.instance;
    }

    try {
      // Prevent concurrent initializations
      if (this.initializing) {
        console.log("[WebGazerSingleton] Initialization already in progress.");
        await this.initializing;
        if (this.instance && this.trackingStarted) {
          if (onGazeListener) {
            this.instance.setGazeListener((data, elapsedTime) => {
              if (data) onGazeListener(data, elapsedTime);
            });
          }
          return this.instance;
        }
      }

      // Initialize WebGazer if not already done
      if (!this.instance) {
        const { default: webgazer } = await import("webgazer");
        this.instance = webgazer
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);
        console.log("[WebGazerSingleton] WebGazer instance created.");

        // **Disable WebGazer's default visualizations upon instance creation**
        this.instance.showPredictionPoints(false); // Hides the red dot
        this.instance.showFaceOverlay(false); // Hides the face overlay
        this.instance.showVideo(true); // **Enable the video feed**
        console.log("[WebGazerSingleton] Default WebGazer visualizations adjusted.");

        // **Adjust Video Element Styling**
        setTimeout(() => {
          const videoElement = document.getElementById('webgazerVideoFeed');
          if (videoElement) {
            videoElement.style.position = 'fixed';
            videoElement.style.top = '60px'; // Adjust based on navbar height
            videoElement.style.left = '10px'; // Adjust as needed
            videoElement.style.width = '150px'; // Set desired width
            videoElement.style.height = '100px'; // Set desired height
            videoElement.style.zIndex = '1001'; // Higher than other content but lower than navbar
            videoElement.style.borderRadius = '8px'; // Optional: Rounded corners
            videoElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // Optional: Shadow
            videoElement.style.pointerEvents = 'none'; // Allow clicks to pass through
            console.log("[WebGazerSingleton] Video element styled to prevent navbar overlap.");
          } else {
            console.warn("[WebGazerSingleton] Video element not found for styling.");
          }
        }, 1000); // 1-second delay; adjust if necessary
      }

      // Set gaze listener if provided
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
        console.log("[WebGazerSingleton] Gaze listener attached.");
      }

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
   * End tracking session gracefully.
   * Prevents multiple calls from causing errors.
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
   * Check if localStorage has calibration data
   * @returns {boolean}
   */
  static hasSavedCalibration() {
    const hasData = !!localStorage.getItem("webgazerGlobalData");
    console.log(`[WebGazerSingleton] hasSavedCalibration: ${hasData}`);
    return hasData;
  }

  /**
   * Reset localStorage & cookie, clearing calibration
   */
  static resetCalibrationData() {
    localStorage.removeItem("webgazerGlobalData");
    Cookies.remove("webgazerCalib");
    console.log("[WebGazerSingleton] Calibration data reset.");
  }

  /**
   * Copy the calibration data from localStorage into a cookie (webgazerCalib).
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
      // secure: true, // only if you're on https
      expires: 365,
    });
    console.log("[WebGazerSingleton] Calibration data saved to cookie.");
  }

  /**
   * Show/hide the camera feed
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
   * Show or hide WebGazer's default prediction points (red dot)
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
   * Show or hide WebGazer's face overlay
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
   * Show or hide WebGazer's video feed
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
