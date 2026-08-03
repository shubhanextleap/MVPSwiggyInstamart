from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(override=True)
app = FastAPI(title="Swiggy Instamart Hybrid AI MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_json_file(filename: str):
    filepath = os.path.join(os.path.dirname(__file__), "data", filename)
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)
    return []

api_key = os.environ.get("OPENAI_API_KEY", "mock-key").strip('"').strip("'")
if api_key.startswith("gsk_"):
    client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    AI_MODEL = "llama-3.1-8b-instant"
else:
    client = OpenAI(api_key=api_key)
    AI_MODEL = "gpt-3.5-turbo"

class HybridDetourResponse(BaseModel):
    productId: str
    productName: str
    price: float
    category: str
    aiMessage: str
    isFallback: bool = False

class TrackEvent(BaseModel):
    userId: str
    eventType: str
    productId: str = None
    source: str = None
    timestamp: str = None

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/api/catalog")
def get_catalog():
    return {"catalog": load_json_file("catalog.json")}

@app.get("/api/users")
def get_users():
    return {"users": load_json_file("users.json")}

@app.post("/api/track")
def track_event(event: TrackEvent):
    from datetime import datetime
    import os
    
    if not event.timestamp:
        event.timestamp = datetime.utcnow().isoformat()
        
    print(f"[ANALYTICS] {event.userId} | {event.eventType} | {event.productId} | {event.source}")
    
    # Save to JSON
    filepath = os.path.join(os.path.dirname(__file__), "data", "analytics.json")
    try:
        events = []
        if os.path.exists(filepath):
            with open(filepath, "r") as f:
                events = json.load(f)
        events.append(event.dict())
        with open(filepath, "w") as f:
            json.dump(events, f, indent=4)
    except Exception as e:
        print(f"Error saving analytics: {e}")
        
    return {"status": "ok"}

@app.post("/api/hybrid-detour/{user_id}", response_model=HybridDetourResponse)
def generate_hybrid_detour(user_id: str):
    """
    Hybrid AI Logic:
    1. Deterministic Selection: Safely pick an in-stock, non-grocery item.
    2. Generative Messaging: LLM writes a personalized pitch based on grocery history.
    """
    users = load_json_file("users.json")
    user = next((u for u in users if u["userId"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    catalog = load_json_file("catalog.json")
    
    # 1. Deterministic Engine (Zero AI Risk)
    target_id = user.get("targetDetourProductId")
    selected_product = next((item for item in catalog if item["productId"] == target_id and item["inStock"]), None)
    
    # Absolute fallback if somehow nothing matches
    if not selected_product:
        selected_product = catalog[0]
        
    fallback_response = HybridDetourResponse(
        productId=selected_product["productId"],
        productName=selected_product["name"],
        price=selected_product["price"],
        category=selected_product["category"],
        aiMessage="Customers who shop like you also love trying this!",
        isFallback=True
    )

    # 2. Generative Messaging
    if api_key in [None, "", "mock-key"]:
        return fallback_response

    system_prompt = f"""
    You are Swiggy Instamart's friendly 'What's New' Discovery AI.
    We are showing a pop-up to the user on app launch.
    
    USER'S GROCERY HABITS: {user.get('groceryHistorySummary')}
    ITEM WE ARE RECOMMENDING: {selected_product['name']} (Category: {selected_product['category']})
    
    TASK: Write a 1-sentence, enthusiastic and personalized greeting that connects their grocery habits to this new item we want them to try.
    Make it sound like you're doing them a favor by curating this!
    
    RULES:
    1. Do not recommend any other item. ONLY talk about {selected_product['name']}.
    2. Return ONLY valid JSON with a single key "aiMessage".
    """

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "system", "content": system_prompt}],
            response_format={ "type": "json_object" },
            temperature=0.8,
            timeout=5.0
        )
        ai_output = json.loads(response.choices[0].message.content)
        
        return HybridDetourResponse(
            productId=selected_product["productId"],
            productName=selected_product["name"],
            price=selected_product["price"],
            category=selected_product["category"],
            aiMessage=ai_output.get("aiMessage", fallback_response.aiMessage),
            isFallback=False
        )
            
    except Exception as e:
        print(f"Hybrid LLM Error: {e}")
        return fallback_response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
