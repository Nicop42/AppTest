// ComfyUI API Client Module with Cache Busting
import { DOMUtils } from './utils.js';

export class APIClient {
  constructor(clientId) {
    this.clientId = clientId;
    this.cachedWorkflow = null;
    this.cachedImg2ImgWorkflow = null;
    this.HIDDEN_NEGATIVE_PROMPT = "nsfw, nudity, naked, explicit, adult content, violence, gore, disturbing content, low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad anatomy, bad proportions, extra limbs, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly";
    
    this.FORBIDDEN_WORDS = [
      "nsfw", "nudity", "naked", "explicit", "porn", "pornography", "sex", "sexual",
      "violence", "gore", "blood", "bloody", "kill", "killing", "murder",
      "hate", "hateful", "racist", "racism", "nazi", "terrorist", "terrorism",
      "illegal", "drug", "drugs", "cocaine", "heroin", "meth", "crack",
      "weapon", "gun", "knife", "bomb", "explosive",
      "copyrighted", "trademarked", "watermark", "signature"
    ];
  }

  async loadWorkflow(useImg2Img = false) {
    // Add cache busting parameter
    const cacheBuster = `?v=${Date.now()}`;
    
    if (useImg2Img) {
      if (this.cachedImg2ImgWorkflow) {
        console.log("📋 Using cached img2img workflow");
        return JSON.parse(JSON.stringify(this.cachedImg2ImgWorkflow));
      }
      
      console.log("📥 Loading img2img workflow from server...");
      const res = await fetch(`js/fastSDXLimg2img.json${cacheBuster}`);
      if (!res.ok) throw new Error(`Img2Img workflow fetch failed: ${res.status}`);
      
      this.cachedImg2ImgWorkflow = await res.json();
      console.log("✅ Img2img workflow loaded, nodes:", Object.keys(this.cachedImg2ImgWorkflow));
      
      // Verify it doesn't contain problematic nodes
      this.validateWorkflow(this.cachedImg2ImgWorkflow, 'img2img');
      
      return JSON.parse(JSON.stringify(this.cachedImg2ImgWorkflow));
    } else {
      if (this.cachedWorkflow) {
        console.log("📋 Using cached text2img workflow");
        return JSON.parse(JSON.stringify(this.cachedWorkflow));
      }
      
      console.log("📥 Loading text2img workflow from server...");
      const res = await fetch(`js/fastSDXLtext2img.json${cacheBuster}`);
      if (!res.ok) throw new Error(`Text2Img workflow fetch failed: ${res.status}`);
      
      this.cachedWorkflow = await res.json();
      console.log("✅ Text2img workflow loaded, nodes:", Object.keys(this.cachedWorkflow));
      
      return JSON.parse(JSON.stringify(this.cachedWorkflow));
    }
  }

  // NEW: Validate workflow doesn't contain problematic nodes
  validateWorkflow(workflow, type) {
    const problematicNodes = ['MarigoldDepthEstimation', 'DWPreprocessor', 'DepthAnything'];
    
    for (const [nodeId, nodeData] of Object.entries(workflow)) {
      if (nodeData.class_type && problematicNodes.includes(nodeData.class_type)) {
        console.error(`❌ Found problematic node in ${type} workflow:`, nodeId, nodeData.class_type);
        throw new Error(`Workflow contains problematic node: ${nodeData.class_type}. Please use the simplified workflow.`);
      }
    }
    
    console.log(`✅ ${type} workflow validation passed - no problematic nodes found`);
  }

  async queuePrompt(workflow) {
    // Log the workflow being sent to help debug
    console.log("📤 Sending workflow to ComfyUI:");
    console.log("- Workflow nodes:", Object.keys(workflow));
    console.log("- Client ID:", this.clientId);
    
    // Check for problematic nodes before sending
    this.validateWorkflow(workflow, 'queued');
    
    const payload = { prompt: workflow, client_id: this.clientId };

    const response = await fetch("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  filterForbiddenWords(text) {
    if (!text) return text;

    const forbiddenPattern = new RegExp(
      `\\b(${this.FORBIDDEN_WORDS.join("|")})\\b`,
      "gi"
    );

    return text.replace(forbiddenPattern, "").replace(/\s+/g, " ").trim();
  }

  async getWorkflowWithSettings(settings, useImg2Img = false, uploadedImageName = null) {
    const workflow = await this.loadWorkflow(useImg2Img);

    console.log(`⚙️ Applying settings to ${useImg2Img ? 'img2img' : 'text2img'} workflow...`);

    // Set seed
    if (settings.useCustomSeed && settings.customSeed) {
      workflow["3"].inputs.seed = parseInt(settings.customSeed) || DOMUtils.generateSeed();
    } else {
      workflow["3"].inputs.seed = DOMUtils.generateSeed();
    }

    // Set quality (steps)
    if (settings.quality !== undefined) {
      const steps = Math.round(5 + (settings.quality / 150) * 25);
      workflow["3"].inputs.steps = Math.max(5, Math.min(30, steps));
    }

    // Set definition (CFG scale)
    if (settings.definition !== undefined && workflow["3"].inputs.hasOwnProperty("cfg")) {
      const cfgValue = DOMUtils.mapRange(settings.definition, 0, 150, 0.5, 3);
      workflow["3"].inputs.cfg = Math.min(3, Math.max(0.5, parseFloat(cfgValue.toFixed(1))));
      console.log(`Setting CFG scale to ${workflow["3"].inputs.cfg} (from ${settings.definition}%)`);
    }

    // Set dimensions
    if (useImg2Img) {
      // For img2img, set dimensions in the CLIP text encode nodes (30 and 33)
      if (workflow["30"] && settings.dimensions) {
        workflow["30"].inputs.width = settings.dimensions.width;
        workflow["30"].inputs.height = settings.dimensions.height;
        workflow["30"].inputs.target_width = settings.dimensions.width;
        workflow["30"].inputs.target_height = settings.dimensions.height;
      }
      if (workflow["33"] && settings.dimensions) {
        workflow["33"].inputs.width = settings.dimensions.width;
        workflow["33"].inputs.height = settings.dimensions.height;
        workflow["33"].inputs.target_width = settings.dimensions.width;
        workflow["33"].inputs.target_height = settings.dimensions.height;
      }
      
      // Set dimensions in ImageScale node if it exists
      if (workflow["76"] && settings.dimensions) {
        workflow["76"].inputs.width = settings.dimensions.width;
        workflow["76"].inputs.height = settings.dimensions.height;
      }
      
      // Set the uploaded image name in the LoadImage node (65)
      if (workflow["65"] && uploadedImageName) {
        workflow["65"].inputs.image = uploadedImageName;
        console.log(`Setting input image to: ${uploadedImageName}`);
      } else if (useImg2Img && !uploadedImageName) {
        throw new Error("Img2img workflow requested but no image name provided");
      }
      
      console.log(`Setting img2img dimensions to ${settings.dimensions.width}x${settings.dimensions.height} (${settings.format})`);
    } else {
      // For text2img, set dimensions in the Empty Latent Image node (5)
      if (workflow["5"] && settings.dimensions) {
        workflow["5"].inputs.width = settings.dimensions.width;
        workflow["5"].inputs.height = settings.dimensions.height;
        console.log(`Setting text2img dimensions to ${settings.dimensions.width}x${settings.dimensions.height} (${settings.format})`);
      }
    }

    const allowedLoras = [
      'MJ52_v2.0.safetensors',
    ];

    // Validate LoRA (only if it exists)
    if (workflow["63"] && workflow["63"].inputs && workflow["63"].inputs.lora_name) {
      if (!allowedLoras.includes(workflow["63"].inputs.lora_name)) {
        workflow["63"].inputs.lora_name = allowedLoras[0];
        console.warn("Invalid LoRA name, using default:", allowedLoras[0]);
      }
    }

    console.log("✅ Workflow settings applied successfully");
    return workflow;
  }

  updateWorkflowPrompts(workflow, positivePrompt, negativePrompt, sessionFolder) {
    // Filter forbidden words
    const filteredPos = this.filterForbiddenWords(positivePrompt);
    const filteredNeg = this.filterForbiddenWords(negativePrompt);

    // Update positive prompts
    workflow["30"]["inputs"]["text_g"] = filteredPos;
    workflow["30"]["inputs"]["text_l"] = filteredPos;

    // Combine user's negative prompt with hidden negative prompt
    const combinedNegativePrompt = filteredNeg
      ? `${filteredNeg}, ${this.HIDDEN_NEGATIVE_PROMPT}`
      : this.HIDDEN_NEGATIVE_PROMPT;
    
    workflow["33"]["inputs"]["text_g"] = combinedNegativePrompt;
    workflow["33"]["inputs"]["text_l"] = combinedNegativePrompt;

    // Set filename prefix
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    workflow["28"]["inputs"]["filename_prefix"] = `${sessionFolder}/${timestamp}`;

    return {
      filteredPositive: filteredPos,
      filteredNegative: filteredNeg,
      workflow
    };
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'input');
    formData.append('subfolder', '');

    console.log('📤 Uploading image:', file.name, 'Size:', file.size);

    const response = await fetch('/upload/image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Image uploaded successfully:', result);
    return result.name;
  }
}