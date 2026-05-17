import { performance } from 'perf_hooks';

export class Agent {
  constructor({ name, instruction, config = {} }) {
    this.name = name;
    this.instruction = instruction;
    this.config = config;
  }

  async execute(ai, contents, additionalConfig = {}) {
    const start = performance.now();
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: this.instruction,
        ...this.config,
        ...additionalConfig
      }
    });
    const end = performance.now();
    const latency = (end - start).toFixed(2);
    
    return {
      text: resp.text,
      usageMetadata: resp.usageMetadata,
      latency,
      response: resp
    };
  }
}

export class Pipeline {
  constructor({ name, agents }) {
    this.name = name;
    this.agents = agents;
  }

  async run(ai, input) {
    let state = input;
    const trace = [];
    for (const agent of this.agents) {
      const result = await agent.execute(ai, state);
      trace.push({ agent: agent.name, output: result.text, latency: result.latency });
      state = result.text;
    }
    return trace;
  }
}
