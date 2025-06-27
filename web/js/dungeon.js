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

  async function loadWorkflow() {
    const res = await fetch("/test/js/fastSDXLtext2img.json");
    if (!res.ok) throw new Error(`Workflow fetch failed: ${res.status}`);
    return await res.json();
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

      await queuePrompt(wf);
      results.innerHTML = `<p>🌀 Processing image...</p>`;
      updateProgress(1, 0);
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
        const current = results.innerHTML;

        // Insert previous result into gallery (if it exists)
        if (current && current.includes("image-block")) {
          console.log("📦 Moving previous image to gallery");
          gallery.insertAdjacentHTML(
            "afterbegin",
            `<div class="gallery-item">${current}</div>`
          );
          $("#gallery").style.display = "block";
        }

        // Clear and show new image
        results.innerHTML = "";

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
