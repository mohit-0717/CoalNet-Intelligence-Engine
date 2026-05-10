const MS_PER_DAY = 24 * 60 * 60 * 1000;

const round2 = (value) => Math.round(value * 100) / 100;

const toDailySeries = (emissions) => {
  return emissions
    .map((entry) => ({
      date: new Date(entry.date),
      value: Number(entry.total_carbon_emission) || 0,
    }))
    .filter((entry) => !Number.isNaN(entry.date.getTime()) && entry.value >= 0)
    .sort((a, b) => a.date - b.date);
};

const calculateTrend = (series) => {
  const n = series.length;
  if (n < 2) return 0;

  const meanX = (n - 1) / 2;
  const meanY = series.reduce((sum, point) => sum + point.value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (i - meanX) * (series[i].value - meanY);
    denominator += (i - meanX) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateError = (series, trend) => {
  if (series.length < 3) return 0;

  const residuals = [];
  for (let i = 1; i < series.length; i += 1) {
    const expected = series[i - 1].value + trend;
    residuals.push(Math.abs(series[i].value - expected));
  }

  const mae = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
  const rmse = Math.sqrt(
    residuals.reduce((sum, value) => sum + value ** 2, 0) / residuals.length
  );

  return { mae: round2(mae), rmse: round2(rmse) };
};

const generateFallbackForecast = (emissions, horizon) => {
  const series = toDailySeries(emissions);
  if (series.length < 30) {
    throw new Error(
      `Insufficient data for forecasting. Need at least 30 data points, got ${series.length}.`
    );
  }

  const recentWindow = series.slice(-30);
  const lastPoint = series[series.length - 1];
  const trend = calculateTrend(recentWindow);
  const accuracy = calculateError(recentWindow, trend);
  const averageRecent =
    recentWindow.reduce((sum, point) => sum + point.value, 0) / recentWindow.length;
  const interval = Math.max(accuracy.rmse || 0, averageRecent * 0.08);

  const forecastData = [];
  for (let step = 1; step <= horizon; step += 1) {
    const date = new Date(lastPoint.date.getTime() + step * MS_PER_DAY);
    const predicted = Math.max(0, lastPoint.value + trend * step);
    const expandingInterval = interval * Math.sqrt(step);

    forecastData.push({
      date: date.toISOString().slice(0, 10),
      predicted: round2(predicted),
      upper_bound: round2(predicted + expandingInterval),
      lower_bound: round2(Math.max(0, predicted - expandingInterval)),
    });
  }

  return {
    forecast_data: forecastData,
    model_accuracy: accuracy,
    model_params: {
      order: [0, 0, 0],
      aic: 0,
    },
    data_points_used: series.length,
  };
};

module.exports = { generateFallbackForecast };
