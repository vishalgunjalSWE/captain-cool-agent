---
title: "Building 'Captain Cool': A Multi-Agent IPL Strategist with Google GenAI"
published: false
tags: nodejs, ai, architecture, srefirst
---

It’s 3:23 PM IST. The clock is ticking, and the pressure is on—just like a high-stakes IPL run chase. 

When you need a stable, high-performance demo that showcases true agentic orchestration, you skip the bloated frontend and get straight to the core: a modular Node.js CLI application. Today, I built **Captain Cool**, a multi-agent IPL strategist using the brand new `@google/genai` SDK and an SRE-first architecture. 

Here is how we architected a team of specialized AI agents that debate, critique, and formulate match-winning cricket strategies in real-time.

## The Architecture: An SRE-First Approach to Orchestration

Instead of relying on heavy frameworks, I engineered a highly decoupled, sequential orchestration loop. This provides maximum observability into each agent's input and output, ensuring predictable execution and easy debugging—a core SRE principle.

**The Pipeline:**
1. **Context Memory:** Uses `fs` to read/write state. The system remembers decisions from the previous over to establish a localized state machine.
2. **The Analyst (Tool Calling):** Ingests the match state and dynamically fetches live weather data (using the Open-Meteo API) to calculate the "Dew Factor".
3. **The Strategist:** Outputs a structured JSON "Tactical Matrix" containing win probabilities and counterfactuals, cleanly rendered via `console.table()`.
4. **The Devil's Advocate:** A critical data scientist agent that aggressively challenges the Strategist's plan to expose flaws.
5. **The Revised Strategist:** The captain takes the critique and refines the plan into a final, robust strategy.
6. **The Commentator:** Translates the final tactical decision into high-energy broadcast commentary for the fans.

*(Insert Excalidraw Architecture Diagram here)*

## The Core Loop: Forced Adversarial Tension

Here is how the prompts are structured to ensure each agent plays its specific role perfectly. Notice the strict constraints on word count and output format. 

The secret sauce here is the **Devil's Advocate** prompt. By explicitly instructing it to **"NEVER agree with the Strategist"**, we force genuine friction. LLMs naturally converge toward agreement (consensus bias). This constraint breaks that pattern and forces a real debate.

```javascript
// prompts.js
export const ANALYST_PROMPT = `You are the Stats Analyst. Analyze the match state and the live weather data. Provide a concise summary of the conditions and key matchups. Keep your response under 50 words.`;

export const STRATEGIST_PROMPT = `You are MS Dhoni, the Strategist. Read the Analyst's report. Propose a tactical decision matrix for the next over. You MUST output a valid JSON array of objects. Each object must have these exact keys: "Tactic" (string), "Bowler" (string), "Win_Prob" (string, e.g., "65%"), "Counterfactual_Risk" (string). Output NOTHING ELSE but the JSON array.`;

export const ADVOCATE_PROMPT = `You are the Devil's Advocate, a ruthless and critical data scientist. Read the Strategist's plan. You MUST disagree with it. Find the biggest risk or flaw in it based on the match state. Challenge the decision aggressively and propose a completely different angle. NEVER agree with the Strategist. Keep your response under 50 words.`;

export const COMMENTATOR_PROMPT = `You are an IPL Commentator (like Harsha Bhogle or Ravi Shastri). Take the final agreed-upon strategy and explain it to the fans in exciting, easy-to-understand cricket jargon. Keep your response under 50 words.`;
```

## Execution, Observability & FinOps

Running the application produces a beautiful simulation where you can see the agents thinking and debating. But this isn't just a demo.

I wrapped every Gemini call in `performance.now()` timers and tracked token usage. At the end of every execution, the script saves an `audit_trace.json` file. 

**FinOps Insight:** We calculate the cost of each run. A full simulation across 5 agents costs approximately **$0.000333**. Running the entire IPL season (74 matches) would cost under $20. This makes a compelling case for AI-powered sports analytics at scale.

*(Insert CLI Terminal Screenshot here showing the matrix and audit trace)*
*(Insert Dashboard Screenshot here showing the live UI)*

## Containerized and Production-Ready

To guarantee the environment is fully reproducible, I packaged the entire multi-agent system into a Docker container.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

Want to run the simulation? Just drop your API key in the `.env` and run:
`docker compose up`

## Why This Matters

By treating AI agents as microservices in a pipeline, we move beyond simple chatbots. We create a resilient, self-correcting system. With context persistence, strict data structuring, and execution telemetry, Captain Cool proves that you can build enterprise-grade decision engines rapidly.

Built using Google Antigravity. Provenance secured.
