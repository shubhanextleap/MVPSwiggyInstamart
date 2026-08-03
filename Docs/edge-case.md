# Corner & Edge Cases: Swiggy Instamart AI "Detour" Engine

When building a non-deterministic AI feature into a high-traffic e-commerce checkout flow, several edge cases must be addressed to ensure a seamless user experience and prevent brand damage.

## 1. User History Edge Cases (Data Constraints)

*   **The "Cold Start" (New User):**
    *   *Scenario:* A user with zero purchase history adds items to their cart. We don't have "Habitual Categories."
    *   *Resolution:* Fall back to global popular categories as the baseline, or rely purely on the *current* cart contents to suggest a globally trending cross-category item.
*   **The "Power User" (No Unexplored Categories):**
    *   *Scenario:* A highly active user has already purchased from every single category available on Instamart.
    *   *Resolution:* Shift the objective from "new category" to "new sub-category" or "new brand" within their least frequently purchased categories.

## 2. Cart Context Edge Cases

*   **The "Empty Cart" Checkout:**
    *   *Scenario:* User navigates to the checkout screen via a deep link or glitch with zero items.
    *   *Resolution:* The AI prompt requires cart context. If cart is empty, do not trigger the AI LLM call; hide the component entirely.
*   **Conflicting or Sensitive Cart Items:**
    *   *Scenario:* The cart contains a mix of sensitive items (e.g., family planning products + children's toys) or heavily restricted items (e.g., alcohol/tobacco).
    *   *Resolution:* Implement a deterministic pre-filter. If the cart contains flagged sensitive categories, bypass the LLM and show standard, safe recommendations (like generic groceries) or hide the component.
*   **Massive Carts (Token Limits):**
    *   *Scenario:* A user adds 150 unique items to their cart for a monthly restock.
    *   *Resolution:* Truncate the payload sent to the LLM. Only send the top 5 most expensive or most relevant items to summarize the cart's intent without exceeding token limits or causing latency.

## 3. LLM Failure & Hallucination Cases

*   **Inventory Hallucination:**
    *   *Scenario:* The LLM recommends a product ID that does not exist in the database, or worse, recommends a competitor's product by name in the rationale.
    *   *Resolution:* The backend must validate the LLM's `productId` output against the live database *before* sending it to the frontend. If invalid, trigger fallback.
*   **Out-of-Stock (OOS) Reality:**
    *   *Scenario:* The LLM correctly selects an unexplored category and a valid product ID, but that specific item is out of stock at the user's nearest dark store.
    *   *Resolution:* The backend validation layer must check live inventory status. If OOS, trigger fallback.
*   **Inappropriate Rationale Generation:**
    *   *Scenario:* The LLM generates a rationale that is nonsensical, slightly offensive, or assumes too much about the user (e.g., "Since you bought so much junk food, you need this diet supplement").
    *   *Resolution:* 
        1.  Strict system prompt engineering enforcing a polite, helpful, and neutral brand tone.
        2.  Client-side reporting (a "thumbs down" or "not relevant" button) to flag bad rationales for prompt refinement.

## 4. Technical Edge Cases

*   **High Latency / LLM Timeout:**
    *   *Scenario:* The LLM provider (OpenAI/Anthropic) experiences an outage or takes > 2 seconds to respond, blocking the checkout flow.
    *   *Resolution:* Set a strict API timeout (e.g., 800ms). If the LLM doesn't respond in time, instantly switch to a pre-computed deterministic recommendation (e.g., standard Collaborative Filtering).
*   **Malformed JSON Output:**
    *   *Scenario:* The LLM ignores the structured output command and returns conversational text instead of a JSON object.
    *   *Resolution:* Backend JSON parsing wrap. If parsing fails, do not attempt to retry (to save latency); immediately trigger the fallback recommendation.
