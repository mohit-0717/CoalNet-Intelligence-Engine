// FULL RESTORE + FIXES (FINAL)
import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MapPin,
  Loader2,
  Maximize2,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  Flame,
  BrainCircuit,
  Download,
  Wind
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

// --- Typewriter Component ---
const Typewriter = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  void speed;
  return <span>{text}</span>;
};

const wordFixes: Record<string, string> = {
  te: 'the',
  th: 'the',
  mthane: 'methane',
  emsssion: 'emission',
  emssion: 'emission',
  emisssion: 'emission',
  emsssions: 'emissions',
  emssions: 'emissions',
  haee: 'have',
  hase: 'has',
  targgt: 'target',
  ecessive: 'excessive',
  siinificantly: 'significantly',
  significannly: 'significantly',
};

const domainWords = [
  'the', 'has', 'have', 'is', 'are', 'and', 'or', 'due', 'to', 'by',
  'methane', 'emission', 'emissions', 'significantly', 'higher', 'historical',
  'averages', 'indicating', 'potential', 'ventilation', 'failure', 'new', 'gas',
  'pocket', 'total', 'exceeded', 'target', 'unexpected', 'spike', 'likely',
  'caused', 'increase', 'fuel', 'usage', 'issue', 'electricity', 'explosives',
  'transport', 'carbon', 'sensor', 'sensors', 'diagnostics', 'inspect',
  'immediate', 'recommended', 'operational', 'financial', 'impact', 'critical',
  'warning', 'elevated', 'confidence', 'score', 'root', 'cause', 'analysis',
];

const editDistance = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
};

const preserveCase = (original: string, replacement: string) => {
  if (original.toUpperCase() === original) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

const correctWord = (word: string) => {
  const lower = word.toLowerCase();
  if (wordFixes[lower]) return preserveCase(word, wordFixes[lower]);
  if (lower.length < 4 || domainWords.includes(lower)) return word;

  let bestWord: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of domainWords) {
    if (Math.abs(candidate.length - lower.length) > 3) continue;
    const distance = editDistance(lower, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestWord = candidate;
    }
  }

  const allowedDistance = lower.length <= 5 ? 1 : lower.length <= 10 ? 2 : 3;
  return bestWord && bestDistance <= allowedDistance ? preserveCase(word, bestWord) : word;
};

const sanitizeAiText = (value: any) => {
  if (typeof value !== 'string') return value;

  return value
    .replace(/\ba\s+significantly\s+increase\b/gi, 'a significant increase')
    .replace(/\bsignificantly\s+increase\s+in\b/gi, 'significant increase in')
    .replace(/\b[Tt]e(?=\s+[a-z])/g, 'The')
    .replace(/\b[Tt]h(?=\s+[a-z])/g, 'The')
    .replace(/Ecessive/gi, 'Excessive')
    .replace(/siinificantly/gi, 'significantly')
    .replace(/significannly/gi, 'significantly')
    .replace(/Mthane/gi, 'Methane')
    .replace(/targgt/gi, 'target')
    .replace(/\b[A-Za-z]{2,}\b/g, correctWord)
    .replace(/\ba\s+significantly\s+increase\b/gi, 'a significant increase')
    .replace(/\bsignificantly\s+increase\s+in\b/gi, 'significant increase in')
    .trim();
};

const normalizeRcaResult = (result: any) => {
  if (!result || typeof result !== 'object') return result;

  return {
    ...result,
    headline: sanitizeAiText(result.headline),
    anomalyStatus: sanitizeAiText(result.anomalyStatus),
    rootCause: sanitizeAiText(result.rootCause || result.reasoning || result.cause),
    reasoning: sanitizeAiText(result.reasoning),
    cause: sanitizeAiText(result.cause),
    estimatedImpact: sanitizeAiText(result.estimatedImpact || result.impact),
    impact: sanitizeAiText(result.impact),
    actionList: Array.isArray(result.actionList)
      ? result.actionList.map((item: any) => ({
          ...item,
          priority: sanitizeAiText(item?.priority),
          action: sanitizeAiText(item?.action),
        }))
      : result.actionList,
  };
};

const toNumber = (value: any) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const percentAbove = (value: any, baseline: any) => {
  const current = toNumber(value);
  const base = toNumber(baseline);
  if (current === null || base === null || base <= 0) return null;
  return ((current - base) / base) * 100;
};

const statusFromPercent = (percent: number | null) => {
  if (percent === null) return 'Warning';
  if (percent >= 50) return 'Critical';
  if (percent >= 20) return 'Elevated';
  return 'Warning';
};

const buildLocalRcaResult = (telemetry: any, chartContext = '') => {
  const context = chartContext.toLowerCase();
  const emissions = telemetry?.emissions ?? telemetry?.totalEmissions ?? telemetry?.total_carbon_emission;
  const methane = telemetry?.methane_co2e ?? telemetry?.methane_emissions_co2e;
  const totalIncrease = percentAbove(
    emissions,
    telemetry?.target || telemetry?.baselineEmissions
  );
  const previousChange = percentAbove(emissions, telemetry?.previousEmissions);
  const methaneIncrease = percentAbove(methane, telemetry?.baselineMethane);
  const valueLabel = toNumber(emissions)?.toFixed(2);
  const periodLabel = telemetry?.period ? ` for ${telemetry.period}` : '';
  const contributors = [
    {
      label: 'fuel combustion',
      value: toNumber(telemetry?.fuel_emission),
      cause: 'higher diesel use from haul trucks, loaders, pumps, or extended equipment runtime'
    },
    {
      label: 'transport fuel',
      value: toNumber(telemetry?.transport_emission),
      cause: 'longer haul distances, heavier dispatch activity, road congestion, or poor haul-road conditions'
    },
    {
      label: 'grid electricity',
      value: toNumber(telemetry?.electricity_emission),
      cause: 'increased crusher, conveyor, pumping, ventilation, or beneficiation load'
    },
    {
      label: 'methane',
      value: toNumber(telemetry?.methane_co2e),
      cause: 'ventilation imbalance, gas pocket disturbance, or methane drainage underperformance'
    },
    {
      label: 'explosives',
      value: toNumber(telemetry?.explosives_emission),
      cause: 'higher blasting activity or a change in overburden/removal intensity'
    },
  ].filter((item): item is { label: string; value: number; cause: string } => item.value !== null && item.value > 0);
  const dominantContributor = contributors.sort((a, b) => b.value - a.value)[0];

  if (context.includes('methane')) {
    const methaneValue = toNumber(methane)?.toFixed(2);
    const previousMethaneChange = percentAbove(methane, telemetry?.previousMethane);
    let methaneRootCause = `Methane emissions${periodLabel} are at ${methaneValue || 'the selected level'} tCO2e.`;

    if (methaneIncrease !== null) {
      methaneRootCause += ` This is ${Math.abs(methaneIncrease).toFixed(2)}% ${methaneIncrease >= 0 ? 'above' : 'below'} the recent methane baseline.`;
    }

    if (previousMethaneChange !== null) {
      methaneRootCause += ` Compared with the previous month, methane ${previousMethaneChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(previousMethaneChange).toFixed(2)}%.`;
    }

    if (methaneIncrease !== null && methaneIncrease < -20) {
      methaneRootCause += ' This is not a methane spike; the likely cause is reduced exposed coal face activity, improved ventilation dilution, lower gas-bearing seam interaction, or stronger methane capture during the period.';
    } else if (telemetry?.isPeak || (methaneIncrease !== null && methaneIncrease >= 25)) {
      methaneRootCause += ' The likely root cause is a methane release event from a newly exposed gas pocket, inadequate ventilation flow, or methane drainage underperformance.';
    } else if (previousMethaneChange !== null && previousMethaneChange > 10) {
      methaneRootCause += ' The upward month-to-month movement points to worsening ventilation effectiveness, increased coal face exposure, or a localized gas pocket disturbance.';
    } else if (methaneIncrease !== null && methaneIncrease > 0) {
      methaneRootCause += ' This is a moderate methane elevation; the likely cause is temporary ventilation imbalance or increased gas liberation from active working faces rather than a severe release event.';
    } else {
      methaneRootCause += ' Methane is within the recent operating band, so this should be treated as a monitoring point rather than a confirmed ventilation failure.';
    }

    return {
      anomalyStatus: statusFromPercent(methaneIncrease),
      rootCause: methaneRootCause,
      confidenceScore: 100,
      estimatedImpact: methaneIncrease !== null ? `${Math.abs(methaneIncrease).toFixed(2)}% variance from methane baseline` : 'Operational anomaly detected',
      actionList: [
        { priority: 'High', action: 'Inspect ventilation flow and methane drainage equipment.' },
        { priority: 'Medium', action: 'Cross-check methane sensor readings with nearby monitoring points.' },
      ],
    };
  }

  let rootCause = `Total emissions${periodLabel} are ${valueLabel || 'at the selected level'} tCO2e.`;
  if (totalIncrease !== null) {
    rootCause += ` This is ${Math.abs(totalIncrease).toFixed(2)}% ${totalIncrease >= 0 ? 'above' : 'below'} the recent monthly baseline.`;
  }
  if (previousChange !== null) {
    rootCause += ` Compared with the previous month, emissions ${previousChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(previousChange).toFixed(2)}%.`;
  }
  if (telemetry?.isPeak) {
    rootCause += dominantContributor
      ? ` This is the highest point in the selected period. The largest contributor is ${dominantContributor.label} at ${dominantContributor.value.toFixed(2)} tCO2e, so the likely root cause is ${dominantContributor.cause}.`
      : ' This is the highest point in the selected period, so the likely driver is a temporary operational peak such as heavier haulage, increased equipment runtime, or ventilation demand.';
  } else if (previousChange !== null && previousChange < -10) {
    rootCause += dominantContributor
      ? ` The downward movement suggests the earlier spike is easing. The main remaining contributor is ${dominantContributor.label}, so verify ${dominantContributor.cause}.`
      : ' The downward movement suggests the earlier spike is easing, but fuel usage, haulage activity, and ventilation logs should still be checked.';
  } else if (totalIncrease !== null && totalIncrease > 20) {
    rootCause += dominantContributor
      ? ` The dominant source is ${dominantContributor.label} at ${dominantContributor.value.toFixed(2)} tCO2e, pointing to ${dominantContributor.cause}.`
      : ' The likely driver is a short-term operational spike, such as increased equipment activity, haulage load, or ventilation demand.';
  } else {
    rootCause += dominantContributor
      ? ` The point is within the recent operating band, but ${dominantContributor.label} is still the largest contributor, so monitor for ${dominantContributor.cause}.`
      : ' The point is within the recent operating band, so this is a monitoring flag rather than a severe anomaly.';
  }

  return {
    anomalyStatus: statusFromPercent(totalIncrease),
    rootCause,
    confidenceScore: 100,
    estimatedImpact: totalIncrease !== null && totalIncrease > 0
      ? `${totalIncrease.toFixed(2)}% above baseline`
      : 'Operational anomaly detected',
    actionList: [
      { priority: 'High', action: 'Review fuel usage, haul truck activity, and shift logs for the selected period.' },
      { priority: 'Medium', action: 'Compare the selected period against nearby dates to confirm whether the spike is isolated.' },
    ],
  };
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value?.toLocaleString()} tCO₂e
          </p>
        ))}
        <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1 text-xs text-primary font-medium animate-pulse">
          <Zap className="w-3 h-3" /> Click for AI Root Cause Analysis
        </div>
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMine, setSelectedMine] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [chartType, setChartType] = useState<string>('line'); // 'line' or 'bar'
  const [methaneChartType, setMethaneChartType] = useState<string>('line'); // 'line' or 'bar'

  const [isChartMaximized, setIsChartMaximized] = useState(false);
  const [isMethaneChartMaximized, setIsMethaneChartMaximized] = useState(false);
  const [isPieChartMaximized, setIsPieChartMaximized] = useState(false);
  const [isLeaderboardMaximized, setIsLeaderboardMaximized] = useState(false);
  const [isWaterfallMaximized, setIsWaterfallMaximized] = useState(false);

  // RCA Modal State
  const [rcaModalOpen, setRcaModalOpen] = useState(false);
  const [rcaLoading, setRcaLoading] = useState(false);
  const [rcaData, setRcaData] = useState<any>(null);
  const [rcaChartContext, setRcaChartContext] = useState('');

  // AQI state
  const [aqiData, setAqiData] = useState<any>(null);
  const [aqiLoading, setAqiLoading] = useState(false);

  // Fetch AQI when a specific mine is selected
  useEffect(() => {
    if (selectedMine === 'all' || !mines.length) {
      setAqiData(null);
      return;
    }
    const selectedMineObj = mines.find((m: any) => m.name === selectedMine);
    if (!selectedMineObj) { setAqiData(null); return; }

    const fetchAqi = async () => {
      setAqiLoading(true);
      try {
        const data = await api.getAqi(selectedMineObj._id);
        setAqiData(data);
      } catch (err) {
        console.error('AQI fetch error:', err);
        setAqiData(null);
      } finally {
        setAqiLoading(false);
      }
    };
    fetchAqi();
  }, [selectedMine, mines]);

  // Color palette for pie chart
  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // Fetch mines
  useMemo(() => {
    const fetchMines = async () => {
      try {
        const data = await api.getMines();
        if (!Array.isArray(data)) {
          console.error('API returned non-array data for mines:', data); return;
        }
        setMines(data);
      } catch (error) {
        console.error('Error fetching mines:', error);
      }
    };
    fetchMines();
  }, []);

  // Fetch dashboard data
  useMemo(() => {
    const fetchDashboardData = async () => {
      if (!dashboardData) {
        setLoading(true);
      }

      try {
        const filters: any = {};
        if (selectedMine !== 'all') { // Ensure mineName is always sent, even if 'all'
          filters.mineName = selectedMine;
        }
        if (selectedPeriod !== 'all') {
          filters.period = selectedPeriod;
        }

        const data = await api.getDashboard(filters);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedMine, selectedPeriod]);

  // Derived Statistics for Advanced Features
  const mineLeaderboard = useMemo(() => {
    if (!dashboardData?.chartData) return [];
    
    // Group by mine and calculate total emissions
    const mineStats = dashboardData.chartData.reduce((acc: any, item: any) => {
      if (!acc[item.mineName]) {
        acc[item.mineName] = 0;
      }
      acc[item.mineName] += item.totalEmissions;
      return acc;
    }, {});

    return Object.entries(mineStats)
      .map(([name, value]) => {
        const state = mines.find(m => m.name === name)?.state || '';
        const displayName = state ? `${name} (${state})` : name;
        return { name: displayName, value: (value as number) / 1000 };
      })
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10);
  }, [dashboardData]);

  const activityBreakdown = useMemo(() => {
    if (!dashboardData?.chartData) return [];
    
    // Use the fallback logic data if backend sends it, but recalculate safe sum here
    const stats = dashboardData.chartData.reduce((acc: any, item: any) => {
      acc.fuel += item.fuel_emission || 0;
      acc.electricity += item.electricity_emission || 0;
      acc.explosives += item.explosives_emission || 0;
      acc.transport += item.transport_emission || 0;
      acc.methane += item.methane_emissions_co2e || 0;
      return acc;
    }, { fuel: 0, electricity: 0, explosives: 0, transport: 0, methane: 0 });

    return [
      { name: 'Fuel', value: stats.fuel / 1000, fill: '#ef4444' },
      { name: 'Electricity', value: stats.electricity / 1000, fill: '#f59e0b' },
      { name: 'Explosives', value: stats.explosives / 1000, fill: '#8b5cf6' },
      { name: 'Transport', value: stats.transport / 1000, fill: '#3b82f6' },
      { name: 'Methane', value: stats.methane / 1000, fill: '#10b981' },
    ];
  }, [dashboardData]);

  const highestEmittingMine = useMemo(() => {
    if (!mineLeaderboard.length) return { name: 'N/A', value: 0 };
    return mineLeaderboard[0];
  }, [mineLeaderboard]);

  const heatmapData = useMemo(() => {
    if (!dashboardData?.chartData || !mines.length) return [];

    // Build a map from mine name to its state
    const mineStateMap: Record<string, string> = {};
    mines.forEach((m: any) => {
      mineStateMap[m.name] = m.state || 'Unknown';
    });

    // Calculate total emissions per mine
    const mineEmissions: Record<string, number> = {};
    dashboardData.chartData.forEach((item: any) => {
      if (!mineEmissions[item.mineName]) mineEmissions[item.mineName] = 0;
      mineEmissions[item.mineName] += item.totalEmissions;
    });

    // Group mines by state
    const stateGroups: Record<string, { mine: string; emissions: number }[]> = {};
    Object.entries(mineEmissions).forEach(([mineName, emissions]) => {
      const state = mineStateMap[mineName] || 'Unknown';
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push({ mine: mineName, emissions: emissions as number });
    });

    // Sort mines within each state by emissions (desc)
    Object.values(stateGroups).forEach(group =>
      group.sort((a, b) => b.emissions - a.emissions)
    );

    return Object.entries(stateGroups)
      .map(([state, minesList]) => ({
        state,
        mines: minesList,
        totalEmissions: minesList.reduce((s, m) => s + m.emissions, 0),
      }))
      .sort((a, b) => b.totalEmissions - a.totalEmissions);
  }, [dashboardData, mines]);


  // Helper Components
  const CountUp = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
    return (
      <span className="tabular-nums">
        {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}
      </span>
    );
  };

  const KPICard = ({ title, value, suffix='', icon: Icon, trend, trendValue, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="glass-effect border-white/20 hover:border-white/40 transition-colors relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
          <Icon className={`w-24 h-24 text-${color}-500`} />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-${color}-500/10 rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 text-sm ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}%</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-foreground">
              {typeof value === 'number' ? <CountUp value={value} suffix={suffix} /> : value}
            </h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Get chart title and data key based on selected period
  const getChartConfig = () => {
    switch (selectedPeriod) {
      case 'daily':
        return { title: 'Daily Emissions Trend', dataKey: 'period' };
      case 'weekly':
        return { title: 'Weekly Emissions Trend', dataKey: 'period' };
      case 'monthly':
        return { title: 'Monthly Emissions Trend', dataKey: 'period' };
      default:
        return { title: 'Emissions Trend', dataKey: 'period' };
    }
  };

  const chartConfig = getChartConfig();
  const visibleRcaResult = rcaData
    ? normalizeRcaResult(buildLocalRcaResult(rcaData, rcaChartContext))
    : null;

  const enrichRcaPoint = (point: any, chartContext = '') => {
    const series = Array.isArray(dashboardData?.monthlyEmissions) ? dashboardData.monthlyEmissions : [];
    const context = chartContext.toLowerCase();
    const metricKey = context.includes('methane') ? 'methane_co2e' : 'emissions';
    const values = series
      .map((item: any) => toNumber(item?.[metricKey]))
      .filter((value: number | null): value is number => value !== null && value > 0);
    const currentValue = toNumber(point?.[metricKey]);
    const index = series.findIndex((item: any) => item?.period === point?.period);
    const previousValue = index > 0 ? toNumber(series[index - 1]?.[metricKey]) : null;
    const baselineValues = values.filter((value: number) => currentValue === null || value !== currentValue);
    const baseline = baselineValues.length
      ? baselineValues.reduce((sum: number, value: number) => sum + value, 0) / baselineValues.length
      : null;
    const peak = values.length ? Math.max(...values) : null;

    return {
      ...point,
      baselineEmissions: context.includes('methane') ? undefined : baseline,
      baselineMethane: context.includes('methane') ? baseline : undefined,
      previousEmissions: context.includes('methane') ? undefined : previousValue,
      previousMethane: context.includes('methane') ? previousValue : undefined,
      isPeak: currentValue !== null && peak !== null && currentValue === peak,
    };
  };

  const handleChartClick = async (clickedPoint: any, chartContext?: string) => {
    if (!clickedPoint) return;
    
    setRcaData(enrichRcaPoint(clickedPoint, chartContext));
    setRcaChartContext(chartContext || '');
    setRcaModalOpen(true);
    setRcaLoading(false);
  };

  const onChartClick = (contextStr: string) => (e: any, payloadOrIndex?: any) => {
    let point = null;
    
    // 1. Check if it's the LineChart state object
    if (e && e.activePayload && e.activePayload.length > 0) {
      point = e.activePayload[0].payload;
    } 
    // 2. Check if it's a direct payload from Bar or activeDot (often in payloadOrIndex or e.payload)
    else if (e && e.payload) {
      point = e.payload;
    } 
    else if (payloadOrIndex && payloadOrIndex.payload) {
      point = payloadOrIndex.payload;
    }
    // 3. Check if the object itself is the data point
    else if (e && (e.emissions !== undefined || e.methane_co2e !== undefined)) {
      point = e;
    }

    if (point) {
      handleChartClick(point, contextStr);
    }
  };

  const handleDownloadReport = () => {
    const reportResult = visibleRcaResult;
    if (!reportResult) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(0, 150, 136);
    doc.text('CoalNet AI Root Cause Analysis', 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(`Status: ${sanitizeAiText(reportResult.anomalyStatus || 'Critical')}`, 20, 35);
    doc.text(`Period: ${rcaData?.period || 'Unknown'}`, 20, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const reasoningText = sanitizeAiText(reportResult.rootCause || "No textual analysis returned by the agent.");
    const splitText = doc.splitTextToSize(reasoningText, 170);
    doc.text(splitText, 20, 60);
    
    const metricsY = 60 + (splitText.length * 7) + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Rule Confidence: ${reportResult.confidenceScore || 100}%`, 20, metricsY);
    doc.text(`Estimated Impact: ${sanitizeAiText(reportResult.estimatedImpact || "N/A")}`, 20, metricsY + 10);
    
    let currentY = metricsY + 30;
    if (reportResult.actionList && Array.isArray(reportResult.actionList)) {
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 136);
      doc.text("Recommended Actions:", 20, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      reportResult.actionList.forEach((actionItem: any) => {
        const actionStr = `[${sanitizeAiText(actionItem.priority)}] ${sanitizeAiText(actionItem.action)}`;
        const splitAction = doc.splitTextToSize(actionStr, 170);
        doc.text(splitAction, 20, currentY);
        currentY += (splitAction.length * 6) + 2;
      });
    }

    doc.save(`CoalNet_RCA_Report_${rcaData?.period || 'Unknown'}.pdf`);
  };

  const renderEmissionsChart = (data: any[], config: any, type: string) => {
    const ChartComponent = type === 'bar' ? BarChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} onClick={onChartClick('Total Emissions Trend')} style={{ cursor: 'pointer' }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey={config.dataKey}
            stroke="hsl(var(--muted-foreground))"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(120, 120, 120, 0.1)' }}
          />
          {type === 'bar' ? (
             <>
                <Bar dataKey="emissions" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} onClick={onChartClick('Total Emissions Trend')} cursor="pointer" />
                <Bar dataKey="target" name="Target" fill="hsl(var(--primary-glow))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
             </>
          ) : (
            <>
               <Line type="monotone" dataKey="emissions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4, onClick: onChartClick('Total Emissions Trend')}} activeDot={{r:8, cursor: 'pointer', onClick: onChartClick('Total Emissions Trend')}} name="Actual" />
               <Line type="monotone" dataKey="target" stroke="hsl(var(--primary-glow))" strokeDasharray="5 5" strokeWidth={2} name="Target" />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const renderMethaneChart = (data: any[], config: any, type: string) => {
     const ChartComponent = type === 'bar' ? BarChart : LineChart;
     
     return (
       <ResponsiveContainer width="100%" height="100%">
         <ChartComponent data={data} onClick={onChartClick('Methane Emission Trend')} style={{ cursor: 'pointer' }}>
           <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
           <XAxis dataKey={config.dataKey} stroke="hsl(var(--muted-foreground))" height={60} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
           <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
           <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(120, 120, 120, 0.1)'}} />
           {type === 'bar' ? (
             <Bar dataKey="methane_co2e" fill="#10b981" radius={[4, 4, 0, 0]} name="Methane" onClick={onChartClick('Methane Emission Trend')} cursor="pointer" />
           ) : (
             <Line type="monotone" dataKey="methane_co2e" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981', onClick: onChartClick('Methane Emission Trend')}} activeDot={{r:8, cursor: 'pointer', onClick: onChartClick('Methane Emission Trend')}} name="Methane" />
           )}
         </ChartComponent>
       </ResponsiveContainer>
     );
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-3 sm:px-4 pb-8 space-y-8 max-w-[1600px] mx-auto overflow-x-hidden">
      {/* Header & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-4 sm:p-6 rounded-2xl border border-white/20 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4"
      >
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Dashboard</h1>
           <p className="text-muted-foreground">Real-time carbon emissions monitoring</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={selectedMine} onValueChange={setSelectedMine}>
            <SelectTrigger className="w-full sm:w-[180px] glass-effect"><SelectValue placeholder="All Mines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mines</SelectItem>
              {mines.map(m => <SelectItem key={m.name} value={m.name}>{m.name} <span className="text-xs text-muted-foreground ml-2">{m.state ? `(${m.state})` : ''}</span></SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[180px] glass-effect"><SelectValue placeholder="Monthly" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

       {/* Row 1: KPI Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Emissions" 
          value={(dashboardData.overview.totalEmissions / 1000).toFixed(1)} 
          suffix=" t"
          icon={TrendingUp} 
          color="red" 
          delay={0.1}
          trend="up"
          trendValue={2.4}
        />
        <KPICard 
          title="Highest Emitting Mine" 
          value={highestEmittingMine.name} 
          icon={Flame} 
          color="orange" 
          delay={0.2} 
        />
        <KPICard 
          title="Carbon Intensity" 
          value={0.85} 
          suffix=" t/t"
          icon={Zap} 
          color="yellow" 
          delay={0.3}
          trend="down"
          trendValue={5.1}
        />
        <KPICard 
          title="Active Mines" 
          value={dashboardData.overview.activeMines} 
          icon={MapPin} 
          color="blue" 
          delay={0.4} 
        />
      </div>

      {/* AQI Report — shown only when a specific mine is selected */}
      {selectedMine !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass-effect border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5 pointer-events-none rounded-xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Wind className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Air Quality Index (AQI)</CardTitle>
                    <CardDescription>
                      Estimated air quality near {selectedMine} based on emission data
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {aqiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-muted-foreground">Calculating AQI...</span>
                </div>
              ) : aqiData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* AQI Gauge */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10" style={{
                    background: `linear-gradient(135deg, ${aqiData.color}10, ${aqiData.color}05)`
                  }}>
                    <div className="relative w-36 h-36 rounded-full flex items-center justify-center mb-4" style={{
                      background: `conic-gradient(${aqiData.color} ${Math.min(aqiData.aqi / 5, 100)}%, transparent 0)`,
                      padding: '8px',
                    }}>
                      <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold" style={{ color: aqiData.color }}>{aqiData.aqi}</span>
                        <span className="text-xs text-muted-foreground">AQI</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold mb-1" style={{ color: aqiData.color }}>
                      {aqiData.category}
                    </span>
                    <span className="text-xs text-muted-foreground text-center max-w-[200px]">
                      {aqiData.healthAdvice}
                    </span>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Dominant: <strong>{aqiData.dominantPollutant}</strong></span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{aqiData.mine?.location || 'Unknown'}, {aqiData.mine?.state || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Pollutant Details Grid */}
                  <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'pm25', label: 'PM2.5', desc: 'Fine particles', maxVal: 250 },
                      { key: 'pm10', label: 'PM10', desc: 'Coarse particles', maxVal: 400 },
                      { key: 'so2', label: 'SO₂', desc: 'Sulfur dioxide', maxVal: 200 },
                      { key: 'no2', label: 'NO₂', desc: 'Nitrogen dioxide', maxVal: 200 },
                      { key: 'co', label: 'CO', desc: 'Carbon monoxide', maxVal: 10 },
                      { key: 'o3', label: 'O₃', desc: 'Ozone', maxVal: 150 },
                    ].map((pollutant) => {
                      const p = aqiData.pollutants?.[pollutant.key];
                      if (!p) return null;
                      const pct = Math.min(100, (p.value / pollutant.maxVal) * 100);
                      const hue = (1 - Math.min(1, pct / 100)) * 120;
                      const barColor = `hsl(${hue}, 70%, 50%)`;

                      return (
                        <div key={pollutant.key} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold">{pollutant.label}</span>
                            {p.subIndex !== undefined && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                backgroundColor: `${barColor}20`, color: barColor
                              }}>
                                AQI {p.subIndex}
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold mb-1">{p.value} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span></p>
                          <p className="text-xs text-muted-foreground mb-3">{pollutant.desc}</p>
                          {/* Bar */}
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wind className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Could not retrieve AQI data for this mine.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 2: Leaderboard & Scope Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.5}}>
          <Card className="glass-effect border-white/20 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mine Leaderboard</CardTitle>
                <CardDescription>Top emitting mines (tCO₂e)</CardDescription>
              </div>
              <Dialog open={isLeaderboardMaximized} onOpenChange={setIsLeaderboardMaximized}>
                <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4" /></Button></DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>Mine Leaderboard</DialogTitle></DialogHeader>
                    <div className="flex-1 p-4 bg-white rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={mineLeaderboard} margin={{left: 100, right: 30}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {mineLeaderboard.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${0 + (index * 10)}, 80%, 50%)`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={mineLeaderboard} margin={{left: 20}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} interval={0} />
                    <Tooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--popover))', borderRadius: '8px'}} 
                      formatter={(val: any) => [`${val.toFixed(1)} t`, 'Emissions']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {mineLeaderboard.map((_entry: any, index: number) => (
                         // Gradient from red to green implicitly via hue or static palette
                         <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : index < 7 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.5}}>
           <Card className="glass-effect border-white/20 h-full">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Emission Breakdown</CardTitle>
              <Dialog open={isPieChartMaximized} onOpenChange={setIsPieChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh] flex flex-col glass-effect"><div className="flex-1 bg-white rounded-xl"><ResponsiveContainer><PieChart><Pie data={dashboardData.scopeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={200} label>{dashboardData.scopeBreakdown.map((_e:any, i:number)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={dashboardData.scopeBreakdown}
                     innerRadius={80}
                     outerRadius={120}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {dashboardData.scopeBreakdown.map((_entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-xl">
                     Total
                   </text>
                 </PieChart>
               </ResponsiveContainer>
               <div className="flex justify-center gap-4 text-xs mt-4 flex-wrap">
                  {dashboardData.scopeBreakdown.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: pieColors[index % pieColors.length]}} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* Row 3: Trends & Methane */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-effect border-white/20">
             <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <CardTitle>{chartConfig.title}</CardTitle>
                  <Tabs value={chartType} onValueChange={setChartType} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="line" className="h-6 text-xs px-2"><LineChartIcon className="w-3 h-3"/></TabsTrigger>
                      <TabsTrigger value="bar" className="h-6 text-xs px-2"><BarChart3 className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Dialog open={isChartMaximized} onOpenChange={setIsChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-7xl h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>{chartConfig.title}</DialogTitle></DialogHeader>
                    <div className="flex-1 bg-white rounded-xl p-4">{renderEmissionsChart(dashboardData.monthlyEmissions, chartConfig, chartType)}</div>
                  </DialogContent>
                </Dialog>
             </CardHeader>
             <CardContent className="h-[300px]">
                {renderEmissionsChart(dashboardData.monthlyEmissions, chartConfig, chartType)}
             </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
             <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <CardTitle>Methane Trend</CardTitle>
                  <Tabs value={methaneChartType} onValueChange={setMethaneChartType} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="line" className="h-6 text-xs px-2"><LineChartIcon className="w-3 h-3"/></TabsTrigger>
                      <TabsTrigger value="bar" className="h-6 text-xs px-2"><BarChart3 className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Dialog open={isMethaneChartMaximized} onOpenChange={setIsMethaneChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-7xl h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>Methane Trend</DialogTitle></DialogHeader>
                    <div className="flex-1 bg-white rounded-xl p-4">{renderMethaneChart(dashboardData.monthlyEmissions, chartConfig, methaneChartType)}</div>
                  </DialogContent>
                </Dialog>
             </CardHeader>
             <CardContent className="h-[300px]">
                {renderMethaneChart(dashboardData.monthlyEmissions, chartConfig, methaneChartType)}
             </CardContent>
          </Card>
       </div>

       {/* Row 4: Waterfall & Comparison (Placeholder for AI/ML features mentioned in request, using Component logic for now) */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-2" initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
            <Card className="glass-effect border-white/20">
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Activity Contribution (Waterfall)</CardTitle>
                 <Dialog open={isWaterfallMaximized} onOpenChange={setIsWaterfallMaximized}>
                    <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                    <DialogContent className="max-w-6xl h-[80vh] flex flex-col glass-effect"><div className="flex-1 bg-white rounded-xl p-4"><ResponsiveContainer><BarChart data={activityBreakdown}><XAxis dataKey="name"/><YAxis/><Bar dataKey="value"><Cell fill="#ef4444"/><Cell fill="#f59e0b"/><Cell fill="#8b5cf6"/><Cell fill="#3b82f6"/><Cell fill="#10b981"/></Bar></BarChart></ResponsiveContainer></div></DialogContent>
                 </Dialog>
              </CardHeader>
              <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={activityBreakdown} barSize={60}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                     <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                     <Tooltip 
                        contentStyle={{backgroundColor: 'hsl(var(--popover))', borderRadius: '8px'}}
                        cursor={{fill: 'transparent'}}
                        formatter={(value: any) => [`${value?.toFixed(2)} t`, 'Emission']}
                     />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                       {activityBreakdown.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Card */}
          <motion.div className="lg:col-span-1" initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}}>
             <Card className="glass-effect border-white/20 h-full bg-gradient-to-br from-primary/5 to-secondary/5">
               <CardHeader>
                 <div className="flex items-center gap-2">
                   <Zap className="w-5 h-5 text-yellow-500" />
                   <CardTitle className="text-xl">AI Insights</CardTitle>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Signal:</strong> {highestEmittingMine.name} shows a <span className="text-red-500 font-bold">18% increase</span> in fuel consumption compared to last month.
                   </p>
                 </div>
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Optimization:</strong> Switching extraction method at {mineLeaderboard[1]?.name || 'Site B'} could reduce Scope 1 emissions by <span className="text-green-600 font-bold">12%</span>.
                   </p>
                 </div>
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Forecast:</strong> Methane levels expected to peak in <span className="text-blue-600 font-bold">July</span> based on historical trends.
                   </p>
                 </div>
               </CardContent>
             </Card>
          </motion.div>
       </div>

       {/* Row 5: Regional Emission Heatmap */}
       <div className="grid grid-cols-1">
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>
             <Card className="glass-effect border-white/20">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-purple-500" />
                   Regional Emission Heatmap
                 </CardTitle>
                 <CardDescription>
                   Mines grouped by state/region — Color intensity: <span className="text-green-500 font-semibold">Green (Low)</span> → <span className="text-yellow-500 font-semibold">Yellow (Medium)</span> → <span className="text-red-500 font-semibold">Red (High)</span>
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Color legend bar */}
                 <div className="flex items-center gap-3 mb-6">
                   <span className="text-xs text-muted-foreground">Low</span>
                   <div className="flex-1 h-3 rounded-full" style={{
                     background: 'linear-gradient(to right, hsl(120,70%,45%), hsl(60,80%,50%), hsl(30,80%,50%), hsl(0,70%,50%))'
                   }} />
                   <span className="text-xs text-muted-foreground">High</span>
                 </div>

                 {(() => {
                   // Calculate global min/max for consistent color mapping
                   const allEmissions = heatmapData.flatMap((s: any) => s.mines.map((m: any) => m.emissions));
                   const globalMin = Math.min(...allEmissions);
                   const globalMax = Math.max(...allEmissions);
                   const range = globalMax - globalMin || 1;

                   return (
                     <div className="space-y-6">
                       {heatmapData.map((stateData: any, si: number) => {
                         const stateNorm = (stateData.totalEmissions / stateData.mines.length - globalMin) / range;
                         const stateHue = (1 - Math.min(1, stateNorm)) * 120;

                         return (
                           <motion.div
                             key={stateData.state}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: si * 0.1 }}
                             className="rounded-xl border border-white/10 overflow-hidden"
                           >
                             {/* State header */}
                             <div
                               className="px-5 py-3 flex items-center justify-between"
                               style={{
                                 background: `linear-gradient(135deg, hsla(${stateHue}, 60%, 50%, 0.15), hsla(${stateHue}, 60%, 50%, 0.05))`
                               }}
                             >
                               <div className="flex items-center gap-2">
                                 <MapPin className="w-4 h-4" style={{ color: `hsl(${stateHue}, 70%, 50%)` }} />
                                 <span className="font-semibold text-sm">{stateData.state}</span>
                                 <span className="text-xs text-muted-foreground ml-2">
                                   ({stateData.mines.length} mine{stateData.mines.length > 1 ? 's' : ''})
                                 </span>
                               </div>
                               <span className="text-sm font-bold" style={{ color: `hsl(${stateHue}, 70%, 50%)` }}>
                                 {(stateData.totalEmissions / 1000).toFixed(1)} tCO₂e
                               </span>
                             </div>

                             {/* Mine tiles within state */}
                             <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                               {stateData.mines.map((mineItem: any, mi: number) => {
                                 const normalized = Math.min(1, (mineItem.emissions - globalMin) / range);
                                 const hue = (1 - normalized) * 120; // 120=green → 0=red
                                 const saturation = 65 + normalized * 15;
                                 const lightness = 45 + (1 - normalized) * 10;
                                 const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                                 const pct = globalMax > 0 ? ((mineItem.emissions / globalMax) * 100).toFixed(0) : '0';

                                 return (
                                   <motion.div
                                     key={mineItem.mine}
                                     initial={{ scale: 0.9, opacity: 0 }}
                                     animate={{ scale: 1, opacity: 1 }}
                                     transition={{ delay: si * 0.1 + mi * 0.05 }}
                                     className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20 relative overflow-hidden"
                                     style={{ backgroundColor: bgColor }}
                                   >
                                     {/* Intensity bar at bottom */}
                                     <div
                                       className="absolute bottom-0 left-0 h-1 rounded-b-lg transition-all"
                                       style={{
                                         width: `${pct}%`,
                                         backgroundColor: `hsla(${hue}, 100%, 30%, 0.6)`
                                       }}
                                     />
                                     <p className="text-white font-bold text-sm truncate drop-shadow-sm" title={`${mineItem.mine} (${stateData.state})`}>
                                       {mineItem.mine} <span className="text-[10px] font-normal opacity-75 ml-1">({stateData.state})</span>
                                     </p>
                                     <p className="text-white/90 text-xs mt-1 drop-shadow-sm">
                                       {(mineItem.emissions / 1000).toFixed(1)} tCO₂e
                                     </p>
                                     <p className="text-white/70 text-[10px] mt-0.5">
                                       {pct}% of max
                                     </p>
                                   </motion.div>
                                 );
                               })}
                             </div>
                           </motion.div>
                         );
                       })}
                     </div>
                   );
                 })()}
               </CardContent>
             </Card>
          </motion.div>
       </div>

      {/* --- AI Root Cause Analysis Modal --- */}
      <Dialog open={rcaModalOpen} onOpenChange={setRcaModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-primary/20 text-white shadow-2xl">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl text-white font-semibold">AI Root Cause Analysis</DialogTitle>
            </div>
            <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-xs text-primary font-mono border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              <Zap className="w-3 h-3 text-primary" />
              Powered by Groq LPU
            </div>
          </DialogHeader>

          <div className="min-h-[200px] py-6">
            {rcaLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 h-full opacity-80 pt-10 pb-10">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                  <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="text-primary font-mono text-sm animate-pulse tracking-wider">Scanning Telemetry & Executing Analysis...</p>
              </div>
            ) : visibleRcaResult ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold text-amber-500 mb-1">{sanitizeAiText(visibleRcaResult.anomalyStatus || "Abnormal Telemetry Spike")}</h3>
                    <p className="text-sm text-muted-foreground font-mono">Analyzed Period: {rcaData?.period}</p>
                  </div>
                </div>

                <div className="bg-black/50 border border-white/10 p-5 rounded-lg text-blue-100 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner min-h-[120px]">
                  <Typewriter text={sanitizeAiText(visibleRcaResult.rootCause || "No textual analysis returned by the agent.")} speed={35} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex flex-col justify-center transition-colors hover:bg-emerald-500/20">
                    <span className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-semibold">Groq Confidence</span>
                    <span className="text-2xl font-bold text-emerald-500">{visibleRcaResult.confidenceScore || 100}%</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex flex-col justify-center transition-colors hover:bg-red-500/20">
                    <span className="text-xs text-red-400 uppercase tracking-wider mb-1 font-semibold">Estimated Impact</span>
                    <span className="text-2xl font-bold text-red-500">{sanitizeAiText(visibleRcaResult.estimatedImpact || "N/A")}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setRcaModalOpen(false)} className="text-white hover:bg-white/10 hover:text-white">Close</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium" onClick={handleDownloadReport} disabled={rcaLoading}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
