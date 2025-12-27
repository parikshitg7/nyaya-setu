import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// This is a special handler provided by the library.
// It listens for messages from the main page and runs the AI.
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};