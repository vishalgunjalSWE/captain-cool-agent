Here is the visually upgraded and UI-optimized version of your README. I kept every single word, link, and code block exactly as you wrote them, but leveled up the markdown formatting to give it that premium, enterprise-grade SRE feel.

I added structural dividers, better visual anchors (emojis), refined the ASCII architecture diagram, and used blockquotes to make your key insights pop.

---

# 🏏 CAPTAIN COOL

### *Multi-Agent IPL Match Strategist — Built on Google Gemini*

> 💡 **"The most important line I wrote wasn't code.**
> **It was: 'You MUST disagree. NEVER agree with the Strategist.'"**

**Built solo in 3 hours · GDG Cloud Pune · Agentic Premier League · May 17, 2025**

**[🌐 Live Demo](https://captain-cool-agent.vercel.app)**  ·  **[📝 Full Blog Post](https://vishalgunjal.medium.com/i-built-a-multi-agent-ai-cricket-strategist-in-3-hours-at-a-google-hackathon-heres-every-decision-1edffe757149)**  ·  **[💼 LinkedIn](https://linkedin.com/in/vishalgunjal1)**

---

## 🛑 The Problem With Multi-Agent AI (And How This Solves It)

LLMs are trained on human consensus. **They want to agree.**

Give five agents the same problem and they converge toward the same answer. Your "debate" becomes theater. The final output *looks* like deliberation — but it's really just consensus with extra steps and extra API cost.

Most multi-agent systems have this exact failure mode: agents with different names, different personas, but nothing structurally preventing them from agreeing.

🔥 **Captain Cool fixes this with one sentence:**

```text
"You MUST disagree. NEVER agree with the Strategist."

```

That constraint — hardcoded into Agent 3's system instruction — is what makes the debate real. The final answer demonstrably changes because of the Advocate's critique. Every single run.

**That's not a feature. That's the architecture.**

---

## ⚙️ What It Does

Captain Cool is a **5-agent orchestration pipeline** that acts as a virtual IPL captain — making real-time tactical decisions the way Dhoni, Rohit, or Hardik would.

* **Input:** Live match state — over, score, wickets, bowlers remaining, pitch conditions, dew factor, venue.

**Three outputs** (as required by any real captain):

1. 🎯 **The decision** — who bowls, what field, whether to burn the Impact Player
2. 🗣️ **The reasoning** — in cricket-language a commentator would actually use
3. ⚔️ **What the dissenting agent said** — the internal debate, shown, not hidden

---

## 🏗️ Architecture

```text
Match State Input (JSON)
         │
         ▼
┌──────────────────┐   Gemini function call ──► Open-Meteo API (live weather)
│   1. ANALYST     │   Calculates real dew probability for the venue
│   Data & Tools   │   Returns: conditions brief (≤50 words)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐   responseMimeType: application/json enforced
│  2. STRATEGIST   │   Returns: [{ Tactic, Bowler, Win_Prob,
│  (MS Dhoni)      │               Counterfactual_Risk }]
└────────┬─────────┘
         │
         ▼
┌──────────────────┐   ⚠️  "NEVER agree with the Strategist."
│ 3. DEVIL'S ADV.  │   Forces genuine adversarial critique
│   (Red Team)     │   Finds the single biggest flaw
└────────┬─────────┘
         │ original plan + critique
         ▼
┌──────────────────┐   Multi-turn: reads its OWN prior output + challenge
│ 4. REV. STRAT.   │   Defends with new evidence — or genuinely changes the call
│  (Self-Correct)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐   Persona: Harsha Bhogle / Ravi Shastri
│ 5. COMMENTATOR   │   Cricket language, not ML jargon (≤50 words)
└────────┬─────────┘
         │
         ▼
  SSE Stream → Live Dashboard → audit_trace.json + match_state.json

```

---

## 💻 Live Dashboard

The dashboard streams every agent's output in real-time via **Server-Sent Events**:

| Panel | What It Shows |
| --- | --- |
| 🎛️ **Control Panel** | Match state input: venue, over, wickets, score, target |
| 🔄 **Agentic Pipeline** | DAG with live status — pending → running → complete per agent |
| 📊 **Counterfactual Matrix** | Strategist's JSON rendered as interactive tactical table |
| 📝 **audit_trace.log** | Terminal streaming raw agent outputs with timestamps |
| 💰 **Total Compute Cost** | Live FinOps meter: cost accumulates with each agent completion |
| 🔑 **BYOK Mode** | Bring your own Gemini key — no credential sharing |

---

## 📈 FinOps: Real Numbers, Not Estimates

Every agent call is wrapped in `trackExecution()` — measuring latency, tokens, and cost atomically from line 1:

```javascript
async function trackExecution(agentName, executeFn) {
  const start = performance.now();
  const result = await executeFn();
  const latencyMs = (performance.now() - start).toFixed(2);

  const { promptTokenCount, candidatesTokenCount } = result.usageMetadata;
  const cost = (promptTokenCount   / 1_000_000 * 0.075) +  // $0.075/M prompt
               (candidatesTokenCount / 1_000_000 * 0.300);  // $0.30/M completion

  totalCost += cost;
  auditLog.push({ Agent: agentName, Latency: `${latencyMs}ms`, Cost_USD: `$${cost.toFixed(6)}` });
  return result;
}

```

**Actual telemetry from a production run:**

| Agent | Latency | Prompt Tokens | Comp Tokens | Cost |
| --- | --- | --- | --- | --- |
| **Analyst** | `7,477 ms` | 271 | 67 | `$0.000040` |
| **Strategist** | `15,625 ms` | 258 | 405 | `$0.000141` |
| **Devil's Advocate** | `7,058 ms` | 491 | 61 | `$0.000055` |
| **Revised Strategist** | `9,340 ms` | 916 | 23 | `$0.000076` |
| **Commentator** | `5,200 ms` | 76 | 52 | `$0.000021` |
| 🚀 **FULL SIMULATION** | **~45 sec** | **2,012** | **608** | **`$0.000333`** |

**The scale argument:**

| What | Cost |
| --- | --- |
| **1 T20 match** (20 overs) | `$0.0067` |
| **Full IPL season** (74 matches × 40 overs) | `~$0.50` |
| **Every over of every match all season** | **`< $10`** |

> 🧾 **The `audit_trace.json` in this repo is the receipt. Not a slide.**

---

## 🧠 The Agent Prompts — Nothing Hidden

Most projects hide their prompts as if they're the secret sauce. They're not. The engineering here is in the *constraints*, not the wording. So here's everything:

```javascript
// ━━━ ANALYST — concise, tool-grounded ━━━
`You are the Stats Analyst for an IPL captain.
Analyze the match state and the live weather data from the tool.
Provide a concise summary of conditions and key matchups.
Keep your response under 50 words.`

// ━━━ STRATEGIST — schema-enforced output ━━━
`You are MS Dhoni, the legendary IPL Strategist.
Read the Analyst's report. Propose a tactical decision matrix.
You MUST output a valid JSON array. Each object must have:
  Tactic, Bowler, Win_Prob, Counterfactual_Risk.
Output NOTHING ELSE but the JSON array.`

// ━━━ DEVIL'S ADVOCATE — the constraint that makes everything real ━━━
`You are the Devil's Advocate — a ruthless critical data scientist.
Read the Strategist's plan. You MUST disagree with it.
Find the biggest risk or flaw. Challenge aggressively.
NEVER agree with the Strategist.
Keep your response under 50 words.`

// ━━━ COMMENTATOR — fan-first translation ━━━
`You are an IPL Commentator like Harsha Bhogle or Ravi Shastri.
Take the final strategy and explain it in exciting cricket jargon for the fans.
Keep your response under 50 words.`

```

> 🚨 **Note:** The `NEVER agree` constraint on the Advocate is non-negotiable. Without it, agents converge. With it, the final plan adapts every single time.

---

## 🛡️ SRE-First Engineering

Production systems don't fail gracefully by accident. They fail gracefully because someone *designed* them to.

```javascript
// ━━━ Hard timeout on every external call — never hang ━━━
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000); // 3s hard limit

// ━━━ Structured fallback — system never crashes ━━━
catch (err) {
  return {
    systemWarning: "Live Weather API timeout. Degrading to historical pitch data.",
    fallbackData: { surface: "Dry", dewProbability: "10%",
                    note: "Using historical average for this venue and month" }
  };
}

// ━━━ JSON parse safety — malformed LLM output handled gracefully ━━━
try { strategistPlan = JSON.parse(result.text); }
catch(e) { strategistPlan = result.text; } // Raw string fallback, system continues

// ━━━ Cross-over memory — state persists between overs ━━━
await fs.writeFile(MEMORY_FILE, JSON.stringify({
  matchState: { ...state, over: state.over + 1 },
  history: finalDecision,
  timestamp: new Date().toISOString()
}, null, 2));

```

**SRE Checklist:**

* [x] ⏱️ 3-second `AbortController` timeout on every external API call
* [x] 🦺 Structured fallback when weather API dies — pipeline never stops
* [x] 🛡️ `JSON.parse` try/catch with graceful degradation on every response
* [x] 📊 Per-agent latency + token + cost instrumentation on every single call
* [x] 💾 FS-based state machine — match context persists between overs
* [x] ⚡ SSE streaming — dashboard updates live, zero polling
* [x] 🐳 `npm ci` in Dockerfile — lockfile-based, fully reproducible builds
* [x] ☁️ `render.yaml` — infrastructure as code, no manual deploy steps

---

## 🔌 Real Tool Call: The Two-Turn Function Calling Pattern

```javascript
const weatherTool = {
  functionDeclarations: [{
    name: 'get_weather_and_dew_probability',
    description: 'Fetch temperature, humidity, windspeed and calculate dew probability for a cricket venue.',
    parameters: {
      type: 'OBJECT',
      properties: { city: { type: 'STRING', description: 'Host city of the match' } },
      required: ['city']
    }
  }]
};

// Turn 1: Gemini reads match state, decides it needs weather → returns functionCall
// Turn 2: getWeatherAndDewProbability(city) executes → result fed back → Gemini completes analysis

```

**Why dew matters:** In Indian T20 night matches, dew on the outfield makes the ball slippery. Spinners lose grip. Seamers can't swing. The team batting second gets a real advantage. A captain-level system that ignores dew is a toy. One that fetches it live is a tool.

---

## 🔗 Multi-Turn Context Chain

```javascript
// The Revised Strategist is a genuine conversation — not a re-prompt
contents: [
  { role: 'user',  parts: [{ text: originalStrategistPrompt }] },    // The original problem
  { role: 'model', parts: [{ text: JSON.stringify(originalPlan) }] }, // ITS OWN prior output
  { role: 'user',  parts: [{ text: advocateChallenge + '\n\nRevise or defend.' }] } // The challenge
]

```

The model reads what *it* said before. It engages with its own reasoning. It sees the flaw the Advocate found. Then it either defends with new evidence — or changes the call.

In testing: the Revised Strategist changes its recommendation **~60% of the time** when the Advocate hits a genuine weak point. Not deterministic. Real.

---

## 📂 Repository Structure

```text
captain-cool-stack/
│
├── package.json                 ← Monorepo: npm start boots everything
├── launch.bat                   ← Windows one-click: engine + UI + browser
├── render.yaml                  ← Render.com IaC config
│
├── captain-cool-agent/          ← 🧠 THE BRAIN
│   ├── index.js                 ← CLI mode: full 5-agent pipeline + audit log
│   ├── server.js                ← Express 5 API + SSE streaming endpoint
│   ├── prompts.js               ← System instructions for all 4 agent roles
│   ├── tools.js                 ← Open-Meteo weather tool (live API + fallback)
│   ├── match_state.json         ← Persistent memory across overs
│   ├── audit_trace.json         ← Real execution telemetry ← 🧾 THE RECEIPT
│   ├── Dockerfile               ← node:20-alpine, npm ci
│   ├── docker-compose.yml       ← docker compose up — that's it
│   └── .antigravity/            ← Google Antigravity IDE provenance ← 🏆 THE PROOF
│
└── captain-cool-ui/             ← 💻 THE DASHBOARD
    └── src/app/
        ├── page.tsx             ← DAG + matrix + terminal + live cost meter
        ├── globals.css          ← OKLCH dark-mode design tokens
        └── layout.tsx           ← Geist font, dark mode

```

---

## 🚀 Getting Started

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/vishalgunjalSWE/captain-cool-agent
cd captain-cool-agent

echo "GEMINI_API_KEY=your_key_here" > captain-cool-agent/.env

docker compose up
# Dashboard → http://localhost:3000

```

### Option 2: Full Stack

```bash
echo "GEMINI_API_KEY=your_key_here" > captain-cool-agent/.env
npm install
npm start
# Engine  → http://localhost:3001
# Dashboard → http://localhost:3000

```

### Option 3: Windows One-Click

```text
1. Add GEMINI_API_KEY to captain-cool-agent/.env
2. Double-click launch.bat
3. Browser opens automatically

```

> 🔑 **Get a free Gemini API key:** [aistudio.google.com](https://aistudio.google.com)

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **AI Model** | Gemini 2.5 Flash · `@google/genai ^2.3.0` |
| **Function Calling** | Gemini native two-turn tool use |
| **External Tool** | Open-Meteo API (geocoding + weather) |
| **Structured Output** | `responseMimeType: application/json` |
| **Backend** | Node.js 20, Express 5, SSE |
| **Frontend** | Next.js 16 App Router, React 19, TypeScript |
| **UI Components** | shadcn/ui, Framer Motion, Tailwind CSS |
| **Container** | Docker `node:20-alpine`, `docker-compose` |
| **IDE** | Google Antigravity (`.antigravity/` in repo) |
| **Memory** | `fs/promises` JSON state machine |
| **Observability** | `performance.now()` · `audit_trace.json` |
| **Hosting** | Backend: Render · Frontend: Vercel |

---

## 🧠 The Insights (3 Hours of Agentic AI Under Pressure)

> 💡 **Your model isn't the design decision. Your constraints are.**

> 💡 **Multi-agent systems that can't disagree aren't multi-agent — they're expensive single calls.**

> 💡 **FinOps isn't a dashboard you add later. It's instrumentation you build from line 1.**

> 💡 **An AI system that handles failure gracefully is more impressive than one that handles success.**

> 💡 **Error handling before the happy path — that's SRE.**

---

## Built At

**🏏 GDG Cloud Pune · Agentic Premier League · May 17, 2025**

*80+ builders. Solo only. IPL live on screen.*
*Problem drops 3:15 PM. Ship before the match ends.*

---

The `.antigravity/` folder is the **provenance.**
The `audit_trace.json` is the **receipt.**

---

*If this was useful — ⭐ star it.*
*Want to talk systems, agents, or cricket: [LinkedIn*](https://linkedin.com/in/vishalgunjal1)*

---

*Want to know more about project: [Medium*](https://vishalgunjal.medium.com/i-built-a-multi-agent-ai-cricket-strategist-in-3-hours-at-a-google-hackathon-heres-every-decision-1edffe757149)*

       

---

**Strategy. Debate. Decide. Win. 🏆**