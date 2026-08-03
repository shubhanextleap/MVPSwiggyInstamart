# Phase-Wise Implementation Plan: Swiggy Instamart AI-Native MVP

This document outlines the step-by-step execution plan for building the "Contextual Detour Engine" MVP, based on the established architecture and problem statement.

## Phase 1: Foundation and Mock Data
**Goal:** Set up the basic environment and create the necessary data structures to simulate a real user environment.
*   **1.1 Project Setup:** Initialize a Python backend (e.g., FastAPI) and a static vanilla HTML/JS frontend to be deployed on Render.
*   **1.2 Define Data Schemas:** Create mock JSON structures for:
    *   `Users`: Including their purchase history and calculated "Habitual Categories" (e.g., Snacks, Beverages).
    *   `Product Catalog`: A robust mock database of items across various categories (including unexplored ones like Personal Care or Pet Supplies).
    *   `Active Cart`: The current state of a user's checkout session.
*   **1.3 Basic API Routes:** Build simple REST endpoints to fetch the catalog and user cart data.

## Phase 2: Core Backend & AI Integration
**Goal:** Build the "brain" of the application—the AI Discovery Agent.
*   **2.1 Classification Logic:** Write the backend service that compares a user's `Habitual Categories` against the full catalog to generate a dynamic list of `Unexplored Categories`.
*   **2.2 LLM Service Setup:** Integrate the chosen LLM API (e.g., OpenAI or Anthropic).
*   **2.3 Prompt Engineering:** Design the system prompt that takes the active cart and unexplored categories as inputs to formulate a creative cross-category recommendation.
*   **2.4 Structured Outputs & Guardrails:** Enforce strict JSON output from the LLM (returning only valid `productId` and a rationale). Implement logic to filter out restricted categories (e.g., alcohol).
*   **2.5 Fallback Mechanism:** Implement a deterministic collaborative filtering fallback that triggers instantly if the LLM fails, hallucinates, or times out.

## Phase 3: Frontend "What's New" UI
**Goal:** Build the user-facing interface that seamlessly presents the AI recommendation before checkout, maintaining the authentic look and feel of Swiggy Instamart.
*   **3.1 Cart & Checkout UI:** Build a high-fidelity representation of the Swiggy Instamart cart screen, closely mimicking its branding, colors, and layout.
*   **3.2 "What's New" Component:** Design and integrate this specific AI-driven UI block that displays the recommended product and the generated rationale.
*   **3.3 State Management:** Ensure smooth loading states while the AI agent fetches the recommendation in the background.

## Phase 4: Testing, Deployment & Presentation Prep
**Goal:** Ensure robustness, prepare the live workflow demonstration, and deploy to production.
*   **4.1 End-to-End Testing:** Simulate various cart scenarios to test the LLM's reasoning and ensure the fallback mechanism triggers correctly during simulated API failures.
*   **4.2 Metric Tracking Setup:** Implement basic logging to track our primary metric: "Day 30 Retention of Detour" (simulated by tracking if the user clicks and adds the recommended item).
*   **4.3 Visual Assets:** Finalize the Mermaid system architecture diagrams and high-fidelity wireframes.
*   **4.4 Version Control & Deployment:** Push the final codebase to GitHub and deploy the live MVP feature onto a Render app for mentors to test.
