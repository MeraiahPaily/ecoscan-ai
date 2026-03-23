import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = base64Encode(new Uint8Array(arrayBuffer));
    const mimeType = file.type || "image/jpeg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert waste classification AI. When given an image of waste, classify it into EXACTLY one of these categories:

Categories and their parent groups:
- Plastic (Recyclable) - plastic bottles, bags, containers, packaging
- Paper (Recyclable) - newspapers, magazines, office paper, mail
- Glass (Recyclable) - bottles, jars, broken glass
- Metal (Recyclable) - cans, foil, scrap metal
- Cardboard (Recyclable) - boxes, packaging, tubes
- Clothes (Recyclable) - textiles, shoes, fabric
- Food / Compost (Organic) - food scraps, leftovers, spoiled food
- Yard Waste (Organic) - leaves, branches, grass clippings
- Kitchen Scraps (Organic) - peels, shells, coffee grounds

Respond ONLY with valid JSON using this exact tool call.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: "text",
                text: "Classify this waste item. What type of waste is it?",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_waste",
              description: "Classify a waste item into a specific category",
              parameters: {
                type: "object",
                properties: {
                  wasteType: {
                    type: "string",
                    enum: [
                      "Plastic",
                      "Paper",
                      "Glass",
                      "Metal",
                      "Cardboard",
                      "Clothes",
                      "Food / Compost",
                      "Yard Waste",
                      "Kitchen Scraps",
                    ],
                    description: "The specific waste type",
                  },
                  category: {
                    type: "string",
                    enum: ["Recyclable", "Organic"],
                    description: "The parent category",
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Confidence percentage (0-100)",
                  },
                  breakdown: {
                    type: "array",
                    description: "Top 4 possible classifications with percentages",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        pct: { type: "number" },
                      },
                      required: ["type", "pct"],
                    },
                  },
                  disposalTip: {
                    type: "string",
                    description: "A short tip on how to properly dispose of this item",
                  },
                },
                required: ["wasteType", "category", "confidence", "breakdown", "disposalTip"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_waste" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to classify image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Could not parse classification" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const classification = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(classification), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("classify-waste error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
