// DOM Utilities and Helper Functions
export class DOMUtils {
  static $ = (sel) => document.querySelector(sel);
  static $$ = (sel) => document.querySelectorAll(sel);

  static updateProgress(progressbar, max = 0, val = 0) {
    progressbar.max = max;
    progressbar.value = val;
  }

  static generateSeed() {
    return Math.floor(Math.random() * 9999999999);
  }

  static mapRange(value, inMin, inMax, outMin, outMax) {
    const clampedValue = Math.max(inMin, Math.min(inMax, value));
    const normalized = (clampedValue - inMin) / (inMax - inMin);
    return outMin + (outMax - outMin) * normalized;
  }

  static createImageElement(src, isMainImage = false, showActionsImmediately = false) {
    const container = document.createElement("div");
    container.className = "image-wrapper";

    const img = document.createElement("img");
    img.src = src;
    img.className = "generated-image";
    img.alt = "Generated image";
    
    let hasRetried = false;
    
    // Add detailed logging and error handling
    img.onload = () => {
      console.log("✅ Image loaded successfully:", src);
      img.style.display = "block"; // Show image when it loads successfully
      
      // Show actions only if explicitly allowed or this is not the main image
      if (showActionsImmediately || !isMainImage) {
        const actions = container.querySelector(".image-actions");
        if (actions) {
          actions.style.display = "flex";
        }
      }
    };
    
    img.onerror = (error) => {
      console.error("❌ Failed to load image:", {
        src: src,
        error: error,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        hasRetried: hasRetried
      });
      
      // Immediately hide the broken image icon
      img.style.display = "none";
      
      if (!hasRetried) {
        hasRetried = true;
        // Try to reload the image once with a delay
        setTimeout(() => {
          console.log("🔄 Retrying image load:", src);
          const retryUrl = src.includes('?') ? src.replace(/\?.*$/, '') : src;
          img.src = `${retryUrl}?retry=${Date.now()}`;
        }, 3000); // Longer delay for img2img files to be written
      } else {
        console.error("❌ Image failed permanently after retry:", src);
        // Mark as failed by keeping display none and adding retry in src
      }
    };

    // Start with image hidden until it loads successfully
    img.style.display = "none";

    const actions = document.createElement("div");
    actions.className = "image-actions";
    // Initially hide actions for main images until workflow is complete
    if (isMainImage && !showActionsImmediately) {
      actions.style.display = "none";
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "download-btn";
    saveBtn.innerHTML =
      '<span class="material-symbols-outlined">download</span> Salva';
    saveBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = src;
      link.download = `generated-image-${Date.now()}.png`;
      link.click();
    };

    actions.appendChild(saveBtn);

    if (!isMainImage) {
      const reuseBtn = document.createElement("button");
      reuseBtn.className = "reuse-btn";
      reuseBtn.innerHTML =
        '<span class="material-symbols-outlined">replay</span> Riusa';
      reuseBtn.onclick = () => {
        console.log("Reuse image:", src);
      };
      actions.appendChild(reuseBtn);
    }

    container.appendChild(img);
    container.appendChild(actions);

    return container;
  }

  static showImageActions(container) {
    // Show the save/download actions for an image
    const actions = container.querySelector(".image-actions");
    if (actions) {
      actions.style.display = "flex";
      console.log("🎯 Image actions shown - save button is now available");
    }
  }

  static showToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, 6000);
  }
}

export const generateUUID = () => crypto.randomUUID();