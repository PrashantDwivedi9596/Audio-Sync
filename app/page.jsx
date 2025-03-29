'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <h1 className="text-4xl font-bold mb-8 text-center mt-8">Audio Sync</h1>
      <p className="text-center mb-8">
        Share audio seamlessly across multiple devices on the same network
      </p>
      
      <div className="flex flex-col items-center gap-4 mt-8">
        <Link href="/host">
          <button className="w-64 py-3 text-lg">Host a Session</button>
        </Link>
        <Link href="/join">
          <button className="w-64 py-3 text-lg">Join a Session</button>
        </Link>
      </div>
      
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>Connect devices to the same hotspot network for best performance</p>
      </div>
    </main>
  );
} 