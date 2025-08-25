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
    this.isFirstGeneration = true; // Track if this is the very first generation
    
    // Progress tracking for img2img workflow
    this.workflowProgress = {
      isImg2Img: false,
      currentStage: 'idle',
      executedNodes: new Set(),
      totalExpectedNodes: 0,
      stages: {
        'preprocessing': { weight: 0.3, completed: false },
        'sampling': { weight: 0.6, completed: false },
        'postprocessing': { weight: 0.1, completed: false }
      }
    };
    
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
    this.uploadedImageDimensions = null; // Store dimensions for proportional resizing
    
    this.setupEventListeners();
    console.log("🎯 ImageGenerator initialized");
  }

  // Method to reset the generator state (useful for debugging)
  resetState() {
    console.log("🧹 Resetting ImageGenerator state...");
    this.promptQueue = [];
    this.generationCount = 0;
    this.generationHistory = [];
    this.isFirstGeneration = true;
    
    // Clear results
    this.results.innerHTML = "";
    
    // Hide gallery
    DOMUtils.$("#gallery").style.display = "none";
    
    // Clear gallery contents
    this.gallery.innerHTML = "";
    
    // Reset container state
    this.contImage.classList.add("empty");
    
    console.log("✅ ImageGenerator state reset");
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
        
        // Update loading text to show upload progress
        const loadingText = this.results.querySelector("#loading-text");
        if (loadingText) {
          loadingText.textContent = "Uploading image for processing...";
        }
        
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
          
          // Update loading text to show processing phase
          if (loadingText) {
            loadingText.textContent = "Processing uploaded image...";
          }
          
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
        workflow = await this.apiClient.getWorkflowWithSettings(
          settings, 
          useImg2Img, 
          uploadedImageName,
          this.uploadedImageDimensions
        );
        console.log("📋 Workflow loaded successfully", {
          type: useImg2Img ? 'img2img' : 'text2img',
          nodeCount: Object.keys(workflow).length,
          hasImageDimensions: !!this.uploadedImageDimensions
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

      // Show loading state and initialize progress tracking
      this.showLoadingState();
      this.resetWorkflowProgress(useImg2Img);
      
      // Add to queue and generate
      this.promptQueue.push({ 
        pos: filteredPositive, 
        neg: filteredNegative,
        mode: useImg2Img ? 'img2img' : 'text2img',
        imageName: uploadedImageName,
        generationParams: generationParams  // Include full generation parameters
      });
      
      console.log("🔍 DEBUG: Added to promptQueue:", {
        pos: filteredPositive,
        neg: filteredNegative,
        mode: useImg2Img ? 'img2img' : 'text2img',
        imageName: uploadedImageName
      });
      console.log("🔍 DEBUG: promptQueue now has", this.promptQueue.length, "items");

      // Update loading text to show generation phase
      const loadingText = this.results.querySelector("#loading-text");
      if (loadingText) {
        loadingText.textContent = useImg2Img ? "Initializing image processing..." : "Generating image...";
      }

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
    loading.textContent = "Preparing generation...";

    const existingText = this.results.querySelector("#loading-text");
    if (existingText) existingText.remove();
    
    this.results.appendChild(loading);
    DOMUtils.updateProgress(this.progressbar, 1, 0);
  }

  handleImageGenerated(images) {
    console.log("🖼️ Handling generated images:", images.length);
    console.log("🔍 DEBUG: promptQueue before processing:", this.promptQueue.length, this.promptQueue);
    
    // Mark workflow as completed
    if (this.workflowProgress.isImg2Img) {
      this.workflowProgress.stages.postprocessing.completed = true;
      this.workflowProgress.currentStage = 'completed';
      console.log("🎯 Img2Img workflow completed!");
    }
    
    // Move previous image to gallery if exists
    const existingImage = this.results.querySelector(".image-container");
    console.log("🔍 DEBUG: existingImage found:", !!existingImage);
    console.log("🔍 DEBUG: gallery current children count:", this.gallery.children.length);
    console.log("🔍 DEBUG: results.innerHTML content:", this.results.innerHTML);
    console.log("🔍 DEBUG: all elements in results:", this.results.children.length, Array.from(this.results.children).map(el => el.tagName + '.' + el.className));
    console.log("🔍 DEBUG: isFirstGeneration flag:", this.isFirstGeneration);
    
    // Check if the existing image actually loaded successfully
    // Only images with display: block have loaded successfully
    const existingImageLoaded = existingImage && existingImage.querySelector('.generated-image[style*="display: block"]');
    console.log("🔍 DEBUG: existingImage loaded successfully:", !!existingImageLoaded);
    
    // Only move to gallery if:
    // 1. There's an existing image container AND
    // 2. The image actually loaded successfully AND  
    // 3. This is not the first generation
    const shouldMoveToGallery = existingImage && existingImageLoaded && !this.isFirstGeneration;
    console.log("🔍 DEBUG: shouldMoveToGallery:", shouldMoveToGallery);
    
    if (shouldMoveToGallery) {
      console.log("📦 Moving previous image to gallery");
      DOMUtils.$("#gallery").style.display = "block";

      // Get the prompts for the PREVIOUS image that's being moved to gallery
      // This should be the generation data that was used to create the existing image
      const prompts = this.promptQueue.shift() || { pos: "", neg: "", mode: "text2img", imageName: null, generationParams: null };
      console.log("🔍 DEBUG: prompts retrieved for gallery:", prompts);
      console.log("🔍 DEBUG: promptQueue after shift:", this.promptQueue.length, this.promptQueue);

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
    } else {
      // Don't move anything to gallery because:
      // - No existing image, OR
      // - Existing image failed to load, OR  
      // - This is the first generation
      if (this.isFirstGeneration) {
        console.log("🔍 DEBUG: First generation - gallery will remain empty");
      } else if (existingImage && !existingImageLoaded) {
        console.log("🔍 DEBUG: Existing image failed to load - not moving to gallery");
        console.log("🔍 DEBUG: This prevents failed temp images from appearing in gallery");
      } else if (!existingImage) {
        console.log("� DEBUG: No existing image found - nothing to move to gallery");
      }
      
      // Do NOT shift the queue - keep prompts for potential retry or debugging
      console.log("🔍 DEBUG: promptQueue will NOT be shifted");
    }

    // Mark that we're no longer on the first generation
    this.isFirstGeneration = false;

    // Show toast after first generation
    this.generationCount++;
    if (this.generationCount > 1) {
      DOMUtils.showToast();
    }

    // Remove loading text and update final progress
    const loadingText = this.results.querySelector("#loading-text");
    if (loadingText) loadingText.remove();

    // Set progress to 100% and then hide after a short delay
    DOMUtils.updateProgress(this.progressbar, 100, 100);
    setTimeout(() => {
      this.progressbar.style.display = "none";
    }, 1000);

    // Determine the current generation mode (after queue was potentially shifted)
    const currentGenerationMode = this.promptQueue.length > 0 ? this.promptQueue[0].mode : 'text2img';
    
    // Show new generated images and track when they're loaded
    this.displayNewImages(images, currentGenerationMode);
    
    console.log("✅ Image generation completed successfully");
  }

  displayNewImages(images, generationMode = 'text2img') {
    console.log("🎨 Displaying new images:", images.length);
    console.log("🔍 Image data received:", images);
    console.log("🎯 Generation mode:", generationMode);
    
    this.results.innerHTML = "";
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";

    // Create all image elements first
    const imageElements = [];
    for (const img of images) {
      console.log("🖼️ Processing image:", {
        filename: img.filename,
        subfolder: img.subfolder,
        type: img.type
      });
      
      const url = `/output/${img.subfolder}/${img.filename}?rand=${Math.random()}`;
      console.log("🔗 Creating image element for:", url);
      
      // Validate URL components
      if (!img.filename) {
        console.error("❌ Missing filename in image data:", img);
        continue;
      }
      
      const imageElement = DOMUtils.createImageElement(url, true);
      imageContainer.appendChild(imageElement);
      imageElements.push(imageElement);
    }

    this.results.appendChild(imageContainer);
    
    // Monitor image loading with polling, passing the generation mode
    this.monitorImageLoading(imageElements, generationMode);
  }

  monitorImageLoading(imageElements, generationMode = 'text2img') {
    const totalImages = imageElements.length;
    let checkCount = 0;
    
    // Use the passed generation mode instead of trying to detect from queue
    const isImg2ImgMode = generationMode === 'img2img';
    
    // Reasonable timeout for both modes
    const maxChecks = isImg2ImgMode ? 60 : 30; // img2img: 30 seconds, text2img: 15 seconds
    const checkInterval = 500; // Check every 500ms
    
    console.log(`📊 Starting to monitor ${totalImages} images (${generationMode} mode)`);
    console.log(`⏱️ Maximum monitoring time: ${(maxChecks * checkInterval / 1000)} seconds`);
    
    const checkImagesLoaded = () => {
      checkCount++;
      let loadedCount = 0;
      let failedCount = 0;
      
      imageElements.forEach((container, index) => {
        const img = container.querySelector('.generated-image');
        if (img) {
          if (img.style.display === 'block') {
            loadedCount++;
          } else if (img.style.display === 'none' && img.src.includes('retry=')) {
            failedCount++;
          }
        }
      });
      
      const totalProcessed = loadedCount + failedCount;
      const elapsedTime = (checkCount * checkInterval / 1000).toFixed(1);
      console.log(`📊 Check ${checkCount} (${elapsedTime}s): ${loadedCount} loaded, ${failedCount} failed, ${totalProcessed}/${totalImages} total`);
      
      // Minimum display time to ensure users see the progress bar
      const minDisplayTime = isImg2ImgMode ? 3000 : 1000; // img2img: 3 seconds minimum, text2img: 1 second
      const elapsedTimeMs = checkCount * checkInterval;
      
      // Hide progress bar when:
      // 1. All images are processed (loaded or failed) AND minimum time has elapsed
      // 2. OR maximum timeout reached
      if ((totalProcessed >= totalImages && elapsedTimeMs >= minDisplayTime) || checkCount >= maxChecks) {
        const reason = checkCount >= maxChecks ? "timeout reached" : "all images processed";
        console.log(`✅ ${reason} after ${elapsedTime}s, hiding progress bar`);
        this.progressbar.style.display = "none";
        
        // Show save buttons for loaded images
        this.showSaveButtonsForImages();
        return;
      }
      
      // Show additional info for img2img mode
      if (isImg2ImgMode && checkCount % 10 === 0) {
        console.log(`🖼️ Img2img processing continues... (${elapsedTime}s elapsed)`);
      }
      
      // Continue checking
      setTimeout(checkImagesLoaded, checkInterval);
    };
    
    // Start monitoring after a short delay
    setTimeout(checkImagesLoaded, 1000);
  }

  showSaveButtonsForImages() {
    console.log("🎯 Showing save buttons for all loaded images");
    
    // Show save buttons for current main images
    const imageContainers = this.results.querySelectorAll(".image-wrapper");
    imageContainers.forEach(container => {
      const img = container.querySelector('.generated-image');
      // Only show actions for successfully loaded images
      if (img && img.style.display === 'block') {
        DOMUtils.showImageActions(container);
      }
    });
  }

  updateProgress(max, value) {
    // If this is actual sampling progress, update the progress bar
    if (max > 0 && value !== undefined) {
      DOMUtils.updateProgress(this.progressbar, max, value);
      
      // Calculate sampling progress
      const samplingProgress = Math.round((value / max) * 100);
      
      // If we're in img2img mode, factor in the overall workflow progress
      if (this.workflowProgress.isImg2Img) {
        this.workflowProgress.stages.sampling.completed = (value === max);
        const overallProgress = this.calculateOverallProgress(samplingProgress);
        this.updateProgressText(`Generating image... ${overallProgress}%`);
      } else {
        this.updateProgressText(`Generating image... ${samplingProgress}%`);
      }
      
      // Log progress for debugging
      if (samplingProgress % 25 === 0 || value === max) {
        console.log(`📊 Sampling Progress: ${value}/${max} (${samplingProgress}%)`);
      }
    }
  }

  updateNodeExecution(nodeId) {
    console.log(`⚙️ Node executing: ${nodeId}`);
    
    if (!this.workflowProgress.isImg2Img) return;
    
    this.workflowProgress.executedNodes.add(nodeId);
    
    // Define node patterns and their stages (using more flexible matching)
    const nodeStagePatterns = [
      { patterns: ['LoadImage', '65'], stage: 'preprocessing', description: 'Loading image' },
      { patterns: ['MiDaS', 'DepthMapPreprocessor', '94'], stage: 'preprocessing', description: 'Processing depth map' },
      { patterns: ['VAEEncode', '69'], stage: 'preprocessing', description: 'Encoding image' },
      { patterns: ['ControlNet', '61', '63'], stage: 'preprocessing', description: 'Applying ControlNet' },
      { patterns: ['KSampler', '3'], stage: 'sampling', description: 'Generating image' },
      { patterns: ['VAEDecode', '8'], stage: 'postprocessing', description: 'Decoding image' },
      { patterns: ['SaveImage', '28'], stage: 'postprocessing', description: 'Saving image' }
    ];
    
    // Find matching stage
    let matchedStage = null;
    let stageDescription = 'Processing';
    
    for (const { patterns, stage, description } of nodeStagePatterns) {
      if (patterns.some(pattern => nodeId.toString().includes(pattern))) {
        matchedStage = stage;
        stageDescription = description;
        break;
      }
    }
    
    // Update current stage if we found a match
    if (matchedStage) {
      const previousStage = this.workflowProgress.currentStage;
      this.workflowProgress.currentStage = matchedStage;
      
      console.log(`🎯 Stage transition: ${previousStage} → ${matchedStage} (${stageDescription})`);
      
      // Update progress text and bar based on current stage
      switch (matchedStage) {
        case 'preprocessing':
          this.updateProgressText(`${stageDescription}...`);
          // Show some progress during preprocessing (gradually increasing)
          const preprocessProgress = Math.min(25, Math.max(5, this.workflowProgress.executedNodes.size * 3));
          DOMUtils.updateProgress(this.progressbar, 100, preprocessProgress);
          break;
        case 'sampling':
          this.updateProgressText('Generating image from photo...');
          // Sampling progress will be handled by updateProgress method
          break;
        case 'postprocessing':
          this.updateProgressText('Finalizing image...');
          DOMUtils.updateProgress(this.progressbar, 100, 95);
          break;
      }
    } else {
      console.log(`🔍 Unknown node type: ${nodeId} - keeping current stage: ${this.workflowProgress.currentStage}`);
    }
  }

  isNodeType(nodeId, nodeType) {
    // Helper method to identify node types by checking the workflow
    // This is a simplified approach - in a real implementation, you'd 
    // want to track the actual node types from the workflow
    const currentGeneration = this.promptQueue.length > 0 ? this.promptQueue[0] : null;
    return false; // Simplified for now
  }

  calculateOverallProgress(samplingProgress) {
    const stages = this.workflowProgress.stages;
    let totalProgress = 0;
    
    // Add completed stages
    if (stages.preprocessing.completed) totalProgress += stages.preprocessing.weight * 100;
    else if (this.workflowProgress.currentStage === 'preprocessing') totalProgress += Math.min(stages.preprocessing.weight * 100, 20);
    
    // Add current sampling progress
    if (this.workflowProgress.currentStage === 'sampling') {
      totalProgress += (samplingProgress / 100) * stages.sampling.weight * 100;
    } else if (stages.sampling.completed) {
      totalProgress += stages.sampling.weight * 100;
    }
    
    // Add postprocessing if completed
    if (stages.postprocessing.completed) totalProgress += stages.postprocessing.weight * 100;
    else if (this.workflowProgress.currentStage === 'postprocessing') totalProgress += stages.postprocessing.weight * 50;
    
    return Math.round(Math.min(totalProgress, 99)); // Never show 100% until truly complete
  }

  updateProgressText(text) {
    const loadingText = this.results.querySelector("#loading-text");
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  resetWorkflowProgress(isImg2Img = false) {
    this.workflowProgress = {
      isImg2Img: isImg2Img,
      currentStage: 'idle',
      executedNodes: new Set(),
      totalExpectedNodes: 0,
      stages: {
        'preprocessing': { weight: 0.3, completed: false },
        'sampling': { weight: 0.6, completed: false },
        'postprocessing': { weight: 0.1, completed: false }
      }
    };
    console.log(`🔄 Workflow progress reset for ${isImg2Img ? 'img2img' : 'text2img'} mode`);
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

  setUploadedImageDimensions(dimensions) {
    this.uploadedImageDimensions = dimensions;
    console.log("📐 Stored uploaded image dimensions:", dimensions);
  }
}