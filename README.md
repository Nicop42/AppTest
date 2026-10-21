# Prompting Heritage

Prompting Heritage is a web application built for a museum setting. It tells the story of Italian silent cinema, in particular *Cabiria* (1914) and its Orientalist imagery, and lets visitors **create images with artificial intelligence** (Stable Diffusion XL). A visitor can start from a text description or from a photo: one taken on the spot, one chosen from the phone's gallery, or one from the museum archive.

The application **has no standalone backend**. It is a **[ComfyUI](https://github.com/comfyanonymous/ComfyUI) extension** (a folder inside `ComfyUI/custom_nodes/`): ComfyUI loads it at startup, serves its web pages and runs its generation workflows.

---

## 1. Architecture at a glance

```
 Visitor's browser (smartphone)                          ComfyUI server (GPU)
 ┌──────────────────────────────────┐                   ┌─────────────────────────────────────┐
 │ landing.html / editorial pages   │ ── GET pages ───▶ │ __init__.py (this extension)         │
 │ generator.html + js/*.js         │                   │  • serves web/ at /prompting-heritage│
 │                                  │ ─ POST /upload/image ─▶  • saves the photo to ComfyUI/input│
 │  1. load workflow JSON           │                   │                                     │
 │  2. customize it (prompt,        │ ─ POST /prompt ──▶│ ComfyUI: queues and runs            │
 │     seed, format, image)         │                   │ the SDXL workflow                   │
 │  3. listen for progress          │ ◀── WebSocket /ws ─│ progress / executing / executed     │
 │                                  │                   │ events                              │
 │  4. show the result              │ ── GET /output/… ─▶│ image saved in ComfyUI/output       │
 └──────────────────────────────────┘                   └─────────────────────────────────────┘
```

The application's logic lives in the **front end**: the browser loads a ComfyUI workflow in JSON format (a graph of nodes), writes the prompt, seed, dimensions and source image into the right nodes, and sends it to ComfyUI. The Python server mostly serves static files.

---

## 2. Project structure

```
AppTest-master/                    ← extension folder inside ComfyUI/custom_nodes/
├── __init__.py                    ← ComfyUI extension: HTTP routes and static files
├── README.md
├── legacy/                        ← code no longer used, kept for reference (not served)
│   ├── standaloneApp.js           ←   old monolithic front end (formerly dungeon.js)
│   ├── debugArchiveCarousel.js    ←   browser-console debug script (formerly force_update_test.js)
│   ├── node_mappings_stub.py      ←   empty stub duplicating __init__.py (formerly dungeon.py)
│   └── empty.css                  ←   empty stylesheet (formerly page.css)
└── web/
    ├── landing.html               ← home page (logo, two editorial paths, "Crea la tua immagine")
    ├── distant-worlds-in-cabiria.html  ← "I mondi lontani in Cabiria": text on Orientalism and Cabiria
    ├── distant-worlds-today.html  ← "I mondi lontani oggi": placeholder page
    ├── generator.html             ← the image generator (core of the app)
    ├── css/main.css               ← styles shared by all pages
    ├── js/                        ← generator ES modules (see §4)
    ├── workflows/                 ← ComfyUI workflows in API format (see §5)
    └── images/
        ├── logo.png
        ├── styles/                ← style preset thumbnails
        ├── archive/               ← Cabiria stills usable as the source image
        └── content/               ← images for the editorial pages
```

---

## 3. Server: `__init__.py`

ComfyUI imports every package in `custom_nodes/` and requires it to expose `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`. Here they are empty dictionaries, because the extension adds no nodes. On import, the module registers routes on ComfyUI's aiohttp server (`server.PromptServer.instance`).

> The file cannot be run on its own (for example with "Run" in VS Code): it depends on the `server` module, which only exists inside ComfyUI.

### Pages and static files

| URL | Content |
|---|---|
| `/prompting-heritage` | redirect to `/prompting-heritage/` |
| `/prompting-heritage/` | `landing.html` |
| `/prompting-heritage/generator.html` | generator |
| `/prompting-heritage/distant-worlds-in-cabiria.html` | editorial page |
| `/prompting-heritage/distant-worlds-today.html` | editorial page |
| `/prompting-heritage/{css,js,images,workflows}/…` | static files from `web/` |
| `/output/…` | the `ComfyUI/output` folder (generated images) |

All pages use **relative paths** (`css/main.css`, `generator.html`…). That is why they work both under ComfyUI and with a plain static server (`npx http-server ./web`, VS Code task *Start Prompting Heritage static preview server*). In that mode only the pages are available, without generation.

**Legacy URLs.** `/test`, `/test/index.html`, `/mondi-cabiria.html` and `/nuovo-cabiria.html` return a permanent redirect (301) to the new addresses, so links and QR codes already handed out keep working.

### API endpoints

| Endpoint | What it does |
|---|---|
| `POST /upload/image` | Receives a multipart file in the `image` field, saves it to `ComfyUI/input` with a UUID prefix and returns `{name, subfolder, type}`. |
| `POST /prompt` | Reads the submitted workflow and writes a `<timestamp>_prompt.txt` file with the positive prompt, negative prompt and seed next to the image. |
| `GET /history?client_id=…` | Lists the images in the client's session folder. |
| CORS middleware | Adds `Access-Control-Allow-*` headers to every response. |

> ⚠️ **Important note on `/prompt`, `/history` and `/upload/image`.** ComfyUI already registers routes with the same method and path, and does so *before* extensions. aiohttp uses the first matching route, so these three handlers are most likely **never executed**: generation works precisely because ComfyUI's built-in `/prompt` responds. This extension's handler would only return `{"status": "accepted"}` without queuing anything. In practice the `_prompt.txt` files are not written. If they are needed, these endpoints should move to their own paths, for example `/prompting-heritage/api/...`.

---

## 4. Generator front end (`web/js/`)

`generator.html` loads Bootstrap 5, Swiper 11 and the `js/app.js` module, which creates and wires together all the other modules.

| Module | Class / export | Responsibility |
|---|---|---|
| `app.js` | `App` | Entry point. Generates a `clientId` (UUID) for the browser session, instantiates the modules, connects the callbacks and starts the archive carousel. Exposes the instance as `window.app`. |
| `comfyUIClient.js` | `ComfyUIClient`, `WORKFLOW_NODES` | HTTP communication with ComfyUI: loads the JSON workflows (cached), applies the settings, filters forbidden words, appends the hidden negative prompt, uploads the image (`/upload/image`) and submits the job (`/prompt`). |
| `comfyUISocket.js` | `ComfyUISocket` | WebSocket `/ws?clientId=…`. Routes `progress`, `executing` and `executed` messages to the `ImageGenerator`. Reconnects after 5 s if the connection drops. |
| `imageGenerator.js` | `ImageGenerator` | Runs a whole generation: chooses text-to-image or image-to-image mode, drives the progress bar, shows the result, moves the previous image to the gallery and provides the "Riusa" (reuse) button. |
| `settingsManager.js` | `SettingsManager` | Handles the **Impostazioni** (settings) modal: custom seed, format (portrait, landscape, square), quality and definition. |
| `styleManager.js` | `StyleManager` | Builds the style thumbnails from `styleConfig.js` and, on selection, adds or removes the style's positive and negative prompts in the text fields. |
| `styleConfig.js` | `STYLE_PRESETS`, `STYLE_LAYOUT` | Configuration of the style presets (image, label, prompts) and their layout (main section or "Scopri altri stili", i.e. more styles). |
| `referenceImageManager.js` | `ReferenceImageManager` | The **Utilizza una tua foto** (use your own photo) modal: camera capture, file from the device or selection from the archive. Validates the file (JPG/PNG, max 50 MB), shows the preview and prepares the image for upload. |
| `archiveConfig.js` | `ARCHIVE_IMAGES`, `getSortedArchiveImages()` | List of archive images (file, caption, order). |
| `archiveCarousel.js` | `initializeArchiveCarousel()`… | Builds the Swiper carousel slides from `archiveConfig.js`. |
| `utils.js` | `DOMUtils`, `generateUUID` | Helpers: selectors, random seed, `mapRange`, creation of the image element with the Salva/Riusa (save/reuse) buttons (with one reload retry after 3 s), toast. |

### 4.1 Generation flow

1. **Composing the prompt.** The visitor writes the *Positive Prompt* (what to include) and, optionally, the *Negative Prompt* (what to exclude). Each selected style appends its own text to both fields, separated by a comma. Deselecting the style removes that text.
2. **Source image (optional).** When the visitor applies a photo or an archive image, `ReferenceImageManager.prepareImageForUpload()` resizes it on a canvas (long side 512 px, multiples of 8, JPEG at 75%) and keeps the original dimensions. From then on **every generation is image-to-image**, until *Reset* is pressed in the modal. Archive images are applied immediately on click, and the modal closes.
3. **Clicking "Genera"** (`ImageGenerator.handleGenerate()`):
   - in image-to-image mode, the image is uploaded with `POST /upload/image` and ComfyUI returns the file name in its `input` folder;
   - the modal settings are read (`SettingsManager.getSettings()` / `getDimensions()`);
   - `ComfyUIClient.getWorkflowWithSettings()` loads `workflows/text-to-image.json` or `workflows/image-to-image.json` and writes the values into the nodes (see §5);
   - `ComfyUIClient.updateWorkflowPrompts()` filters forbidden words, inserts the prompts and sets `filename_prefix = prompting-heritage/session_<first 8 characters of clientId>/<timestamp>`;
   - the full parameters are stored in an internal queue, for the gallery and for "Riusa";
   - the workflow is submitted with `POST /prompt` together with the `client_id`.
4. **Progress.** ComfyUI sends `progress` events (sampler steps) over the WebSocket, which update the bar. In image-to-image mode, `executing` events also advance the percentage, with a different weight per phase: preprocessing 30%, sampling 60%, postprocessing 10%.
5. **Result.** Every `executed` event that contains images displays those images, loaded from `/output/<subfolder>/<filename>`. The *Salva* (save) button appears once the image has loaded, or after a timeout of 15 s in text-to-image and 30 s in image-to-image.
6. **Gallery.** On the next generation, the current image moves to the *Immagini precedenti* (previous images) section together with its mode and prompts, and a toast notification appears. In the gallery each image also has **Riusa**, which restores the prompts, seed (pinned as a custom seed), quality, definition and format in the form, and tries to fetch the source image back from the server.

### 4.2 What the settings mean

| UI control | Default | Actual workflow parameter |
|---|---|---|
| *Usa Seed personalizzato* (custom seed) | off (random seed) | `KSampler.seed` |
| *Formato immagine* (format) | square | text-to-image: `EmptyLatentImage` 1024×1024, 1024×1820 (portrait) or 1820×1024 (landscape). Image-to-image: SDXL conditioning size in the prompt nodes; the actual resolution follows the photo's aspect ratio, with the short side at 1024 px |
| *Qualità immagine* (quality, slider 0–150) | 15 | `KSampler.steps` = 5 + (value/150)·25, i.e. 5–30 steps (default ≈ 8) |
| *Definizione immagine* (definition, slider 0–150) | 75 | `KSampler.cfg` mapped linearly to 0.5–3.0 (default ≈ 1.8). This is the guidance, i.e. how closely the image follows the prompt |

### 4.3 Content filters

- `FORBIDDEN_WORDS` (in `comfyUIClient.js`): words in this list are **removed** from both prompts before submission, and the text field is updated.
- `HIDDEN_NEGATIVE_PROMPT`: a long negative prompt (explicit or violent content, artifacts, bad anatomy, watermarks…) is **always appended** to the user's negative prompt.
- Both filters run **in the browser**: they guard against casual misuse, but not against someone sending requests directly to ComfyUI.

---

## 5. ComfyUI workflows (`web/workflows/`)

The files are exported from ComfyUI in **API format**: an object `{ nodeId: { class_type, inputs } }`. The code edits nodes through the IDs collected in `WORKFLOW_NODES` (`comfyUIClient.js`). **When re-exporting a workflow, the node IDs must stay the same.**

| Constant | ID | Node |
|---|---|---|
| `SAMPLER` | 3 | `KSampler`: seed, steps, cfg |
| `EMPTY_LATENT_IMAGE` | 5 | `EmptyLatentImage`, dimensions (text-to-image only) |
| `SAVE_IMAGE` | 28 | `SaveImage`, `filename_prefix` |
| `POSITIVE_PROMPT` / `NEGATIVE_PROMPT` | 30 / 33 | `CLIPTextEncodeSDXL` |
| `LORA_LOADER` | 63 | `LoraLoader`: the code only accepts `MJ52_v2.0.safetensors` |
| `LOAD_IMAGE` | 65 | `LoadImage` (image-to-image only) |
| `IMAGE_SCALE` | 76 | not present in the current workflows; handled by the code if it exists |
| `IMAGE_RESIZE` | 94 | `Image Resize`, proportional resize (image-to-image only) |

**`text-to-image.json`** (in use). Checkpoint `dreamshaperXL_v21TurboDPMSDE` (SDXL Turbo, few steps), LoRA `MJ52_v2.0` (model 0.6 / clip 0.3), VAE `sdxl_vae`, sampler `dpmpp_2m_sde` with the `exponential` scheduler. After decoding, faces are restored with GFPGAN 1.4 (`FaceRestoreCFWithModel`) before saving.

**`image-to-image.json`** (in use). Same checkpoint, LoRA and VAE. The uploaded image is resized (node 94) and encoded into the latent (`VAEEncode`, denoise 0.95), so the composition changes substantially. A **depth map** (MiDaS) and a **pose** (DWPose) are also extracted from it and applied in sequence through a single SDXL "union/promax" ControlNet (strength 0.7 and 0.65). This way the new image keeps the structure and poses of the original photo. The face-restore node is present but not connected to the save node, so it is not used in this mode.

**`*-cabiria-lora.json`** (not used by the code). Variants with the `MovieMaticCabiria (CabiriaMovieStyle)` LoRA. The image-to-image one uses SDXL base, 40 steps, Marigold depth and a 4x upscaler. They are ready for a proper "Cabiria style" in the future.

**Models required in ComfyUI.** `dreamshaperXL_v21TurboDPMSDE.safetensors`, `sdxl_vae.safetensors`, `MJ52_v2.0.safetensors`, `GFPGANv1.4.pth`, `diffusion_pytorch_model_promax.safetensors` (ControlNet), plus the custom nodes providing `FaceRestoreCFWithModel`, `Image Resize`, `MiDaS-DepthMapPreprocessor` and `DWPreprocessor` (for example *comfyui_controlnet_aux*, *facerestore_cf*, *WAS Node Suite*).

---

## 6. Running the application

1. Place the project folder inside `ComfyUI/custom_nodes/`.
2. Start ComfyUI as usual (in the portable version, `run_nvidia_gpu.bat`).
3. Check in the ComfyUI console that the extension appears among the loaded custom nodes, without "IMPORT FAILED".
4. Open `http://127.0.0.1:8188/prompting-heritage/` in the browser.

To preview only the pages without ComfyUI, run `npx http-server ./web -p 8080` and open `http://localhost:8080/landing.html`.

---

## 7. Customization

- **Add or change a style.** Copy the thumbnail into `web/images/styles/`, add an entry to `STYLE_PRESETS` (`styleConfig.js`) and add its key to `STYLE_LAYOUT.primaryStyles` or `STYLE_LAYOUT.moreStyles`.
- **Add an archive image.** Copy it into `web/images/archive/` and add an entry to `ARCHIVE_IMAGES` (`archiveConfig.js`), with its caption and position (`order`).
- **Change the model or the fixed parameters.** Edit the workflow in ComfyUI, re-export it in API format keeping the node IDs, and replace the file in `web/workflows/`.

---

## 8. Renaming (old → new)

The code has been standardized in English, with names that describe the content. **Visitor-facing text is still in Italian.**

| Area | Before | After |
|---|---|---|
| Pages | `index.html`, `mondi-cabiria.html`, `nuovo-cabiria.html` | `generator.html`, `distant-worlds-in-cabiria.html`, `distant-worlds-today.html` |
| URLs | `/test`, `/test/index.html`, `/mondi-cabiria.html` | `/prompting-heritage/…` (old URLs redirect) |
| CSS | `dungeon.css` | `main.css` |
| JS modules | `apiClient.js` (`APIClient`), `websocketHandler.js` (`WebSocketHandler`), `photoUpload.js` (`PhotoUpload`), `archivioConfig.js`, `archivioManager.js` | `comfyUIClient.js` (`ComfyUIClient`), `comfyUISocket.js` (`ComfyUISocket`), `referenceImageManager.js` (`ReferenceImageManager`), `archiveConfig.js`, `archiveCarousel.js` |
| Config | `STYLE_CONFIG`/`DISPLAY_CONFIG`, keys `style1…style12`; `ARCHIVIO_CONFIG`, keys `archivio1…10` | `STYLE_PRESETS`/`STYLE_LAYOUT`, descriptive keys (`silentFilm`, `orientalist`…); `ARCHIVE_IMAGES` (`wedding`, `molochTemple`…) |
| Workflows | `js/fastSDXLtext2img.json`, `js/fastSDXLimg2img.json`, `js/SDXL*Cabiria.json` | `workflows/text-to-image.json`, `workflows/image-to-image.json`, `workflows/*-cabiria-lora.json` |
| Images | `stile1.png…`, `Archivio1.png…`, `LandingLogo.png`, `MercatoSchiavi.jpg`… | `images/styles/silent-film.png…`, `images/archive/wedding.png…`, `images/logo.png`, `images/content/gerome-slave-market.jpg`… |
| HTML IDs/classes | `#positive`, `#filter`, `#filtersModal`, `#usePhotoModal`, `.stile-block`, `.nome-stile`, `.row-filtro`, `.swiper-archivio`… | `#positive-prompt`, `#open-settings-btn`, `#settings-modal`, `#reference-image-modal`, `.style-card`, `.thumbnail-label`, `.settings-row`, `.archive-swiper`… |
| Setting | `definition` (actually CFG) | `guidance` |
| Output on disk | `ComfyUI/output/gradio/session_xxxxxxxx/` | `ComfyUI/output/prompting-heritage/session_xxxxxxxx/` |

Renaming the image files also fixed a letter-case mismatch (`Archivio1.png` and `Stile4.png` on disk versus `archivio1.png` and `stile4.png` in the code): harmless on Windows, but on Linux it would have prevented those images from loading.

---

## 9. Known issues and notes

1. **Extension endpoints shadowed by ComfyUI** (`/prompt`, `/history`, `/upload/image`): see the note in §3.
2. **Depth-map preview.** In the image-to-image workflow the `PreviewImage` node (79) also emits an `executed` event with images, of type `temp`. The front end treats it as a result and tries to load it from `/output/`, which does not serve the temp folder, so loading fails. The code already avoids moving these images to the gallery; the clean fix is to remove node 79 or to ignore events that do not come from the `SAVE_IMAGE` node.
3. **Phase detection in image-to-image.** `updateNodeExecution()` matches node IDs with `includes()`: for example `'3'` also matches `'30'`, `'33'` and `'63'`. The displayed percentage is therefore approximate.
4. The **"Cabiria"** style currently uses a watercolor prompt (`watercolor, soft washes…`). It is probably a placeholder, pending the Cabiria LoRA from the `*-cabiria-lora.json` workflows.
5. `main.css` refers to `images/image.svg` (the icon for empty frames), which does not exist in the project.
6. `ReferenceImageManager.restoreImageFromServer()` shows a hard-coded path from one specific machine (`C:\Users\StudiumLab\…`) in an error message.
7. The images `images/styles/surrealism.png`, `images/styles/ornate-engraving.png` and `images/content/cabiria-maciste.jpg` are not used.
8. `distant-worlds-today.html` is still a placeholder page.
