import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

// API key from environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Smart AI Enhancement - returns full enhanced document
// Works for both selection and full document
app.post('/api/enhance-smart', async (req, res) => {
  try {
    const { text, mode, customInstruction } = req.body;
    // mode: 'selection' | 'document'

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const isDocument = mode === 'document';
    const hasCustomInstruction = customInstruction && customInstruction.trim().length > 0;
    
    // NO restrictions - send full text
    const fullText = text;

    // For document mode: return the FULL enhanced document
    // For selection mode: return enhanced selection
    const systemPrompt = isDocument
      ? `You are an expert markdown editor. Your task is to enhance the ENTIRE document.

${hasCustomInstruction ? `INSTRUCTION: "${customInstruction}"` : 'Improve clarity, grammar, flow, and readability throughout.'}

CRITICAL RULES:
1. Return the COMPLETE enhanced document - every single line
2. Enhance ALL parts of the document, not just the beginning
3. Preserve the original structure and formatting (markdown syntax)
4. Make improvements throughout - beginning, middle, AND end
5. Output ONLY the enhanced markdown text, nothing else`

      : `You are a writing assistant. Improve the selected text.

${hasCustomInstruction ? `INSTRUCTION: "${customInstruction}"` : 'Improve clarity, grammar, and style.'}

RULES:
1. Provide ONE improved version
2. Keep similar length to original
3. Preserve meaning and tone

Output JSON only:
{"replacement":"improved text","reason":"what was improved"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullText },
      ],
      // GPT-5.2 with reasoning - no temperature allowed
      reasoning_effort: 'low'
     
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    if (isDocument) {
      // Document mode: return FULL enhanced document as single change
      // The AI returns the complete enhanced markdown directly
      const enhancedDocument = responseText.trim();
      
      if (!enhancedDocument) {
        return res.status(500).json({ error: 'Empty response from AI' });
      }

      res.json({
        changes: [{
          id: 'doc1',
          original: text,
          replacement: enhancedDocument,
          reason: 'Full document enhancement'
        }]
      });
    } else {
      // Selection mode: parse JSON response
      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        return res.status(500).json({
          error: 'Failed to parse AI response',
        });
      }

      if (!parsed.replacement) {
        return res.status(500).json({ error: 'Invalid response structure' });
      }
      
      res.json({
        changes: [{
          id: 'c1',
          original: text,
          replacement: parsed.replacement,
          reason: parsed.reason || 'Improved text'
        }]
      });
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    res.status(500).json({
      error: 'Failed to process enhancement',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

