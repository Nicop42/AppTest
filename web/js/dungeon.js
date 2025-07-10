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
  // Mappa degli stili con i relativi prompt
  const stylePrompts = {
    style1: "digital art, highly detailed, vibrant colors, 4k, trending on artstation",
    style2: "oil painting, impasto brushstrokes, rich textures, classical art style",
    style3: "anime style, cel-shaded, vibrant colors, sharp lines, studio ghibli inspired",
    style4: "pencil sketch, hatching, detailed linework, monochrome",
    style5: "watercolor painting, soft edges, pastel colors, dreamy atmosphere",
    style6: "cyberpunk, neon lights, futuristic, rain-soaked streets, 4k",
    style7: "low poly, geometric shapes, minimalist, vibrant colors",
    style8: "steampunk, brass and copper, gears, vintage aesthetic",
    style9: "pixel art, 8-bit, retro gaming style, vibrant colors",
    style10: "surrealism, dreamlike, impossible architecture, vibrant colors",
    style11: "chalk drawing, on blackboard, dust and chalk particles",
    style12: "claymation, stop motion, soft lighting, tactile textures"
  };

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

  document.querySelectorAll(".style-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stileBlock = btn.closest(".stile-block");
      const isActive = stileBlock.classList.contains("active");

      // Rimuove "active" da tutti i blocchi stile
      document
        .querySelectorAll(".stile-block")
        .forEach((s) => s.classList.remove("active"));

      // Se non era già attivo, attivalo e aggiungi lo stile al prompt
      if (!isActive) {
        stileBlock.classList.add("active");
        const styleId = btn.dataset.stile;
        const styleText = stylePrompts[styleId] || "";
        
        // Aggiungi lo stile al prompt positivo
        if (positiveInput.value.trim() === "") {
          positiveInput.value = styleText;
        } else {
          // Se c'è già del testo, aggiungi lo stile dopo una virgola
          positiveInput.value = `${positiveInput.value}, ${styleText}`;
        }
        
        console.log(`Stile selezionato: ${styleId}`);
      } else {
        // Se era già attivo e lo stiamo disattivando, rimuovi il testo dello stile se presente
        const styleId = btn.dataset.stile;
        const styleText = stylePrompts[styleId] || "";
        if (styleText) {
          // Rimuovi il testo dello stile dal prompt
          positiveInput.value = positiveInput.value
            .replace(`, ${styleText}`, '')
            .replace(styleText, '')
            .replace(/^\s*,\s*/, '')  // Rimuove virgole all'inizio
            .replace(/,\s*$/, '')      // Rimuove virgole alla fine
            .replace(/\s{2,}/g, ' ');  // Rimuove spazi multipli
        }
      }
    });
  });

  /* FINE CAROSELLO STILI  */

  /* -------------------------- */
  /* Variabili dei settaggi */
  // Slider dinamico
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
  let selectedFormat = 'square'; // Default to square format
  
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
  updateFormatButtons('square');

  // Reset filtri
  const resetFiltersBtn = document.getElementById("reset-filters");
  if (resetFiltersBtn) { // ✅ CORRETTO: Controllo sicurezza
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
  if (applyFiltersBtn) { // ✅ CORRETTO: Controllo sicurezza
    applyFiltersBtn.addEventListener("click", () => {
      const seedToggle = document.getElementById("filter-seed-toggle");
      const seedValue = document.getElementById("filter-seed-value");

      const useSeed = seedToggle ? seedToggle.checked : false;
      const seedVal = seedValue ? parseInt(seedValue.value) || null : null;
      const quality = qualitySlider ? parseInt(qualitySlider.value) : 75;
      const definition = definitionSlider ? parseInt(definitionSlider.value) : 75;

      console.log("✅ FILTRI APPLICATI:");
      console.log({ useSeed, seedVal, selectedFormat, quality, definition });

      // TODO: Usa questi dati per aggiornare il tuo prompt/generazione immagine
    });
  }

  const seedToggleFilter = document.getElementById("filter-seed-toggle");
  const seedInputFilter = document.getElementById("filter-seed-value");

  // Abilita/disabilita input seed in base allo switch
  if (seedToggleFilter && seedInputFilter) { // ✅ CORRETTO: Controllo sicurezza
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

  // Funzione per ottenere il workflow aggiornato con il seed corretto, i parametri di qualità e le dimensioni
  async function getWorkflowWithSeed() {
    const workflow = await loadWorkflow();
    
    // Gestione del seed
    const useCustomSeed = document.getElementById('filter-seed-toggle')?.checked;
    const customSeed = document.getElementById('filter-seed-value')?.value;
    
    if (useCustomSeed && customSeed) {
      workflow["3"].inputs.seed = parseInt(customSeed) || Math.floor(Math.random() * 9999999999);
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
    if (definitionSlider && workflow["3"].inputs.hasOwnProperty('cfg')) {
      const definition = parseInt(definitionSlider.value) || 0;
      // Mappa la definizione da 0-100 a 0.5-3
      const cfgValue = mapRange(definition, 0, 100, 0.5, 3);
      // Arrotonda a 1 decimale e assicurati che sia nel range corretto
      workflow["3"].inputs.cfg = Math.min(3, Math.max(0.5, parseFloat(cfgValue.toFixed(1))));
      console.log(`Setting CFG scale to ${workflow["3"].inputs.cfg} (from ${definition}%)`);
    }
    
    // Imposta le dimensioni in base al formato selezionato
    const format = selectedFormat || 'square';
    if (workflow["5"]) {
      switch (format) {
        case 'vertical':
          workflow["5"].inputs.width = 1024;
          workflow["5"].inputs.height = 1820;
          break;
        case 'horizontal':
          workflow["5"].inputs.width = 1820;
          workflow["5"].inputs.height = 1024;
          break;
        case 'square':
        default:
          workflow["5"].inputs.width = 1024;
          workflow["5"].inputs.height = 1024;
      }
      console.log(`Setting dimensions to ${workflow["5"].inputs.width}x${workflow["5"].inputs.height} (${format})`);
    }
    
    return workflow;
  }

  generateBtn.addEventListener("click", async () => {
    try {
      // Mostra la progress bar
      progressbar.style.display = "block";
      // rimuovo lo stile del container img vuoto
      contImage.classList.remove("empty");

      // Ottieni il workflow con il seed e i parametri aggiornati
      const wf = await getWorkflowWithSeed();
      const pos = positiveInput.value.trim();
      const neg = negativeInput.value.trim();
      
      // Aggiorna i prompt nel workflow
      wf["30"]["inputs"]["text_g"] = pos;
      wf["30"]["inputs"]["text_l"] = pos;
      wf["33"]["inputs"]["text_g"] = neg;
      wf["33"]["inputs"]["text_l"] = neg;
      
      // Aggiorna il seed nell'input per visualizzazione
      seedInput.value = wf["3"].inputs.seed;

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      wf["28"]["inputs"]["filename_prefix"] = `${sessionFolder}/${timestamp}`;

      const loading = document.createElement("p");
      loading.id = "loading-text";
      loading.textContent = "🌀 Processing image...";

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
        const imageBlock = results.querySelector(".image-block");

        if (imageBlock) {
          console.log("📦 Moving previous image to gallery");
          $("#gallery").style.display = "block";

          const galleryItem = document.createElement("div");
          galleryItem.className = "gallery-item";

          const promptInfo = document.createElement("div");
          promptInfo.className = "prompt-info";

          const prompts = promptQueue.shift() || { pos: "", neg: "" };
          promptInfo.innerHTML = `<p><strong>Positive:</strong> ${prompts.pos}</p><p><strong>Negative:</strong> ${prompts.neg}</p>`;

          galleryItem.appendChild(imageBlock);
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

        // Show new generated image
        for (let img of msg.data.output.images) {
          const url = `/output/${img.subfolder}/${img.filename}?rand=${Math.random()}`;
          
          const container = document.createElement("div");
          container.className = "image-block";
          
          const image = document.createElement("img");
          image.src = url;
          image.alt = "Generated image";
          
          const btnWrap = document.createElement("div");
          btnWrap.className = "btn-wrap";
          
          const downloadBtn = document.createElement("a");
          downloadBtn.href = url;
          downloadBtn.download = img.filename;
          downloadBtn.innerText = "Salva";
          downloadBtn.className = "download-btn";
          
          // Create Riusa button
          const reuseBtn = document.createElement("button");
          reuseBtn.innerText = "Riusa";
          reuseBtn.className = "reuse-btn";
          
          btnWrap.appendChild(downloadBtn);
          btnWrap.appendChild(reuseBtn);
          container.appendChild(image);
          container.appendChild(btnWrap);
          results.appendChild(container);
        }
      }
    });

    ws.addEventListener("error", (err) => {
      console.warn("❌ WebSocket connection failed:", err);
    });
  } catch (err) {
    console.warn("❌ Could not set up WebSocket:", err);
  }
})(window, document);