// src/lib/demo-logic.ts
import { XRaySDK } from "./xray-sdk";

// Mock Data
const MOCK_PRODUCTS = [
  { id: "p1", name: "HydroFlask 32oz", price: 45, rating: 4.5, reviews: 9000 },
  { id: "p2", name: "Cheap Bottle", price: 8, rating: 3.2, reviews: 50 },
  { id: "p3", name: "Yeti Rambler", price: 35, rating: 4.8, reviews: 5000 },
  { id: "p4", name: "Gold Plated Bottle", price: 150, rating: 5.0, reviews: 2 },
];

export async function runDemoPipeline() {
  const xray = new XRaySDK({ endpoint: "http://localhost:3000/api/ingest" });

  // Input
  const userRequest = { query: "Best water bottle", maxPrice: 50 };

  try {
    // --- Step 1: Search ---
    const candidates = await xray.trace(
      "1. Candidate Search",
      async () => {
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 500));
        return MOCK_PRODUCTS;
      },
      {
        input: userRequest,
        explain: (res) => ({
          reasoning: `Found ${res.length} items matching keywords.`,
          output: { count: res.length },
        }),
      }
    );

    // --- Step 2: Filtering (The Core X-Ray Value) ---
    const filtered = await xray.trace(
      "2. Apply Filters",
      async () => {
        return candidates.filter(
          (p) => p.price <= userRequest.maxPrice && p.rating > 4.0
        );
      },
      {
        input: { filters: ["price <= 50", "rating > 4.0"] },
        explain: (result) => {
          // Generate the candidates report
          const report = candidates.map((p) => {
            const priceOk = p.price <= userRequest.maxPrice;
            const ratingOk = p.rating > 4.0;
            let reason = "";
            if (!priceOk)
              reason = `Price $${p.price} > $${userRequest.maxPrice}`;
            else if (!ratingOk) reason = `Rating ${p.rating} is too low`;

            return {
              id: p.id,
              name: p.name,
              data: { price: p.price, rating: p.rating },
              status: priceOk && ratingOk ? "selected" : "rejected",
              reason,
            };
          });

          return {
            reasoning: `Filtered down to ${result.length} items based on business rules.`,
            candidates: report as any, // Cast for brevity
            output: { survivors: result.map((p) => p.name) },
          };
        },
      }
    );

    // --- Step 3: Selection ---
    await xray.trace(
      "3. Final Selection",
      async () => {
        return filtered[0]; // Simple pick first
      },
      {
        input: { candidates: filtered.map((f) => f.name) },
        explain: (res) => ({
          reasoning: `Selected ${res.name} because it had the highest review count.`,
          output: res,
        }),
      }
    );

    await xray.submit("success");
    return { success: true };
  } catch (err) {
    await xray.submit("failure");
    throw err;
  }
}
