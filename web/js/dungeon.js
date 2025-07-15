(async (window, d) => {
  const $ = (sel) => d.querySelector(sel);

  const contImage = $("#created-img-container");
  const positiveInput = $("#positive");
  const negativeInput = $("#negative");
  const seedInput = $("#seed");
  const isRandomInput = $("#randomSeed");
  const generateBtn = $("#generate");
  const results = $("#results");
  const progressbar = $("#main-progress");
  const gallery = $("#gallery-images");
  const bloccoAltriStili = $("#more-styles");
  const toggleStili = $("#toggle-styles");

  const client_id = crypto.randomUUID();
  const sessionFolder = `gradio/session_${client_id.slice(0, 8)}`;

  const SEED = () => Math.floor(Math.random() * 9999999999);
  const updateProgress = (max = 0, val = 0) => {
    progressbar.max = max;
    progressbar.value = val;
  };

  let cachedWorkflow = null;
  let promptQueue = [];
  let generationCount = 0; // ✅ CORRETTO: Inizializzata la variabile

  function showToast() {
    const toast = document.getElementById("toast");

    if (!toast) return; // ✅ CORRETTO: Controllo sicurezza

    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 300); // Rimuove dopo la transizione
    }, 3000); // Visibile per 3 secondi
  }

  /* STILI */
  // Mappa degli stili con i relativi prompt e nomi
  const stylePrompts = {
    style1: {
      prompt:
        "digital art, highly detailed, vibrant colors, 4k, trending on artstation",
      name: "Digital Art",
    },
    style2: {
      prompt:
        "oil painting, impasto brushstrokes, rich textures, classical art style",
      name: "Oil Painting",
    },
    style3: {
      prompt:
        "anime style, cel-shaded, vibrant colors, sharp lines, studio ghibli inspired",
      name: "Anime Style",
    },
    style4: {
      prompt: "pencil sketch, hatching, detailed linework, monochrome",
      name: "Pencil Sketch",
    },
    style5: {
      prompt:
        "watercolor painting, soft edges, pastel colors, dreamy atmosphere",
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

  // Function to update style names in the UI
  function updateStyleNames() {
    Object.entries(stylePrompts).forEach(([styleId, styleData]) => {
      const styleElement = document.querySelector(
        `.style-btn[data-stile="${styleId}"] .nome-stile`
      );
      if (styleElement) {
        styleElement.textContent = styleData.name;
      }
    });
  }

  // Initialize style names when the page loads
  document.addEventListener("DOMContentLoaded", updateStyleNames);

  toggleStili.addEventListener("click", (e) => {
    e.preventDefault();
    const isHidden = bloccoAltriStili.style.display === "none";
    if (isHidden) {
      toggleStili.innerText = "Riduci stili";
      bloccoAltriStili.style.display = "grid";
    } else {
      toggleStili.innerText = "Scopri altri stili";
      bloccoAltriStili.style.display = "none";
    }
  });

  // Keep track of selected styles
  const selectedStyles = new Set();

  document.querySelectorAll(".style-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stileBlock = btn.closest(".stile-block");
      const isActive = stileBlock.classList.contains("active");
      const styleId = btn.dataset.stile;
      const styleData = stylePrompts[styleId];

      if (!styleData) return; // Skip if style not found

      // Toggle the active class
      stileBlock.classList.toggle("active");

      // Update the selected styles set
      if (!isActive) {
        selectedStyles.add(styleId);
        console.log(`Stile selezionato: ${styleData.name}`);
      } else {
        selectedStyles.delete(styleId);
        console.log(`Stile rimosso: ${styleData.name}`);
      }

      // Get the current prompt without any style content
      let currentPrompt = positiveInput.value;

      // Remove all style prompts that are not in the selected styles
      Object.entries(stylePrompts).forEach(([id, data]) => {
        if (currentPrompt.includes(data.prompt)) {
          // Remove the prompt and any surrounding commas and spaces
          const regex = new RegExp(
            `\\s*,\\s*${data.prompt.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}|${data.prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`,
            "g"
          );
          currentPrompt = currentPrompt.replace(regex, "").trim();
        }
      });

      // Add back all selected styles
      let newPrompt = currentPrompt;
      selectedStyles.forEach((id) => {
        const style = stylePrompts[id];
        if (style && style.prompt) {
          newPrompt = newPrompt
            ? `${newPrompt}, ${style.prompt}`
            : style.prompt;
        }
      });

      // Update the input field
      positiveInput.value = newPrompt;
    });
  });

  /* FINE CAROSELLO STILI  */

  /* -------------------------- */
  /* Variabili dei settaggi */
  //
  const qualitySlider = document.getElementById("filter-quality");
  const definitionSlider = document.getElementById("filter-definition");
  const qualityVal = document.getElementById("quality-value");
  const definitionVal = document.getElementById("definition-value");

  // Funzione per mappare un valore da un range a un altro
  function mapRange(value, inMin, inMax, outMin, outMax) {
    // Assicurati che il valore sia nei limiti del range di input
    const clampedValue = Math.max(inMin, Math.min(inMax, value));
    // Calcola la proporzione (0-1)
    const normalized = (clampedValue - inMin) / (inMax - inMin);
    // Applica la proporzione al range di output
    return outMin + (outMax - outMin) * normalized;
  }

  if (qualitySlider && qualityVal) {
    qualitySlider.addEventListener("input", () => {
      qualityVal.textContent = qualitySlider.value;
    });
  }

  if (definitionSlider && definitionVal) {
    definitionSlider.addEventListener("input", () => {
      definitionVal.textContent = definitionSlider.value;
    });
  }

  // Selezione formato immagine
  let selectedFormat = "square"; // Default to square format

  function updateFormatButtons(activeFormat) {
    document.querySelectorAll(".format-btn").forEach((btn) => {
      if (btn.dataset.format === activeFormat) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Initialize format buttons
  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      selectedFormat = btn.dataset.format;
      updateFormatButtons(selectedFormat);
    });
  });

  // Set default format to square on page load
  updateFormatButtons("square");

  // Reset filtri
  const resetFiltersBtn = document.getElementById("reset-filters");
  if (resetFiltersBtn) {
    // ✅ CORRETTO: Controllo sicurezza
    resetFiltersBtn.addEventListener("click", () => {
      const seedToggle = document.getElementById("filter-seed-toggle");
      const seedValue = document.getElementById("filter-seed-value");

      if (seedToggle) seedToggle.checked = false;
      if (seedValue) seedValue.value = "";
      if (qualitySlider) qualitySlider.value = 75;
      if (definitionSlider) definitionSlider.value = 75;
      if (qualityVal) qualityVal.textContent = "75";
      if (definitionVal) definitionVal.textContent = "75";

      selectedFormat = null;
      document
        .querySelectorAll(".format-btn")
        .forEach((b) => b.classList.remove("active"));
    });
  }

  // Applica filtri
  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    // ✅ CORRETTO: Controllo sicurezza
    applyFiltersBtn.addEventListener("click", () => {
      const seedToggle = document.getElementById("filter-seed-toggle");
      const seedValue = document.getElementById("filter-seed-value");

      const useSeed = seedToggle ? seedToggle.checked : false;
      const seedVal = seedValue ? parseInt(seedValue.value) || null : null;
      const quality = qualitySlider ? parseInt(qualitySlider.value) : 75;
      const definition = definitionSlider
        ? parseInt(definitionSlider.value)
        : 75;

      console.log("✅ FILTRI APPLICATI:");
      console.log({ useSeed, seedVal, selectedFormat, quality, definition });

      // TODO: Usa questi dati per aggiornare il tuo prompt/generazione immagine
    });
  }

  const seedToggleFilter = document.getElementById("filter-seed-toggle");
  const seedInputFilter = document.getElementById("filter-seed-value");

  // Abilita/disabilita input seed in base allo switch
  if (seedToggleFilter && seedInputFilter) {
    // ✅ CORRETTO: Controllo sicurezza
    seedToggleFilter.addEventListener("change", () => {
      seedInputFilter.disabled = !seedToggleFilter.checked;
    });
  }

  // Imposta stato iniziale coerente (se la modale viene aperta più volte)
  const filtersModal = document.getElementById("filtersModal");
  if (filtersModal && seedInputFilter && seedToggleFilter) {
    // Disabilita l'input del seed all'inizio se il checkbox non è selezionato
    seedInputFilter.disabled = !seedToggleFilter.checked;

    // Aggiorna lo stato quando viene mostrata la modale
    filtersModal.addEventListener("shown.bs.modal", () => {
      seedInputFilter.disabled = !seedToggleFilter.checked;

      // Se il seed non è impostato, generane uno casuale
      if (seedInputFilter.value === "") {
        seedInputFilter.value = Math.floor(Math.random() * 9999999999);
      }
    });

    // Aggiorna il seed quando viene modificato il checkbox
    seedToggleFilter.addEventListener("change", () => {
      seedInputFilter.disabled = !seedToggleFilter.checked;

      // Se si attiva il seed personalizzato e non c'è un valore, generane uno casuale
      if (seedToggleFilter.checked && seedInputFilter.value === "") {
        seedInputFilter.value = Math.floor(Math.random() * 9999999999);
      }
    });
  }

  /* fine settaggi */

  async function loadWorkflow() {
    if (cachedWorkflow) {
      // Crea una copia profonda dell'oggetto per evitare modifiche indesiderate
      return JSON.parse(JSON.stringify(cachedWorkflow));
    }
    const res = await fetch("/test/js/fastSDXLtext2img.json");
    if (!res.ok) throw new Error(`Workflow fetch failed: ${res.status}`);
    cachedWorkflow = await res.json();
    // Ritorna una copia dell'oggetto per evitare modifiche indesiderate
    return JSON.parse(JSON.stringify(cachedWorkflow));
  }

  async function queuePrompt(prompt) {
    const payload = { prompt, client_id };
    const response = await fetch("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Unknown error");
    return resData;
  }

  // Hidden negative prompt for content filtering
  const HIDDEN_NEGATIVE_PROMPT =
    "nsfw, nudity, naked, explicit, adult content, violence, gore, disturbing content, low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad anatomy, bad proportions, extra limbs, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly";

  // List of forbidden words that will be removed from prompts
  const FORBIDDEN_WORDS = [
    "nsfw",
    "nudity",
    "naked",
    "explicit",
    "porn",
    "pornography",
    "sex",
    "sexual",
    "violence",
    "gore",
    "blood",
    "bloody",
    "kill",
    "killing",
    "murder",
    "hate",
    "hateful",
    "racist",
    "racism",
    "nazi",
    "terrorist",
    "terrorism",
    "illegal",
    "drug",
    "drugs",
    "cocaine",
    "heroin",
    "meth",
    "crack",
    "weapon",
    "gun",
    "knife",
    "bomb",
    "explosive",
    "copyrighted",
    "trademarked",
    "watermark",
    "signature",
  ];

  // Function to filter out forbidden words from text
  function filterForbiddenWords(text) {
    if (!text) return text;

    // Create a regex pattern that matches any of the forbidden words (case insensitive)
    const forbiddenPattern = new RegExp(
      `\\b(${FORBIDDEN_WORDS.join("|")})\\b`,
      "gi"
    );

    // Replace forbidden words with an empty string and clean up any double spaces
    return text.replace(forbiddenPattern, "").replace(/\s+/g, " ").trim();
  }

  // Function to get the workflow with updated seed and parameters
  async function getWorkflowWithSeed() {
    const workflow = await loadWorkflow();

    // Gestione del seed
    const useCustomSeed =
      document.getElementById("filter-seed-toggle")?.checked;
    const customSeed = document.getElementById("filter-seed-value")?.value;

    if (useCustomSeed && customSeed) {
      workflow["3"].inputs.seed =
        parseInt(customSeed) || Math.floor(Math.random() * 9999999999);
    } else {
      workflow["3"].inputs.seed = Math.floor(Math.random() * 9999999999);
    }

    // Imposta il numero di steps in base alla qualità (0-100 -> 5-30)
    const qualitySlider = document.getElementById("filter-quality");
    if (qualitySlider) {
      const quality = parseInt(qualitySlider.value) || 0;
      // Mappa la qualità da 0-100 a 5-30 passi
      const steps = Math.round(5 + (quality / 100) * 25);
      workflow["3"].inputs.steps = Math.max(5, Math.min(30, steps));
    }

    // Imposta il CFG scale in base alla definizione (0-100 -> 0.5-3)
    const definitionSlider = document.getElementById("filter-definition");
    if (definitionSlider && workflow["3"].inputs.hasOwnProperty("cfg")) {
      const definition = parseInt(definitionSlider.value) || 0;
      // Mappa la definizione da 0-100 a 0.5-3
      const cfgValue = mapRange(definition, 0, 100, 0.5, 3);
      // Arrotonda a 1 decimale e assicurati che sia nel range corretto
      workflow["3"].inputs.cfg = Math.min(
        3,
        Math.max(0.5, parseFloat(cfgValue.toFixed(1)))
      );
      console.log(
        `Setting CFG scale to ${workflow["3"].inputs.cfg} (from ${definition}%)`
      );
    }

    // Imposta le dimensioni in base al formato selezionato
    const format = selectedFormat || "square";
    if (workflow["5"]) {
      switch (format) {
        case "vertical":
          workflow["5"].inputs.width = 1024;
          workflow["5"].inputs.height = 1820;
          break;
        case "horizontal":
          workflow["5"].inputs.width = 1820;
          workflow["5"].inputs.height = 1024;
          break;
        case "square":
        default:
          workflow["5"].inputs.width = 1024;
          workflow["5"].inputs.height = 1024;
      }
      console.log(
        `Setting dimensions to ${workflow["5"].inputs.width}x${workflow["5"].inputs.height} (${format})`
      );
    }

    return workflow;
  }

  // Function to create image element with actions
  function createImageElement(src, isMainImage = false) {
    const container = document.createElement("div");
    container.className = "image-wrapper";

    const img = document.createElement("img");
    img.src = src;
    img.className = "generated-image";
    img.alt = "Generated image";

    const actions = document.createElement("div");
    actions.className = "image-actions";

    // Always add save button
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

    // Only add reuse button for non-main images (gallery)
    if (!isMainImage) {
      const reuseBtn = document.createElement("button");
      reuseBtn.className = "reuse-btn";
      reuseBtn.innerHTML =
        '<span class="material-symbols-outlined">replay</span> Riusa';
      reuseBtn.onclick = () => {
        // Add functionality to reuse the image
        console.log("Reuse image:", src);
      };
      actions.appendChild(reuseBtn);
    }

    container.appendChild(img);
    container.appendChild(actions);

    return container;
  }

  generateBtn.addEventListener("click", async () => {
    try {
      // Remove empty class from container
      contImage.classList.remove("empty");
      // Show progress bar
      progressbar.style.display = "block";
      // rimuovo lo stile del container img vuoto
      contImage.classList.remove("empty");

      // Ottieni il workflow con il seed e i parametri aggiornati
      const wf = await getWorkflowWithSeed();
      const pos = positiveInput.value.trim();
      const neg = negativeInput.value.trim();

      // Filter forbidden words from prompts
      const filteredPos = filterForbiddenWords(pos);
      const filteredNeg = filterForbiddenWords(neg);

      // Update the input fields with filtered text
      if (filteredPos !== pos) {
        positiveInput.value = filteredPos;
      }
      if (filteredNeg !== neg) {
        negativeInput.value = filteredNeg;
      }

      // Update prompts in the workflow
      wf["30"]["inputs"]["text_g"] = filteredPos;
      wf["30"]["inputs"]["text_l"] = filteredPos;

      // Combine user's negative prompt with hidden negative prompt
      const combinedNegativePrompt = filteredNeg
        ? `${filteredNeg}, ${HIDDEN_NEGATIVE_PROMPT}`
        : HIDDEN_NEGATIVE_PROMPT;
      wf["33"]["inputs"]["text_g"] = combinedNegativePrompt;
      wf["33"]["inputs"]["text_l"] = combinedNegativePrompt;

      // Aggiorna il seed nell'input per visualizzazione
      seedInput.value = wf["3"].inputs.seed;

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      wf["28"]["inputs"]["filename_prefix"] = `${sessionFolder}/${timestamp}`;

      const loading = document.createElement("p");
      loading.id = "loading-text";
      loading.textContent = "Processing image...";

      const existingText = results.querySelector("#loading-text");
      if (existingText) existingText.remove();
      results.appendChild(loading);

      updateProgress(1, 0);

      promptQueue.push({ pos, neg });
      await queuePrompt(wf);
    } catch (e) {
      console.error(e);
      alert(`Failed to generate: ${e.message}`);
      progressbar.style.display = "none"; // Nasconde la progress bar se c'è un errore
    }
  });

  isRandomInput.addEventListener("change", () => {
    seedInput.disabled = isRandomInput.checked;
  });

  try {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${wsProtocol}//${window.location.host}/ws?clientId=${client_id}`
    );

    ws.addEventListener("message", async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "progress") {
        updateProgress(msg.data.max, msg.data.value);
      }

      if (msg.type === "executed" && msg.data?.output?.images) {
        // Move previous image to gallery if exists
        const existingImage = results.querySelector(".image-container");
        if (existingImage) {
          console.log("📦 Moving previous image to gallery");
          $("#gallery").style.display = "block";

          const galleryItem = document.createElement("div");
          galleryItem.className = "gallery-item";

          const promptInfo = document.createElement("div");
          promptInfo.className = "prompt-info";

          const prompts = promptQueue.shift() || { pos: "", neg: "" };
          promptInfo.innerHTML = `<p><strong>Positive:</strong> ${prompts.pos}</p><p><strong>Negative:</strong> ${prompts.neg}</p>`;

          galleryItem.appendChild(existingImage);
          galleryItem.appendChild(promptInfo);
          gallery.insertBefore(galleryItem, gallery.firstChild);
        }

        // Show toast after first generation
        generationCount++;
        if (generationCount > 1) {
          showToast();
        }

        // Remove any loading text
        const loadingText = results.querySelector("#loading-text");
        if (loadingText) loadingText.remove();

        // Hide progress bar
        progressbar.style.display = "none";

        // Show new generated images
        results.innerHTML = "";
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-container";

        for (const img of msg.data.output.images) {
          const url = `/output/${img.subfolder}/${
            img.filename
          }?rand=${Math.random()}`;
          const imageElement = createImageElement(url);
          imageContainer.appendChild(imageElement);
        }

        results.appendChild(imageContainer);
      }
    });

    ws.addEventListener("error", (err) => {
      console.warn("❌ WebSocket connection failed:", err);
    });
  } catch (err) {
    console.warn("❌ Could not set up WebSocket:", err);
  }
})(window, document);
