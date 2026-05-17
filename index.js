import { GoogleGenAI } from '@google/genai';
import { getWeatherAndDewProbability } from './tools.js';
import { ANALYST_PROMPT, STRATEGIST_PROMPT, ADVOCATE_PROMPT, COMMENTATOR_PROMPT } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const matchState = {
  innings: 2,
  over: 16,
  target: 185,
  currentScore: 145,
  wicketsDown: 4,
  batsmen: ["Right-handed pinch hitter", "Left-handed anchor"],
  bowlersAvailable: ["Leg spinner (1 over left)", "Fast bowler (2 overs left)", "Off spinner (1 over left)"]
};
const venue = "Pune";

async function runMatchSimulation(state, venue) {
  console.log("=== MATCH SIMULATION STARTED ===\n");
  
  // 1. Analyst Phase (Uses Tool)
  console.log("--> 1. ANALYST (Fetching Data & Analyzing)");
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
  
  const analystPrompt = `Match State: ${JSON.stringify(state)}. Venue: ${venue}. Fetch the weather for this venue and analyze the match state.`;
  
  let analystResponse = await ai.models.generateContent({
    model: modelName,
    contents: analystPrompt,
    config: {
      systemInstruction: ANALYST_PROMPT,
      tools: [weatherTool]
    }
  });

  let analystFinalText = analystResponse.text;
  
  if (analystResponse.functionCalls && analystResponse.functionCalls.length > 0) {
    const call = analystResponse.functionCalls[0];
    if (call.name === "get_weather_and_dew_probability") {
      const city = call.args.city;
      console.log(`    [Tool Call] Fetching weather for ${city}...`);
      const weatherData = await getWeatherAndDewProbability(city);
      
      analystResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: analystPrompt }] },
          { role: 'model', parts: analystResponse.candidates[0].content.parts },
          { 
            role: 'user', 
            parts: [{
              functionResponse: {
                name: call.name,
                response: weatherData
              }
            }]
          }
        ],
        config: {
          systemInstruction: ANALYST_PROMPT,
          tools: [weatherTool]
        }
      });
      analystFinalText = analystResponse.text;
    }
  }
  console.log(`\nANALYST REPORT:\n${analystFinalText}\n`);

  // 2. Strategist Phase
  console.log("--> 2. STRATEGIST (Formulating Plan)");
  const strategistPrompt = `Analyst's Report: ${analystFinalText}\nMatch State: ${JSON.stringify(state)}`;
  const strategistResponse = await ai.models.generateContent({
    model: modelName,
    contents: strategistPrompt,
    config: { systemInstruction: STRATEGIST_PROMPT }
  });
  const strategistPlan = strategistResponse.text;
  console.log(`\nSTRATEGIST PLAN:\n${strategistPlan}\n`);

  // 3. Advocate Phase
  console.log("--> 3. ADVOCATE (Critiquing Plan)");
  const advocatePrompt = `Strategist's Plan: ${strategistPlan}\nMatch State: ${JSON.stringify(state)}`;
  const advocateResponse = await ai.models.generateContent({
    model: modelName,
    contents: advocatePrompt,
    config: { systemInstruction: ADVOCATE_PROMPT }
  });
  const advocateCritique = advocateResponse.text;
  console.log(`\nADVOCATE CRITIQUE:\n${advocateCritique}\n`);

  // 4. Strategist Revised Phase
  console.log("--> 4. STRATEGIST (Revising Plan)");
  const strategistRevisedPrompt = `Original Plan: ${strategistPlan}\nAdvocate's Critique: ${advocateCritique}\nRevise your plan to address the critique, or firmly justify your original stance.`;
  const strategistRevisedResponse = await ai.models.generateContent({
    model: modelName,
    contents: [
      { role: 'user', parts: [{ text: strategistPrompt }] },
      { role: 'model', parts: [{ text: strategistPlan }] },
      { role: 'user', parts: [{ text: strategistRevisedPrompt }] }
    ],
    config: { systemInstruction: STRATEGIST_PROMPT }
  });
  const finalPlan = strategistRevisedResponse.text;
  console.log(`\nREVISED STRATEGIST PLAN:\n${finalPlan}\n`);

  // 5. Commentator Phase
  console.log("--> 5. COMMENTATOR (Broadcast)");
  const commentatorPrompt = `Final Strategy: ${finalPlan}`;
  const commentatorResponse = await ai.models.generateContent({
    model: modelName,
    contents: commentatorPrompt,
    config: { systemInstruction: COMMENTATOR_PROMPT }
  });
  console.log(`\nCOMMENTARY:\n${commentatorResponse.text}\n`);
  
  console.log("=== MATCH SIMULATION END ===");
}

runMatchSimulation(matchState, venue).catch(console.error);
