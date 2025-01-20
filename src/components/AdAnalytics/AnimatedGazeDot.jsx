// src/components/AdAnalytics/AnimatedGazeDot.jsx
import { motion } from "framer-motion";

const AnimatedGazeDot = ({ x, y }) => {
  return (
    <motion.div
      key={`${x}-${y}`} // Ensures re-animation when the position changes
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        top: y,
        left: x,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(255, 0, 0, 0.5)",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
      }}
    />
  );
};

export default AnimatedGazeDot;
