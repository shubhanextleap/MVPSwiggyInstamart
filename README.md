# Swiggy Instamart Hybrid AI MVP

This is a Minimum Viable Product (MVP) showcasing a hybrid AI-driven discovery experience for Swiggy Instamart, featuring dynamic product recommendations and an interactive grocery shopping experience.

## Features

* **Hybrid AI Discovery Engine:** 
  * Features an intelligent launch modal ("Detour") that recommends personalized items based on a user's grocery habits.
  * Uses a hybrid approach: A deterministic engine reliably selects in-stock products, while a generative LLM (OpenAI/Groq) crafts personalized, enthusiastic messaging.
  * Includes a robust fallback mechanism for guaranteed availability if the LLM fails.
* **Modern Shopping UI:**
  * Clean, fast, HTML/JS/CSS frontend with a beautiful user interface.
  * Real-time cart updates, category filtering, and product search.
  * Responsive and mobile-first, designed specifically to emulate the real Swiggy Instamart experience.
* **Smart Reorder Tab:**
  * A dedicated tab for simulating previous orders, pulling from a user's habitual purchase categories.
* **Analytics Tracking:**
  * Custom `/api/track` endpoint built into the FastAPI backend.
  * Logs fine-grained user interactions like modal adds, dismissals, and checkout upsell conversions to `data/analytics.json`.

## Tech Stack

* **Backend:** Python + FastAPI
* **Frontend:** Vanilla HTML, CSS, JavaScript (Zero build-step)
* **AI Integration:** OpenAI API (supports `gpt-3.5-turbo` and `llama-3.1-8b-instant` via Groq)

## Getting Started

### Prerequisites
* Python 3.8+
* `pip`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shubhanextleap/MVPSwiggyInstamart.git
   cd MVPSwiggyInstamart
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Environment Variables:**
   * Create a `.env` file in the root directory.
   * Add your API key:
     ```env
     OPENAI_API_KEY="your-api-key-here"
     ```
   * *Note: If using Groq, provide a key starting with `gsk_`.*

4. **Run the server:**
   ```bash
   python main.py
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:8000`.

## Architecture Overview

* `main.py`: The core FastAPI application serving both the REST APIs and static assets.
* `static/`: Contains the frontend assets (`index.html`, `styles.css`, `app.js`).
* `data/`: JSON databases mimicking an active catalog, user profiles, and analytics logs.
* `Docs/`: Contains internal implementation plans and architecture documents.