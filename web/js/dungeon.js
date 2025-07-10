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

  toggleStili.addEventListener("click", (e) => {
    e.preventDefault();
    const isHidden = bloccoAltriStili.style.display === "none";
    console.log("isHidden " + isHidden);
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

      // Rimuove "active" da tutti gli swiper-slide
      document
        .querySelectorAll(".stile-block")
        .forEach((s) => s.classList.remove("active"));

      // Se non era già attivo, attivalo
      if (!isActive) {
        stileBlock.classList.add("active");
        const stile = btn.dataset.stile;
        console.log(`Stile selezionato: ${stile}`); // ✅ CORRETTO: Sostituito alert con console.log
        // inserire codice per lo stile dell'immagine
      }
    });
  });

  /* FINE CAROSELLO STILI  */

  /* -------------------------- */
  /* Variabili dei settaggi */
  let selectedFormat = null;

  // Slider dinamico
  const qualitySlider = document.getElementById("filter-quality");
  const definitionSlider = document.getElementById("filter-definition");
  const qualityVal = document.getElementById("quality-value");
  const definitionVal = document.getElementById("definition-value");

  if (qualitySlider && qualityVal) { // ✅ CORRETTO: Controllo sicurezza
    qualitySlider.addEventListener("input", () => {
      qualityVal.textContent = qualitySlider.value;
    });
  }

  if (definitionSlider && definitionVal) { // ✅ CORRETTO: Controllo sicurezza
    definitionSlider.addEventListener("input", () => {
      definitionVal.textContent = definitionSlider.value;
    });
  }

  // Selezione formato immagine
  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".format-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedFormat = btn.dataset.format;
    });
  });

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
  if (filtersModal && seedInputFilter && seedToggleFilter) { // ✅ CORRETTO: Controllo sicurezza
    filtersModal.addEventListener("shown.bs.modal", () => {
      seedInputFilter.disabled = !seedToggleFilter.checked;
    });
  }

  /* fine settaggi */

  async function loadWorkflow() {
    if (cachedWorkflow) return cachedWorkflow;
    const res = await fetch("/test/js/fastSDXLtext2img.json");
    if (!res.ok) throw new Error(`Workflow fetch failed: ${res.status}`);
    cachedWorkflow = await res.json();
    return cachedWorkflow;
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

  generateBtn.addEventListener("click", async () => {
    try {
      // Mostra la progress bar
      progressbar.style.display = "block";
      // rimuovo lo stile del container img vuoto
      contImage.classList.remove("empty");

      const pos = positiveInput.value.trim();
      const neg = negativeInput.value.trim();
      const seedVal = isRandomInput.checked
        ? SEED()
        : parseInt(seedInput.value) || SEED();
      seedInput.value = seedVal;

      const wf = await loadWorkflow();

      wf["3"]["inputs"]["seed"] = seedVal;
      wf["30"]["inputs"]["text_g"] = pos;
      wf["30"]["inputs"]["text_l"] = pos;
      wf["33"]["inputs"]["text_g"] = neg;
      wf["33"]["inputs"]["text_l"] = neg;

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

          const btnBlock = imageBlock.querySelector(".btn-wrap");
          if (btnBlock) { // ✅ CORRETTO: Controllo sicurezza
            // Pulsante "Salva" esiste già, ora creiamo "Riusa"
            const reuseBtn = document.createElement("button");
            reuseBtn.innerText = "Riusa";
            reuseBtn.className = "reuse-btn";

            // Listener: riusa prompt e seed
            reuseBtn.addEventListener("click", () => {
              // aggiungere codice
              console.log("click su pulsante RIUSA");
            });

            btnBlock.appendChild(reuseBtn);
          }

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

        // ✅ CORRETTO: Incrementa counter e mostra toast solo dopo la prima generazione
        generationCount++;
        if (generationCount > 1) {
          showToast();
        }

        const loadingText = results.querySelector("#loading-text");
        if (loadingText) loadingText.remove();

        for (let img of msg.data.output.images) {
          const url = `/output/${img.subfolder}/${
            img.filename
          }?rand=${Math.random()}`;

          const container = document.createElement("div");
          container.className = "image-block";

          const image = document.createElement("img");
          image.src = url;
          image.alt = "Generated image";
          //image.width = 256;

          const btnWrap = document.createElement("div");
          btnWrap.className = "btn-wrap";

          const downloadBtn = document.createElement("a");
          downloadBtn.href = url;
          downloadBtn.download = img.filename;
          downloadBtn.innerText = "Salva";
          downloadBtn.className = "download-btn";

          btnWrap.appendChild(downloadBtn);
          container.appendChild(image);
          container.appendChild(btnWrap);
          results.appendChild(container);
        }
        progressbar.style.display = "none";
      }
    });

    ws.addEventListener("error", (err) => {
      console.warn("❌ WebSocket connection failed:", err);
    });
  } catch (err) {
    console.warn("❌ Could not set up WebSocket:", err);
  }
})(window, document);