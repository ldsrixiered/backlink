import OpenAI from 'openai';
import { config } from '../config/env.js';

export async function createDraft(prospect) {
  if (!config.openai.apiKey) return fallbackDraft(prospect);

  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const completion = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: 'Write concise, friendly SEO backlink outreach emails. Avoid hype. Return plain text only.'
      },
      {
        role: 'user',
        content: JSON.stringify(prospect)
      }
    ]
  });

  return completion.choices[0].message.content || fallbackDraft(prospect);
}

function fallbackDraft(prospect) {
  return [
    'Hi there,',
    '',
    `I found ${prospect.domain} while researching useful ${prospect.category || 'health and beauty'} resources.`,
    '',
    'I thought one of our guides could be a helpful addition for your readers if it fits naturally on the page.',
    '',
    'Would you be open to taking a quick look?',
    '',
    'Best,',
    '[Your Name]'
  ].join('\n');
}
