// Main Application Module: creates and wires together all modules of the generator page
import { generateUUID } from './utils.js';
import { StyleManager } from './styleManager.js';
import { SettingsManager } from './settingsManager.js';
import { ComfyUIClient } from './comfyUIClient.js';
import { ImageGenerator } from './imageGenerator.js';
import { ReferenceImageManager } from './referenceImageManager.js';
import { ComfyUISocket } from './comfyUISocket.js';
import { initializeArchiveCarousel } from './archiveCarousel.js';

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
      this.apiClient = new ComfyUIClient(this.clientId);
      this.settingsManager = new SettingsManager();
      this.styleManager = new StyleManager();
      this.referenceImageManager = new ReferenceImageManager();

      // Initialize image generator (depends on API client, settings, and reference image)
      this.imageGenerator = new ImageGenerator(this.apiClient, this.settingsManager, this.referenceImageManager);

      // When a reference image is applied, generation switches to image-to-image mode
      this.referenceImageManager.setOnImageAppliedCallback(async (file, imageDimensions) => {
        console.log("📷 Reference image applied for img2img generation:", file.name);
        if (imageDimensions) {
          console.log("📐 Image dimensions received:", imageDimensions);
          // Store dimensions for use in generation
          this.imageGenerator.setUploadedImageDimensions(imageDimensions);
        }
        // The actual img2img logic is handled in imageGenerator.handleGenerate()
      });

      // Initialize ComfyUI WebSocket (depends on image generator)
      this.comfyUISocket = new ComfyUISocket(this.clientId, this.imageGenerator);

      // Initialize archive carousel from archiveConfig.js
      // Wait a bit to ensure all other components are ready
      setTimeout(() => {
        try {
          initializeArchiveCarousel();
        } catch (error) {
          console.error("🎯 Error initializing archive carousel:", error);
        }
      }, 500);

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

  getReferenceImageManager() {
    return this.referenceImageManager;
  }

  getComfyUISocket() {
    return this.comfyUISocket;
  }

  // Cleanup method
  destroy() {
    if (this.comfyUISocket) {
      this.comfyUISocket.close();
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
