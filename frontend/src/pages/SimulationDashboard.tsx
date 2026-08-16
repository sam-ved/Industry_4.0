import { useState, useEffect } from 'react';
import { ScenarioBuilder } from '../components/simulation/ScenarioBuilder';
import { SimulationCharts } from '../components/simulation/SimulationCharts';
import { DigitalTwinView } from '../components/simulation/DigitalTwinView';
import AIInsightsPanel from '../components/common/AIInsightsPanel';
import { LayoutDashboard, Download } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function SimulationDashboard() {
  const [twinState, setTwinState] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  useDocumentMeta('Simulation Engine', 'Run what-if production scenarios, digital twin visualization, and optimize energy, costs, and emissions.');

  const fetchTwinState = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/twin/state');
      const data = await response.json();
      if (data.status === 'success') {
        setTwinState(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch digital twin state:", error);
    }
  };

  useEffect(() => {
    fetchTwinState();
  }, []);

  const handleRunSimulation = async (mode: string, parameters: any) => {
    setIsLoading(true);
    setAiInsights(null);
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, parameters })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationResults(data.data.results);
        fetchAiInsights(data.data.results);
      }
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAiInsights = async (results: any) => {
    setIsAILoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/ai-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });
      const data = await response.json();
      if (data.status === 'success') {
        const expl = data.data;
        // Safely extract strings from potentially nested objects returned by the LLM
        const safeExtract = (val: any) => {
          if (!val) return null;
          if (typeof val === 'string') return val;
          if (val.description) return val.description;
          if (val.cause) return val.cause;
          if (val.financial?.description) return val.financial.description;
          return val;
        };

        const ensureString = (val: any): string => {
          if (!val) return "";
          if (typeof val === 'string') return val;
          try {
            return JSON.stringify(val);
          } catch (e) {
            return "Complex data";
          }
        };

        setAiInsights({
          summary: ensureString(expl.explanation) || "Simulation analysis completed.",
          root_cause: ensureString(safeExtract(expl.root_cause)) || "Parameter adjustment.",
          recommendation: Array.isArray(expl.recommendations) 
            ? expl.recommendations.map((r: any) => ensureString(r?.action || r)).join(" | ") 
            : ensureString(expl.recommendations) || "Review simulation data.",
          risk_level: ensureString(expl.risk_level) || "Medium", 
          business_impact: ensureString(safeExtract(expl.implications)) || "Potential operational impact detected."
        });
      }
    } catch (error) {
      console.error("AI Explanation failed:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/'} 
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-400" />
              Production Simulation Engine
            </h1>
            <p className="text-slate-400 mt-1">Run What-If scenarios and optimize industrial parameters.</p>
          </div>
        </div>
        <div className="relative group">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-1">
              <button 
                onClick={() => alert("Exporting PDF Report...")}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md"
              >
                Export as PDF
              </button>
              <button 
                onClick={() => alert("Exporting Excel Report...")}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <ScenarioBuilder onRunSimulation={handleRunSimulation} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-2 space-y-6">
          <DigitalTwinView twinState={twinState} />
          {simulationResults && twinState && (
             <SimulationCharts results={simulationResults} baseState={twinState.factory_state} />
          )}
        </div>
      </div>

      {(aiInsights || isAILoading) && (
        <AIInsightsPanel 
          isLoading={isAILoading} 
          insights={aiInsights} 
        />
      )}
    </div>
  );
}
