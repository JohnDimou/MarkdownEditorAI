import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

// Model capabilities - determines API parameters per model
function getModelCapabilities(modelId) {
  const id = modelId.toLowerCase();
  
  // O1 models: reasoning, no temperature, no system messages
  if (id.startsWith('o1')) {
    return { 
      hasReasoning: true,
      reasoningEffortValues: id.includes('preview') ? ['low', 'medium', 'high'] : ['medium'],
      defaultReasoningEffort: 'medium',
      useMaxCompletionTokens: true,
      supportsTemperature: false,
      supportsSystemMessage: false
    };
  }
  
  // O3 models: reasoning, no temperature
  if (id.startsWith('o3')) {
    return { 
      hasReasoning: true,
      reasoningEffortValues: ['medium'],
      defaultReasoningEffort: 'medium',
      useMaxCompletionTokens: true,
      supportsTemperature: false,
      supportsSystemMessage: true
    };
  }
  
  // GPT-5.x and GPT-4.1: reasoning models
  if (id.includes('gpt-5') || id.includes('gpt-4.1')) {
    return { 
      hasReasoning: true,
      reasoningEffortValues: ['low', 'medium', 'high'],
      defaultReasoningEffort: 'medium',
      useMaxCompletionTokens: true,
      supportsTemperature: false,
      supportsSystemMessage: true
    };
  }
  
  // GPT-4o/4-turbo: modern, no reasoning
  if (id.includes('gpt-4o') || id.includes('gpt-4-turbo')) {
    return { 
      hasReasoning: false,
      reasoningEffortValues: [],
      defaultReasoningEffort: null,
      useMaxCompletionTokens: true,
      supportsTemperature: true,
      supportsSystemMessage: true
    };
  }
  
  // Default: older models
  return { 
    hasReasoning: false,
    reasoningEffortValues: [],
    defaultReasoningEffort: null,
    useMaxCompletionTokens: false,
    supportsTemperature: true,
    supportsSystemMessage: true
  };
}

// Format model names for display
function formatModelName(modelId) {
  const id = modelId.toLowerCase();
  if (id === 'gpt-4o') return 'GPT-4o';
  if (id === 'gpt-4.1') return 'GPT-4.1';
  if (id === 'gpt-5') return 'GPT-5';
  if (id.startsWith('o1-mini')) return 'O1 Mini';
  if (id.startsWith('o1-preview')) return 'O1 Preview';
  if (id.startsWith('o1')) return 'O1';
  if (id.startsWith('o3-mini')) return 'O3 Mini';
  if (id.startsWith('o3')) return 'O3';
  return modelId;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fetch available models from OpenAI
app.post('/api/models', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.models.list();
    
    const chatModels = response.data
      .filter(model => {
        const id = model.id.toLowerCase();
        
        // Only keep models with 0 or 1 hyphen
        if ((id.match(/-/g) || []).length > 1) return false;
        
        // Whitelist chat models
        const isChat = 
          id.startsWith('gpt-4o') ||
          id.startsWith('gpt-4.') ||
          id.startsWith('gpt-5') ||
          id.startsWith('o1') ||
          id.startsWith('o3');
        
        // Blacklist non-chat variants
        const excluded = ['instruct', 'vision', 'audio', 'realtime', 'embedding', 'base'];
        const isExcluded = excluded.some(x => id.includes(x));
        
        return isChat && !isExcluded;
      })
      .map(model => {
        const caps = getModelCapabilities(model.id);
        return {
          id: model.id,
          name: formatModelName(model.id),
          created: model.created,
          hasReasoning: caps.hasReasoning,
          reasoningOptions: caps.reasoningEffortValues,
          defaultReasoning: caps.defaultReasoningEffort,
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({ models: chatModels });
  } catch (error) {
    console.error('Error fetching models:', error.message);
    if (error.status === 401) return res.status(401).json({ error: 'Invalid API key' });
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// AI Enhancement endpoint
app.post('/api/enhance-smart', async (req, res) => {
  try {
    const { text, mode, customInstruction, settings } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (!settings?.apiKey) {
      return res.status(400).json({ error: 'API key required. Add it in Settings.' });
    }

    const { apiKey, model, reasoningEffort, maxTokens } = settings;
    const caps = getModelCapabilities(model);
    const openai = new OpenAI({ apiKey });

    const isDocument = mode === 'document';
    const instruction = customInstruction?.trim();

    const systemPrompt = isDocument
      ? `You are an expert markdown editor. Enhance the ENTIRE document.
${instruction ? `INSTRUCTION: "${instruction}"` : 'Improve clarity, grammar, flow, and readability.'}
RULES:
1. Return the COMPLETE enhanced document
2. Enhance ALL parts - beginning, middle, AND end
3. Preserve markdown structure and formatting
4. Output ONLY the enhanced markdown, nothing else`
      : `You are a writing assistant. Improve the selected text.
${instruction ? `INSTRUCTION: "${instruction}"` : 'Improve clarity, grammar, and style.'}
RULES:
1. Provide ONE improved version
2. Keep similar length
3. Preserve meaning and tone
Output JSON only: {"replacement":"improved text","reason":"what was improved"}`;

    // Build messages
    const messages = caps.supportsSystemMessage 
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }]
      : [{ role: 'user', content: `${systemPrompt}\n\n---\n\n${text}` }];

    // Build options
    const options = { model, messages };

    if (caps.hasReasoning) {
      const effort = caps.reasoningEffortValues.includes(reasoningEffort) 
        ? reasoningEffort 
        : caps.defaultReasoningEffort;
      options.reasoning_effort = effort;
    }

    if (caps.supportsTemperature) {
      options.temperature = 0.7;
    }

    const tokenLimit = maxTokens || 16000;
    if (caps.useMaxCompletionTokens) {
      options.max_completion_tokens = tokenLimit;
    } else {
      options.max_tokens = tokenLimit;
    }

    const completion = await openai.chat.completions.create(options);
    const responseText = completion.choices[0]?.message?.content || '';

    if (isDocument) {
      const enhanced = responseText.trim();
      if (!enhanced) return res.status(500).json({ error: 'Empty response from AI' });
      res.json({ changes: [{ id: 'doc1', original: text, replacement: enhanced, reason: 'Full document enhancement' }] });
    } else {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse AI response' });
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.replacement) return res.status(500).json({ error: 'Invalid response structure' });
      res.json({ changes: [{ id: 'c1', original: text, replacement: parsed.replacement, reason: parsed.reason || 'Improved text' }] });
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.status === 401) return res.status(401).json({ error: 'Invalid API key' });
    if (error.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
    res.status(500).json({ error: 'Enhancement failed', details: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
