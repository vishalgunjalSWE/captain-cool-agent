"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ShieldCheck, Zap, Database, Terminal, Clock, Coins } from "lucide-react";

export default function Dashboard() {
  const [running, setRunning] = useState(false);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: string; text: string; time: string; type: string }[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [finalMatrix, setFinalMatrix] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [matchState, setMatchState] = useState({
    innings: 2,
    over: 19,
    target: 185,
    currentScore: 167,
    wicketsDown: 6,
    venue: "Pune"
  });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setLogs(prev => [...prev, { id: Math.random().toString(), text, time: new Date().toLocaleTimeString(), type }]);
  };

  const startSimulation = async () => {
    setRunning(true);
    setLogs([]);
    setFinalMatrix([]);
    setTotalCost(0);
    setActivePhase(null);
    addLog("Initializing SRE-Grade Match Simulation...", "info");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const url = new URL(`${apiBase}/api/simulate/stream`);
      url.searchParams.append("state", JSON.stringify(matchState));
      
      const eventSource = new EventSource(url.toString());

      eventSource.addEventListener("phase_start", (e) => {
        const data = JSON.parse(e.data);
        setActivePhase(data.phase);
        addLog(`[${data.phase}] Execution phase started...`, "info");
      });

      eventSource.addEventListener("telemetry", (e) => {
        const data = JSON.parse(e.data);
        addLog(data.log, "warning");
      });

      eventSource.addEventListener("phase_end", (e) => {
        const data = JSON.parse(e.data);
        addLog(`[${data.phase}] Latency: ${data.latency}ms | Tokens: ${data.promptTokens + data.compTokens} | Cost: $${data.cost}`, "success");
        setTotalCost(prev => prev + parseFloat(data.cost));
        
        if (data.phase === "Strategist") {
          try { setFinalMatrix(JSON.parse(data.data)); } catch(err) {}
        }
      });

      eventSource.addEventListener("done", (e) => {
        addLog("Simulation completed successfully.", "success");
        setActivePhase(null);
        setRunning(false);
        eventSource.close();
      });

      // Application-level error sent by the backend (e.g. Gemini 429)
      eventSource.addEventListener("error", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // Parse nested error structure from Gemini API
          let msg = data.message || "Unknown error";
          try {
            const inner = JSON.parse(msg);
            const geminiErr = inner?.error;
            if (geminiErr?.code === 429) {
              msg = `⚡ Gemini API rate limit hit (free tier: 20 req/day). Wait ~1 min and try again. Details: ${geminiErr.message?.slice(0, 120)}...`;
            } else if (geminiErr?.message) {
              msg = `Gemini API error (${geminiErr.code}): ${geminiErr.message?.slice(0, 120)}`;
            }
          } catch (_) { /* msg is already a plain string */ }
          addLog(msg, "error");
        } catch (_) {
          addLog("Stream closed with an unreadable error.", "error");
        }
        setActivePhase(null);
        setRunning(false);
        eventSource.close();
      });

      // Network-level SSE disconnect (browser fires this with no data)
      eventSource.onerror = () => {
        if (!running) return; // already handled by app-level error above
        addLog("[Network] SSE connection dropped. Is the backend running on port 3001?", "error");
        setActivePhase(null);
        setRunning(false);
        eventSource.close();
      };

    } catch (err) {
      addLog("Failed to connect to backend engine.", "error");
      setRunning(false);
    }
  };

  const phases = [
    { id: "Analyst", label: "Analyst (Data & Tools)", icon: <Database className="w-4 h-4" /> },
    { id: "Strategist", label: "Strategist (Matrix)", icon: <Activity className="w-4 h-4" /> },
    { id: "Advocate", label: "Devil's Advocate (Red Team)", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "Revised_Strategist", label: "Strategist (Final)", icon: <Zap className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 font-mono flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <Activity className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AGENTIC PREMIER LEAGUE</h1>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Status: Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm bg-zinc-900 px-4 py-2 rounded-md border border-zinc-800">
          <Coins className="text-yellow-500 w-4 h-4" />
          <span className="text-zinc-400">Total Compute Cost:</span>
          <span className="font-bold text-green-400">${totalCost.toFixed(6)}</span>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* COLUMN 1: INPUT MATRIX */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Control Panel
              </CardTitle>
              <CardDescription className="text-zinc-400">Match State Parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="text-zinc-400">Venue</label>
                <Input className="bg-zinc-900 border-zinc-800 text-white" value={matchState.venue} onChange={e => setMatchState({...matchState, venue: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-zinc-400">Over</label>
                  <Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={matchState.over} onChange={e => setMatchState({...matchState, over: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400">Wickets</label>
                  <Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={matchState.wicketsDown} onChange={e => setMatchState({...matchState, wicketsDown: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-zinc-400">Target</label>
                  <Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={matchState.target} onChange={e => setMatchState({...matchState, target: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400">Current</label>
                  <Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={matchState.currentScore} onChange={e => setMatchState({...matchState, currentScore: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={startSimulation} 
                  disabled={running}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                >
                  {running ? "EXECUTING SIMULATION..." : "EXECUTE SIMULATION"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* COLUMN 2: DAG PIPELINE */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4" /> Agentic Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 relative space-y-6">
              
              {/* Vertical line connecting nodes */}
              <div className="absolute top-10 bottom-10 left-1/2 w-px bg-zinc-800 -translate-x-1/2 z-0"></div>

              {phases.map((phase, i) => {
                const isActive = activePhase === phase.id;
                const isPast = logs.some(l => l.text.includes(`[${phase.id}] Latency`));
                
                return (
                  <motion.div 
                    key={phase.id}
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ 
                      opacity: isActive || isPast ? 1 : 0.4, 
                      scale: isActive ? 1.05 : 1,
                      borderColor: isActive ? "#3b82f6" : isPast ? "#22c55e" : "#27272a"
                    }}
                    className={`relative z-10 w-64 bg-zinc-900 border-2 rounded-lg p-4 flex items-center gap-4 shadow-xl
                      ${isActive ? 'ring-4 ring-blue-900/50' : ''}
                    `}
                  >
                    <div className={`p-2 rounded-md ${isActive ? 'bg-blue-600' : isPast ? 'bg-green-600' : 'bg-zinc-800'}`}>
                      {phase.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{phase.label}</h3>
                      <p className="text-xs text-zinc-400">
                        {isActive ? "Processing..." : isPast ? "Complete" : "Waiting"}
                      </p>
                    </div>
                    {isActive && (
                      <span className="absolute right-4 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </section>

        {/* COLUMN 3: TELEMETRY CONSOLE */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Tactical Matrix */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-none h-64 overflow-hidden flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-zinc-800">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" /> Counterfactual Matrix</span>
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">JSON</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-zinc-900/50 sticky top-0">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Tactic</TableHead>
                    <TableHead className="text-zinc-400">Bowler</TableHead>
                    <TableHead className="text-zinc-400">Win Prob</TableHead>
                    <TableHead className="text-zinc-400">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalMatrix.length === 0 && (
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center text-zinc-500 py-8">Matrix not generated yet</TableCell>
                    </TableRow>
                  )}
                  {finalMatrix.map((row, i) => (
                    <TableRow key={i} className="border-zinc-800 hover:bg-zinc-900/50">
                      <TableCell className="font-medium text-blue-400">{row.Tactic}</TableCell>
                      <TableCell>{row.Bowler}</TableCell>
                      <TableCell className="text-green-400">{row.Win_Prob}</TableCell>
                      <TableCell className="text-red-400">{row.Counterfactual_Risk}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Raw Terminal */}
          <Card className="bg-[#0c0c0c] border-zinc-800 text-green-500 flex-1 flex flex-col overflow-hidden font-mono text-xs">
            <CardHeader className="py-2 px-4 border-b border-zinc-800 bg-zinc-950">
              <CardTitle className="text-xs flex items-center gap-2 text-zinc-400">
                <Terminal className="w-3 h-3" /> audit_trace.log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1 space-y-1">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={log.id}
                    className={`
                      ${log.type === "info" ? "text-blue-400" : ""}
                      ${log.type === "success" ? "text-green-400" : ""}
                      ${log.type === "warning" ? "text-fuchsia-400" : ""}
                      ${log.type === "error" ? "text-red-500" : ""}
                    `}
                  >
                    <span className="text-zinc-600 mr-2">[{log.time}]</span> 
                    {log.text}
                  </motion.div>
                ))}
                <div ref={logsEndRef} />
              </AnimatePresence>
            </CardContent>
          </Card>

        </section>
      </main>
    </div>
  );
}
