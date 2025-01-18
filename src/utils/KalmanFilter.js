// src/utils/KalmanFilter.js
export default class KalmanFilter {
  constructor({ R = 0.05, Q = 1, A = 1, B = 0, C = 1 } = {}) {
    this.R = R; // measurement noise variance
    this.Q = Q; // process noise variance
    this.A = A;
    this.B = B;
    this.C = C;
    this.cov = NaN;
    this.x = NaN;
  }

  filter(z, u = 0) {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = 1 / this.C;
    } else {
      const predX = this.A * this.x + this.B * u;
      const predCov = this.A * this.cov * this.A + this.Q;
      const K = (predCov * this.C) / (this.C * predCov * this.C + this.R);
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    return this.x;
  }

  reset() {
    this.x = NaN;
    this.cov = NaN;
  }
}
