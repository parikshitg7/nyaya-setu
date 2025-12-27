"use client";

import { useState, useEffect, useRef } from "react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { legalData } from "./legal_data";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Nyaya Setu. Loading the AI model... (This may take a while)" }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true); // Tracks internet connection
  const engineRef = useRef<any>(null); // Stores the AI engine

  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    // 1. Setup Network Listeners (The Shield Feature)
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup listeners when leaving
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // --- LOAD AI ENGINE ---
  useEffect(() => {
    async function loadEngine() {
      try {
        // Point to the worker file
        const engine = await CreateWebWorkerMLCEngine(
          new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
          "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", 
          {
            initProgressCallback: (info) => {
              console.log(info.text); // Check console for download progress
            },
          }
        );
        engineRef.current = engine;
        setIsLoading(false);
        setMessages(prev => [...prev, { role: "assistant", content: "AI Ready! Ask me anything about Indian Law." }]);
      } catch (error) {
        console.error("Failed to load AI:", error);
      }
    }

    loadEngine();
  }, []);

  // --- SEND MESSAGE LOGIC ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    
    // 1. Add User Message to Chat
    const userMessage = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input box

    // 2. SEARCH: Scan "legal_data.ts" for keywords
    const foundLaw = legalData.find((law) => 
      law.keywords.some((keyword) => userText.toLowerCase().includes(keyword))
    );

    // 3. PROMPT ENGINEERING: Build instructions for the AI
    let finalSystemPrompt = "You are Nyaya Setu, a helpful Indian Legal Assistant. Answer in simple English.";
    
    if (foundLaw) {
      finalSystemPrompt += `\n\nIMPORTANT CONTEXT: Use this specific law to answer the user: "${foundLaw.content}"`;
    } else {
      finalSystemPrompt += "\n\nNote: You are an AI assistant. If you don't know the specific law, give general advice but warn the user to consult a lawyer.";
    }

    // 4. PREPARE HISTORY: Send context + history + new message
    const messagesToSend = [
      { role: "system", content: finalSystemPrompt },
      ...messages.filter(m => m.role !== "system"), // Clean old system prompts
      userMessage
    ];

    try {
      // 5. GENERATE RESPONSE
      const response = await engineRef.current.chat.completions.create({
        messages: messagesToSend,
      });

      const aiMessage = response.choices[0].message;
      setMessages((prev) => [...prev, { role: "assistant", content: aiMessage.content }]);
    } catch (error) {
      console.error("AI Generation Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: I could not generate an answer. Please check console." }]);
    }
  };

  // --- UI RENDER ---
  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white font-sans">
      
      {/* HEADER */}
      <header className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-orange-400 tracking-wide">Nyaya Setu ⚖️</h1>
        
        {/* PRIVACY SHIELD BADGE */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-300 ${
          isOnline 
            ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" 
            : "border-green-500 text-green-500 bg-green-500/10"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {isOnline ? "ONLINE (Private Mode)" : "OFFLINE (Air-Gapped)"}
        </div>
      </header>

      {/* CHAT HISTORY AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, index) => (
          // Hide system messages
          msg.role === "system" ? null : (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-orange-600 text-white rounded-tr-none" 
                    : "bg-gray-700 text-gray-200 rounded-tl-none border border-gray-600"
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        ))}
        {/* Dummy div to auto-scroll could go here */}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-900 border border-gray-600 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-white placeholder-gray-500"
            placeholder={isLoading ? "Initializing Neural Network..." : "Ask a legal question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading} 
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold transition shadow-lg"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          AI can make mistakes. Please verify important legal info.
        </p>
      </div>
    </div>
  );
}