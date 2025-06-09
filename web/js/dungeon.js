(async (window, d) => {
  const $ = (sel) => d.querySelector(sel);

  const positiveInput = $('#positive');
  const negativeInput = $('#negative');
  const seedInput = $('#seed');
  const isRandomInput = $('#randomSeed');
  const generateBtn = $('#generate');
  const results = $('#results');
  const progressbar = $('#main-progress');

  const client_id = crypto.randomUUID();

  const SEED = () => Math.floor(Math.random() * 9999999999);
  const updateProgress = (max = 0, val = 0) => {
    progressbar.max = max;
    progressbar.value = val;
  };

  async function loadWorkflow() {
    const res = await fetch('/test/js/fastSDXLtext2img.json');
    if (!res.ok) throw new Error(`Workflow fetch failed: ${res.status}`);
    return await res.json();
  }

  async function queuePrompt(prompt) {
  const payload = { prompt, client_id };
  const response = fetch('prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

  generateBtn.addEventListener('click', async () => {
    try {
      const pos = positiveInput.value.trim();
      const neg = negativeInput.value.trim();
      const seedVal = isRandomInput.checked ? SEED() : parseInt(seedInput.value) || SEED();
      seedInput.value = seedVal;

      const wf = await loadWorkflow();
      wf['3']['inputs']['seed'] = seedVal;
      wf['30']['inputs']['text_g'] = pos;
      wf['30']['inputs']['text_l'] = pos;
      wf['33']['inputs']['text_g'] = neg;
      wf['33']['inputs']['text_l'] = neg;

      const resp = await queuePrompt(wf);

      results.innerHTML = '';
      if (resp?.data?.output?.images) {
        for (let img of resp.data.output.images) {
          const url = `/view?filename=${img.filename}&type=output&subfolder=${img.subfolder}&rand=${Math.random()}`;
          results.innerHTML += `<img src="${url}" width="256" />`;
        }
      } else {
        alert(resp?.error?.message || 'Unknown error occurred.');
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to generate: ${e.message}`);
    }
  });

  isRandomInput.addEventListener('change', () => {
    seedInput.disabled = isRandomInput.checked;
  });

  const ws = new WebSocket(`ws://${window.location.hostname}:8188/ws?clientId=${client_id}`);
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'progress') updateProgress(msg.data.max, msg.data.value);
  });
})(window, document);

