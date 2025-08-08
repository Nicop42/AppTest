// Style Management Module
import { DOMUtils } from './utils.js';
import { STYLE_CONFIG, DISPLAY_CONFIG } from './styleConfig.js';

export class StyleManager {
  constructor() {
    console.log("🔍 StyleManager constructor - STYLE_CONFIG:", STYLE_CONFIG);
    console.log("🔍 StyleManager constructor - DISPLAY_CONFIG:", DISPLAY_CONFIG);
    
    // ✨ STYLES ARE NOW CONFIGURED IN styleConfig.js ✨
    // Edit styleConfig.js to manage all your styles in one place!
    this.styleConfig = STYLE_CONFIG;
    this.displayConfig = DISPLAY_CONFIG;

    // Convert to old format for compatibility (will be updated throughout the code)
    this.stylePrompts = {};
    Object.entries(this.styleConfig).forEach(([key, config]) => {
      this.stylePrompts[key] = {
        prompt: config.positivePrompt,
        name: config.name
      };
    });

    console.log("🔍 StyleManager stylePrompts:", this.stylePrompts);

    this.selectedStyles = new Set();
    this.positiveInput = null; // Will be set later when DOM is ready
    this.negativeInput = null; // Will be set later when DOM is ready  
    this.primaryStylesContainer = null; // Will be set later when DOM is ready
    this.moreStylesContainer = null; // Will be set later when DOM is ready
    this.toggleStili = null; // Will be set later when DOM is ready

    this.initialize();
  }

  initialize() {
    // Ensure DOM is ready before updating elements
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupDOMReferences();
        this.generateStyleButtons();
        this.setupEventListeners();
        console.log("✅ StyleManager initialized after DOMContentLoaded - styles generated from styleConfig.js");
      });
    } else {
      // DOM is already ready
      setTimeout(() => {
        this.setupDOMReferences();
        this.generateStyleButtons();
        this.setupEventListeners();
        console.log("✅ StyleManager initialized - styles generated from styleConfig.js");
      }, 100);
    }
  }

  setupDOMReferences() {
    this.positiveInput = DOMUtils.$("#positive");
    this.negativeInput = DOMUtils.$("#negative");
    this.primaryStylesContainer = DOMUtils.$("#primary-styles");
    this.moreStylesContainer = DOMUtils.$("#more-styles");
    this.toggleStili = DOMUtils.$("#toggle-styles");
    console.log("🔍 DOM references set up");
  }

  // ✨ NEW METHOD: Dynamically generates all style buttons from configuration
  generateStyleButtons() {
    console.log("🔄 Generating style buttons from styleConfig.js...");
    
    // Clear existing content
    this.primaryStylesContainer.innerHTML = '';
    this.moreStylesContainer.innerHTML = '';
    
    // Generate primary styles
    this.displayConfig.primaryStyles.forEach(styleId => {
      if (this.styleConfig[styleId]) {
        const styleButton = this.createStyleButton(styleId, this.styleConfig[styleId]);
        this.primaryStylesContainer.appendChild(styleButton);
      }
    });
    
    // Generate more styles
    this.displayConfig.moreStyles.forEach(styleId => {
      if (this.styleConfig[styleId]) {
        const styleButton = this.createStyleButton(styleId, this.styleConfig[styleId]);
        this.moreStylesContainer.appendChild(styleButton);
      }
    });
    
    console.log("✅ Style buttons generation complete");
  }

  // ✨ NEW METHOD: Creates a single style button element
  createStyleButton(styleId, config) {
    const stileBlock = document.createElement('div');
    stileBlock.className = 'stile-block';
    
    stileBlock.innerHTML = `
      <button type="button" data-stile="${styleId}" class="style-btn">
        <img
          src="images/${config.image}"
          alt="${config.name}"
          width="200"
          height="200"
        />
        <span class="nome-stile">${config.name}</span>
      </button>
    `;
    
    return stileBlock;
  }

  // ✨ UPDATED METHOD: Updates both images and names from the config (now regenerates everything)
  updateStyleElements() {
    console.log("🔄 Regenerating all style elements from styleConfig.js...");
    this.generateStyleButtons();
    this.setupStyleEventListeners(); // Re-setup event listeners for new buttons
    console.log("✅ Style elements update complete");
  }

  // Keep old method for compatibility but make it use the new system
  updateStyleNames() {
    this.updateStyleElements();
  }

  setupEventListeners() {
    // Toggle styles visibility
    this.toggleStili.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = this.moreStylesContainer.style.display === "none";
      if (isHidden) {
        this.toggleStili.innerText = "Riduci stili";
        this.moreStylesContainer.style.display = "grid";
      } else {
        this.toggleStili.innerText = "Scopri altri stili";
        this.moreStylesContainer.style.display = "none";
      }
    });

    // Setup style selection event listeners
    this.setupStyleEventListeners();
  }

  // ✨ NEW METHOD: Sets up event listeners for style buttons (can be called after regenerating buttons)
  setupStyleEventListeners() {
    // Remove existing listeners and add new ones
    document.querySelectorAll(".style-btn").forEach((btn) => {
      // Remove existing listener if any
      btn.removeEventListener("click", this.handleStyleSelection);
      // Add new listener
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

  // ✨ NEW METHOD: Update a specific style config and refresh UI
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
      console.log(`✅ Style ${styleId} updated and UI refreshed`);
    }
  }

  // ✨ NEW METHOD: Add a new style dynamically
  addNewStyle(styleId, config) {
    this.styleConfig[styleId] = config;
    this.stylePrompts[styleId] = {
      prompt: config.positivePrompt,
      name: config.name
    };
    
    // Add to display config (you can customize where it goes)
    if (!this.displayConfig.moreStyles.includes(styleId)) {
      this.displayConfig.moreStyles.push(styleId);
    }
    
    // Refresh the UI
    this.updateStyleElements();
    console.log(`✅ New style ${styleId} added and UI refreshed`);
  }

  // ✨ NEW METHOD: Remove a style dynamically
  removeStyle(styleId) {
    if (this.styleConfig[styleId]) {
      delete this.styleConfig[styleId];
      delete this.stylePrompts[styleId];
      
      // Remove from display config
      this.displayConfig.primaryStyles = this.displayConfig.primaryStyles.filter(id => id !== styleId);
      this.displayConfig.moreStyles = this.displayConfig.moreStyles.filter(id => id !== styleId);
      
      // Remove from selected styles if it was selected
      this.selectedStyles.delete(styleId);
      
      // Refresh the UI
      this.updateStyleElements();
      console.log(`✅ Style ${styleId} removed and UI refreshed`);
    }
  }
}