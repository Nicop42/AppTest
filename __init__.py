import os
import json
from aiohttp import web
import server
import aiofiles
import uuid

# === Directory Paths ===
BASE_DIR = os.path.dirname(os.path.realpath(__file__))
WEBROOT = os.path.join(BASE_DIR, "web")

# 💡 Point to ComfyUI's REAL output directory
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "output"))
INPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "input"))

# === CORS Middleware ===
@web.middleware
async def cors_middleware(request, handler):
    if request.method == 'OPTIONS':
        return web.Response()
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

server.PromptServer.instance.app.middlewares.append(cors_middleware)

# === Static and HTML Routes ===
@server.PromptServer.instance.routes.get("/test")
def dungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "landing.html"))

# Serve index.html at /test/index.html
@server.PromptServer.instance.routes.get("/test/index.html")
def dungeon_index(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

# ✅ AGGIUNTO: Supporto per percorsi originali /test/
server.PromptServer.instance.routes.static("/test/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/test/js/", path=os.path.join(WEBROOT, "js"))
server.PromptServer.instance.routes.static("/test/images/", path=os.path.join(WEBROOT, "images"))

# ✅ AGGIUNTO: Supporto per percorsi diretti (compatibilità con lavoro colleghi)
server.PromptServer.instance.routes.static("/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/js/", path=os.path.join(WEBROOT, "js"))
server.PromptServer.instance.routes.static("/images/", path=os.path.join(WEBROOT, "images"))

# ✅ Serve real ComfyUI output folder at /output/
server.PromptServer.instance.routes.static("/output/", path=OUTPUT_DIR)

# ✅ NEW: Image Upload Endpoint
@server.PromptServer.instance.routes.post("/upload/image")
async def upload_image(request):
    try:
        reader = await request.multipart()
        field = await reader.next()
        
        if field.name != 'image':
            return web.json_response({"error": "No image field found"}, status=400)
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}_{field.filename}"
        filepath = os.path.join(INPUT_DIR, filename)
        
        # Ensure input directory exists
        os.makedirs(INPUT_DIR, exist_ok=True)
        
        # Save the uploaded file
        async with aiofiles.open(filepath, 'wb') as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                await f.write(chunk)
        
        print(f"📁 Image uploaded: {filename}")
        
        return web.json_response({
            "name": filename,
            "subfolder": "",
            "type": "input"
        })
        
    except Exception as e:
        print("❌ Error uploading image:", str(e))
        return web.json_response({"error": str(e)}, status=500)

# === POST /prompt ===
@server.PromptServer.instance.routes.post("/prompt")
async def handle_prompt(request):
    try:
        data = await request.json()

        # === Extract core fields ===
        client_id = data.get("client_id")
        prompt_data = data.get("prompt")

        if not client_id or not prompt_data:
            return web.json_response({"error": "Missing client_id or prompt"}, status=400)

        # === Extract from SaveImage node (28) ===
        save_node = prompt_data.get("28", {}).get("inputs", {})
        filename_prefix = save_node.get("filename_prefix", "")
        if not filename_prefix:
            return web.json_response({"error": "Missing filename_prefix in node 28"}, status=400)

        # === Get timestamp and folder from filename_prefix
        timestamp = filename_prefix.split("/")[-1]
        session_dir = os.path.join(OUTPUT_DIR, os.path.dirname(filename_prefix))
        os.makedirs(session_dir, exist_ok=True)

        # === Extract prompt data safely ===
        pos = prompt_data.get("30", {}).get("inputs", {}).get("text_g", "N/A")
        neg = prompt_data.get("33", {}).get("inputs", {}).get("text_g", "N/A")
        seed = prompt_data.get("3", {}).get("inputs", {}).get("seed", "unknown")

        # === Save prompt info to .txt file ===
        txt_path = os.path.join(session_dir, f"{timestamp}_prompt.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(f"Positive Prompt:\n{pos}\n\n")
            f.write(f"Negative Prompt:\n{neg}\n\n")
            f.write(f"Seed: {seed}\n")

        print(f"📝 Saved prompt metadata to {txt_path}")

        # ✅ Return success — ComfyUI handles actual generation
        return web.json_response({"status": "accepted"})

    except Exception as e:
        print("❌ Error in /prompt:", str(e))
        return web.json_response({"error": str(e)}, status=500)

@server.PromptServer.instance.routes.get("/history")
async def get_history(request):
    try:
        client_id = request.query.get("client_id")
        if not client_id:
            return web.json_response({"error": "Missing client_id"}, status=400)

        session_dir = os.path.join(OUTPUT_DIR, "gradio", f"session_{client_id[:8]}")
        if not os.path.exists(session_dir):
            return web.json_response({"images": []})

        images = []
        for fname in sorted(os.listdir(session_dir)):
            if fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                images.append({
                    "url": f"/output/gradio/session_{client_id[:8]}/{fname}",
                    "filename": fname
                })

        return web.json_response({"images": images})

    except Exception as e:
        print("❌ Error in /history:", str(e))
        return web.json_response({"error": str(e)}, status=500)

# ✅ Required for ComfyUI to recognize this as a custom module
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']