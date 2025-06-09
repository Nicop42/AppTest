import os
import json
from aiohttp import web
import server

# Define where the web files are
WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

# ✅ CORS Middleware
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

# ✅ Apply middleware AFTER app creation
server.PromptServer.instance.app.middlewares.append(cors_middleware)

# ✅ Serve index.html for /test
@server.PromptServer.instance.routes.get("/test")
def dungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

# ✅ Serve static CSS and JS
server.PromptServer.instance.routes.static("/test/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/test/js/", path=os.path.join(WEBROOT, "js"))

# ✅ Handle /prompt POST for image generation
@server.PromptServer.instance.routes.post("/prompt")
async def handle_prompt(request):
    try:
        data = await request.json()
        print("\n=== /prompt Received ===")
        print(json.dumps(data, indent=2)[:1000])
        print("========================")

        if "prompt" not in data:
            return web.json_response({"error": "Missing 'prompt'"}, status=400)

        fake_image = {
            "filename": "sample.jpg",
            "subfolder": "output"
        }

        return web.json_response({
            "data": {
                "output": {
                    "images": [fake_image]
                }
            }
        })

    except Exception as e:
        print("❌ Error in /prompt:", str(e))
        return web.json_response({"error": str(e)}, status=500)

# ✅ Required exports
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
