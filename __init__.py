"""Prompting Heritage - ComfyUI custom extension.

Serves the Prompting Heritage web application from the ComfyUI server and
adds a few HTTP endpoints used by the front end. Image generation itself is
performed by ComfyUI through its standard /prompt API and WebSocket.
"""

import os
import uuid

import aiofiles
from aiohttp import web

import server

# === Paths ===
EXTENSION_DIR = os.path.dirname(os.path.realpath(__file__))
WEB_ROOT = os.path.join(EXTENSION_DIR, "web")

# ComfyUI's real output/input directories (this extension lives in ComfyUI/custom_nodes/<name>)
COMFYUI_OUTPUT_DIR = os.path.abspath(os.path.join(EXTENSION_DIR, "..", "..", "output"))
COMFYUI_INPUT_DIR = os.path.abspath(os.path.join(EXTENSION_DIR, "..", "..", "input"))

# URL prefix under which the whole web app is published
APP_BASE_PATH = "/prompting-heritage"

# Sub-folder of the ComfyUI output directory where generated images are stored (one folder per session)
SESSIONS_OUTPUT_SUBFOLDER = "prompting-heritage"

routes = server.PromptServer.instance.routes


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


# === HTML Pages ===
def serve_page(filename):
    return web.FileResponse(os.path.join(WEB_ROOT, filename))


@routes.get(APP_BASE_PATH)
async def redirect_to_landing_page(request):
    # Trailing slash is required so that relative asset paths (css/, js/, images/) resolve under the prefix
    raise web.HTTPFound(f"{APP_BASE_PATH}/")


@routes.get(f"{APP_BASE_PATH}/")
async def landing_page(request):
    return serve_page("landing.html")


@routes.get(f"{APP_BASE_PATH}/generator.html")
async def generator_page(request):
    return serve_page("generator.html")


@routes.get(f"{APP_BASE_PATH}/distant-worlds-in-cabiria.html")
async def distant_worlds_in_cabiria_page(request):
    return serve_page("distant-worlds-in-cabiria.html")


@routes.get(f"{APP_BASE_PATH}/distant-worlds-today.html")
async def distant_worlds_today_page(request):
    return serve_page("distant-worlds-today.html")


# === Legacy URLs (kept so existing links and QR codes keep working) ===
LEGACY_REDIRECTS = {
    "/test": f"{APP_BASE_PATH}/",
    "/test/index.html": f"{APP_BASE_PATH}/generator.html",
    "/mondi-cabiria.html": f"{APP_BASE_PATH}/distant-worlds-in-cabiria.html",
    "/nuovo-cabiria.html": f"{APP_BASE_PATH}/distant-worlds-today.html",
}


def make_legacy_redirect(target):
    async def redirect(request):
        raise web.HTTPMovedPermanently(target)
    return redirect


for legacy_path, target_path in LEGACY_REDIRECTS.items():
    routes.get(legacy_path)(make_legacy_redirect(target_path))


# === Static Assets ===
for asset_dir in ("css", "js", "images", "workflows"):
    routes.static(f"{APP_BASE_PATH}/{asset_dir}/", path=os.path.join(WEB_ROOT, asset_dir))

# Generated images, read directly from ComfyUI's output folder
routes.static("/output/", path=COMFYUI_OUTPUT_DIR)


# === POST /upload/image ===
@routes.post("/upload/image")
async def upload_reference_image(request):
    try:
        reader = await request.multipart()
        field = await reader.next()

        if field.name != 'image':
            return web.json_response({"error": "No image field found"}, status=400)

        # Generate unique filename
        filename = f"{uuid.uuid4().hex}_{field.filename}"
        filepath = os.path.join(COMFYUI_INPUT_DIR, filename)

        os.makedirs(COMFYUI_INPUT_DIR, exist_ok=True)

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
@routes.post("/prompt")
async def save_prompt_metadata(request):
    try:
        data = await request.json()

        client_id = data.get("client_id")
        workflow = data.get("prompt")

        if not client_id or not workflow:
            return web.json_response({"error": "Missing client_id or prompt"}, status=400)

        # === SaveImage node (28) ===
        save_node_inputs = workflow.get("28", {}).get("inputs", {})
        filename_prefix = save_node_inputs.get("filename_prefix", "")
        if not filename_prefix:
            return web.json_response({"error": "Missing filename_prefix in node 28"}, status=400)

        # === Timestamp and session folder from filename_prefix ===
        timestamp = filename_prefix.split("/")[-1]
        session_dir = os.path.join(COMFYUI_OUTPUT_DIR, os.path.dirname(filename_prefix))
        os.makedirs(session_dir, exist_ok=True)

        positive_prompt = workflow.get("30", {}).get("inputs", {}).get("text_g", "N/A")
        negative_prompt = workflow.get("33", {}).get("inputs", {}).get("text_g", "N/A")
        seed = workflow.get("3", {}).get("inputs", {}).get("seed", "unknown")

        # === Save prompt info to .txt file ===
        metadata_path = os.path.join(session_dir, f"{timestamp}_prompt.txt")
        with open(metadata_path, "w", encoding="utf-8") as f:
            f.write(f"Positive Prompt:\n{positive_prompt}\n\n")
            f.write(f"Negative Prompt:\n{negative_prompt}\n\n")
            f.write(f"Seed: {seed}\n")

        print(f"📝 Saved prompt metadata to {metadata_path}")

        # ComfyUI handles the actual generation
        return web.json_response({"status": "accepted"})

    except Exception as e:
        print("❌ Error in /prompt:", str(e))
        return web.json_response({"error": str(e)}, status=500)


# === GET /history ===
@routes.get("/history")
async def list_session_images(request):
    try:
        client_id = request.query.get("client_id")
        if not client_id:
            return web.json_response({"error": "Missing client_id"}, status=400)

        session_folder = f"session_{client_id[:8]}"
        session_dir = os.path.join(COMFYUI_OUTPUT_DIR, SESSIONS_OUTPUT_SUBFOLDER, session_folder)
        if not os.path.exists(session_dir):
            return web.json_response({"images": []})

        images = []
        for fname in sorted(os.listdir(session_dir)):
            if fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                images.append({
                    "url": f"/output/{SESSIONS_OUTPUT_SUBFOLDER}/{session_folder}/{fname}",
                    "filename": fname
                })

        return web.json_response({"images": images})

    except Exception as e:
        print("❌ Error in /history:", str(e))
        return web.json_response({"error": str(e)}, status=500)


# Required for ComfyUI to recognize this as a custom node package (it defines no nodes)
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
