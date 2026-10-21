# Prompting Heritage

Prompting Heritage è un'applicazione web pensata per un contesto museale. Racconta il cinema muto italiano, e in particolare *Cabiria* (1914) e l'immaginario orientalista, e permette ai visitatori di **creare immagini con l'intelligenza artificiale** (Stable Diffusion XL). Si può partire da una descrizione testuale oppure da una foto: scattata sul momento, scelta dalla galleria del telefono o presa dall'archivio del museo.

L'applicazione **non ha un backend autonomo**. È un'**estensione di [ComfyUI](https://github.com/comfyanonymous/ComfyUI)** (una cartella dentro `ComfyUI/custom_nodes/`): ComfyUI la carica all'avvio, ne serve le pagine web e ne esegue i workflow di generazione.

---

## 1. Architettura in breve

```
 Browser del visitatore (smartphone)                     Server ComfyUI (GPU)
 ┌──────────────────────────────────┐                   ┌─────────────────────────────────────┐
 │ landing.html / pagine editoriali │ ── GET pagine ──▶ │ __init__.py (questa estensione)      │
 │ generator.html + js/*.js         │                   │  • serve web/ su /prompting-heritage │
 │                                  │ ─ POST /upload/image ─▶  • salva la foto in ComfyUI/input │
 │  1. carica workflow JSON         │                   │                                     │
 │  2. lo personalizza (prompt,     │ ─ POST /prompt ──▶│ ComfyUI: mette in coda ed esegue    │
 │     seed, formato, immagine)     │                   │ il workflow SDXL                    │
 │  3. ascolta il progresso         │ ◀── WebSocket /ws ─│ eventi progress / executing /       │
 │                                  │                   │ executed                            │
 │  4. mostra il risultato          │ ── GET /output/… ─▶│ immagine salvata in ComfyUI/output  │
 └──────────────────────────────────┘                   └─────────────────────────────────────┘
```

Il "cervello" dell'applicazione sta nel **front end**: il browser carica un workflow ComfyUI in formato JSON (un grafo di nodi), sostituisce nei nodi giusti prompt, seed, dimensioni e immagine di partenza, e lo invia a ComfyUI. Il server Python serve soprattutto i file statici.

---

## 2. Struttura del progetto

```
AppTest-master/                    ← cartella dell'estensione dentro ComfyUI/custom_nodes/
├── __init__.py                    ← estensione ComfyUI: route HTTP e file statici
├── README.md
├── legacy/                        ← codice non più usato, conservato per riferimento (non servito)
│   ├── standaloneApp.js           ←   vecchia versione monolitica del front end (ex dungeon.js)
│   ├── debugArchiveCarousel.js    ←   script di debug da console (ex force_update_test.js)
│   ├── node_mappings_stub.py      ←   stub vuoto duplicato di __init__.py (ex dungeon.py)
│   └── empty.css                  ←   foglio di stile vuoto (ex page.css)
└── web/
    ├── landing.html               ← pagina iniziale (logo, due percorsi editoriali, "Crea la tua immagine")
    ├── distant-worlds-in-cabiria.html  ← "I mondi lontani in Cabiria": testo su orientalismo e Cabiria
    ├── distant-worlds-today.html  ← "I mondi lontani oggi": pagina segnaposto
    ├── generator.html             ← il generatore di immagini (cuore dell'app)
    ├── css/main.css               ← stili comuni a tutte le pagine
    ├── js/                        ← moduli ES del generatore (vedi §4)
    ├── workflows/                 ← workflow ComfyUI in formato API (vedi §5)
    └── images/
        ├── logo.png
        ├── styles/                ← miniature dei preset di stile
        ├── archive/               ← fotogrammi di Cabiria usabili come immagine di partenza
        └── content/               ← immagini delle pagine editoriali
```

---

## 3. Server: `__init__.py`

ComfyUI importa ogni pacchetto in `custom_nodes/` e richiede che esponga `NODE_CLASS_MAPPINGS` e `NODE_DISPLAY_NAME_MAPPINGS`. Qui sono dizionari vuoti, perché l'estensione non aggiunge nodi. Al momento dell'import, il modulo registra delle route sul server aiohttp di ComfyUI (`server.PromptServer.instance`).

### Pagine e file statici

| URL | Contenuto |
|---|---|
| `/prompting-heritage` | redirect a `/prompting-heritage/` |
| `/prompting-heritage/` | `landing.html` |
| `/prompting-heritage/generator.html` | generatore |
| `/prompting-heritage/distant-worlds-in-cabiria.html` | pagina editoriale |
| `/prompting-heritage/distant-worlds-today.html` | pagina editoriale |
| `/prompting-heritage/{css,js,images,workflows}/…` | file statici da `web/` |
| `/output/…` | cartella `ComfyUI/output` (immagini generate) |

Tutte le pagine usano **percorsi relativi** (`css/main.css`, `generator.html`…). Per questo funzionano sia sotto ComfyUI sia con un semplice server statico (`npx http-server ./web`, task VS Code *Start Prompting Heritage static preview server*). In quella modalità si vedono solo le pagine, senza generazione.

**URL storici.** `/test`, `/test/index.html`, `/mondi-cabiria.html` e `/nuovo-cabiria.html` rispondono con un redirect permanente (301) ai nuovi indirizzi, così link e QR code già distribuiti continuano a funzionare.

### Endpoint API

| Endpoint | Cosa fa |
|---|---|
| `POST /upload/image` | Riceve un file multipart nel campo `image`, lo salva in `ComfyUI/input` con un prefisso UUID e risponde `{name, subfolder, type}`. |
| `POST /prompt` | Legge il workflow inviato e scrive un file `<timestamp>_prompt.txt` con prompt positivo, negativo e seed accanto all'immagine. |
| `GET /history?client_id=…` | Elenca le immagini della cartella di sessione del client. |
| middleware CORS | Aggiunge `Access-Control-Allow-*` a ogni risposta. |

> ⚠️ **Nota importante su `/prompt`, `/history` e `/upload/image`.** ComfyUI registra già route con lo stesso metodo e percorso, e lo fa *prima* delle estensioni. aiohttp usa la prima route che corrisponde, quindi con ogni probabilità questi tre handler **non vengono mai eseguiti**: la generazione funziona proprio perché risponde il `/prompt` nativo di ComfyUI. L'handler di questa estensione si limiterebbe a restituire `{"status": "accepted"}` senza mettere in coda nulla. In pratica i file `_prompt.txt` non vengono scritti. Se servono, conviene spostare questi endpoint su percorsi propri, per esempio `/prompting-heritage/api/...`.

---

## 4. Front end del generatore (`web/js/`)

`generator.html` carica Bootstrap 5, Swiper 11 e il modulo `js/app.js`, che crea e collega tutti gli altri moduli.

| Modulo | Classe / export | Responsabilità |
|---|---|---|
| `app.js` | `App` | Punto d'ingresso. Genera un `clientId` (UUID) per la sessione del browser, istanzia i moduli, collega i callback e avvia il carosello dell'archivio. Espone l'istanza come `window.app`. |
| `comfyUIClient.js` | `ComfyUIClient`, `WORKFLOW_NODES` | Dialogo HTTP con ComfyUI: carica i workflow JSON (con cache), applica le impostazioni, filtra le parole vietate, aggiunge il prompt negativo nascosto, carica l'immagine (`/upload/image`) e invia il job (`/prompt`). |
| `comfyUISocket.js` | `ComfyUISocket` | WebSocket `/ws?clientId=…`. Smista i messaggi `progress`, `executing` ed `executed` all'`ImageGenerator`. Se la connessione cade, si riconnette dopo 5 s. |
| `imageGenerator.js` | `ImageGenerator` | Gestisce l'intera generazione: sceglie la modalità text-to-image o image-to-image, gestisce la barra di avanzamento, mostra il risultato, sposta l'immagine precedente nella galleria e offre il pulsante "Riusa". |
| `settingsManager.js` | `SettingsManager` | Gestisce la modale **Impostazioni**: seed personalizzato, formato (verticale, orizzontale, quadrato), qualità e definizione. |
| `styleManager.js` | `StyleManager` | Genera le miniature degli stili da `styleConfig.js` e, alla selezione, aggiunge o toglie dai campi di testo i prompt positivo e negativo dello stile. |
| `styleConfig.js` | `STYLE_PRESETS`, `STYLE_LAYOUT` | Configurazione dei preset di stile (immagine, etichetta, prompt) e della loro disposizione (sezione principale o "Scopri altri stili"). |
| `referenceImageManager.js` | `ReferenceImageManager` | Modale **Utilizza una tua foto**: scatto con la fotocamera, scelta dal dispositivo o selezione dall'archivio. Valida il file (JPG/PNG, max 50 MB), mostra l'anteprima e prepara l'immagine per l'upload. |
| `archiveConfig.js` | `ARCHIVE_IMAGES`, `getSortedArchiveImages()` | Elenco delle immagini d'archivio (file, didascalia, ordine). |
| `archiveCarousel.js` | `initializeArchiveCarousel()`… | Costruisce le slide del carosello Swiper a partire da `archiveConfig.js`. |
| `utils.js` | `DOMUtils`, `generateUUID` | Funzioni di supporto: selettori, seed casuale, `mapRange`, creazione dell'elemento immagine con i pulsanti Salva/Riusa (con un nuovo tentativo di caricamento dopo 3 s), toast. |

### 4.1 Flusso di una generazione

1. **Composizione del prompt.** Il visitatore scrive il *Positive Prompt* ("cosa vuoi inserire") e, se vuole, il *Negative Prompt* ("cosa vuoi escludere"). Ogni stile selezionato aggiunge in coda ai due campi i propri testi, separati da virgola. Deselezionandolo, quei testi vengono rimossi.
2. **Immagine di partenza (facoltativa).** Se il visitatore applica una foto o un'immagine d'archivio, `ReferenceImageManager.prepareImageForUpload()` la ridimensiona su un canvas (lato lungo 512 px, multipli di 8, JPEG all'75 %) e ricorda le dimensioni originali. Da quel momento **ogni generazione è image-to-image**, finché non si preme *Reset* nella modale. Le immagini d'archivio vengono applicate subito al clic, e la modale si chiude.
3. **Clic su "Genera"** (`ImageGenerator.handleGenerate()`):
   - in modalità image-to-image, l'immagine viene caricata con `POST /upload/image` e ComfyUI restituisce il nome del file nella sua cartella `input`;
   - le impostazioni della modale vengono lette (`SettingsManager.getSettings()` / `getDimensions()`);
   - `ComfyUIClient.getWorkflowWithSettings()` carica `workflows/text-to-image.json` oppure `workflows/image-to-image.json` e scrive i valori nei nodi (vedi §5);
   - `ComfyUIClient.updateWorkflowPrompts()` filtra le parole vietate, inserisce i prompt e imposta `filename_prefix = prompting-heritage/session_<primi 8 caratteri del clientId>/<timestamp>`;
   - i parametri completi vengono salvati in una coda interna, per la galleria e per "Riusa";
   - il workflow viene inviato con `POST /prompt` insieme al `client_id`.
4. **Avanzamento.** ComfyUI invia sul WebSocket gli eventi `progress` (passi del sampler), con cui si aggiorna la barra. In image-to-image anche gli eventi `executing` fanno avanzare la percentuale, con pesi diversi per fase: pre-elaborazione 30 %, campionamento 60 %, post-elaborazione 10 %.
5. **Risultato.** Ogni evento `executed` che contiene immagini mostra le immagini indicate, prese da `/output/<subfolder>/<filename>`. Il pulsante *Salva* compare quando l'immagine si è caricata, oppure dopo un timeout di 15 s in text-to-image e 30 s in image-to-image.
6. **Galleria.** Alla generazione successiva, l'immagine corrente passa nella sezione *Immagini precedenti* insieme a modalità e prompt, e compare un avviso (toast). Nella galleria ogni immagine ha anche **Riusa**, che reimposta nel form prompt, seed (fissato come seed personalizzato), qualità, definizione e formato, e prova a recuperare dal server l'immagine di partenza.

### 4.2 Significato delle impostazioni

| Controllo UI | Valore di default | Parametro reale del workflow |
|---|---|---|
| *Usa Seed personalizzato* | disattivo (seed casuale) | `KSampler.seed` |
| *Formato immagine* | quadrata | text-to-image: `EmptyLatentImage` 1024×1024, 1024×1820 (verticale) o 1820×1024 (orizzontale). Image-to-image: dimensioni di condizionamento SDXL nei nodi prompt; la risoluzione effettiva segue le proporzioni della foto, con il lato corto a 1024 px |
| *Qualità immagine* (slider 0–150) | 15 | `KSampler.steps` = 5 + (valore/150)·25, quindi 5–30 passi (default ≈ 8) |
| *Definizione immagine* (slider 0–150) | 75 | `KSampler.cfg` mappato linearmente su 0,5–3,0 (default ≈ 1,8). È la "guidance", cioè quanto l'immagine aderisce al prompt |

### 4.3 Filtri sui contenuti

- `FORBIDDEN_WORDS` (in `comfyUIClient.js`): le parole presenti in questo elenco vengono **rimosse** dai due prompt prima dell'invio, e il campo di testo viene aggiornato.
- `HIDDEN_NEGATIVE_PROMPT`: un lungo prompt negativo (contenuti espliciti o violenti, artefatti, anatomia errata, filigrane…) viene **sempre aggiunto** al negativo dell'utente.
- Entrambi i filtri girano **nel browser**: proteggono dall'uso ingenuo, ma non da chi invia richieste dirette a ComfyUI.

---

## 5. Workflow ComfyUI (`web/workflows/`)

I file sono esportati da ComfyUI in **formato API**: un oggetto `{ idNodo: { class_type, inputs } }`. Il codice modifica i nodi tramite gli ID raccolti in `WORKFLOW_NODES` (`comfyUIClient.js`). **Se si riesporta un workflow, gli ID dei nodi devono restare gli stessi.**

| Costante | ID | Nodo |
|---|---|---|
| `SAMPLER` | 3 | `KSampler`: seed, steps, cfg |
| `EMPTY_LATENT_IMAGE` | 5 | `EmptyLatentImage`, dimensioni (solo text-to-image) |
| `SAVE_IMAGE` | 28 | `SaveImage`, `filename_prefix` |
| `POSITIVE_PROMPT` / `NEGATIVE_PROMPT` | 30 / 33 | `CLIPTextEncodeSDXL` |
| `LORA_LOADER` | 63 | `LoraLoader`: il codice accetta solo `MJ52_v2.0.safetensors` |
| `LOAD_IMAGE` | 65 | `LoadImage` (solo image-to-image) |
| `IMAGE_SCALE` | 76 | non presente nei workflow attuali; il codice lo gestisce se esiste |
| `IMAGE_RESIZE` | 94 | `Image Resize`, ridimensionamento proporzionale (solo image-to-image) |

**`text-to-image.json`** (usato). Checkpoint `dreamshaperXL_v21TurboDPMSDE` (SDXL Turbo, pochi passi), LoRA `MJ52_v2.0` (model 0,6 / clip 0,3), VAE `sdxl_vae`, sampler `dpmpp_2m_sde` con scheduler `exponential`. Dopo la decodifica, il volto viene restaurato con GFPGAN 1.4 (`FaceRestoreCFWithModel`) prima del salvataggio.

**`image-to-image.json`** (usato). Stesso checkpoint, LoRA e VAE. L'immagine caricata viene ridimensionata (nodo 94) e codificata nel latente (`VAEEncode`, denoise 0,95), quindi la composizione cambia molto. Da essa si ricavano anche una **mappa di profondità** (MiDaS) e una **posa** (DWPose), applicate in cascata con un unico ControlNet SDXL "union/promax" (forza 0,7 e 0,65). In questo modo la nuova immagine conserva struttura e pose della foto originale. Il nodo di face restore è presente ma non collegato al salvataggio, quindi in questa modalità non viene usato.

**`*-cabiria-lora.json`** (non usati dal codice). Varianti con la LoRA `MovieMaticCabiria (CabiriaMovieStyle)`. Quella image-to-image usa SDXL base, 40 passi, profondità Marigold e upscaler 4x. Sono pronte per un eventuale "stile Cabiria" vero e proprio.

**Modelli necessari in ComfyUI.** `dreamshaperXL_v21TurboDPMSDE.safetensors`, `sdxl_vae.safetensors`, `MJ52_v2.0.safetensors`, `GFPGANv1.4.pth`, `diffusion_pytorch_model_promax.safetensors` (ControlNet), più i custom node che forniscono `FaceRestoreCFWithModel`, `Image Resize`, `MiDaS-DepthMapPreprocessor` e `DWPreprocessor` (per esempio *comfyui_controlnet_aux*, *facerestore_cf*, *WAS Node Suite*).

---

## 6. Personalizzazione

- **Aggiungere o modificare uno stile.** Copiare la miniatura in `web/images/styles/`, aggiungere una voce in `STYLE_PRESETS` (`styleConfig.js`) e inserirne la chiave in `STYLE_LAYOUT.primaryStyles` o in `STYLE_LAYOUT.moreStyles`.
- **Aggiungere un'immagine d'archivio.** Copiarla in `web/images/archive/` e aggiungere una voce in `ARCHIVE_IMAGES` (`archiveConfig.js`), indicando la didascalia e la posizione (`order`).
- **Cambiare il modello o i parametri fissi.** Modificare il workflow in ComfyUI, riesportarlo in formato API mantenendo gli ID dei nodi e sostituire il file in `web/workflows/`.

---

## 7. Rinomina effettuata (vecchio → nuovo)

Il codice è stato uniformato in inglese, con nomi che descrivono il contenuto. **I testi visibili ai visitatori sono rimasti in italiano.**

| Ambito | Prima | Dopo |
|---|---|---|
| Pagine | `index.html`, `mondi-cabiria.html`, `nuovo-cabiria.html` | `generator.html`, `distant-worlds-in-cabiria.html`, `distant-worlds-today.html` |
| URL | `/test`, `/test/index.html`, `/mondi-cabiria.html` | `/prompting-heritage/…` (i vecchi URL fanno redirect) |
| CSS | `dungeon.css` | `main.css` |
| Moduli JS | `apiClient.js` (`APIClient`), `websocketHandler.js` (`WebSocketHandler`), `photoUpload.js` (`PhotoUpload`), `archivioConfig.js`, `archivioManager.js` | `comfyUIClient.js` (`ComfyUIClient`), `comfyUISocket.js` (`ComfyUISocket`), `referenceImageManager.js` (`ReferenceImageManager`), `archiveConfig.js`, `archiveCarousel.js` |
| Config | `STYLE_CONFIG`/`DISPLAY_CONFIG`, chiavi `style1…style12`; `ARCHIVIO_CONFIG`, chiavi `archivio1…10` | `STYLE_PRESETS`/`STYLE_LAYOUT`, chiavi descrittive (`silentFilm`, `orientalist`…); `ARCHIVE_IMAGES` (`wedding`, `molochTemple`…) |
| Workflow | `js/fastSDXLtext2img.json`, `js/fastSDXLimg2img.json`, `js/SDXL*Cabiria.json` | `workflows/text-to-image.json`, `workflows/image-to-image.json`, `workflows/*-cabiria-lora.json` |
| Immagini | `stile1.png…`, `Archivio1.png…`, `LandingLogo.png`, `MercatoSchiavi.jpg`… | `images/styles/silent-film.png…`, `images/archive/wedding.png…`, `images/logo.png`, `images/content/gerome-slave-market.jpg`… |
| ID/classi HTML | `#positive`, `#filter`, `#filtersModal`, `#usePhotoModal`, `.stile-block`, `.nome-stile`, `.row-filtro`, `.swiper-archivio`… | `#positive-prompt`, `#open-settings-btn`, `#settings-modal`, `#reference-image-modal`, `.style-card`, `.thumbnail-label`, `.settings-row`, `.archive-swiper`… |
| Impostazione | `definition` (in realtà CFG) | `guidance` |
| Output su disco | `ComfyUI/output/gradio/session_xxxxxxxx/` | `ComfyUI/output/prompting-heritage/session_xxxxxxxx/` |

La rinomina dei file immagine ha risolto anche una incoerenza tra maiuscole e minuscole (`Archivio1.png` e `Stile4.png` su disco, contro `archivio1.png` e `stile4.png` nel codice): su Windows non creava problemi, su Linux avrebbe impedito di caricare le immagini.

---

## 8. Problemi noti e osservazioni

1. **Endpoint dell'estensione oscurati da ComfyUI** (`/prompt`, `/history`, `/upload/image`): vedi la nota al §3.
2. **Anteprima della mappa di profondità.** Nel workflow image-to-image il nodo `PreviewImage` (79) genera anch'esso un evento `executed` con immagini, di tipo `temp`. Il front end lo tratta come un risultato e prova a caricarlo da `/output/`, che non serve la cartella temp, quindi il caricamento fallisce. Il codice evita già di spostare queste immagini nella galleria; la soluzione pulita è eliminare il nodo 79 o ignorare gli eventi che non provengono dal nodo `SAVE_IMAGE`.
3. **Riconoscimento delle fasi in image-to-image.** `updateNodeExecution()` confronta gli ID dei nodi con `includes()`: per esempio `'3'` corrisponde anche a `'30'`, `'33'` e `'63'`. La percentuale mostrata è quindi indicativa.
4. Lo stile **"Cabiria"** usa al momento un prompt da acquerello (`watercolor, soft washes…`). Probabilmente è un segnaposto, in attesa della LoRA Cabiria dei workflow `*-cabiria-lora.json`.
5. `main.css` fa riferimento a `images/image.svg` (icona dei riquadri vuoti), che non esiste nel progetto.
6. `ReferenceImageManager.restoreImageFromServer()` mostra in un messaggio un percorso fisso di una macchina specifica (`C:\Users\StudiumLab\…`).
7. Le immagini `images/styles/surrealism.png`, `images/styles/ornate-engraving.png` e `images/content/cabiria-maciste.jpg` non sono usate.
8. `distant-worlds-today.html` è ancora una pagina segnaposto.
