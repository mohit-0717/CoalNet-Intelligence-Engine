const FALLBACK_RCA = {
  anomalyStatus: 'Warning',
  rootCause: 'AI analysis could not be parsed reliably. Manual inspection is required.',
  confidenceScore: 0,
  estimatedImpact: 'Unknown',
  actionList: [
    { priority: 'High', action: 'Inspect the source telemetry and sensor diagnostics.' },
  ],
};

const STATUS_VALUES = new Set(['Critical', 'Warning', 'Elevated']);

const KEY_ALIASES = {
  anomalystatus: 'anomalyStatus',
  status: 'anomalyStatus',
  severity: 'anomalyStatus',
  level: 'anomalyStatus',
  rootcause: 'rootCause',
  root_cause: 'rootCause',
  cause: 'rootCause',
  cuase: 'rootCause',
  reasoning: 'rootCause',
  reason: 'rootCause',
  explanation: 'rootCause',
  analysis: 'rootCause',
  confidencescore: 'confidenceScore',
  confidence_score: 'confidenceScore',
  confidence: 'confidenceScore',
  score: 'confidenceScore',
  estimatedimpact: 'estimatedImpact',
  estimated_impact: 'estimatedImpact',
  impact: 'estimatedImpact',
  actionlist: 'actionList',
  action_list: 'actionList',
  actions: 'actionList',
  recommendations: 'actionList',
  steps: 'actionList',
};

const TEXT_FIXES = [
  [/\ba\s+significantly\s+increase\b/gi, 'a significant increase'],
  [/\bsignificantly\s+increase\s+in\b/gi, 'significant increase in'],
  [/Ecessive/gi, 'Excessive'],
  [/\b[Tt]e(?=\s+[a-z])/g, 'The'],
  [/\b[Tt]h(?=\s+[a-z])/g, 'The'],
  [/siinificantly/gi, 'significantly'],
  [/significannly/gi, 'significantly'],
  [/Mthane/gi, 'Methane'],
  [/targgt/gi, 'target'],
  [/conversational conversational/gi, 'conversational'],
];

const WORD_FIXES = {
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

const DOMAIN_WORDS = [
  'the', 'has', 'have', 'is', 'are', 'and', 'or', 'due', 'to', 'by',
  'methane', 'emission', 'emissions', 'significantly', 'higher', 'historical',
  'averages', 'indicating', 'potential', 'ventilation', 'failure', 'new', 'gas',
  'pocket', 'total', 'exceeded', 'target', 'unexpected', 'spike', 'likely',
  'caused', 'increase', 'fuel', 'usage', 'issue', 'electricity', 'explosives',
  'transport', 'carbon', 'sensor', 'sensors', 'diagnostics', 'inspect',
  'immediate', 'recommended', 'operational', 'financial', 'impact', 'critical',
  'warning', 'elevated', 'confidence', 'score', 'root', 'cause', 'analysis',
];

const editDistance = (a, b) => {
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

const preserveCase = (original, replacement) => {
  if (original.toUpperCase() === original) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

const correctWord = (word) => {
  const lower = word.toLowerCase();
  if (WORD_FIXES[lower]) return preserveCase(word, WORD_FIXES[lower]);
  if (lower.length < 4 || DOMAIN_WORDS.includes(lower)) return word;

  let bestWord = null;
  let bestDistance = Infinity;

  for (const candidate of DOMAIN_WORDS) {
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

const cleanText = (value) => {
  if (typeof value !== 'string') return value;
  const fixedText = TEXT_FIXES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
  return fixedText
    .replace(/\b[A-Za-z]{2,}\b/g, correctWord)
    .replace(/\ba\s+significantly\s+increase\b/gi, 'a significant increase')
    .replace(/\bsignificantly\s+increase\s+in\b/gi, 'significant increase in')
    .trim();
};

const normalizeKey = (key) => {
  const compact = String(key).replace(/[\s-]/g, '').toLowerCase();
  const snake = String(key).replace(/[\s-]/g, '_').toLowerCase();
  return KEY_ALIASES[compact] || KEY_ALIASES[snake] || key;
};

const stripMarkdownFences = (text) => (
  String(text || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim()
);

const extractJsonObject = (text) => {
  const source = stripMarkdownFences(text);
  const firstBrace = source.indexOf('{');
  if (firstBrace === -1) return source;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < source.length; i += 1) {
    const char = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return source.slice(firstBrace, i + 1);
    }
  }

  const lastBrace = source.lastIndexOf('}');
  return lastBrace > firstBrace ? source.slice(firstBrace, lastBrace + 1) : source.slice(firstBrace);
};

const escapeRawControlCharactersInStrings = (text) => {
  let output = '';
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      output += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      output += char;
      inString = !inString;
      continue;
    }

    if (inString && char === '\n') {
      output += '\\n';
      continue;
    }

    if (inString && char === '\r') {
      output += '\\r';
      continue;
    }

    if (inString && char === '\t') {
      output += '\\t';
      continue;
    }

    output += char;
  }

  return output;
};

const repairJsonText = (text) => (
  escapeRawControlCharactersInStrings(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
);

const parseJsonCandidate = (text) => {
  const candidate = extractJsonObject(text);
  const attempts = [
    candidate,
    repairJsonText(candidate),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      // Try the next repair pass.
    }
  }

  return null;
};

const normalizeActionItem = (item) => {
  if (typeof item === 'string') {
    return { priority: 'Medium', action: cleanText(item) };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const normalized = normalizeKeys(item);
  const priority = cleanText(normalized.priority || normalized.severity || 'Medium');
  const action = cleanText(normalized.action || normalized.recommendation || normalized.step || normalized.description);

  if (!action) return null;
  return { priority, action };
};

const normalizeKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeKeys);
  }

  if (!value || typeof value !== 'object') {
    return cleanText(value);
  }

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    acc[normalizeKey(key)] = normalizeKeys(entryValue);
    return acc;
  }, {});
};

const getFirstStringField = (text, keys) => {
  for (const key of keys) {
    const pattern = new RegExp(`["']?${key}["']?\\s*:\\s*["']([\\s\\S]*?)["']\\s*(?:,|}|\\n)`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) return cleanText(match[1]);
  }
  return undefined;
};

const getFirstNumberField = (text, keys) => {
  for (const key of keys) {
    const pattern = new RegExp(`["']?${key}["']?\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) return Number(match[1]);
  }
  return undefined;
};

const parseFallbackFields = (text) => {
  const source = stripMarkdownFences(text);
  return {
    anomalyStatus: getFirstStringField(source, ['anomalyStatus', 'status', 'severity']) || FALLBACK_RCA.anomalyStatus,
    rootCause: getFirstStringField(source, ['rootCause', 'root_cause', 'cause', 'cuase', 'reasoning', 'explanation']) || FALLBACK_RCA.rootCause,
    confidenceScore: getFirstNumberField(source, ['confidenceScore', 'confidence_score', 'confidence']) || FALLBACK_RCA.confidenceScore,
    estimatedImpact: getFirstStringField(source, ['estimatedImpact', 'estimated_impact', 'impact']) || FALLBACK_RCA.estimatedImpact,
    actionList: FALLBACK_RCA.actionList,
  };
};

const coerceStatus = (value) => {
  const status = cleanText(value);
  if (STATUS_VALUES.has(status)) return status;

  const lowered = String(status || '').toLowerCase();
  if (lowered.includes('critical') || lowered.includes('severe')) return 'Critical';
  if (lowered.includes('elevated') || lowered.includes('moderate')) return 'Elevated';
  return 'Warning';
};

const coerceConfidence = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return FALLBACK_RCA.confidenceScore;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeRcaObject = (value) => {
  const normalized = normalizeKeys(value || {});
  const actionList = Array.isArray(normalized.actionList)
    ? normalized.actionList.map(normalizeActionItem).filter(Boolean)
    : [];

  return {
    anomalyStatus: coerceStatus(normalized.anomalyStatus),
    rootCause: cleanText(normalized.rootCause) || FALLBACK_RCA.rootCause,
    confidenceScore: coerceConfidence(normalized.confidenceScore),
    estimatedImpact: cleanText(normalized.estimatedImpact) || FALLBACK_RCA.estimatedImpact,
    actionList: actionList.length ? actionList : FALLBACK_RCA.actionList,
  };
};

const parseRcaResponse = (rawResponse) => {
  const parsed = parseJsonCandidate(rawResponse);
  if (parsed) {
    return normalizeRcaObject(parsed);
  }

  return normalizeRcaObject(parseFallbackFields(rawResponse));
};

module.exports = {
  parseRcaResponse,
  normalizeRcaObject,
};
