// Style Management Module
import { DOMUtils } from './utils.js';
import { STYLE_CONFIG } from './styleConfig.js';

export class StyleManager {
  constructor() {
    // ✨ STYLES ARE NOW CONFIGURED IN styleConfig.js ✨
    // Edit styleConfig.js to manage all your styles in one place!
    this.styleConfig = STYLE_CONFIG;

    // Convert to old format for compatibility (will be updated throughout the code)
    this.stylePrompts = {};
    Object.entries(this.styleConfig).forEach(([key, config]) => {
      this.stylePrompts[key] = {
        prompt: config.positivePrompt,
        name: config.name
      };
    });

    this.selectedStyles = new Set();
    this.positiveInput = DOMUtils.$("#positive");
    this.negativeInput = DOMUtils.$("#negative");
    this.bloccoAltriStili = DOMUtils.$("#more-styles");
    this.toggleStili = DOMUtils.$("#toggle-styles");

    this.initialize();
  }

  initialize() {
    this.updateStyleElements();
    this.setupEventListeners();
  }

  // ✨ NEW METHOD: Updates both images and names from the config
  updateStyleElements() {
    Object.entries(this.styleConfig).forEach(([styleId, config]) => {
      // Update style name
      const nameElement = document.querySelector(
        `.style-btn[data-stile="${styleId}"] .nome-stile`
      );
      if (nameElement) {
        nameElement.textContent = config.name;
      }

      // Update style image
      const imageElement = document.querySelector(
        `.style-btn[data-stile="${styleId}"] img`
      );
      if (imageElement) {
        const newSrc = `images/${config.image}`;
        imageElement.src = newSrc;
        imageElement.alt = config.name;
      }
    });
  }

  // Keep old method for compatibility but make it use the new system
  updateStyleNames() {
    Object.entries(this.stylePrompts).forEach(([styleId, styleData]) => {
      const styleElement = document.querySelector(
        `.style-btn[data-stile="${styleId}"] .nome-stile`
      );
      if (styleElement) {
        styleElement.textContent = styleData.name;
      }
    });
  }

  setupEventListeners() {
    // Toggle styles visibility
    this.toggleStili.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = this.bloccoAltriStili.style.display === "none";
      if (isHidden) {
        this.toggleStili.innerText = "Riduci stili";
        this.bloccoAltriStili.style.display = "grid";
      } else {
        this.toggleStili.innerText = "Scopri altri stili";
        this.bloccoAltriStili.style.display = "none";
      }
    });

    // Style selection buttons
    document.querySelectorAll(".style-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.handleStyleSelection(btn));
    });
  }

  handleStyleSelection(btn) {
    const stileBlock = btn.closest(".stile-block");
    const isActive = stileBlock.classList.contains("active");
    const styleId = btn.dataset.stile;
    const styleConfig = this.styleConfig[styleId];

    if (!styleConfig) return;

    stileBlock.classList.toggle("active");

    if (!isActive) {
      this.selectedStyles.add(styleId);
    } else {
      this.selectedStyles.delete(styleId);
    }

    this.updatePromptsWithStyles();
  }

  updatePromptsWithStyles() {
    this.updatePositivePrompt();
    this.updateNegativePrompt();
  }

  updatePositivePrompt() {
    let currentPrompt = this.positiveInput.value;

    // Remove all style prompts from current text
    Object.entries(this.styleConfig).forEach(([id, config]) => {
      if (currentPrompt.includes(config.positivePrompt)) {
        const regex = new RegExp(
          `\\s*,\\s*${config.positivePrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${config.positivePrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`,
          "g"
        );
        currentPrompt = currentPrompt.replace(regex, "").trim();
      }
    });

    // Add back selected styles
    let newPrompt = currentPrompt;
    this.selectedStyles.forEach((id) => {
      const config = this.styleConfig[id];
      if (config && config.positivePrompt) {
        newPrompt = newPrompt ? `${newPrompt}, ${config.positivePrompt}` : config.positivePrompt;
      }
    });

    this.positiveInput.value = newPrompt;
  }

  updateNegativePrompt() {
    let currentNegativePrompt = this.negativeInput.value;

    // Remove all negative style prompts from current text
    Object.entries(this.styleConfig).forEach(([id, config]) => {
      if (config.negativePrompt && currentNegativePrompt.includes(config.negativePrompt)) {
        const regex = new RegExp(
          `\\s*,\\s*${config.negativePrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${config.negativePrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`,
          "g"
        );
        currentNegativePrompt = currentNegativePrompt.replace(regex, "").trim();
      }
    });

    // Add back selected negative prompts
    let newNegativePrompt = currentNegativePrompt;
    this.selectedStyles.forEach((id) => {
      const config = this.styleConfig[id];
      if (config && config.negativePrompt) {
        newNegativePrompt = newNegativePrompt ? `${newNegativePrompt}, ${config.negativePrompt}` : config.negativePrompt;
      }
    });

    this.negativeInput.value = newNegativePrompt;
  }

  getSelectedStylesPrompt() {
    const selectedPrompts = [];
    this.selectedStyles.forEach((id) => {
      const config = this.styleConfig[id];
      if (config && config.positivePrompt) {
        selectedPrompts.push(config.positivePrompt);
      }
    });
    return selectedPrompts.join(", ");
  }

  // ✨ NEW METHOD: Get selected negative prompts
  getSelectedNegativePrompts() {
    const selectedNegativePrompts = [];
    this.selectedStyles.forEach((id) => {
      const config = this.styleConfig[id];
      if (config && config.negativePrompt) {
        selectedNegativePrompts.push(config.negativePrompt);
      }
    });
    return selectedNegativePrompts.join(", ");
  }

  // ✨ NEW METHOD: Get style config for easy editing
  getStyleConfig() {
    return this.styleConfig;
  }

  // ✨ NEW METHOD: Update a specific style config
  updateStyleConfig(styleId, newConfig) {
    if (this.styleConfig[styleId]) {
      this.styleConfig[styleId] = { ...this.styleConfig[styleId], ...newConfig };
      // Update the compatibility object
      this.stylePrompts[styleId] = {
        prompt: this.styleConfig[styleId].positivePrompt,
        name: this.styleConfig[styleId].name
      };
      // Refresh the UI
      this.updateStyleElements();
    }
  }
}