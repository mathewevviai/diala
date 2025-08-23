import React from 'react';

export default function TranscriptSkeleton() {
  return (
    <div className="rounded-lg bg-yellow-100 p-6">
      <div className="space-y-3">
        {/* Generate multiple skeleton lines */}
        {[...Array(8)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex gap-2">
              {/* Simulate transcript chunks with varying widths */}
              <div 
                className="h-6 bg-yellow-200 rounded animate-pulse"
                style={{ width: `${Math.random() * 20 + 15}%` }}
              />
              <div 
                className="h-6 bg-yellow-200 rounded animate-pulse"
                style={{ width: `${Math.random() * 25 + 20}%` }}
              />
              <div 
                className="h-6 bg-yellow-200 rounded animate-pulse"
                style={{ width: `${Math.random() * 30 + 25}%` }}
              />
              {Math.random() > 0.5 && (
                <div 
                  className="h-6 bg-yellow-200 rounded animate-pulse"
                  style={{ width: `${Math.random() * 15 + 10}%` }}
                />
              )}
            </div>
          </div>
        ))}
        
        {/* Last line with partial width */}
        <div className="flex gap-2">
          <div className="h-6 bg-yellow-200 rounded animate-pulse w-1/4" />
          <div className="h-6 bg-yellow-200 rounded animate-pulse w-1/6" />
        </div>
      </div>
      
    </div>
  );
}