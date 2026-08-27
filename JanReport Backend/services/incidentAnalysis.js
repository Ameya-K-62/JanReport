const HF_API_URL =
  process.env.HUGGING_FACE_ROUTER_URL ||
  'https://router.huggingface.co/hf-inference/models';
const SENTIMENT_MODEL =
  process.env.HUGGING_FACE_SENTIMENT_MODEL ||
  'distilbert/distilbert-base-uncased-finetuned-sst-2-english';

const highSeverityKeywords = [
  'fire',
  'explosion',
  'blast',
  'dead',
  'death',
  'casualty',
  'killed',
  'murder',
  'shooting',
  'riot',
  'collapsed',
  'flood',
  'earthquake',
  'accident',
  'crash',
  'injured',
  'emergency',
];

const mediumSeverityKeywords = [
  'traffic',
  'jam',
  'leak',
  'outage',
  'protest',
  'damage',
  'blocked',
  'unsafe',
  'warning',
  'pollution',
  'contamination',
  'shortage',
];

const requestInference = async (model, text) => {
  const token = process.env.HUGGING_FACE_ACCESS_TOKEN;

  if (!token) {
    throw new Error('HUGGING_FACE_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error || `Hugging Face request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
};

const normalizeSentiment = (predictionList) => {
  const labels = Array.isArray(predictionList?.[0]) ? predictionList[0] : predictionList;

  if (!Array.isArray(labels) || labels.length === 0) {
    return {
      label: 'NEUTRAL',
      score: 0,
      confidence: 0,
      result: 'Sentiment analysis unavailable',
    };
  }

  const top = labels.sort((a, b) => b.score - a.score)[0];
  const rawLabel = String(top.label || '').toUpperCase();

  let normalized = 'NEUTRAL';
  if (rawLabel.includes('NEGATIVE') || rawLabel === 'LABEL_0') {
    normalized = 'NEGATIVE';
  } else if (rawLabel.includes('POSITIVE') || rawLabel === 'LABEL_1') {
    normalized = 'POSITIVE';
  }

  return {
    label: normalized,
    score: top.score,
    confidence: Math.round(top.score * 100),
    result: `${normalized} sentiment detected by BERT (${Math.round(top.score * 100)}% confidence)`,
    rawLabel: top.label,
  };
};

const calculateSeverity = (text, sentiment) => {
  const lowerText = text.toLowerCase();

  const hasHighKeyword = highSeverityKeywords.some((keyword) =>
    lowerText.includes(keyword)
  );
  const hasMediumKeyword = mediumSeverityKeywords.some((keyword) =>
    lowerText.includes(keyword)
  );

  let score = 30;
  if (sentiment.label === 'NEGATIVE') {
    score += Math.round(sentiment.score * 35);
  } else if (sentiment.label === 'POSITIVE') {
    score -= 10;
  }

  if (hasHighKeyword) {
    score += 40;
  } else if (hasMediumKeyword) {
    score += 20;
  }

  score = Math.max(0, Math.min(100, score));

  let level = 'low';
  if (score >= 75) {
    level = 'high';
  } else if (score >= 45) {
    level = 'medium';
  }

  return {
    level,
    score,
    result: `Estimated ${level.toUpperCase()} incident severity (${score}/100) based on sentiment and incident cues`,
  };
};

export const analyzeIncident = async ({ title, description, location }) => {
  const content = [title, description, location].filter(Boolean).join('. ').trim();

  if (!content) {
    throw new Error('Incident text is required for analysis');
  }

  const prediction = await requestInference(SENTIMENT_MODEL, content);
  const sentiment = normalizeSentiment(prediction);
  const severity = calculateSeverity(content, sentiment);

  return {
    sentiment,
    severity,
    model: SENTIMENT_MODEL,
  };
};
