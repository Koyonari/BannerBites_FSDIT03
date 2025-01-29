// src/components/ErrorBoundary.jsx

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state to display fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-transparent">
          <p className="text-red-500">Something went wrong with the heatmap.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
