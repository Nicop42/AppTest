// Image Generation Module
import { DOMUtils } from './utils.js';

export class ImageGenerator {
  constructor(apiClient, settingsManager, photoUpload = null) {
    this.apiClient = apiClient;
    this.settingsManager = settingsManager;
    this.photoUpload = photoUpload;
    this.promptQueue = [];
    this.generationCount = 0;
    this.generationHistory = []; // Store complete generation parameters for reuse
    
    // DOM elements
    this.contImage = DOMUtils.$("#created-img-container");
    this.positiveInput = DOMUtils.$("#positive");
    this.negativeInput = DOMUtils.$("#negative");
    this.seedInput = DOMUtils.$("#seed");
    this.generateBtn = DOMUtils.$("#generate");
    this.results = DOMUtils.$("#results");
    this.progressbar = DOMUtils.$("#main-progress");
    this.gallery = DOMUtils.$("#gallery-images");

    this.sessionFolder = `gradio/session_${this.apiClient.clientId.slice(0, 8)}`;
    
    this.setupEventListeners();
    console.log("🎯 ImageGenerator initialized");
  }

  setupEventListeners() {
    this.generateBtn.addEventListener("click", () => this.handleGenerate());
    
    const isRandomInput = DOMUtils.$("#randomSeed");
    if (isRandomInput) {
      isRandomInput.addEventListener("change", () => {
        this.seedInput.disabled = isRandomInput.checked;
      });
    }
  }

  async handleGenerate() {
    console.log("🚀 Starting image generation...");
    
    try {
      // Scroll to image container
      this.contImage.scrollIntoView({ behavior: "smooth" });
      this.contImage.classList.remove("empty");
      this.progressbar.style.display = "block";

      // Check if we should use img2img mode
      const useImg2Img = this.photoUpload && this.photoUpload.hasPhoto();
      let uploadedImageName = null;

      console.log("🔍 Generation mode check:", {
        photoUploadExists: !!this.photoUpload,
        hasPhoto: this.photoUpload ? this.photoUpload.hasPhoto() : false,
        useImg2Img
      });

      // If using img2img, upload the image first
      if (useImg2Img) {
        console.log("🖼️ Using img2img mode - uploading image...");
        
        const selectedFile = this.photoUpload.getSelectedFile();
        if (!selectedFile) {
          throw new Error("Nessun file selezionato per img2img");
        }

        console.log("📤 Uploading file:", {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        });

        try {
          // Upload image and get filename
          uploadedImageName = await this.apiClient.uploadImage(selectedFile);
          
          // Ensure only filename is used (strip any path)
          uploadedImageName = uploadedImageName.split(/[\\/]/).pop();
          this.photoUpload.setUploadedImageName(uploadedImageName);
          
          console.log(`✅ Image uploaded successfully: ${uploadedImageName}`);
        } catch (uploadError) {
          console.error("❌ Image upload failed:", uploadError);
          throw new Error(`Errore caricamento immagine: ${uploadError.message}`);
        }
      } else {
        console.log("✍️ Using text2img mode");
      }

      // Get current settings
      const settings = this.settingsManager.getSettings();
      settings.dimensions = this.settingsManager.getDimensions();

      console.log("⚙️ Generation settings:", {
        ...settings,
        useImg2Img,
        uploadedImageName
      });

      // Get workflow with settings (text2img or img2img)
      let workflow;
      try {
        workflow = await this.apiClient.getWorkflowWithSettings(settings, useImg2Img, uploadedImageName);
        console.log("📋 Workflow loaded successfully", {
          type: useImg2Img ? 'img2img' : 'text2img',
          nodeCount: Object.keys(workflow).length
        });
      } catch (workflowError) {
        console.error("❌ Workflow loading failed:", workflowError);
        throw new Error(`Errore caricamento workflow: ${workflowError.message}`);
      }
      
      // Get prompts
      const positivePrompt = this.positiveInput.value.trim();
      const negativePrompt = this.negativeInput.value.trim();

      console.log("📝 Prompts:", {
        positive: positivePrompt.substring(0, 100) + "...",
        negative: negativePrompt.substring(0, 100) + "..."
      });

      // Update workflow with prompts
      const { filteredPositive, filteredNegative, workflow: updatedWorkflow } = 
        this.apiClient.updateWorkflowPrompts(workflow, positivePrompt, negativePrompt, this.sessionFolder);

      // Update input fields if content was filtered
      if (filteredPositive !== positivePrompt) {
        this.positiveInput.value = filteredPositive;
        console.log("🔒 Positive prompt filtered");
      }
      if (filteredNegative !== negativePrompt) {
        this.negativeInput.value = filteredNegative;
        console.log("🔒 Negative prompt filtered");
      }

      // Update seed display
      this.seedInput.value = updatedWorkflow["3"].inputs.seed;

      // Store complete generation parameters for reuse
      const generationParams = {
        positivePrompt: filteredPositive,
        negativePrompt: filteredNegative,
        seed: updatedWorkflow["3"].inputs.seed,
        settings: {
          ...settings,
          useCustomSeed: true,
          customSeed: updatedWorkflow["3"].inputs.seed
        },
        mode: useImg2Img ? 'img2img' : 'text2img',
        uploadedImageName: uploadedImageName,
        timestamp: Date.now()
      };

      // Show loading state
      this.showLoadingState();
      
      // Add to queue and generate
      this.promptQueue.push({ 
        pos: filteredPositive, 
        neg: filteredNegative,
        mode: useImg2Img ? 'img2img' : 'text2img',
        imageName: uploadedImageName,
        generationParams: generationParams  // Include full generation parameters
      });

      console.log("📤 Sending generation request...");
      
      try {
        const result = await this.apiClient.queuePrompt(updatedWorkflow);
        console.log("✅ Generation request sent successfully:", result);
      } catch (queueError) {
        console.error("❌ Queue prompt failed:", queueError);
        throw new Error(`Errore invio richiesta: ${queueError.message}`);
      }

    } catch (error) {
      console.error("❌ Generation failed:", error);
      alert(`Errore generazione: ${error.message}`);
      this.progressbar.style.display = "none";
      
      // Reset loading state
      const loadingText = this.results.querySelector("#loading-text");
      if (loadingText) loadingText.remove();
    }
  }

  showLoadingState() {
    console.log("⏳ Showing loading state...");
    
    const loading = document.createElement("p");
    loading.id = "loading-text";
    loading.textContent = "Processing image...";

    const existingText = this.results.querySelector("#loading-text");
    if (existingText) existingText.remove();
    
    this.results.appendChild(loading);
    DOMUtils.updateProgress(this.progressbar, 1, 0);
  }

  handleImageGenerated(images) {
    console.log("🖼️ Handling generated images:", images.length);
    
    // Move previous image to gallery if exists
    const existingImage = this.results.querySelector(".image-container");
    if (existingImage) {
      console.log("📦 Moving previous image to gallery");
      DOMUtils.$("#gallery").style.display = "block";

      const prompts = this.promptQueue.shift() || { pos: "", neg: "", mode: "text2img", imageName: null, generationParams: null };

      // Add reuse buttons to images being moved to gallery
      const imageWrappers = existingImage.querySelectorAll(".image-wrapper");
      imageWrappers.forEach(wrapper => {
        const actions = wrapper.querySelector(".image-actions");
        const existingReuseBtn = actions.querySelector(".reuse-btn");
        
        // Only add reuse button if it doesn't already exist
        if (!existingReuseBtn) {
          const img = wrapper.querySelector("img");
          const reuseBtn = document.createElement("button");
          reuseBtn.className = "reuse-btn";
          reuseBtn.innerHTML = '<span class="material-symbols-outlined">replay</span> Riusa';
          reuseBtn.onclick = async () => {
            console.log("🔄 Reusing parameters for image:", img.src);
            if (prompts.generationParams) {
              await this.reuseGenerationParams(prompts.generationParams);
            } else {
              console.warn("⚠️ No generation parameters found for this image");
              alert("Impossibile riutilizzare i parametri: dati di generazione non disponibili per questa immagine.");
            }
          };
          actions.appendChild(reuseBtn);
        }
      });

      const galleryItem = document.createElement("div");
      galleryItem.className = "gallery-item";

      const promptInfo = document.createElement("div");
      promptInfo.className = "prompt-info";
      
      const modeDisplay = prompts.mode === 'img2img' ? `🖼️ Img2Img (${prompts.imageName})` : '✍️ Text2Img';
      promptInfo.innerHTML = `
        <p><strong>Mode:</strong> ${modeDisplay}</p>
        <p><strong>Positive:</strong> ${prompts.pos}</p>
        <p><strong>Negative:</strong> ${prompts.neg}</p>
      `;

      galleryItem.appendChild(existingImage);
      galleryItem.appendChild(promptInfo);
      this.gallery.insertBefore(galleryItem, this.gallery.firstChild);
    }

    // Show toast after first generation
    this.generationCount++;
    if (this.generationCount > 1) {
      DOMUtils.showToast();
    }

    // Remove loading text
    const loadingText = this.results.querySelector("#loading-text");
    if (loadingText) loadingText.remove();

    // Hide progress bar
    this.progressbar.style.display = "none";

    // Show new generated images
    this.displayNewImages(images);
    
    console.log("✅ Image generation completed successfully");
  }

  displayNewImages(images) {
    console.log("🎨 Displaying new images:", images.length);
    
    this.results.innerHTML = "";
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";

    for (const img of images) {
      const url = `/output/${img.subfolder}/${img.filename}?rand=${Math.random()}`;
      console.log("🔗 Creating image element for:", url);
      const imageElement = DOMUtils.createImageElement(url, true);
      imageContainer.appendChild(imageElement);
    }

    this.results.appendChild(imageContainer);
  }

  updateProgress(max, value) {
    DOMUtils.updateProgress(this.progressbar, max, value);
  }

  // Restore generation parameters to the UI
  async reuseGenerationParams(generationParams) {
    console.log("🔄 Reusing generation parameters:", generationParams);
    
    // Restore prompts
    if (this.positiveInput && generationParams.positivePrompt !== undefined) {
      this.positiveInput.value = generationParams.positivePrompt;
    }
    
    if (this.negativeInput && generationParams.negativePrompt !== undefined) {
      this.negativeInput.value = generationParams.negativePrompt;
    }
    
    // Restore seed in main interface
    if (this.seedInput && generationParams.seed !== undefined) {
      this.seedInput.value = generationParams.seed;
    }
    
    // Restore settings in settings manager (filters)
    if (generationParams.settings && this.settingsManager) {
      this.settingsManager.applySettings(generationParams.settings);
    }
    
    // Handle img2img mode
    if (generationParams.mode === 'img2img' && generationParams.uploadedImageName && this.photoUpload) {
      console.log("🖼️ Attempting to restore img2img image:", generationParams.uploadedImageName);
      
      try {
        const restored = await this.photoUpload.restoreImageFromServer(generationParams.uploadedImageName);
        if (restored) {
          console.log("✅ Image restored automatically for img2img mode");
        } else {
          console.log("⚠️ Could not restore image automatically, user will need to upload manually");
        }
      } catch (error) {
        console.error("❌ Error during image restoration:", error);
        alert(`Errore nel ripristino automatico dell'immagine: ${error.message}\n\nCarica nuovamente l'immagine manualmente.`);
      }
    }
    
    console.log("✅ Generation parameters restored successfully");
  }
}