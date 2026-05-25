import { config } from '../config/env.js';

export async function findEmailsForDomain(domain) {
  if (!config.hunter.apiKey) return [];

  const url = new URL('https://api.hunter.io/v2/domain-search');
  url.searchParams.set('domain', domain);
  url.searchParams.set('api_key', config.hunter.apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hunter.io request failed with ${response.status}`);
  }

  const payload = await response.json();
  return (payload.data?.emails || []).map((item) => ({
    email: item.value,
    firstName: item.first_name,
    lastName: item.last_name,
    confidence: item.confidence,
    position: item.position
  }));
}
