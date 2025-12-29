"use client";

import { useState, useEffect, useRef } from "react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Nyaya Setu. Loading AI & Legal Database..." }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  // --- REFS ---
  const engineRef = useRef<any>(null); // Stores the AI brain
  const ragWorkerRef = useRef<Worker | null>(null); // Stores the Database Worker

  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    // 1. Setup Network Listeners
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // --- LOAD AI & DATABASE ---
  // --- LOAD AI & DATABASE ---
  useEffect(() => {
    // 1. Initialize the RAG (Database) Worker
    // NOTICE: We now point to the public folder file "/workers/rag_worker.js"
    const ragWorker = new Worker("/workers/rag_worker.js", { type: "module" });
    
    ragWorker.onmessage = (e) => {
      if (e.data.status === "ready") {
        console.log("✅ Legal Database Ready");
      }
    };
    
    // Tell worker to start indexing data
    ragWorker.postMessage({ type: "init" });
    ragWorkerRef.current = ragWorker;

    // 2. Initialize the AI Engine (Keep this same)
    async function loadEngine() {
      try {
        // ... inside async function loadEngine()
        const engine = await CreateWebWorkerMLCEngine(
          new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
          "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", // <--- NEW SMARTER MODEL
          {
// ...
            initProgressCallback: (info) => {
              console.log(info.text);
            },
          }
        );
        engineRef.current = engine;
        setIsLoading(false); // AI is ready
        setMessages(prev => [...prev, { role: "assistant", content: "AI Ready! Ask me anything about Indian Law." }]);
      } catch (error) {
        console.error("Failed to load AI:", error);
      }
    }

    loadEngine();

    // Cleanup workers when page closes
    return () => {
      ragWorker.terminate();
    };
  }, []);

  // --- SEND MESSAGE LOGIC (WITH TIMEOUT SAFETY) ---
  // --- SEND MESSAGE LOGIC (CLEANER) ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    console.log("1. User sent:", userText);
    
    // UI Updates
    const userMessage = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); 

    // 2. SMART SEARCH
    console.log("2. Starting Database Search...");
    let searchContext = "";
    
    if (ragWorkerRef.current) {
      try {
        let timeoutId: any;

        const searchPromise = new Promise<string>((resolve) => {
          const worker = ragWorkerRef.current;
          if (!worker) return resolve("");

          const handler = (e: MessageEvent) => {
            worker.removeEventListener("message", handler);
            const hits = e.data.hits;
            if (hits && hits.length > 0) {
              const context = hits.map((h: any) => h.document.content).join("\n\n");
              resolve(context);
            } else {
              resolve("");
            }
          };
          worker.addEventListener("message", handler);
          worker.postMessage({ type: "search", query: userText });
        });

        const timeoutPromise = new Promise<string>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn("⚠️ Search timed out (3s limit).");
            resolve("");
          }, 3000);
        });

        // Run the Race
        searchContext = await Promise.race([searchPromise, timeoutPromise]);
        
        // STOP THE TIMER (The Fix)
        clearTimeout(timeoutId);

        console.log("3. Search Result:", searchContext ? "Found Context" : "No Context Found");

      } catch (err) {
        console.error("Search failed:", err);
      }
    }

    // 3. PROMPT & AI
    // 3. PROMPT & AI
    let finalSystemPrompt = `
    You are Nyaya Setu, an empathetic and expert Indian Legal AI Assistant. 
    
    INSTRUCTIONS:
    1. ANALYZE the "Relevant Laws" provided below. Use them to answer the user.
    2. IF the user mentions "husband", "wife", "dowry", or "hitting" in a marriage context, PRIORITIZE Section 498A or Domestic Violence Act over general assault laws.
    3. SPEAK DIRECTLY to the user (e.g., "I am sorry to hear that...", "You can file an FIR..."). 
    4. DO NOT make up fake "Question/Answer" dialogues. Just answer the user.
    5. SIMPLIFY the legal language. Explain it like a friend.
    `;
    
    if (searchContext) {
      finalSystemPrompt += `\n\nRELEVANT LAWS FOUND:\n"${searchContext}"`;
    } else {
      finalSystemPrompt += "\n\nNote: I could not find a specific law in my database, but I can offer general advice.";
    }

    console.log("4. Sending to AI...");
    const messagesToSend = [
      { role: "system", content: finalSystemPrompt },
      ...messages.filter(m => m.role !== "system"),
      userMessage
    ];

    try {
      const response = await engineRef.current.chat.completions.create({
        messages: messagesToSend,
        temperature: 0.1, // Keep it strict
        repetition_penalty: 1.2,  // <--- ADD THIS LINE (Prevents "Mera pati mera pati" loops)
        //max_tokens: 300,          // <--- ADD THIS LINE (Prevents long, rambling answers)
      });

      console.log("5. AI Responded!");
      const aiMessage = response.choices[0].message;
      setMessages((prev) => [...prev, { role: "assistant", content: aiMessage.content }]);
    } catch (error) {
      console.error("AI Generation Error:", error);
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