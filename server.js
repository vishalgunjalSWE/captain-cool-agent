import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { getWeatherAndDewProbability } from './tools.js';
import { ANALYST_PROMPT, STRATEGIST_PROMPT, ADVOCATE_PROMPT, COMMENTATOR_PROMPT } from './prompts.js';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

app.get('/api/simulate/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const trackPhase = async (phaseName, executeFn) => {
    sendEvent('phase_start', { phase: phaseName });
    const start = performance.now();
    const result = await executeFn();
    const end = performance.now();
    const latency = (end - start).toFixed(2);
    
    const usage = result.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const compTokens = usage.candidatesTokenCount || 0;
    const cost = ((promptTokens / 1000000) * 0.075) + ((compTokens / 1000000) * 0.30);
    
    sendEvent('phase_end', {
      phase: phaseName,
      latency,
      promptTokens,
      compTokens,
      cost: cost.toFixed(6),
      data: result.text
    });
    return result;
  };

  const stateStr = req.query.state || "{}";
  let matchState;
  try { matchState = JSON.parse(stateStr); } catch(e) { matchState = {}; }
  const venue = matchState.venue || "Pune";

  try {
    // 1. Analyst Phase
    const analystPrompt = `Match State: ${JSON.stringify(matchState)}. Venue: ${venue}. Fetch the weather and analyze.`;
    const analystResult = await trackPhase("Analyst", async () => {
      let resp = await ai.models.generateContent({
        model: modelName,
        contents: analystPrompt,
        config: { systemInstruction: ANALYST_PROMPT, tools: [weatherTool] }
      });
      if (resp.functionCalls && resp.functionCalls.length > 0) {
        const call = resp.functionCalls[0];
        sendEvent('telemetry', { log: `[Tool Call] Fetching weather for ${call.args.city}...` });
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
      return { text: resp.text, usageMetadata: resp.usageMetadata };
    });

    // 2. Strategist
    const strategistPrompt = `Analyst's Report: ${analystResult.text}\nMatch State: ${JSON.stringify(matchState)}`;
    const strategistResult = await trackPhase("Strategist", async () => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: strategistPrompt,
        config: { systemInstruction: STRATEGIST_PROMPT, responseMimeType: "application/json" }
      });
      return { text: resp.text, usageMetadata: resp.usageMetadata };
    });

    let strategistPlan;
    try { strategistPlan = JSON.parse(strategistResult.text); } catch(e) { strategistPlan = []; }

    // 3. Advocate
    const advocatePrompt = `Strategist's Matrix: ${JSON.stringify(strategistPlan)}\nMatch State: ${JSON.stringify(matchState)}`;
    const advocateResult = await trackPhase("Advocate", async () => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: advocatePrompt,
        config: { systemInstruction: ADVOCATE_PROMPT }
      });
      return { text: resp.text, usageMetadata: resp.usageMetadata };
    });

    // 4. Revised Strategist
    const strategistRevisedPrompt = `Original Matrix: ${JSON.stringify(strategistPlan)}\nAdvocate's Critique: ${advocateResult.text}\nRevise the plan and output the final single tactical decision in plain text.`;
    const revisedResult = await trackPhase("Revised_Strategist", async () => {
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

    sendEvent('done', { message: "Simulation complete." });
    res.end();
  } catch (error) {
    sendEvent('error', { message: error.message });
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Captain Cool Express API streaming on port ${PORT}`);
});
