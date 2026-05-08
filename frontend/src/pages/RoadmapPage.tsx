import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, BrainCircuit, Leaf, Clock, Banknote, Sparkles } from "lucide-react";

// --- Types ---
interface Mine {
  _id: string;
  name: string;
}

interface Initiative {
  title: string;
  estimatedCost: string;
  roi: string;
  co2Reduction: string;
}

interface Phase {
  timeframe: string;
  focus: string;
  initiatives: Initiative[];
}

interface RoadmapResponse {
  roadmapTitle: string;
  phases: Phase[];
}

export default function RoadmapPage() {
  const { toast } = useToast();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>("");
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMines();
        if (Array.isArray(data)) {
          setMines(data);
        }
      } catch (e) {
        console.error("Error fetching mines:", e);
      }
    })();
  }, []);

  const handleLoadSampleMine = () => {
    // Select the first mine as a quick sample
    if (mines.length > 0) {
      setSelectedMineId(mines[0]._id);
      toast({ title: "Sample Mine Selected", description: `Selected ${mines[0].name}` });
    } else {
      toast({ title: "Error", description: "No mines available to load.", variant: "destructive" });
    }
  };

  const generateRoadmap = async () => {
    if (!selectedMineId) {
      toast({ title: "Selection Required", description: "Please select a mine first.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setRoadmap(null);
    try {
      const data = await api.getAiRoadmap(selectedMineId);
      setRoadmap(data);
    } catch (e) {
      console.error(e);
      toast({ title: "AI Error", description: "Failed to generate the strategic roadmap.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getPhaseColors = (index: number) => {
    if (index === 0) return { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-400" };
    if (index === 1) return { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400" };
    return { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400" };
  };

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
              <Map className="w-8 h-8 text-primary" />
              AI Strategic Roadmap
            </h1>
            <p className="text-muted-foreground">
              Generate a personalized 36-month decarbonization timeline driven by Groq AI.
            </p>
          </div>
          
          <div className="flex items-end gap-3 w-full md:w-auto">
            <div className="w-64">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Target Mine
              </Label>
              <Select value={selectedMineId} onValueChange={setSelectedMineId}>
                <SelectTrigger className="glass-effect border-white/10">
                  <SelectValue placeholder="Select a mine…" />
                </SelectTrigger>
                <SelectContent>
                  {mines.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleLoadSampleMine} className="glass-effect border-white/10 shrink-0">
              Sample
            </Button>
            <Button onClick={generateRoadmap} disabled={isLoading || !selectedMineId} className="shrink-0 group whitespace-nowrap">
              {isLoading ? (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Reasoning...
                </span>
              ) : (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  AI Strategic Roadmap
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Shimmer Loading State */}
        {isLoading && (
          <div className="space-y-6 pt-8 animate-pulse">
            <div className="h-8 w-64 bg-white/5 rounded mx-auto mb-12"></div>
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-white/5 shrink-0 z-10" />
                <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-white/5" />
                <Card className="flex-1 glass-effect border-white/5 opacity-50">
                  <CardHeader>
                    <div className="h-6 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-48 bg-white/5 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-20 w-full bg-white/5 rounded" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Roadmap Display */}
        {!isLoading && roadmap && (
          <div className="space-y-8 pt-8 animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">{roadmap.roadmapTitle}</h2>
              <p className="text-primary mt-2 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Generated Strategy
              </p>
            </div>

            <div className="relative">
              {roadmap.phases.map((phase, index) => {
                const colors = getPhaseColors(index);
                const isLast = index === roadmap.phases.length - 1;

                return (
                  <div key={index} className="flex gap-6 relative mb-8 group">
                    {/* Timeline Line */}
                    {!isLast && (
                      <div className="absolute left-6 top-12 bottom-[-32px] w-0.5 bg-border" />
                    )}

                    {/* Timeline Dot */}
                    <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 z-10 shadow-sm border border-border`}>
                      <span className="font-bold">{index + 1}</span>
                    </div>

                    {/* Timeline Card */}
                    <Card className={`flex-1 bg-card border-t-4 border-l-border border-r-border border-b-border ${colors.border} transition-all duration-300 shadow-sm hover:shadow-md`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl text-card-foreground">{phase.timeframe}</CardTitle>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                            {phase.focus}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {phase.initiatives.map((initiative, idx) => (
                          <div key={idx} className="bg-muted/40 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors">
                            <h4 className="text-lg font-medium text-foreground mb-4">{initiative.title}</h4>
                            
                            {/* The "Big Three" Badges */}
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">ROI: {initiative.roi}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-full">
                                <Leaf className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Impact: {initiative.co2Reduction}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                                <Banknote className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Cost: {initiative.estimatedCost}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !roadmap && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Map className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No Roadmap Generated</p>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Select a mine and generate an AI-powered 36-month timeline.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
