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

  static createImageElement(src, isMainImage = false) {
    const container = document.createElement("div");
    container.className = "image-wrapper";

    const img = document.createElement("img");
    img.src = src;
    img.className = "generated-image";
    img.alt = "Generated image";

    const actions = document.createElement("div");
    actions.className = "image-actions";

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