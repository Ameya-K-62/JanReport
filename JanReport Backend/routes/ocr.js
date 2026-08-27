import express from 'express';

const router = express.Router();
const OCR_API_ENDPOINT = 'https://api.ocr.space/parse/image';

const normalizeErrorMessage = (value) => {
  if (Array.isArray(value)) {
    return value.join(' | ');
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
};

const parseCoordinates = (text) => {
  if (!text) {
    return { latitude: null, longitude: null };
  }

  const normalized = String(text)
    .replace(/\r/g, '\n')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ');

  const sanitized = normalized
    .replace(/\bl6ng\b/gi, 'long')
    .replace(/\bl0ng\b/gi, 'long')
    .replace(/\blng\b/gi, 'long')
    .replace(/\b1at\b/gi, 'lat')
    .replace(/\blatltude\b/gi, 'latitude')
    .replace(/\blattitude\b/gi, 'latitude')
    .replace(/\bmaharashtra\b/gi, 'Maharashtra');

  const keyedPatterns = [
    /(?:lat(?:itude)?|1at(?:itude)?)[^\d+\-]*([-+]?\d{1,2}(?:[.,]\d+)?)\D+(?:lon(?:gitude)?|long|lng|l6ng|l0ng)[^\d+\-]*([-+]?\d{1,3}(?:[.,]\d+)?)/i,
    /(?:lon(?:gitude)?|long|lng|l6ng|l0ng)[^\d+\-]*([-+]?\d{1,3}(?:[.,]\d+)?)\D+(?:lat(?:itude)?|1at(?:itude)?)[^\d+\-]*([-+]?\d{1,2}(?:[.,]\d+)?)/i,
  ];

  const genericPattern = /([-+]?\d{1,2}(?:[.,]\d+)?)[^\d+\-]+([-+]?\d{1,3}(?:[.,]\d+)?)/g;

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const isValidLatLon = (lat, lon) => {
    return lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  };

  for (const pattern of keyedPatterns) {
    const keyedMatch = sanitized.match(pattern);

    if (keyedMatch) {
      const first = toNumber(keyedMatch[1].replace(',', '.'));
      const second = toNumber(keyedMatch[2].replace(',', '.'));

      if (pattern === keyedPatterns[0]) {
        if (isValidLatLon(first, second)) {
          return { latitude: first, longitude: second };
        }
      } else if (isValidLatLon(second, first)) {
        return { latitude: second, longitude: first };
      }
    }
  }

  for (const match of sanitized.matchAll(genericPattern)) {
    const lat = toNumber(match[1].replace(',', '.'));
    const lon = toNumber(match[2].replace(',', '.'));

    if (isValidLatLon(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  const explicitLat = sanitized.match(/(?:lat(?:itude)?|1at(?:itude)?)\D*([-+]?\d{1,2}(?:[.,]\d+)?)/i);
  const explicitLon = sanitized.match(/(?:lon(?:gitude)?|long|lng|l6ng|l0ng)\D*([-+]?\d{1,3}(?:[.,]\d+)?)/i);

  if (explicitLat && explicitLon) {
    const lat = toNumber(explicitLat[1].replace(',', '.'));
    const lon = toNumber(explicitLon[1].replace(',', '.'));

    if (isValidLatLon(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  return { latitude: null, longitude: null };
};

router.post('/parse-geotag', async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Valid base64 image is required',
      });
    }

    const apiKey = process.env.OCR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OCR API key is not configured on server',
      });
    }

    const attemptEngine = async (engine) => {
      const formData = new FormData();
      formData.append('base64Image', base64Image);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', String(engine));
      formData.append('apikey', apiKey);

      const response = await fetch(OCR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          apikey: apiKey,
        },
        body: formData,
      });

      const payload = await response.json();
      return { response, payload, engine };
    };

    const attempts = [];
    for (const engine of [2, 1]) {
      const result = await attemptEngine(engine);
      attempts.push(result);

      if (result.response.ok && !result.payload?.IsErroredOnProcessing) {
        break;
      }
    }

    const successfulAttempt = attempts.find(
      (attempt) => attempt.response.ok && !attempt.payload?.IsErroredOnProcessing
    );

    if (!successfulAttempt) {
      const latestAttempt = attempts[attempts.length - 1];
      const latestPayload = latestAttempt?.payload;

      return res.status(502).json({
        success: false,
        message:
          normalizeErrorMessage(latestPayload?.ErrorMessage) ||
          'OCR service failed. Try a clearer/smaller image.',
        details: normalizeErrorMessage(latestPayload?.ErrorDetails),
        attempts: attempts.map((attempt) => ({
          engine: attempt.engine,
          status: attempt.response.status,
          error:
            normalizeErrorMessage(attempt.payload?.ErrorMessage) ||
            normalizeErrorMessage(attempt.payload?.ErrorDetails) ||
            null,
        })),
      });
    }

    const payload = successfulAttempt.payload;

    const parsedResults = Array.isArray(payload?.ParsedResults) ? payload.ParsedResults : [];
    const parsedText = parsedResults
      .map((result) => result?.ParsedText || '')
      .join('\n')
      .trim();

    const { latitude, longitude } = parseCoordinates(parsedText);

    res.json({
      success: true,
      data: {
        parsedText,
        latitude,
        longitude,
        engineUsed: successfulAttempt.engine,
        processingTimeInMilliseconds: payload?.ProcessingTimeInMilliseconds || null,
      },
    });
  } catch (error) {
    console.error('OCR parse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse image using OCR',
      error: error.message,
    });
  }
});

export default router;
