"use client";

import { useState } from "react";

export default function Home() {
  // State to store the user's input
  const [input, setInput] = useState("");
  // State to store the chat history (We start with one welcome message)
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Nyaya Setu. How can I help you with Indian Law today?" }
  ]);

  // Function to handle sending a message
  const handleSend = () => {
    if (!input.trim()) return; // Don't send empty messages

    // 1. Add User Message to the list
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear the input box
    setInput("");

    // (Later, we will connect the AI here)
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      {/* HEADER */}
      <header className="p-4 border-b border-gray-700 bg-gray-800 text-center">
        <h1 className="text-xl font-bold text-orange-400">Nyaya Setu ⚖️</h1>
      </header>

      {/* CHAT AREA (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-orange-600 text-white" // User style
                  : "bg-gray-700 text-gray-200" // AI style
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA (Fixed at bottom) */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ask a legal question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()} // Allow sending with Enter key
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}