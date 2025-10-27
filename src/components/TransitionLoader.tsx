// src/components/TransitionLoader.tsx
import React from 'react';
import Lottie from 'react-lottie';
import { motion } from 'framer-motion';
import evAnimation from '../assets/ev-car.json'; // Ensure this path is correct

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: evAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

const TransitionLoader: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-gray-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-64 h-64">
        <Lottie options={defaultOptions} height={256} width={256} />
      </div>
      <motion.p
        className="mt-4 text-xl font-bold"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Switching to Provider Dashboard...
      </motion.p>
    </motion.div>
  );
};

export default TransitionLoader;