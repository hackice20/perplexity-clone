import React from 'react';

const FreeTierMessage = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center space-x-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-neutral-300">
          Running on free tier, please wait...
        </span>
        <svg
          className="w-5 h-5 text-orange-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
    </div>
  );
};

export default FreeTierMessage; 