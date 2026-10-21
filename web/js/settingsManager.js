// Generation Settings Module (seed, format, quality, guidance) - backs the settings modal
import { DOMUtils } from './utils.js';

export class SettingsManager {
  constructor() {
    this.selectedFormat = "square";
    this.qualitySlider = document.getElementById("quality-slider");
    this.guidanceSlider = document.getElementById("guidance-slider");
    this.qualityVal = document.getElementById("quality-value");
    this.guidanceVal = document.getElementById("guidance-value");
    this.customSeedToggle = document.getElementById("custom-seed-toggle");
    this.customSeedInput = document.getElementById("custom-seed-value");
    this.settingsModal = document.getElementById("settings-modal");

    this.initialize();
  }

  initialize() {
    this.setupSliders();
    this.setupFormatButtons();
    this.setupSeedToggle();
    this.setupModalButtons();
    this.updateFormatButtons("square");
  }

  setupSliders() {
    if (this.qualitySlider && this.qualityVal) {
      this.qualitySlider.addEventListener("input", () => {
        this.qualityVal.textContent = this.qualitySlider.value;
      });
    }

    if (this.guidanceSlider && this.guidanceVal) {
      this.guidanceSlider.addEventListener("input", () => {
        this.guidanceVal.textContent = this.guidanceSlider.value;
      });
    }
  }

  setupFormatButtons() {
    document.querySelectorAll(".format-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.selectedFormat = btn.dataset.format;
        this.updateFormatButtons(this.selectedFormat);
      });
    });
  }

  updateFormatButtons(activeFormat) {
    document.querySelectorAll(".format-btn").forEach((btn) => {
      if (btn.dataset.format === activeFormat) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  setupSeedToggle() {
    if (this.customSeedToggle && this.customSeedInput) {
      this.customSeedToggle.addEventListener("change", () => {
        this.customSeedInput.disabled = !this.customSeedToggle.checked;
        
        if (this.customSeedToggle.checked && this.customSeedInput.value === "") {
          this.customSeedInput.value = DOMUtils.generateSeed();
        }
      });
    }

    if (this.settingsModal && this.customSeedInput && this.customSeedToggle) {
      this.customSeedInput.disabled = !this.customSeedToggle.checked;

      this.settingsModal.addEventListener("shown.bs.modal", () => {
        this.customSeedInput.disabled = !this.customSeedToggle.checked;

        if (this.customSeedInput.value === "") {
          this.customSeedInput.value = DOMUtils.generateSeed();
        }
      });
    }
  }

  setupModalButtons() {
    const resetSettingsBtn = document.getElementById("reset-settings");
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener("click", () => {
        this.resetSettings();
      });
    }

    const applySettingsBtn = document.getElementById("apply-settings");
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener("click", () => {
        this.confirmSettings();
      });
    }
  }

  resetSettings() {
    if (this.customSeedToggle) this.customSeedToggle.checked = false;
    if (this.customSeedInput) this.customSeedInput.value = "";
    if (this.qualitySlider) this.qualitySlider.value = 15;
    if (this.guidanceSlider) this.guidanceSlider.value = 75;
    if (this.qualityVal) this.qualityVal.textContent = "15";
    if (this.guidanceVal) this.guidanceVal.textContent = "75";

    this.selectedFormat = "square";
    this.updateFormatButtons("square");
  }

  confirmSettings() {
    const useSeed = this.customSeedToggle ? this.customSeedToggle.checked : false;
    const seedVal = this.customSeedInput ? parseInt(this.customSeedInput.value) || null : null;
    const quality = this.qualitySlider ? parseInt(this.qualitySlider.value) : 15;
    const guidance = this.guidanceSlider ? parseInt(this.guidanceSlider.value) : 75;

    console.log("✅ Settings applied:");
    console.log({ useSeed, seedVal, selectedFormat: this.selectedFormat, quality, guidance });

    return {
      useSeed,
      seedVal,
      selectedFormat: this.selectedFormat,
      quality,
      guidance
    };
  }

  getSettings() {
    return {
      useCustomSeed: this.customSeedToggle?.checked || false,
      customSeed: this.customSeedInput?.value || null,
      quality: this.qualitySlider ? parseInt(this.qualitySlider.value) : 15,
      guidance: this.guidanceSlider ? parseInt(this.guidanceSlider.value) : 75,
      format: this.selectedFormat
    };
  }

  getDimensions() {
    switch (this.selectedFormat) {
      case "vertical":
        return { width: 1024, height: 1820 };
      case "horizontal":
        return { width: 1820, height: 1024 };
      case "square":
      default:
        return { width: 1024, height: 1024 };
    }
  }

  // Toggle seed input based on toggle state
  toggleSeedInput() {
    if (this.customSeedToggle && this.customSeedInput) {
      this.customSeedInput.disabled = !this.customSeedToggle.checked;
      
      if (this.customSeedToggle.checked && this.customSeedInput.value === "") {
        this.customSeedInput.value = DOMUtils.generateSeed();
      }
    }
  }

  // Apply settings back to the UI
  applySettings(settings) {
    if (settings.useCustomSeed !== undefined && this.customSeedToggle) {
      this.customSeedToggle.checked = settings.useCustomSeed;
      this.toggleSeedInput();
    }
    
    if (settings.customSeed !== undefined && this.customSeedInput) {
      this.customSeedInput.value = settings.customSeed || '';
    }
    
    if (settings.quality !== undefined && this.qualitySlider && this.qualityVal) {
      this.qualitySlider.value = settings.quality;
      this.qualityVal.textContent = settings.quality;
    }
    
    if (settings.guidance !== undefined && this.guidanceSlider && this.guidanceVal) {
      this.guidanceSlider.value = settings.guidance;
      this.guidanceVal.textContent = settings.guidance;
    }
    
    if (settings.format !== undefined) {
      this.selectedFormat = settings.format;
      this.updateFormatButtons(settings.format);
    }
  }
}