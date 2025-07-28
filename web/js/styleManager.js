// Style Management Module
import { DOMUtils } from './utils.js';

export class StyleManager {
  constructor() {
    this.stylePrompts = {
      style1: {
        prompt: "digital art, highly detailed, vibrant colors, 4k, trending on artstation",
        name: "Digital Art",
      },
      style2: {
        prompt: "oil painting, impasto brushstrokes, rich textures, classical art style",
        name: "Oil Painting",
      },
      style3: {
        prompt: "anime style, cel-shaded, vibrant colors, sharp lines, studio ghibli inspired",
        name: "Anime Style",
      },
      style4: {
        prompt: "pencil sketch, hatching, detailed linework, monochrome",
        name: "Pencil Sketch",
      },
      style5: {
        prompt: "watercolor painting, soft edges, pastel colors, dreamy atmosphere",
        name: "Watercolor",
      },
      style6: {
        prompt: "cyberpunk, neon lights, futuristic, rain-soaked streets, 4k",
        name: "Cyberpunk",
      },
      style7: {
        prompt: "low poly, geometric shapes, minimalist, vibrant colors",
        name: "Low Poly",
      },
      style8: {
        prompt: "steampunk, brass and copper, gears, vintage aesthetic",
        name: "Steampunk",
      },
      style9: {
        prompt: "pixel art, 8-bit, retro gaming style, vibrant colors",
        name: "Pixel Art",
      },
      style10: {
        prompt: "surrealism, dreamlike, impossible architecture, vibrant colors",
        name: "Surrealism",
      },
      style11: {
        prompt: "chalk drawing, on blackboard, dust and chalk particles",
        name: "Chalk Drawing",
      },
      style12: {
        prompt: "claymation, stop motion, soft lighting, tactile textures",
        name: "Claymation",
      },
    };

    this.selectedStyles = new Set();
    this.positiveInput = DOMUtils.$("#positive");
    this.bloccoAltriStili = DOMUtils.$("#more-styles");
    this.toggleStili = DOMUtils.$("#toggle-styles");

    this.initialize();
  }

  initialize() {
    this.updateStyleNames();
    this.setupEventListeners();
  }

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
    const styleData = this.stylePrompts[styleId];

    if (!styleData) return;

    stileBlock.classList.toggle("active");

    if (!isActive) {
      this.selectedStyles.add(styleId);
      console.log(`Stile selezionato: ${styleData.name}`);
    } else {
      this.selectedStyles.delete(styleId);
      console.log(`Stile rimosso: ${styleData.name}`);
    }

    this.updatePromptWithStyles();
  }

  updatePromptWithStyles() {
    let currentPrompt = this.positiveInput.value;

    // Remove all style prompts from current text
    Object.entries(this.stylePrompts).forEach(([id, data]) => {
      if (currentPrompt.includes(data.prompt)) {
        const regex = new RegExp(
          `\\s*,\\s*${data.prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${data.prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`,
          "g"
        );
        currentPrompt = currentPrompt.replace(regex, "").trim();
      }
    });

    // Add back selected styles
    let newPrompt = currentPrompt;
    this.selectedStyles.forEach((id) => {
      const style = this.stylePrompts[id];
      if (style && style.prompt) {
        newPrompt = newPrompt ? `${newPrompt}, ${style.prompt}` : style.prompt;
      }
    });

    this.positiveInput.value = newPrompt;
  }

  getSelectedStylesPrompt() {
    const selectedPrompts = [];
    this.selectedStyles.forEach((id) => {
      const style = this.stylePrompts[id];
      if (style && style.prompt) {
        selectedPrompts.push(style.prompt);
      }
    });
    return selectedPrompts.join(", ");
  }
}