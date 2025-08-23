'use client';

import * as React from 'react';

export type TwitchTestimonialsProps = {
  url?: string;
};

export default function TwitchTestimonials({ url = '' }: TwitchTestimonialsProps) {
  return (
    <div className="w-full h-48 bg-white border-2 border-black flex items-center justify-center">
      <div
        data-src={url}
        className="text-xs sm:text-sm font-black uppercase tracking-wide text-gray-600"
        style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
      >
        TWITCH PLACEHOLDER
      </div>
    </div>
  );
}
