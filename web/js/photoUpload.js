// Photo Upload Module
// Photo Upload Module
import { DOMUtils } from './utils.js';

export class PhotoUpload {
  constructor() {
    this.uploadedImageURL = null;
    this.selectedFile = null;
    this.uploadedImageName = null;
    this.onPhotoAppliedCallback = null;

    // DOM elements
    this.takePhotoBtn = document.getElementById("takePhotoBtn");
    this.uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
    this.cameraInput = document.getElementById("cameraInput");
    this.uploadInput = document.getElementById("uploadInput");
    this.previewArea = document.getElementById("previewArea");
    this.resetBtn = document.getElementById("reset-photo");
    this.applyBtn = document.getElementById("apply-photo");
    this.photoTextP = document.querySelector("#use-photo-section .use-photo-text p");

    this.initialize();
  }

  initialize() {
    console.log("🔧 Initializing PhotoUpload module");
    this.setupEventListeners();
    this.logDOMElements();
  }

  logDOMElements() {
    console.log("📋 PhotoUpload DOM Elements Check:");
    console.log("- takePhotoBtn:", !!this.takePhotoBtn);
    console.log("- uploadPhotoBtn:", !!this.uploadPhotoBtn);
    console.log("- cameraInput:", !!this.cameraInput);
    console.log("- uploadInput:", !!this.uploadInput);
    console.log("- previewArea:", !!this.previewArea);
    console.log("- resetBtn:", !!this.resetBtn);
    console.log("- applyBtn:", !!this.applyBtn);
    console.log("- photoTextP:", !!this.photoTextP);
  }

  setupEventListeners() {
    if (this.takePhotoBtn && this.cameraInput) {
      this.takePhotoBtn.addEventListener("click", () => {
        console.log("📷 Take photo button clicked");
        this.cameraInput.click();
      });
    } else {
      console.warn("❌ Take photo button or camera input not found");
    }

    if (this.uploadPhotoBtn && this.uploadInput) {
      this.uploadPhotoBtn.addEventListener("click", () => {
        console.log("📁 Upload photo button clicked");
        this.uploadInput.click();
      });
    } else {
      console.warn("❌ Upload photo button or upload input not found");
    }

    if (this.cameraInput) {
      this.cameraInput.addEventListener("change", (e) => {
        console.log("📷 Camera input changed, files:", e.target.files.length);
        this.handleFile(e.target.files[0]);
      });
    }

    if (this.uploadInput) {
      this.uploadInput.addEventListener("change", (e) => {
        console.log("📁 Upload input changed, files:", e.target.files.length);
        this.handleFile(e.target.files[0]);
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", () => {
        console.log("🔄 Reset button clicked");
        this.resetPhoto();
      });
    }

    if (this.applyBtn) {
      this.applyBtn.addEventListener("click", () => {
        console.log("✅ Apply button clicked");
        this.applyPhoto();
      });
    }
  }

  handleFile(file) {
    console.log("📋 HandleFile called with:", file);
    
    if (!file) {
      console.warn("❌ No file provided to handleFile");
      return;
    }

    console.log("📁 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Check file type
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      const message = "Per favore carica solo immagini JPG o PNG.";
      console.error("❌ Invalid file type:", file.type);
      alert(message);
      return;
    }

    // Check file size (optional - add reasonable limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const message = "Il file è troppo grande. Massimo 10MB.";
      console.error("❌ File too large:", file.size);
      alert(message);
      return;
    }

    try {
      // Revoke previous URL if exists
      if (this.uploadedImageURL) {
        console.log("🗑️ Revoking previous image URL");
        URL.revokeObjectURL(this.uploadedImageURL);
      }

      // Create new URL and update preview
      this.uploadedImageURL = URL.createObjectURL(file);
      console.log("🖼️ Created new image URL:", this.uploadedImageURL);
      
      if (this.previewArea) {
        this.previewArea.innerHTML = `<img src="${this.uploadedImageURL}" alt="Preview" style="max-width: 100%; max-height: 300px; object-fit: contain;">`;
        console.log("✅ Preview updated successfully");
      } else {
        console.warn("❌ Preview area not found");
      }

      // Update selected file and text
      this.selectedFile = file;
      if (this.photoTextP) {
        this.photoTextP.textContent = file.name;
        console.log("📝 Updated photo text to:", file.name);
      }

      console.log("✅ Photo uploaded successfully:", file.name);
      
    } catch (error) {
      console.error("❌ Error handling file:", error);
      alert("Errore nel caricamento del file. Riprova.");
    }
  }

  resetPhoto() {
    console.log("🔄 Resetting photo...");
    
    try {
      if (this.uploadedImageURL) {
        URL.revokeObjectURL(this.uploadedImageURL);
        this.uploadedImageURL = null;
        console.log("🗑️ Revoked image URL");
      }

      if (this.previewArea) {
        this.previewArea.innerHTML = "";
        console.log("🧹 Cleared preview area");
      }

      if (this.cameraInput) {
        this.cameraInput.value = "";
      }

      if (this.uploadInput) {
        this.uploadInput.value = "";
      }

      this.selectedFile = null;
      this.uploadedImageName = null;

      if (this.photoTextP) {
        this.photoTextP.textContent = "Scegli una foto dal tuo device";
        console.log("📝 Reset photo text");
      }

      console.log("✅ Photo reset completed");
      
    } catch (error) {
      console.error("❌ Error resetting photo:", error);
    }
  }

  async applyPhoto() {
    console.log("✅ Applying photo...");
    
    if (!this.selectedFile) {
      console.warn("❌ No file selected for apply");
      alert("Nessun file selezionato");
      return;
    }

    if (!this.onPhotoAppliedCallback) {
      console.warn("❌ No callback set for photo applied");
      alert("Callback non configurato");
      return;
    }

    try {
      console.log("📤 Calling photo applied callback with file:", this.selectedFile.name);
      await this.onPhotoAppliedCallback(this.selectedFile);
      console.log("✅ Photo applied successfully");
    } catch (error) {
      console.error("❌ Error applying photo:", error);
      alert(`Errore nell'applicazione della foto: ${error.message}`);
    }
  }

  setOnPhotoAppliedCallback(callback) {
    console.log("🔗 Setting photo applied callback");
    this.onPhotoAppliedCallback = callback;
  }

  getSelectedFile() {
    return this.selectedFile;
  }

  getUploadedImageURL() {
    return this.uploadedImageURL;
  }

  // Method to restore an image from server for reuse functionality
  async restoreImageFromServer(imageName) {
    console.log("🔄 Attempting to restore image from server:", imageName);
    
    if (!imageName) {
      console.warn("❌ No image name provided for restoration");
      return false;
    }

    try {
      // ComfyUI stores uploaded images in the input folder and serves them via /view endpoint
      const possiblePaths = [
        `/view?filename=${imageName}&subfolder=&type=input`,
        `/view?filename=${imageName}&type=input`,
        `/input/${imageName}`,
        `/upload/${imageName}`
      ];

      let imageUrl = null;
      let response = null;

      // Try each possible path until we find the image
      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Trying to fetch image from: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            imageUrl = path;
            console.log(`✅ Found image at: ${path}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Failed to fetch from ${path}:`, e.message);
          continue;
        }
      }

      if (!imageUrl || !response.ok) {
        console.warn("❌ Could not find image on server, falling back to manual upload");
        console.log("📋 Attempted paths:", possiblePaths);
        console.log("💾 ComfyUI should store images in: C:\\Users\\StudiumLab\\ComfyUI_windows_portable\\ComfyUI\\input");
        alert(`Immagine originale non trovata sul server: ${imageName}\n\nL'immagine dovrebbe essere in: C:\\Users\\StudiumLab\\ComfyUI_windows_portable\\ComfyUI\\input\n\nPer riprodurre esattamente lo stesso risultato, carica nuovamente l'immagine manualmente.`);
        return false;
      }

      // Convert response to blob and then to file
      const blob = await response.blob();
      const file = new File([blob], imageName, { type: blob.type });

      // Clear any existing image first
      this.resetPhoto();

      // Restore the image to the upload component
      this.handleFile(file);
      
      console.log("✅ Image restored successfully from server:", imageName);
      return true;

    } catch (error) {
      console.error("❌ Error restoring image from server:", error);
      alert(`Errore nel ripristino dell'immagine: ${error.message}\n\nCarica nuovamente l'immagine manualmente.`);
      return false;
    }
  }

  hasPhoto() {
    const hasPhoto = this.selectedFile !== null;
    console.log("🤔 hasPhoto check:", hasPhoto);
    return hasPhoto;
  }

  getUploadedImageName() {
    return this.uploadedImageName;
  }

  setUploadedImageName(name) {
    console.log("📝 Setting uploaded image name:", name);
    this.uploadedImageName = name;
  }
}