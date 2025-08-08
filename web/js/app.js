// Main Application Module
import { generateUUID } from './utils.js';
import { StyleManager } from './styleManager.js';
import { SettingsManager } from './settingsManager.js';
import { APIClient } from './apiClient.js';
import { ImageGenerator } from './imageGenerator.js';
import { PhotoUpload } from './photoUpload.js';
import { WebSocketHandler } from './websocketHandler.js';
import { STYLE_CONFIG, DISPLAY_CONFIG } from './styleConfig.js';

console.log("🔍 DEBUG: STYLE_CONFIG imported directly in app.js:", STYLE_CONFIG);
console.log("🔍 DEBUG: DISPLAY_CONFIG imported directly in app.js:", DISPLAY_CONFIG);

class App {
  constructor() {
    this.clientId = generateUUID();
    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be fully ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }
      
      console.log("🚀 App initializing with DOM ready...");
      
      // Initialize core modules
      this.apiClient = new APIClient(this.clientId);
      this.settingsManager = new SettingsManager();
      this.styleManager = new StyleManager();
      this.photoUpload = new PhotoUpload();
      
      // Initialize image generator (depends on API client, settings, and photo upload)
      this.imageGenerator = new ImageGenerator(this.apiClient, this.settingsManager, this.photoUpload);
      
      // Set up photo upload callback to handle img2img mode
      this.photoUpload.setOnPhotoAppliedCallback(async (file, imageDimensions) => {
        console.log("📷 Photo applied for img2img generation:", file.name);
        if (imageDimensions) {
          console.log("📐 Image dimensions received:", imageDimensions);
          // Store dimensions for use in generation
          this.imageGenerator.setUploadedImageDimensions(imageDimensions);
        }
        // The photo is now ready for img2img generation
        // The actual img2img logic is handled in imageGenerator.handleGenerate()
      });
      
      // Initialize WebSocket handler (depends on image generator)
      this.websocketHandler = new WebSocketHandler(this.clientId, this.imageGenerator);

      console.log("✅ App initialized successfully");
      console.log("📝 Client ID:", this.clientId.slice(0, 8));
      
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
      this.showError("Failed to initialize the application. Please refresh the page.");
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      max-width: 500px;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Public API methods for external access
  getClientId() {
    return this.clientId;
  }

  getStyleManager() {
    return this.styleManager;
  }

  getSettingsManager() {
    return this.settingsManager;
  }

  getImageGenerator() {
    return this.imageGenerator;
  }

  getPhotoUpload() {
    return this.photoUpload;
  }

  getWebSocketHandler() {
    return this.websocketHandler;
  }

  // Cleanup method
  destroy() {
    if (this.websocketHandler) {
      this.websocketHandler.close();
    }
    console.log("🧹 App destroyed");
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.destroy();
  }
});

export default App;