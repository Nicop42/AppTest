// WebSocket Handler Module
export class WebSocketHandler {
  constructor(clientId, imageGenerator) {
    this.clientId = clientId;
    this.imageGenerator = imageGenerator;
    this.ws = null;
    
    this.initialize();
  }

  initialize() {
    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      this.ws = new WebSocket(
        `${wsProtocol}//${window.location.host}/ws?clientId=${this.clientId}`
      );

      this.setupEventListeners();
    } catch (err) {
      console.warn("❌ Could not set up WebSocket:", err);
    }
  }

  setupEventListeners() {
    if (!this.ws) return;

    this.ws.addEventListener("message", (e) => this.handleMessage(e));
    this.ws.addEventListener("error", (err) => this.handleError(err));
    this.ws.addEventListener("open", () => this.handleOpen());
    this.ws.addEventListener("close", () => this.handleClose());
  }

  handleMessage(event) {
    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "progress":
          this.handleProgress(msg.data);
          break;
        case "executed":
          this.handleExecuted(msg.data);
          break;
        case "executing":
          this.handleExecuting(msg.data);
          break;
        default:
          console.log("Unknown WebSocket message type:", msg.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  handleProgress(data) {
    if (this.imageGenerator && data.max !== undefined && data.value !== undefined) {
      this.imageGenerator.updateProgress(data.max, data.value);
      
      // Log progress for debugging, especially useful for img2img operations
      const percentage = data.max > 0 ? Math.round((data.value / data.max) * 100) : 0;
      if (percentage % 25 === 0 || data.value === data.max) {
        console.log(`📊 ComfyUI Progress: ${data.value}/${data.max} (${percentage}%)`);
      }
    }
  }

  handleExecuting(data) {
    console.log("⚙️ WebSocket executing data received:", data);
    
    // Update UI to show that a node is being executed (useful for img2img preprocessing)
    if (this.imageGenerator && data.node) {
      console.log(`🔄 Node ${data.node} is executing...`);
      this.imageGenerator.updateNodeExecution(data.node);
    } else {
      console.log("⚙️ Node execution started but no node ID provided:", data);
    }
  }

  handleExecuted(data) {
    console.log("🎯 WebSocket executed data received:", data);
    
    if (data?.output?.images && this.imageGenerator) {
      console.log("✅ Images found in executed data:", data.output.images);
      this.imageGenerator.handleImageGenerated(data.output.images);
    } else {
      console.warn("⚠️ No images found in executed data:", {
        hasData: !!data,
        hasOutput: !!data?.output,
        hasImages: !!data?.output?.images,
        imageGeneratorExists: !!this.imageGenerator
      });
    }
  }

  handleError(error) {
    console.warn("❌ WebSocket connection failed:", error);
  }

  handleOpen() {
    console.log("✅ WebSocket connection established");
  }

  handleClose() {
    console.log("🔌 WebSocket connection closed");
    // Optionally implement reconnection logic here
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect WebSocket...");
      this.initialize();
    }, 5000);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}