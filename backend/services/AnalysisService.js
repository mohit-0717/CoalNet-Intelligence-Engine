const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const percentAbove = (value, baseline) => {
  const current = toNumber(value);
  const base = toNumber(baseline);
  if (current === null || base === null || base <= 0) return null;
  return ((current - base) / base) * 100;
};

const statusFromPercent = (percent) => {
  if (percent === null) return 'Warning';
  if (percent >= 50) return 'Critical';
  if (percent >= 20) return 'Elevated';
  return 'Warning';
};

const buildDeterministicRootCause = (telemetry = {}, historicalAverages = {}, chartContext = '') => {
  const context = String(chartContext || '').toLowerCase();
  const emissions = telemetry.emissions ?? telemetry.totalEmissions ?? telemetry.total_carbon_emission;
  const target = telemetry.target ?? historicalAverages.targetEmissions ?? historicalAverages.totalEmissions;
  const methane = telemetry.methane_co2e ?? telemetry.methane_emissions_co2e;
  const methaneBaseline = historicalAverages.methane_co2e ?? historicalAverages.methane_emissions_co2e;
  const fuel = telemetry.fuel_used ?? telemetry.fuelUsage;
  const fuelBaseline = historicalAverages.fuel_used ?? historicalAverages.fuelUsage;

  if (context.includes('methane')) {
    const methaneIncrease = percentAbove(methane, methaneBaseline);
    const qualifier = methaneIncrease !== null
      ? ` by ${Math.abs(methaneIncrease).toFixed(2)}%`
      : '';

    return `Methane emissions are higher than the historical baseline${qualifier}, indicating a possible ventilation failure, gas pocket disturbance, or methane drainage issue.`;
  }

  const totalIncrease = percentAbove(emissions, target);
  if (totalIncrease !== null && totalIncrease > 0) {
    const fuelIncrease = percentAbove(fuel, fuelBaseline);
    const likelyDriver = fuelIncrease !== null && fuelIncrease > 10
      ? ' The likely driver is increased fuel usage, which can happen when haul trucks work harder during poor road or weather conditions.'
      : ' The likely driver is a short-term operational spike, such as increased equipment activity, haulage load, or ventilation demand.';

    return `Total emissions have exceeded the 30-day baseline by ${totalIncrease.toFixed(2)}%, indicating a significant increase in emissions.${likelyDriver}`;
  }

  if (methane !== undefined) {
    return 'Methane emissions are above the expected operating range, indicating a possible ventilation failure, gas pocket disturbance, or methane drainage issue.';
  }

  return 'The selected telemetry point is above the expected operating range, indicating an operational anomaly that requires inspection of fuel usage, ventilation, and sensor readings.';
};

const buildFallbackActions = (chartContext = '') => {
  const context = String(chartContext || '').toLowerCase();
  if (context.includes('methane')) {
    return [
      { priority: 'High', action: 'Inspect ventilation flow and methane drainage equipment.' },
      { priority: 'Medium', action: 'Cross-check methane sensor readings with nearby monitoring points.' },
    ];
  }

  return [
    { priority: 'High', action: 'Review fuel usage, haul truck activity, and shift logs for the selected period.' },
    { priority: 'Medium', action: 'Compare the selected period against nearby dates to confirm whether the spike is isolated.' },
  ];
};

const analyze = async (mineId, telemetry, historicalAverages, chartContext) => {
  const totalIncrease = percentAbove(
    telemetry?.emissions ?? telemetry?.totalEmissions ?? telemetry?.total_carbon_emission,
    telemetry?.target ?? historicalAverages?.targetEmissions ?? historicalAverages?.totalEmissions
  );

  return {
    anomalyStatus: statusFromPercent(totalIncrease),
    rootCause: buildDeterministicRootCause(telemetry, historicalAverages, chartContext),
    confidenceScore: 100,
    estimatedImpact: totalIncrease !== null && totalIncrease > 0
      ? `${totalIncrease.toFixed(2)}% above baseline`
      : 'Operational anomaly detected',
    actionList: buildFallbackActions(chartContext),
  };
};

module.exports = {
  analyze,
};
