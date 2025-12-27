// public/workers/rag_worker.js

console.log("Worker: 🟢 I AM ALIVE! (File loaded)");

// --- 1. LOCAL VARIABLES ---
let pipeline, env, create, insert, search;
let db = null;
let extractor = null;

// --- 2. LEGAL DATA (Inlined to avoid import errors) ---
const legalData = [
  {
    id: "1",
    keywords: ["divorce", "separation", "husband", "wife", "marriage"],
    content: "Section 13 of the Hindu Marriage Act, 1955 allows divorce for cruelty, adultery, or desertion."
  },
  {
    id: "2",
    keywords: ["arrest", "police", "custody", "warrant", "rights"],
    content: "Article 22 of the Constitution states a person arrested must be produced before a magistrate within 24 hours."
  },
  {
    id: "3",
    keywords: ["dowry", "harassment", "bride", "groom", "demand", "cruelty", "hit", "beat"],
    content: "Section 498A of the IPC penalizes husbands or relatives for subjecting a woman to cruelty or harassment for dowry."
  },
  {
    id: "4",
    keywords: ["consumer", "fraud", "complaint", "refund"],
    content: "The Consumer Protection Act, 2019 allows consumers to file complaints for defective goods or unfair trade."
  }
];

// --- 3. INITIALIZATION ---
async function initialize() {
  try {
    console.log("Worker: Loading Local Libraries...");

    // IMPORT LOCAL FILES (Bypassing Internet & Next.js)
    const transformers = await import("./transformers.min.js");
    const orama = await import("./orama.min.js");

    // Assign libraries to variables
    pipeline = transformers.pipeline;
    env = transformers.env;
    create = orama.create;
    insert = orama.insert;
    search = orama.search;

    console.log("Worker: Libraries Loaded. Downloading Model...");

    // Configure Environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    // Load AI Model (Downloads once, then caches)
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

    // Create Database
    db = await create({
      schema: {
        content: "string",
        keywords: "string[]",
        embedding: "vector[384]"
      }
    });

    console.log("Worker: Indexing Data...");
    for (const item of legalData) {
      const out = await extractor(item.content, { pooling: "mean", normalize: true });
      await insert(db, {
        content: item.content,
        keywords: item.keywords,
        embedding: Array.from(out.data)
      });
    }

    console.log("Worker: ✅ READY");
    self.postMessage({ status: "ready" });

  } catch (err) {
    console.error("❌ Worker Error:", err);
    self.postMessage({ status: "error", message: err.toString() });
  }
}

// --- 4. LISTENER ---
self.onmessage = async (e) => {
  if (e.data.type === "init") initialize();

  if (e.data.type === "search") {
    if (!extractor || !db) return; // Ignore if not ready
    
    const out = await extractor(e.data.query, { pooling: "mean", normalize: true });
    const res = await search(db, {
      mode: "hybrid",
      term: e.data.query,
      vector: { value: Array.from(out.data), property: "embedding" },
      limit: 2
    });
    self.postMessage({ status: "results", hits: res.hits });
  }
};