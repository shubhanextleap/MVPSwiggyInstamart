# Swiggy Instamart: AI-Driven Quick Commerce System Architecture

This document outlines the high-level system architecture for the Swiggy Instamart Hybrid AI MVP. The architecture is designed for a strict separation of concerns between the client, backend, data layer, and external AI services.

## 1. FRONTEND (Client Side)
The frontend is designed to be lightweight, fast, and mobile-first, operating entirely on the client side without heavy frameworks.

* **Mobile UI (Vanilla JS):** The visual presentation layer that renders the home page, cart, and the AI detour pop-up.
* **Cart State Store:** Manages the local state of the user's shopping cart (items, quantities, and totals) entirely within the browser.
* **Telemetry Hub:** Asynchronously captures user interactions (e.g., pop-up views, add-to-cart clicks) and transmits them to the backend without blocking the UI thread.

*Data Flow:* The frontend interacts with the system exclusively by calling the backend REST API endpoints.

## 2. BACKEND (FastAPI Controller)
The backend acts as the central coordinator, orchestrating requests from the frontend, reading from the data layer, and communicating with external AI services.

* **Hybrid-AI Controller:** The main orchestrator endpoint. It coordinates between the internal data layer and the external LLM service to formulate the final AI Detour pop-up response.
* **Deterministic Selection Engine:** The critical safety layer (highlighted). It reads from the inventory and user profiles to deterministically select a guaranteed in-stock, targeted product. This ensures the AI never hallucinates pricing or product availability.
* **Analytics Logger:** Receives asynchronous event payloads from the frontend's Telemetry Hub and writes them to the data layer.

## 3. DATA LAYER (JSON Storage)
A lightweight file-based data layer used for rapid MVP iteration.

* **`catalog.json`:** The source of truth for product inventory, pricing, categories, and stock status. Read by the Deterministic Selection Engine.
* **`users.json`:** Contains user profiles, historical grocery purchase data, and target detour product mappings. Read by the Deterministic Selection Engine.
* **`telemetry_log.json`:** An append-only log file where the Analytics Logger writes all frontend telemetry events. (Note: implemented in code as `analytics.json`).

## 4. EXTERNAL SERVICES
The generative layer of the application.

* **LLM Provider (OpenAI/Groq):** A large language model accessed via API. 
* *Data Flow:* The Hybrid-AI Controller securely sends *only* the specific context (the user's grocery history + the deterministically selected item). The LLM processes this context and returns a highly personalized, enthusiastic messaging response, which the backend then forwards to the frontend.
