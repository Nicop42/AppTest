// ComfyUI API client: loads workflow templates, applies user settings and submits jobs
import { DOMUtils } from './utils.js';

// Node IDs used by the ComfyUI workflow templates in /workflows/*.json
export const WORKFLOW_NODES = {
  SAMPLER: "3",              // KSampler (seed, steps, cfg)
  EMPTY_LATENT_IMAGE: "5",   // text-to-image only: output size
  SAVE_IMAGE: "28",          // filename_prefix -> output sub-folder
  POSITIVE_PROMPT: "30",     // CLIPTextEncodeSDXL (positive)
  NEGATIVE_PROMPT: "33",     // CLIPTextEncodeSDXL (negative)
  LORA_LOADER: "63",
  LOAD_IMAGE: "65",          // image-to-image only: reference image
  IMAGE_SCALE: "76",
  IMAGE_RESIZE: "94"         // image-to-image only: proportional resize
};

export class ComfyUIClient {
  constructor(clientId) {
    this.clientId = clientId;
    this.cachedTextToImageWorkflow = null;
    this.cachedImageToImageWorkflow = null;
    this.HIDDEN_NEGATIVE_PROMPT = "nipples, vagina, tits, nsfw, nudity, naked, explicit, adult content, violence, gore, disturbing content, low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad anatomy, bad proportions, extra limbs, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly";
    
    this.FORBIDDEN_WORDS = [
      "nsfw", "nudity", "naked", "explicit", "porn", "pornography", "sex", "sexual",
      "violence", "gore", "blood", "bloody", "kill", "killing", "murder",
      "hate", "hateful", "racist", "racism", "nazi", "terrorist", "terrorism",
      "illegal", "drug", "drugs", "cocaine", "heroin", "meth", "crack",
      "weapon", "gun", "knife", "bomb", "explosive",
      "copyrighted", "trademarked", "watermark", "signature", "vagina"
    ];
  }

  async loadWorkflow(useImg2Img = false) {
    // Add cache busting parameter
    const cacheBuster = `?v=${Date.now()}`;
    
    if (useImg2Img) {
      if (this.cachedImageToImageWorkflow) {
        console.log("📋 Using cached img2img workflow");
        return JSON.parse(JSON.stringify(this.cachedImageToImageWorkflow));
      }
      
      console.log("📥 Loading img2img workflow from server...");
      const res = await fetch(`workflows/image-to-image.json${cacheBuster}`);
      if (!res.ok) throw new Error(`Img2Img workflow fetch failed: ${res.status}`);
      
      this.cachedImageToImageWorkflow = await res.json();
      console.log("✅ Img2img workflow loaded, nodes:", Object.keys(this.cachedImageToImageWorkflow));
      
      // Verify it doesn't contain problematic nodes
      this.validateWorkflow(this.cachedImageToImageWorkflow, 'img2img');
      
      return JSON.parse(JSON.stringify(this.cachedImageToImageWorkflow));
    } else {
      if (this.cachedTextToImageWorkflow) {
        console.log("📋 Using cached text2img workflow");
        return JSON.parse(JSON.stringify(this.cachedTextToImageWorkflow));
      }
      
      console.log("📥 Loading text2img workflow from server...");
      const res = await fetch(`workflows/text-to-image.json${cacheBuster}`);
      if (!res.ok) throw new Error(`Text2Img workflow fetch failed: ${res.status}`);
      
      this.cachedTextToImageWorkflow = await res.json();
      console.log("✅ Text2img workflow loaded, nodes:", Object.keys(this.cachedTextToImageWorkflow));
      
      return JSON.parse(JSON.stringify(this.cachedTextToImageWorkflow));
    }
  }

  // NEW: Validate workflow doesn't contain problematic nodes
  validateWorkflow(workflow, type) {
    const problematicNodes = ['DepthAnything'];
    
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

  async getWorkflowWithSettings(settings, useImg2Img = false, uploadedImageName = null, imageDimensions = null) {
    const workflow = await this.loadWorkflow(useImg2Img);

    console.log(`⚙️ Applying settings to ${useImg2Img ? 'img2img' : 'text2img'} workflow...`);

    // Set seed
    if (settings.useCustomSeed && settings.customSeed) {
      workflow[WORKFLOW_NODES.SAMPLER].inputs.seed = parseInt(settings.customSeed) || DOMUtils.generateSeed();
    } else {
      workflow[WORKFLOW_NODES.SAMPLER].inputs.seed = DOMUtils.generateSeed();
    }

    // Set quality (sampling steps)
    if (settings.quality !== undefined) {
      const steps = Math.round(5 + (settings.quality / 150) * 25);
      workflow[WORKFLOW_NODES.SAMPLER].inputs.steps = Math.max(5, Math.min(30, steps));
    }

    // Set guidance (CFG scale)
    if (settings.guidance !== undefined && workflow[WORKFLOW_NODES.SAMPLER].inputs.hasOwnProperty("cfg")) {
      const cfgValue = DOMUtils.mapRange(settings.guidance, 0, 150, 0.5, 3);
      workflow[WORKFLOW_NODES.SAMPLER].inputs.cfg = Math.min(3, Math.max(0.5, parseFloat(cfgValue.toFixed(1))));
      console.log(`Setting CFG scale to ${workflow[WORKFLOW_NODES.SAMPLER].inputs.cfg} (from guidance ${settings.guidance})`);
    }

    // Set dimensions
    if (useImg2Img) {
      // For img2img, set dimensions in the CLIP text encode nodes (30 and 33)
      if (workflow[WORKFLOW_NODES.POSITIVE_PROMPT] && settings.dimensions) {
        workflow[WORKFLOW_NODES.POSITIVE_PROMPT].inputs.width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.POSITIVE_PROMPT].inputs.height = settings.dimensions.height;
        workflow[WORKFLOW_NODES.POSITIVE_PROMPT].inputs.target_width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.POSITIVE_PROMPT].inputs.target_height = settings.dimensions.height;
      }
      if (workflow[WORKFLOW_NODES.NEGATIVE_PROMPT] && settings.dimensions) {
        workflow[WORKFLOW_NODES.NEGATIVE_PROMPT].inputs.width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.NEGATIVE_PROMPT].inputs.height = settings.dimensions.height;
        workflow[WORKFLOW_NODES.NEGATIVE_PROMPT].inputs.target_width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.NEGATIVE_PROMPT].inputs.target_height = settings.dimensions.height;
      }
      
      // Calculate and set proportional resize dimensions for img2img
      if (useImg2Img && imageDimensions && imageDimensions.width && imageDimensions.height) {
        const { width: originalWidth, height: originalHeight } = imageDimensions;
        console.log(`📐 Original image dimensions: ${originalWidth}x${originalHeight}`);
        
        // Calculate proportional dimensions where shortest side is 1024
        const aspectRatio = originalWidth / originalHeight;
        const TARGET_SHORT_SIDE = 1024;
        let resizeWidth, resizeHeight;
        
        if (originalWidth < originalHeight) {
          // Portrait: width is shorter
          resizeWidth = TARGET_SHORT_SIDE;
          resizeHeight = Math.round(TARGET_SHORT_SIDE / aspectRatio);
        } else {
          // Landscape or square: height is shorter
          resizeHeight = TARGET_SHORT_SIDE;
          resizeWidth = Math.round(TARGET_SHORT_SIDE * aspectRatio);
        }
        
        // Ensure dimensions are multiples of 8 (AI model requirement)
        resizeWidth = Math.round(resizeWidth / 8) * 8;
        resizeHeight = Math.round(resizeHeight / 8) * 8;
        
        console.log(`🔧 Calculated proportional resize: ${resizeWidth}x${resizeHeight}`);
        console.log(`📊 Aspect ratio maintained: ${(resizeWidth/resizeHeight).toFixed(3)} (original: ${aspectRatio.toFixed(3)})`);
        
        // Set proportional dimensions in the Image Resize node (94)
        if (workflow[WORKFLOW_NODES.IMAGE_RESIZE]) {
          workflow[WORKFLOW_NODES.IMAGE_RESIZE].inputs.resize_width = resizeWidth;
          workflow[WORKFLOW_NODES.IMAGE_RESIZE].inputs.resize_height = resizeHeight;
          workflow[WORKFLOW_NODES.IMAGE_RESIZE].inputs.mode = "resize"; // Ensure it's in resize mode
          console.log(`📏 Set Image Resize node (94) to: ${resizeWidth}x${resizeHeight}`);
        }
      }
      
      // Set dimensions in ImageScale node if it exists
      if (workflow[WORKFLOW_NODES.IMAGE_SCALE] && settings.dimensions) {
        workflow[WORKFLOW_NODES.IMAGE_SCALE].inputs.width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.IMAGE_SCALE].inputs.height = settings.dimensions.height;
      }
      
      // Set the uploaded image name in the LoadImage node (65)
      if (workflow[WORKFLOW_NODES.LOAD_IMAGE] && uploadedImageName) {
        workflow[WORKFLOW_NODES.LOAD_IMAGE].inputs.image = uploadedImageName;
        console.log(`Setting input image to: ${uploadedImageName}`);
      } else if (useImg2Img && !uploadedImageName) {
        throw new Error("Img2img workflow requested but no image name provided");
      }
      
      console.log(`Setting img2img dimensions to ${settings.dimensions.width}x${settings.dimensions.height} (${settings.format})`);
    } else {
      // For text2img, set dimensions in the Empty Latent Image node (5)
      if (workflow[WORKFLOW_NODES.EMPTY_LATENT_IMAGE] && settings.dimensions) {
        workflow[WORKFLOW_NODES.EMPTY_LATENT_IMAGE].inputs.width = settings.dimensions.width;
        workflow[WORKFLOW_NODES.EMPTY_LATENT_IMAGE].inputs.height = settings.dimensions.height;
        console.log(`Setting text2img dimensions to ${settings.dimensions.width}x${settings.dimensions.height} (${settings.format})`);
      }
    }

    const allowedLoras = [
      'MJ52_v2.0.safetensors',
    ];

    // Validate LoRA (only if it exists)
    if (workflow[WORKFLOW_NODES.LORA_LOADER] && workflow[WORKFLOW_NODES.LORA_LOADER].inputs && workflow[WORKFLOW_NODES.LORA_LOADER].inputs.lora_name) {
      if (!allowedLoras.includes(workflow[WORKFLOW_NODES.LORA_LOADER].inputs.lora_name)) {
        workflow[WORKFLOW_NODES.LORA_LOADER].inputs.lora_name = allowedLoras[0];
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
    workflow[WORKFLOW_NODES.POSITIVE_PROMPT]["inputs"]["text_g"] = filteredPos;
    workflow[WORKFLOW_NODES.POSITIVE_PROMPT]["inputs"]["text_l"] = filteredPos;

    // Combine user's negative prompt with hidden negative prompt
    const combinedNegativePrompt = filteredNeg
      ? `${filteredNeg}, ${this.HIDDEN_NEGATIVE_PROMPT}`
      : this.HIDDEN_NEGATIVE_PROMPT;
    
    workflow[WORKFLOW_NODES.NEGATIVE_PROMPT]["inputs"]["text_g"] = combinedNegativePrompt;
    workflow[WORKFLOW_NODES.NEGATIVE_PROMPT]["inputs"]["text_l"] = combinedNegativePrompt;

    // Set filename prefix
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    workflow[WORKFLOW_NODES.SAVE_IMAGE]["inputs"]["filename_prefix"] = `${sessionFolder}/${timestamp}`;

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