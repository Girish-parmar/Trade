import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizes[size]} border-4 border-primary border-t-transparent animate-spin mb-4`}></div>
      <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">{message}</p>
    </div>
  );
};

export default LoadingSpinner;