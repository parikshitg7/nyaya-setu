"use client"; // This tells Next.js this is a Client Component (interactive)

import { useState } from "react";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">Nyaya Setu</h1>
      <p className="mt-2 text-gray-400">Your Offline Legal Assistant</p>
    </div>
  );
}