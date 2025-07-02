(async (window, d) => {
  const $ = (sel) => d.querySelector(sel);

  const positiveInput = $("#positive");
  const negativeInput = $("#negative");
  const seedInput = $("#seed");
  const isRandomInput = $("#randomSeed");
  const generateBtn = $("#generate");
  const results = $("#results");
  const progressbar = $("#main-progress");
  const gallery = $("#gallery-images");

  const client_id = crypto.randomUUID();
  const sessionFolder = `gradio/session_${client_id.slice(0, 8)}`;

  const SEED = () => Math.floor(Math.random() * 9999999999);
  const updateProgress = (max = 0, val = 0) => {
    progressbar.max = max;
    progressbar.value = val;
  };

  let cachedWorkflow = null;
  let lastPositive = "";
  let lastNegative = "";

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
      const pos = positiveInput.value.trim();
      const neg = negativeInput.value.trim();
      const seedVal = isRandomInput.checked
        ? SEED()
        : parseInt(seedInput.value) || SEED();
      seedInput.value = seedVal;

      lastPositive = pos;
      lastNegative = neg;

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
      await queuePrompt(wf);
    } catch (e) {
      console.error(e);
      alert(`Failed to generate: ${e.message}`);
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
          promptInfo.innerHTML = `<p><strong>Positive:</strong> ${lastPositive}</p><p><strong>Negative:</strong> ${lastNegative}</p>`;

          galleryItem.appendChild(imageBlock);
          galleryItem.appendChild(promptInfo);
          gallery.insertBefore(galleryItem, gallery.firstChild);
        }

        const loadingText = results.querySelector("#loading-text");
        if (loadingText) loadingText.remove();

        for (let img of msg.data.output.images) {
          const url = `/output/${img.subfolder}/${img.filename}?rand=${Math.random()}`;

          const container = document.createElement("div");
          container.className = "image-block";

          const image = document.createElement("img");
          image.src = url;
          image.alt = "Generated image";
          image.width = 256;

          const downloadBtn = document.createElement("a");
          downloadBtn.href = url;
          downloadBtn.download = img.filename;
          downloadBtn.innerText = "Salva";
          downloadBtn.className = "download-btn";

          container.appendChild(image);
          container.appendChild(downloadBtn);
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
