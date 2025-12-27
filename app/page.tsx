"use client";

import { useState, useEffect, useRef } from "react";
// NEW: Import the engine creation function
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Nyaya Setu. Loading the AI model... (This may take a while)" }
  ]);
  const [isLoading, setIsLoading] = useState(true); // To track if AI is ready
  const engineRef = useRef(null); // To store the AI engine instance

  // NEW: Load the AI when the page starts
  useEffect(() => {
    async function loadEngine() {
      // 1. Point to the worker file we just made
      const engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", // The Model ID
        {
          initProgressCallback: (info) => {
            console.log(info.text); // Look at console to see download progress
            // Optional: You can update a progress bar state here later
          },
        }
      );
      engineRef.current = engine;
      setIsLoading(false); // AI is ready!
      setMessages(prev => [...prev, { role: "assistant", content: "AI Ready! Ask me anything." }]);
    }

    loadEngine();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 1. Add User Message
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 2. Ask the AI (The Magic Part)
    // We create a temporary array including the history + new message
    const response = await engineRef.current.chat.completions.create({
      messages: [...messages, userMessage],
    });

    // 3. Add AI Response
    const aiMessage = response.choices[0].message;
    setMessages((prev) => [...prev, { role: "assistant", content: aiMessage.content }]);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700 bg-gray-800 text-center">
        <h1 className="text-xl font-bold text-orange-400">Nyaya Setu ⚖️</h1>
        {/* Show a loading badge if AI is downloading */}
        {isLoading && <span className="text-xs text-yellow-400">Initializing AI... (Check Console)</span>}
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user" ? "bg-orange-600" : "bg-gray-700"}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-700 rounded-lg outline-none"
            placeholder={isLoading ? "Waiting for AI..." : "Ask a legal question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading} 
          />
          <button onClick={handleSend} disabled={isLoading} className="px-6 py-3 bg-orange-500 rounded-lg font-bold disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}