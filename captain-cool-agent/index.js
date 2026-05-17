import { GoogleGenAI } from '@google/genai';
import { getWeatherAndDewProbability } from './tools.js';
import { ANALYST_PROMPT, STRATEGIST_PROMPT, ADVOCATE_PROMPT, COMMENTATOR_PROMPT } from './prompts.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m"
};

const MEMORY_FILE = './match_state.json';
const AUDIT_FILE = './audit_trace.json';

const initialState = {
  innings: 2,
  over: 19, // Final over
  target: 185,
  currentScore: 167, // 18 runs to defend
  wicketsDown: 6,
  batsmen: ["Aggressive left-handed pinch hitter", "Aggressive left-handed pinch hitter"],
  bowlersAvailable: ["Inexperienced off-spinner (1 over left)", "Part-time medium pacer (1 over left)"],
  unavailable: ["Best fast bowler (0 overs left)"]
};
const venue = "Pune";

const auditLog = [];
let totalCost = 0;

async function trackExecution(agentName, executeFn) {
  const start = performance.now();
  const result = await executeFn();
  const end = performance.now();
  const latency = (end - start).toFixed(2);
  
  const usage = result.usageMetadata || {};
  const promptTokens = usage.promptTokenCount || 0;
  const compTokens = usage.candidatesTokenCount || 0;
  
  // Gemini 2.5 Flash pricing (approx: $0.075 / 1M prompt, $0.30 / 1M comp)
  const cost = ((promptTokens / 1000000) * 0.075) + ((compTokens / 1000000) * 0.30);
  totalCost += cost;
  
  auditLog.push({
    Agent: agentName,
    "Latency (ms)": latency,
    "Prompt Tokens": promptTokens,
    "Comp Tokens": compTokens,
    "Cost ($)": cost.toFixed(6)
  });
  
  return { text: result.text, latency };
}

async function runMatchSimulation() {
  console.log(`${colors.bold}=== SRE-GRADE MATCH SIMULATION INITIALIZED ===${colors.reset}\n`);
  
  // Memory Load (Context Persistence)
  let matchState = { ...initialState };
  let previousHistory = "";
  try {
    const memory = await fs.readFile(MEMORY_FILE, 'utf-8');
    const parsed = JSON.parse(memory);
    matchState = parsed.matchState;
    previousHistory = parsed.history || "No previous history.";
    console.log(`${colors.cyan}[System] Context restored from match_state.json (Over: ${matchState.over})${colors.reset}\n`);
  } catch (err) {
    console.log(`${colors.cyan}[System] No previous memory found. Starting high-stakes scenario (Over: ${matchState.over}).${colors.reset}\n`);
  }
  
  const modelName = "gemini-2.5-flash";
  
  const weatherTool = {
    functionDeclarations: [{
      name: "get_weather_and_dew_probability",
      description: "Get the current temperature, humidity, and dew probability for a given city.",
      parameters: {
        type: "OBJECT",
        properties: {
          city: { type: "STRING", description: "The name of the city, e.g., 'Pune'" }
        },
        required: ["city"]
      }
    }]
  };
  
  // 1. ANALYST Phase
  console.log(`${colors.cyan}--> 1. ANALYST (Fetching Telemetry & Analyzing)${colors.reset}`);
  const analystPrompt = `Previous History: ${previousHistory}\nMatch State: ${JSON.stringify(matchState)}. Venue: ${venue}. Fetch the weather and analyze.`;
  
  const { text: analystFinalText, latency: analystLatency } = await trackExecution("Analyst", async () => {
    let resp = await ai.models.generateContent({
      model: modelName,
      contents: analystPrompt,
      config: { systemInstruction: ANALYST_PROMPT, tools: [weatherTool] }
    });
    
    if (resp.functionCalls && resp.functionCalls.length > 0) {
      const call = resp.functionCalls[0];
      if (call.name === "get_weather_and_dew_probability") {
        console.log(`    ${colors.magenta}[Tool Call] Fetching weather for ${call.args.city}...${colors.reset}`);
        const weatherData = await getWeatherAndDewProbability(call.args.city);
        
        resp = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: analystPrompt }] },
            { role: 'model', parts: resp.candidates[0].content.parts },
            { role: 'user', parts: [{ functionResponse: { name: call.name, response: weatherData } }] }
          ],
          config: { systemInstruction: ANALYST_PROMPT, tools: [weatherTool] }
        });
      }
    }
    return { text: resp.text, usageMetadata: resp.usageMetadata };
  });
  console.log(`\n${colors.cyan}${colors.bold}ANALYST REPORT [${analystLatency}ms]:${colors.reset}\n${colors.cyan}${analystFinalText}${colors.reset}\n`);

  // 2. STRATEGIST Phase
  console.log(`${colors.green}--> 2. STRATEGIST (Formulating Tactic Matrix)${colors.reset}`);
  const strategistPrompt = `Analyst's Report: ${analystFinalText}\nMatch State: ${JSON.stringify(matchState)}`;
  const { text: strategistJSON, latency: strategistLatency } = await trackExecution("Strategist", async () => {
    const resp = await ai.models.generateContent({
      model: modelName,
      contents: strategistPrompt,
      config: { 
        systemInstruction: STRATEGIST_PROMPT,
        responseMimeType: "application/json"
      }
    });
    return { text: resp.text, usageMetadata: resp.usageMetadata };
  });
  
  let strategistPlan = [];
  try {
    strategistPlan = JSON.parse(strategistJSON);
    console.log(`\n${colors.green}${colors.bold}STRATEGIST MATRIX [${strategistLatency}ms]:${colors.reset}`);
    console.table(strategistPlan);
  } catch(e) {
    console.log(`\n${colors.green}${colors.bold}STRATEGIST PLAN [${strategistLatency}ms]:${colors.reset}\n${strategistJSON}`);
    strategistPlan = strategistJSON; 
  }
  
  // 3. ADVOCATE Phase
  console.log(`\n${colors.red}--> 3. ADVOCATE (Red Team Critique)${colors.reset}`);
  const advocatePrompt = `Strategist's Matrix: ${JSON.stringify(strategistPlan)}\nMatch State: ${JSON.stringify(matchState)}`;
  const { text: advocateCritique, latency: advocateLatency } = await trackExecution("Advocate", async () => {
    const resp = await ai.models.generateContent({
      model: modelName,
      contents: advocatePrompt,
      config: { systemInstruction: ADVOCATE_PROMPT }
    });
    return { text: resp.text, usageMetadata: resp.usageMetadata };
  });
  console.log(`\n${colors.red}${colors.bold}ADVOCATE CRITIQUE [${advocateLatency}ms]:${colors.reset}\n${colors.red}${advocateCritique}${colors.reset}\n`);

  // 4. REVISED STRATEGIST Phase
  console.log(`${colors.green}--> 4. STRATEGIST (Finalizing Strategy)${colors.reset}`);
  const strategistRevisedPrompt = `Original Matrix: ${JSON.stringify(strategistPlan)}\nAdvocate's Critique: ${advocateCritique}\nRevise the plan and output the final single tactical decision in plain text.`;
  const { text: finalPlan, latency: revisedLatency } = await trackExecution("Revised_Strategist", async () => {
    const resp = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: strategistPrompt }] },
        { role: 'model', parts: [{ text: JSON.stringify(strategistPlan) }] },
        { role: 'user', parts: [{ text: strategistRevisedPrompt }] }
      ],
      config: { systemInstruction: "You are MS Dhoni. Output the final tactical decision concisely in plain text." }
    });
    return { text: resp.text, usageMetadata: resp.usageMetadata };
  });
  console.log(`\n${colors.green}${colors.bold}FINAL STRATEGY [${revisedLatency}ms]:${colors.reset}\n${colors.green}${finalPlan}${colors.reset}\n`);

  // 5. COMMENTATOR Phase
  console.log(`${colors.yellow}--> 5. COMMENTATOR (Broadcast)${colors.reset}`);
  const commentatorPrompt = `Final Strategy: ${finalPlan}`;
  const { text: commentatorResponse, latency: commentatorLatency } = await trackExecution("Commentator", async () => {
    const resp = await ai.models.generateContent({
      model: modelName,
      contents: commentatorPrompt,
      config: { systemInstruction: COMMENTATOR_PROMPT }
    });
    return { text: resp.text, usageMetadata: resp.usageMetadata };
  });
  console.log(`\n${colors.yellow}${colors.bold}COMMENTARY [${commentatorLatency}ms]:${colors.reset}\n${colors.yellow}${commentatorResponse}${colors.reset}\n`);
  
  // Memory Save
  const nextState = {
    matchState: { ...matchState, over: matchState.over + 1 },
    history: finalPlan
  };
  await fs.writeFile(MEMORY_FILE, JSON.stringify(nextState, null, 2));
  console.log(`${colors.cyan}[System] Context saved to match_state.json for next over.${colors.reset}\n`);

  // Audit Log Save
  await fs.writeFile(AUDIT_FILE, JSON.stringify({ totalCost: totalCost.toFixed(6), auditLog }, null, 2));
  console.log(`${colors.bold}=== FINOPS AUDIT TRACE SAVED TO audit_trace.json ===${colors.reset}`);
  console.table(auditLog);
  console.log(`${colors.magenta}${colors.bold}Total Orchestration Cost: $${totalCost.toFixed(6)}${colors.reset}\n`);
}

runMatchSimulation().catch(console.error);
