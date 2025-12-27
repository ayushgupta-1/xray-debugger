// src/lib/demo-logic.ts
import { XRaySDK } from "./xray-sdk";

// Reliable Mock Data with Dark Mode placeholder images
const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "HydroFlask 32oz Wide",
    price: 44.95,
    rating: 4.8,
    reviews: 12500,
    image:
      "https://images.unsplash.com/photo-1616740540792-3daec604777d?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "bottle",
  },
  {
    id: "p2",
    name: "Generic Plastic Bottle",
    price: 8.5,
    rating: 3.1,
    reviews: 45,
    image:
      "https://images.unsplash.com/photo-1616118133712-8c947f7b822c?q=80&w=1065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "bottle",
  },
  {
    id: "p3",
    name: "Yeti Rambler 26oz",
    price: 35.0,
    rating: 4.7,
    reviews: 5600,
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.sportsmans.com%2Fmedias%2Fyeti-rambler-26oz-insulated-bottle-with-chug-cap-sharptail-taupe-1701900-1.jpg%3Fcontext%3DbWFzdGVyfGltYWdlc3wzMTA3NXxpbWFnZS9qcGVnfGgxMy9oOTYvMTAwMDM1NDg0NzEzMjYvMTcwMTkwMC0xX2Jhc2UtY29udmVyc2lvbkZvcm1hdF8xMjAwLWNvbnZlcnNpb25Gb3JtYXR8NzdmMjE5N2U3NGI4MTIzZTk3YzRhZTY5ZjJmMThjMGYzODMyNWEzNDE0ODcwYmE0NDU0ODMyNzc5OTEzNDJhYw&f=1&nofb=1&ipt=cae14e373a46382635af4b674c90e373e0040d40a40d6d464301d078cb8339ed",
    category: "bottle",
  },
  {
    id: "p4",
    name: "Replacement Straw Lid",
    price: 12.0,
    rating: 4.5,
    reviews: 890,
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F71XMxuDHhKL._AC_.jpg&f=1&nofb=1&ipt=d877a8e6b63d1cab7130367186d9d47d2f09130778e470915f4dcb73b245b93d",
    category: "accessory",
  },
];

interface SimulationConfig {
  maxPrice: number;
  minRating: number;
}

export async function runDemoPipeline(config: SimulationConfig) {
  const xray = new XRaySDK({ endpoint: "/api/ingest" });

  try {
    // --- Step 1: Search ---
    const candidates = await xray.trace(
      "1. Candidate Search",
      async () => {
        await new Promise((r) => setTimeout(r, 600));
        return MOCK_PRODUCTS;
      },
      {
        input: { query: "insulated water bottle", ...config },
        explain: (res) => ({
          reasoning: `Retrieved ${res.length} candidates from Product API.`,
          output: { count: res.length },
        }),
      }
    );

    // --- Step 2: Filters ---
    const filtered = await xray.trace(
      "2. Hard Filters",
      async () => {
        return candidates.filter(
          (p) => p.price <= config.maxPrice && p.rating >= config.minRating
        );
      },
      {
        input: {
          filters: [
            `price <= ${config.maxPrice}`,
            `rating >= ${config.minRating}`,
          ],
        },
        explain: (result) => {
          const report = candidates.map((p) => {
            const priceOk = p.price <= config.maxPrice;
            const ratingOk = p.rating >= config.minRating;
            let reason = "";
            if (!priceOk) reason = `Price $${p.price} > $${config.maxPrice}`;
            else if (!ratingOk)
              reason = `Rating ${p.rating} < ${config.minRating}`;

            return {
              id: p.id,
              name: p.name,
              status: priceOk && ratingOk ? "selected" : "rejected",
              reason,
              data: { price: p.price, rating: p.rating, image: p.image },
            };
          });
          return {
            reasoning: `Dropped ${
              candidates.length - result.length
            } candidates based on user preferences.`,
            candidates: report as any,
          };
        },
      }
    );

    // --- Step 3: LLM Check ---
    // FIX: Assigned the result to 'finalSelection' variable
    const finalSelection = await xray.trace(
      "3. LLM Semantic Check",
      async () => {
        await new Promise((r) => setTimeout(r, 800));
        return filtered.filter((p) => p.category === "bottle");
      },
      {
        input: {
          prompt: "Is this a standalone water bottle? Reject accessories.",
        },
        explain: (result) => {
          const report = filtered.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.category === "bottle" ? "selected" : "rejected",
            reason:
              p.category !== "bottle" ? "Detected as Accessory" : undefined,
            data: { image: p.image },
          }));
          return {
            reasoning: `LLM identified ${
              filtered.length - result.length
            } false positives.`,
            candidates: report as any,
          };
        },
      }
    );

    // --- Step 4: Rank & Select ---
    await xray.trace(
      "4. Rank & Select",
      async () => {
        // FIX: Now we can safely use finalSelection
        const sorted = [...finalSelection].sort(
          (a, b) => b.reviews - a.reviews
        );
        return sorted[0] || null;
      },
      {
        input: {
          candidates: finalSelection.map((p) => p.name),
          criterion: "Highest Review Count",
        },
        explain: (winner) => {
          if (!winner)
            return {
              reasoning: "No candidates survived the pipeline.",
              candidates: [],
            };

          const rankedReport = finalSelection
            .sort((a, b) => b.reviews - a.reviews)
            .map((p, index) => ({
              id: p.id,
              name: p.name,
              status: index === 0 ? "selected" : "rejected", // Only #1 wins
              reason:
                index === 0
                  ? "Winner: Highest Review Count"
                  : `Rank #${index + 1} (Lower reviews)`,
              data: { reviews: p.reviews, image: p.image },
            }));

          return {
            reasoning: winner
              ? `Selected ${winner.name} (${winner.reviews} reviews).`
              : "No winner.",
            candidates: rankedReport as any,
          };
        },
      }
    );

    await xray.submit("success");
    return { success: true };
  } catch (err) {
    await xray.submit("failure");
    throw err;
  }
}
