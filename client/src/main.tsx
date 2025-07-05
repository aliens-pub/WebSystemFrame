import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global error handlers for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise:', event.promise);
});

createRoot(document.getElementById("root")!).render(<App />);
