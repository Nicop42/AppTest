// Settings and Filters Management Module
import { DOMUtils } from './utils.js';

export class SettingsManager {
  constructor() {
    this.selectedFormat = "square";
    this.qualitySlider = document.getElementById("filter-quality");
    this.definitionSlider = document.getElementById("filter-definition");
    this.qualityVal = document.getElementById("quality-value");
    this.definitionVal = document.getElementById("definition-value");
    this.seedToggleFilter = document.getElementById("filter-seed-toggle");
    this.seedInputFilter = document.getElementById("filter-seed-value");
    this.filtersModal = document.getElementById("filtersModal");

    this.initialize();
  }

  initialize() {
    this.setupSliders();
    this.setupFormatButtons();
    this.setupSeedToggle();
    this.setupFilterButtons();
    this.updateFormatButtons("square");
  }

  setupSliders() {
    if (this.qualitySlider && this.qualityVal) {
      this.qualitySlider.addEventListener("input", () => {
        this.qualityVal.textContent = this.qualitySlider.value;
      });
    }

    if (this.definitionSlider && this.definitionVal) {
      this.definitionSlider.addEventListener("input", () => {
        this.definitionVal.textContent = this.definitionSlider.value;
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
    if (this.seedToggleFilter && this.seedInputFilter) {
      this.seedToggleFilter.addEventListener("change", () => {
        this.seedInputFilter.disabled = !this.seedToggleFilter.checked;
        
        if (this.seedToggleFilter.checked && this.seedInputFilter.value === "") {
          this.seedInputFilter.value = DOMUtils.generateSeed();
        }
      });
    }

    if (this.filtersModal && this.seedInputFilter && this.seedToggleFilter) {
      this.seedInputFilter.disabled = !this.seedToggleFilter.checked;

      this.filtersModal.addEventListener("shown.bs.modal", () => {
        this.seedInputFilter.disabled = !this.seedToggleFilter.checked;

        if (this.seedInputFilter.value === "") {
          this.seedInputFilter.value = DOMUtils.generateSeed();
        }
      });
    }
  }

  setupFilterButtons() {
    const resetFiltersBtn = document.getElementById("reset-filters");
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    const applyFiltersBtn = document.getElementById("apply-filters");
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        this.applyFilters();
      });
    }
  }

  resetFilters() {
    if (this.seedToggleFilter) this.seedToggleFilter.checked = false;
    if (this.seedInputFilter) this.seedInputFilter.value = "";
    if (this.qualitySlider) this.qualitySlider.value = 15;
    if (this.definitionSlider) this.definitionSlider.value = 75;
    if (this.qualityVal) this.qualityVal.textContent = "15";
    if (this.definitionVal) this.definitionVal.textContent = "75";

    this.selectedFormat = "square";
    this.updateFormatButtons("square");
  }

  applyFilters() {
    const useSeed = this.seedToggleFilter ? this.seedToggleFilter.checked : false;
    const seedVal = this.seedInputFilter ? parseInt(this.seedInputFilter.value) || null : null;
    const quality = this.qualitySlider ? parseInt(this.qualitySlider.value) : 15;
    const definition = this.definitionSlider ? parseInt(this.definitionSlider.value) : 75;

    console.log("✅ FILTRI APPLICATI:");
    console.log({ useSeed, seedVal, selectedFormat: this.selectedFormat, quality, definition });

    return {
      useSeed,
      seedVal,
      selectedFormat: this.selectedFormat,
      quality,
      definition
    };
  }

  getSettings() {
    return {
      useCustomSeed: this.seedToggleFilter?.checked || false,
      customSeed: this.seedInputFilter?.value || null,
      quality: this.qualitySlider ? parseInt(this.qualitySlider.value) : 15,
      definition: this.definitionSlider ? parseInt(this.definitionSlider.value) : 75,
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
    if (this.seedToggleFilter && this.seedInputFilter) {
      this.seedInputFilter.disabled = !this.seedToggleFilter.checked;
      
      if (this.seedToggleFilter.checked && this.seedInputFilter.value === "") {
        this.seedInputFilter.value = DOMUtils.generateSeed();
      }
    }
  }

  // Apply settings back to the UI
  applySettings(settings) {
    if (settings.useCustomSeed !== undefined && this.seedToggleFilter) {
      this.seedToggleFilter.checked = settings.useCustomSeed;
      this.toggleSeedInput();
    }
    
    if (settings.customSeed !== undefined && this.seedInputFilter) {
      this.seedInputFilter.value = settings.customSeed || '';
    }
    
    if (settings.quality !== undefined && this.qualitySlider && this.qualityVal) {
      this.qualitySlider.value = settings.quality;
      this.qualityVal.textContent = settings.quality;
    }
    
    if (settings.definition !== undefined && this.definitionSlider && this.definitionVal) {
      this.definitionSlider.value = settings.definition;
      this.definitionVal.textContent = settings.definition;
    }
    
    if (settings.format !== undefined) {
      this.selectedFormat = settings.format;
      this.updateFormatButtons(settings.format);
    }
  }
}