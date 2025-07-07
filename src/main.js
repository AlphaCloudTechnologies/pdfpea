console.log('Starting main.js execution...');

import { createApp } from 'vue'
console.log('Vue imported successfully');

import App from './App.vue'
console.log('App component imported successfully');

import './css/tailwind.css'
import './css/styles.css'
import './css/index.css'
console.log('Styles imported successfully');

// Import external dependencies
import * as pdfLib from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import Moveable from 'moveable'
console.log('External dependencies imported successfully');

// Set up global references for backwards compatibility
window.PDFLib = pdfLib
window.pdfjsLib = pdfjsLib  
window.Moveable = Moveable

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

console.log('All imports and setup completed');

console.log('About to create Vue app...');
try {
  const app = createApp(App);
  console.log('Vue app created successfully:', app);
  const mountedApp = app.mount('#app');
  console.log('Vue app mounted successfully:', mountedApp);
} catch (error) {
  console.error('Error creating or mounting Vue app:', error);
}