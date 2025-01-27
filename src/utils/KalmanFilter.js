// src/utils/KalmanFilter.js
class KalmanFilter {
  constructor({ R, Q }) {
    this.R = R; // Measurement noise
    this.Q = Q; // Process noise
    this.A = 1;
    this.B = 0;
    this.C = 1;

    this.cov = NaN;
    this.x = NaN; // Estimated signal without noise
  }

  filter(z, u = 0) {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.R * (1 / this.C);
    } else {
      // Prediction step
      const predX = this.A * this.x + this.B * u;
      const predCov = this.A * this.cov * this.A + this.Q;

      // Update step
      const K = predCov * this.C / (this.C * predCov * this.C + this.R);
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    return this.x;
  }

  reset() {
    this.cov = NaN;
    this.x = NaN;
  }
}

export default KalmanFilter;
