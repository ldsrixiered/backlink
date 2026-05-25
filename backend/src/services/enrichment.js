import OpenAI from 'openai';
import { config } from '../config/env.js';

const categories = ['medspa', 'skincare', 'beauty', 'health', 'wellness', 'local seo', 'other'];
const localTerms = ['near me', 'local', 'city', 'clinic', 'spa', 'salon', 'dermatology', 'aesthetic'];

export async function enrichProspects(prospects) {
  if (!prospects.length) return [];

  const categorized = config.openai.apiKey
    ? await categorizeWithOpenAI(prospects)
    : prospects.map((item) => ({ ...item, category: categorizeLocally(item) }));

  return categorized.map((item) => ({
    ...item,
    localSeo: detectLocalSeo(item)
  }));
}

async function categorizeWithOpenAI(prospects) {
  const client = new OpenAI({ apiKey: config.openai.apiKey });
  const input = prospects.map((item) => ({
    id: item.id,
    domain: item.domain,
    url: item.url,
    anchorText: item.anchorText
  }));

  try {
    const completion = await client.chat.completions.create({
      model: config.openai.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `Return JSON only. Categorize each backlink prospect as one of: ${categories.join(', ')}.`
        },
        {
          role: 'user',
          content: JSON.stringify(input)
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '[]');
    const byId = new Map(parsed.map((item) => [item.id, item.category]));
    return prospects.map((item) => ({
      ...item,
      category: categories.includes(byId.get(item.id)) ? byId.get(item.id) : categorizeLocally(item)
    }));
  } catch {
    return prospects.map((item) => ({ ...item, category: categorizeLocally(item) }));
  }
}

function categorizeLocally(item) {
  const text = `${item.domain} ${item.url} ${item.anchorText}`.toLowerCase();
  if (/(medspa|med spa|aesthetic|injectable|botox|laser)/.test(text)) return 'medspa';
  if (/(skin|skincare|dermatology|acne|facial)/.test(text)) return 'skincare';
  if (/(beauty|salon|makeup|cosmetic)/.test(text)) return 'beauty';
  if (/(health|medical|doctor|wellness clinic)/.test(text)) return 'health';
  if (/(wellness|fitness|lifestyle|self care)/.test(text)) return 'wellness';
  if (/(seo|marketing|local)/.test(text)) return 'local seo';
  return 'other';
}

function detectLocalSeo(item) {
  const text = `${item.domain} ${item.url} ${item.anchorText}`.toLowerCase();
  return localTerms.some((term) => text.includes(term));
}
