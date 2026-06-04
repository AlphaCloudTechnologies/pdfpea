console.log("Starting main.js execution...");

import "./css/main.css";
console.log("Styles imported successfully");

import { createApp } from "vue";
console.log("Vue imported successfully");

import App from "./App.vue";
console.log("App component imported successfully");

import Organize from "./views/Organize.vue";
console.log("Organizer component imported successfully");

// Import external dependencies
import * as pdfLib from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import Moveable from "moveable";
console.log("External dependencies imported successfully");

// Set up global references for backwards compatibility
window.PDFLib = pdfLib;
window.pdfjsLib = pdfjsLib;
window.Moveable = Moveable;

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

console.log("All imports and setup completed");

console.log("About to create Vue app...");
try {
  const app = createApp(App);
  console.log("Vue app created successfully:", app);
  const mountedApp = app.mount("#app");
  console.log("Vue app mounted successfully:", mountedApp);

  // Organizer
  const organize = createApp(Organize);
  console.log("Organizer created successfully:", organize);
  const mountedOrganize = organize.mount("#organize");
  console.log("Organizer mounted successfully:", mountedOrganize);
} catch (error) {
  console.error("Error creating or mounting Vue app:", error);
}
