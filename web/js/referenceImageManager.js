// Reference Image Module: lets the visitor pick the source image for image-to-image generation
// (camera, device gallery or museum archive) and prepares it for upload
import { DOMUtils } from "./utils.js";

export class ReferenceImageManager {
  constructor() {
    this.uploadedImageURL = null;
    this.selectedFile = null;
    this.uploadedImageName = null;
    this.onImageAppliedCallback = null;

    // DOM elements
    this.takePhotoBtn = document.getElementById("take-photo-btn");
    this.choosePhotoBtn = document.getElementById("choose-photo-btn");
    this.cameraInput = document.getElementById("camera-input");
    this.fileInput = document.getElementById("file-input");
    this.previewContainer = document.getElementById("reference-image-preview");
    this.resetBtn = document.getElementById("reset-reference-image");
    this.applyBtn = document.getElementById("apply-reference-image");
    this.selectionLabel = document.querySelector(
      "#reference-image-section .reference-image-summary p"
    );
    this.referenceImageModal = document.getElementById("reference-image-modal");

    this.initialize();
  }

  initialize() {
    console.log("🔧 Initializing ReferenceImageManager module");
    this.setupEventListeners();
    this.logDOMElements();
  }

  logDOMElements() {
    console.log("📋 ReferenceImageManager DOM Elements Check:");
    console.log("- takePhotoBtn:", !!this.takePhotoBtn);
    console.log("- choosePhotoBtn:", !!this.choosePhotoBtn);
    console.log("- cameraInput:", !!this.cameraInput);
    console.log("- fileInput:", !!this.fileInput);
    console.log("- previewContainer:", !!this.previewContainer);
    console.log("- resetBtn:", !!this.resetBtn);
    console.log("- applyBtn:", !!this.applyBtn);
    console.log("- selectionLabel:", !!this.selectionLabel);
  }

  setupEventListeners() {
    /* MUSEUM ARCHIVE IMAGES */
    // Setup archive image click handlers when modal is shown
    if (this.referenceImageModal) {
      // Store reference to this for use in event listeners
      const manager = this;
      
      this.referenceImageModal.addEventListener("show.bs.modal", function (event) {
        console.log("show.bs.modal - Setting up archive image handlers");
        
        // Setup click handlers for archive images (Swiper is initialized by archiveCarousel.js)
        setTimeout(() => {
          document.querySelectorAll(".archive-image-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
              const slide = btn.closest(".swiper-slide");
              const isActive = slide.classList.contains("active");

              // Remove "active" from all slides
              document
                .querySelectorAll(".swiper-slide")
                .forEach((s) => s.classList.remove("active"));

              // If it wasn't already active, activate it
              if (!isActive) {
                slide.classList.add("active");
                const imgElement = btn.querySelector("img");
                const imagePath = imgElement.src;
                const imageName = imagePath.split("/").pop(); // Get filename from path
                
                console.log(`🖼️ Archive image selected: ${imageName}`);
                
                try {
                  // Load the archive image for img2img processing
                  await manager.loadArchiveImage(imagePath, imageName);
                  
                  // Close the modal after successful selection
                  if (manager.usePhotoModal && typeof bootstrap !== 'undefined') {
                    const modal = bootstrap.Modal.getInstance(manager.usePhotoModal);
                    if (modal) {
                      modal.hide();
                    } else {
                      // If no instance exists, create one and hide it
                      const newModal = new bootstrap.Modal(manager.usePhotoModal);
                      newModal.hide();
                    }
                  } else {
                    console.warn("Bootstrap not available or modal not found");
                  }
                } catch (error) {
                  console.error("❌ Error loading archive image:", error);
                  alert(`Errore nel caricamento dell'immagine: ${error.message}`);
                }
              }
            });
          });
        }, 100); // Small delay to ensure DOM is ready
      });
    }

    /* end museum archive images */

    if (this.takePhotoBtn && this.cameraInput) {
      this.takePhotoBtn.addEventListener("click", () => {
        console.log("📷 Take photo button clicked");
        this.cameraInput.click();
      });
    } else {
      console.warn("❌ Take photo button or camera input not found");
    }

    if (this.choosePhotoBtn && this.fileInput) {
      this.choosePhotoBtn.addEventListener("click", () => {
        console.log("📁 Upload photo button clicked");
        this.fileInput.click();
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

    if (this.fileInput) {
      this.fileInput.addEventListener("change", (e) => {
        console.log("📁 Upload input changed, files:", e.target.files.length);
        this.handleFile(e.target.files[0]);
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", () => {
        console.log("🔄 Reset button clicked");
        this.resetImage();
      });
    }

    if (this.applyBtn) {
      this.applyBtn.addEventListener("click", () => {
        console.log("✅ Apply button clicked");
        this.applyImage();
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
      lastModified: file.lastModified,
    });

    // Check file type
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      const message = "Per favore carica solo immagini JPG o PNG.";
      console.error("❌ Invalid file type:", file.type);
      alert(message);
      return;
    }

    // Check file size (increased limit but add warning for very large files)
    const maxSize = 50 * 1024 * 1024; // 50MB max
    const warningSize = 10 * 1024 * 1024; // 10MB warning threshold

    if (file.size > maxSize) {
      const message = "Il file è troppo grande. Massimo 50MB.";
      console.error("❌ File too large:", file.size);
      alert(message);
      return;
    }

    if (file.size > warningSize) {
      console.warn(
        `⚠️ Large file detected: ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB - will be resized for processing`
      );
    }

    try {
      // Revoke previous URL if exists
      if (this.uploadedImageURL) {
        console.log("🗑️ Revoking previous image URL");
        URL.revokeObjectURL(this.uploadedImageURL);
      }

      // Create new URL and update preview with orientation correction
      this.uploadedImageURL = URL.createObjectURL(file);
      console.log("🖼️ Created new image URL:", this.uploadedImageURL);

      if (this.previewContainer) {
        // Check if this is a mobile photo that might need orientation correction
        const img = new Image();
        img.onload = () => {
          console.log(`📐 Image dimensions: ${img.width}x${img.height}`);
          // Check if image is very tall (potential mobile portrait with wrong orientation)
          if (img.height > img.width * 2) {
            console.log("⚠️ Detected potential mobile portrait image");
          }
        };
        img.src = this.uploadedImageURL;

        this.previewContainer.innerHTML = `<img src="${this.uploadedImageURL}" alt="Preview" style="max-width: 100%; max-height: 300px; object-fit: contain;">`;
        console.log("✅ Preview updated successfully");
      } else {
        console.warn("❌ Preview area not found");
      }

      // Update selected file and text
      this.selectedFile = file;
      if (this.selectionLabel) {
        this.selectionLabel.textContent = file.name;
        console.log("📝 Updated photo text to:", file.name);
      }

      console.log("✅ Photo uploaded successfully:", file.name);
    } catch (error) {
      console.error("❌ Error handling file:", error);
      alert("Errore nel caricamento del file. Riprova.");
    }
  }

  resetImage() {
    console.log("🔄 Resetting photo...");

    try {
      if (this.uploadedImageURL) {
        URL.revokeObjectURL(this.uploadedImageURL);
        this.uploadedImageURL = null;
        console.log("🗑️ Revoked image URL");
      }

      if (this.previewContainer) {
        this.previewContainer.innerHTML = "";
        console.log("🧹 Cleared preview area");
      }

      if (this.cameraInput) {
        this.cameraInput.value = "";
      }

      if (this.fileInput) {
        this.fileInput.value = "";
      }

      this.selectedFile = null;
      this.uploadedImageName = null;

      if (this.selectionLabel) {
        this.selectionLabel.textContent = "Scegli una foto dal tuo device";
        console.log("📝 Reset photo text");
      }

      console.log("✅ Photo reset completed");
    } catch (error) {
      console.error("❌ Error resetting photo:", error);
    }
  }

  async prepareImageForUpload(file) {
    return new Promise((resolve, reject) => {
      console.log("🔧 Processing image for mobile compatibility");

      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        try {
          const originalWidth = img.width;
          const originalHeight = img.height;
          console.log(`📐 Original image: ${originalWidth}x${originalHeight}`);

          // Much more aggressive sizing for Marigold compatibility
          // Marigold works better with smaller, specific resolutions
          const MAX_DIMENSION = 512; // Further reduced for Marigold
          let { width, height } = img;

          // Always resize to a smaller, memory-friendly size
          const aspectRatio = width / height;

          // Force to common AI-friendly resolutions
          if (aspectRatio > 1) {
            // Landscape
            width = MAX_DIMENSION;
            height = Math.round(MAX_DIMENSION / aspectRatio);
          } else {
            // Portrait or square
            height = MAX_DIMENSION;
            width = Math.round(MAX_DIMENSION * aspectRatio);
          }

          // Ensure dimensions are multiples of 8 (important for AI models)
          width = Math.round(width / 8) * 8;
          height = Math.round(height / 8) * 8;

          console.log(
            `📉 Resizing to: ${width}x${height} (from ${img.width}x${img.height})`
          );
          console.log(
            `🔢 Memory reduction factor: ${(
              (img.width * img.height) /
              (width * height)
            ).toFixed(2)}x`
          );

          // Set canvas size to calculated dimensions
          canvas.width = width;
          canvas.height = height;

          // Clear canvas and set white background (helps with some models)
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);

          // Draw image to canvas with scaling and orientation correction
          ctx.drawImage(img, 0, 0, width, height);

          // Convert back to blob with aggressive compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a new File object with the processed data
                const processedFile = new File([blob], file.name, {
                  type: "image/jpeg", // Force JPEG for better compatibility
                  lastModified: Date.now(),
                });

                console.log(
                  `✅ Image processed: ${processedFile.size} bytes (${(
                    processedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}MB)`
                );
                console.log(
                  `📊 Size reduction: ${(
                    ((file.size - processedFile.size) / file.size) *
                    100
                  ).toFixed(1)}%`
                );
                console.log(`🎯 Final dimensions: ${width}x${height}`);

                // Return both the processed file and original dimensions for proportional resizing
                resolve({
                  file: processedFile,
                  originalDimensions: {
                    width: originalWidth,
                    height: originalHeight,
                  },
                  processedDimensions: { width, height },
                });
              } else {
                reject(new Error("Failed to process image"));
              }
            },
            "image/jpeg",
            0.75
          ); // More aggressive compression (75% quality)
        } catch (error) {
          console.error("❌ Error processing image:", error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error("❌ Error loading image for processing");
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async applyImage() {
    console.log("✅ Applying photo...");

    if (!this.selectedFile) {
      console.warn("❌ No file selected for apply");
      alert("Nessun file selezionato");
      return;
    }

    if (!this.onImageAppliedCallback) {
      console.warn("❌ No callback set for photo applied");
      alert("Callback non configurato");
      return;
    }

    try {
      // Process the image for mobile compatibility (removes EXIF orientation issues)
      console.log("🔧 Processing image before upload...");
      const result = await this.prepareImageForUpload(this.selectedFile);

      // Store dimensions for later use
      this.originalImageDimensions = result.originalDimensions;

      console.log(
        "📤 Calling photo applied callback with processed file:",
        result.file.name
      );
      console.log(
        "📐 Original dimensions stored:",
        this.originalImageDimensions
      );

      await this.onImageAppliedCallback(
        result.file,
        this.originalImageDimensions
      );
      console.log("✅ Photo applied successfully");
    } catch (error) {
      console.error("❌ Error applying photo:", error);
      alert(`Errore nell'applicazione della foto: ${error.message}`);
    }
  }

  getOriginalImageDimensions() {
    return this.originalImageDimensions;
  }

  setOnImageAppliedCallback(callback) {
    console.log("🔗 Setting photo applied callback");
    this.onImageAppliedCallback = callback;
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
        `/upload/${imageName}`,
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
        console.warn(
          "❌ Could not find image on server, falling back to manual upload"
        );
        console.log("📋 Attempted paths:", possiblePaths);
        console.log(
          "💾 ComfyUI should store images in: C:\\Users\\StudiumLab\\ComfyUI_windows_portable\\ComfyUI\\input"
        );
        alert(
          `Immagine originale non trovata sul server: ${imageName}\n\nL'immagine dovrebbe essere in: C:\\Users\\StudiumLab\\ComfyUI_windows_portable\\ComfyUI\\input\n\nPer riprodurre esattamente lo stesso risultato, carica nuovamente l'immagine manualmente.`
        );
        return false;
      }

      // Convert response to blob and then to file
      const blob = await response.blob();
      const file = new File([blob], imageName, { type: blob.type });

      // Clear any existing image first
      this.resetImage();

      // Restore the image to the upload component
      this.handleFile(file);

      console.log("✅ Image restored successfully from server:", imageName);
      return true;
    } catch (error) {
      console.error("❌ Error restoring image from server:", error);
      alert(
        `Errore nel ripristino dell'immagine: ${error.message}\n\nCarica nuovamente l'immagine manualmente.`
      );
      return false;
    }
  }

  hasImage() {
    const hasImage = this.selectedFile !== null;
    console.log("🤔 hasImage check:", hasImage);
    return hasImage;
  }

  getUploadedImageName() {
    return this.uploadedImageName;
  }

  setUploadedImageName(name) {
    console.log("📝 Setting uploaded image name:", name);
    this.uploadedImageName = name;
  }

  /**
   * Load an archive image for img2img processing
   * @param {string} imagePath - The full path/URL to the image
   * @param {string} imageName - The filename of the image
   */
  async loadArchiveImage(imagePath, imageName) {
    console.log(`🖼️ Loading archive image: ${imageName} from ${imagePath}`);
    
    try {
      // Fetch the image from the path
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], imageName, { type: blob.type });
      
      console.log(`✅ Archive image loaded as file:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Use the same process as regular file upload
      await this.handleArchiveFile(file, imagePath);
      
    } catch (error) {
      console.error("❌ Error loading archive image:", error);
      throw error;
    }
  }

  /**
   * Handle archive file similarly to regular file upload
   * @param {File} file - The File object created from the archive image
   * @param {string} imagePath - The original image path for preview
   */
  async handleArchiveFile(file, imagePath) {
    console.log("📋 handleArchiveFile called with:", file.name);

    try {
      // Revoke previous URL if exists
      if (this.uploadedImageURL) {
        console.log("🗑️ Revoking previous image URL");
        URL.revokeObjectURL(this.uploadedImageURL);
      }

      // Use the original image path for preview (no need to create object URL)
      this.uploadedImageURL = imagePath;
      console.log("🖼️ Using archive image path:", this.uploadedImageURL);

      if (this.previewContainer) {
        this.previewContainer.innerHTML = `<img src="${imagePath}" alt="Preview" style="max-width: 100%; max-height: 300px; object-fit: contain;">`;
        console.log("✅ Preview updated with archive image");
      }

      // Update selected file and text
      this.selectedFile = file;
      this.uploadedImageName = file.name;
      
      if (this.selectionLabel) {
        this.selectionLabel.textContent = `Immagine archivio: ${file.name}`;
        console.log("📝 Updated photo text for archive image:", file.name);
      }

      // If there's a callback set, automatically apply the image
      if (this.onImageAppliedCallback) {
        console.log("🔄 Auto-applying archive image...");
        await this.applyImage();
      }

      console.log("✅ Archive image processed successfully:", file.name);
    } catch (error) {
      console.error("❌ Error handling archive file:", error);
      throw error;
    }
  }
}
