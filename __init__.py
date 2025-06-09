import os
import json
from aiohttp import web
import server

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
WEBROOT = os.path.join(BASE_DIR, "web")
OUTPUT_ROOT = os.path.join(BASE_DIR, "output")

@web.middleware
async def cors_middleware(request, handler):
    if request.method == 'OPTIONS':
        response = web.Response()
    else:
        response = await handler(request)

    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8188'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

server.PromptServer.instance.app.middlewares.append(cors_middleware)

@server.PromptServer.instance.routes.get("/test")
def dungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

server.PromptServer.instance.routes.static("/test/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/test/js/", path=os.path.join(WEBROOT, "js"))

# ✅ In-memory map of session folders
session_dirs = {}

@server.PromptServer.instance.routes.post("/prompt")
async def handle_prompt(request):
    try:
        data = await request.json()

        client_id = data.get("client_id")
        if not client_id:
            return web.json_response({"error": "Missing client_id"}, status=400)

        # Create unique folder for this session
        if client_id not in session_dirs:
            session_dir = f"session_{client_id[:8]}"
            full_dir = os.path.join(OUTPUT_ROOT, session_dir)
            os.makedirs(full_dir, exist_ok=True)
            session_dirs[client_id] = session_dir

        session_folder = session_dirs[client_id]

        # Here you'd trigger actual ComfyUI processing and save image in session_folder
        # For now, simulate:
        image_name = "sample.jpg"  # You can dynamically name this if needed

        return web.json_response({
            "data": {
                "output": {
                    "images": [
                        {
                            "filename": image_name,
                            "subfolder": f"output/{session_folder}"
                        }
                    ]
                }
            }
        })

    except Exception as e:
        print("❌ Error in /prompt:", str(e))
        return web.json_response({"error": str(e)}, status=500)

@server.PromptServer.instance.routes.get("/view")
async def view_image(request):
    filename = request.query.get("filename")
    subfolder = request.query.get("subfolder", "output")

    if not filename:
        return web.Response(status=400, text="Missing filename")

    image_path = os.path.join(BASE_DIR, subfolder, filename)

    if not os.path.isfile(image_path):
        return web.Response(status=404, text=f"File not found: {image_path}")

    return web.FileResponse(image_path)

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
