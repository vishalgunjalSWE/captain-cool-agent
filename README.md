# 🏏 Captain Cool — Multi-Agent IPL Match Strategist

> *Built in 3 hours at GDG Cloud Pune Hackathon. Powered entirely by Google Gemini 2.5 Flash.*

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Google Antigravity](https://img.shields.io/badge/IDE-Google%20Antigravity-34A853?style=flat-square)](https://antigravity.dev/)
[![Node.js](https://img.shields.io/badge/Engine-Node.js%2020-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js%2016-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=flat-square&logo=docker)](https://docker.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=flat-square)](https://opensource.org/licenses/ISC)

---

## The Problem

Cricket captaincy is one of the hardest real-time decision problems in sport. In a T20 match, a captain has roughly **30 seconds** to decide:

- Who bowls this over — and against which batsman?
- Do I change the field to a left-hander at the non-striker end?
- Is the dew heavy enough that a spinner's grip is compromised?
- Has this bowler been threatened enough that I should pull him before he finishes his quota?

Bad calls cost matches. There are no take-backs.

The hackathon challenge was to build an **agentic AI system** that makes these calls the way Dhoni, Rohit, or Hardik would — with real reasoning, real debate, and output a cricket fan would actually understand.

The constraint that mattered: **100% Google Gemini stack. No OpenAI. No Claude. If you cheated, you were disqualified.**

---

## The Solution

I built a **5-agent orchestration pipeline** where agents genuinely debate before committing to a call.

Not one LLM wearing five hats. Five separate Gemini API calls, each with its own system instruction, its own role, and its own constraints that force real friction between them.

```
Match State Input
      │
      ▼
┌─────────────┐     fetches live weather via
│   ANALYST   │ ──► Open-Meteo API (real tool call)
└──────┬──────┘     calculates dew probability
       │
       ▼
┌─────────────┐     outputs strict JSON Tactical Matrix
│  STRATEGIST │     with win probabilities per option
│ (MS Dhoni)  │     uses responseMimeType: application/json
└──────┬──────┘
       │
       ▼
┌─────────────┐     system prompt says: NEVER agree
│   DEVIL'S   │     forced adversarial critique
│   ADVOCATE  │     finds the single biggest flaw
└──────┬──────┘
       │
       ▼
┌─────────────┐     receives original plan + critique
│  REVISED    │     multi-turn context: sees its own prior output
│  STRATEGIST │     defends or changes the call
└──────┬──────┘
       │
       ▼
┌─────────────┐     translates dry decision into
│ COMMENTATOR │     cricket jargon for the fans
│(Harsha/Ravi)│     "the leggie is wasted in this dew"
└─────────────┘
       │
       ▼
  SSE Stream → Real-time Dashboard → audit_trace.json
```

The final answer demonstrably changes because of the Advocate's critique. That's not a UI feature — that's the whole point.

---

## Why I Went Deep on Backend & SRE — Not the Frontend

Most hackathon projects spend 80% of their time on the UI and hope the demo looks impressive enough that nobody asks hard questions.

I went the other direction.

**The backend is where the real engineering lives.** Any frontend can be polished in a few hours. But building a multi-agent system where:

- agents have hard role constraints that prevent them from agreeing when they shouldn't
- external API calls have 3-second timeouts and graceful fallback paths
- every LLM call is individually instrumented for latency and token cost
- state persists between overs like a proper state machine
- the whole thing is containerized so it runs identically everywhere

That takes deliberate thought about **failure modes**, not just happy paths.

### The FinOps Angle

I wanted to prove that AI orchestration at this level doesn't cost a fortune. So I built cost accounting into the system from the start — not as an afterthought.

Every agent call calculates:
```
cost = (promptTokens / 1M × $0.075) + (compTokens / 1M × $0.30)
```

Actual numbers from a real run:

| Agent | Latency | Tokens | Cost |
|-------|---------|--------|------|
| Analyst | 7,477 ms | 338 | $0.000040 |
| Strategist | 15,625 ms | 663 | $0.000141 |
| Advocate | 7,058 ms | 552 | $0.000055 |
| Revised Strategist | 9,340 ms | 939 | $0.000076 |
| Commentator | 5,200 ms | 128 | $0.000021 |
| **Full simulation** | **~45s** | **2,620** | **$0.000333** |

**$0.000333 per match simulation.** You could run every over of an entire IPL season for under $5. That's the argument I wanted to make with real data — not theory.

### The SRE Angle

Production systems fail. External APIs time out. LLMs occasionally return malformed JSON. I designed for this:

```javascript
// 3-second hard timeout on every external call
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 3000);

// If weather API dies, system doesn't crash
catch (err) {
    return {
        systemWarning: "Live Weather API timeout. Degrading to historical pitch data.",
        fallbackData: { surface: "Dry", dewProbability: "10%" }
    };
}
```

```javascript
// JSON parse can fail — handle it
try { strategistPlan = JSON.parse(strategistResult.text); }
catch(e) { strategistPlan = []; }
```

```javascript
// Memory persists state across overs
await fs.writeFile(MEMORY_FILE, JSON.stringify(nextState, null, 2));
```

This is what "SRE-first" actually means: you write the error handling before you write the happy path.

---

## Repository Structure

```
captain-cool-stack/
│
├── package.json              # monorepo: npm start boots everything
├── launch.bat                # Windows one-click: engine + UI + browser
│
├── captain-cool-agent/       # The Brain
│   ├── index.js              # CLI mode (5-agent pipeline, audit log)
│   ├── server.js             # Express API (SSE streaming for dashboard)
│   ├── prompts.js            # System instructions for all 4 agent roles
│   ├── tools.js              # Open-Meteo weather tool (live API + fallback)
│   ├── match_state.json      # Persistent memory — saved between overs
│   ├── audit_trace.json      # Real execution telemetry from last run
│   ├── Dockerfile            # node:20-alpine
│   ├── docker-compose.yml    # docker compose up — that's it
│   └── .antigravity/         # Google Antigravity provenance
│
└── captain-cool-ui/          # The Dashboard
    └── src/app/
        ├── page.tsx          # Full dashboard: DAG + matrix + terminal + cost meter
        ├── globals.css       # OKLCH dark-mode design tokens
        └── layout.tsx        # Geist font, dark class forced
```

---

## Getting Started

### Option 1: Docker (Recommended — Zero Environment Issues)

```bash
git clone https://github.com/yourusername/captain-cool-agent
cd captain-cool-agent
echo "GEMINI_API_KEY=your_key_here" > .env
docker compose up
```

### Option 2: Full Stack (Engine + Dashboard)

```bash
# Root of monorepo
echo "GEMINI_API_KEY=your_key_here" > captain-cool-agent/.env
npm install
npm start

# That's it. Both services boot. Dashboard opens at http://localhost:3000
```

### Option 3: Windows One-Click

```
Add your API key to captain-cool-agent/.env
Double-click launch.bat
```

---

## The Agent Prompts (What Makes Them Real)

I'm showing these because most people hide their prompts. There's nothing to hide — the engineering is in the *constraints*, not the secret sauce.

```javascript
// The Analyst — concise, tool-dependent
"You are the Stats Analyst. Analyze the match state and the live weather data.
Provide a concise summary of the conditions and key matchups. Keep your response under 50 words."

// The Strategist — forces structured output
"You are MS Dhoni, the Strategist. Read the Analyst's report.
Propose a tactical decision matrix for the next over.
You MUST output a valid JSON array of objects.
Each object must have: Tactic, Bowler, Win_Prob, Counterfactual_Risk.
Output NOTHING ELSE but the JSON array."

// The Advocate — the most important constraint in the system
"You are the Devil's Advocate, a ruthless and critical data scientist.
Read the Strategist's plan. You MUST disagree with it.
Find the biggest risk or flaw. Challenge aggressively.
NEVER agree with the Strategist. Keep your response under 50 words."

// The Commentator — fan-first translation
"You are an IPL Commentator (like Harsha Bhogle or Ravi Shastri).
Take the final agreed-upon strategy and explain it to the fans in exciting cricket jargon.
Keep your response under 50 words."
```

The `NEVER agree` constraint on the Advocate is intentional and non-negotiable. Without it, agents converge toward agreement and the debate becomes theater. With it, the final plan genuinely adapts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | `@google/genai ^2.3.0` — Gemini 2.5 Flash |
| Function Calling | Gemini native tool use — real live API |
| External Tool | Open-Meteo API (geocoding + weather) |
| Backend | Node.js 20, Express 5, SSE streaming |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI Components | shadcn/ui, Framer Motion, Tailwind CSS, Lucide |
| Container | Docker (node:20-alpine), docker-compose |
| IDE | Google Antigravity |
| Memory | `fs/promises` JSON persistence |
| Observability | `performance.now()` per agent, `audit_trace.json` |

---

## Match Scenario Walkthrough

Here is how the system handles a high-stakes scenario.

**Scenario:** Over 19, chasing 185, score is 167/6 (18 needed off 12 balls). Two aggressive left-handed batsmen on strike. Only an inexperienced off-spinner and a part-time medium pacer remain.

1. **Analyst** assessed the high humidity and calculated a 70% Dew Probability, advising against the spinner.
2. **Strategist** proposed using the part-time medium pacer to avoid the spinner in the dew.
3. **Devil's Advocate** challenged this, noting the medium pacer's poor record against left-handers.
4. **Revised Strategist** decided to stick with the medium pacer but instructed a defensive wide-line field setting to mitigate the risk.

*(Insert Screenshot of Dashboard showing the DAG and Terminal output for this scenario)*

---

## What the Judges Cared About (And How We Did)

The hackathon scored on four axes — 250 points each:

**Relevance** — Does this solve the actual problem or is it a wrapper?  
Three distinct outputs: the decision, the reasoning, the dissent. Real dew factor from live weather. Match state persisted across overs. This is a cricket strategist, not a cricket chatbot.

**Technical Depth** — Real Gemini orchestration or just prompt-stuffing?  
Five separate API calls. Real function calling. `responseMimeType: application/json` enforced. Multi-turn context chain where the Revised Strategist literally reads its own prior output. SSE streaming backend. Dockerized.

**Innovation & Agentic Design** — Did you go beyond the obvious?  
The `NEVER agree` constraint. The counterfactual matrix with per-option win probabilities. Live FinOps cost metering in the dashboard. Context memory as a state machine. DAG pipeline visualizer.

**Documentation & Blog** — Can someone understand it from the outside?  
You're reading it. Read the detailed write-up on [dev.to](https://dev.to/yourusername/building-captain-cool-multi-agent-ipl-strategist-with-google-genai-...) or check out the [AI Studio Prompt Prototype](https://aistudio.google.com/...).

---

## Built at GDG Cloud Pune

3-hour build window. One developer. Google Antigravity IDE throughout.

The `.antigravity/` folder in this repo is the provenance — it's the IDE's equivalent of a git signature that this was built the way it says it was.

---

*If you found this useful or interesting — star it. If you want to talk systems, agents, or cricket: find me on LinkedIn or Twitter.*
