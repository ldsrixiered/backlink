const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:4173/api' : '/api');

export async function fetchProspects() {
  const response = await fetch(`${API_BASE}/prospects`);
  return parseResponse(response);
}

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/prospects/upload`, {
    method: 'POST',
    body: formData
  });
  return parseResponse(response);
}

export async function updateStatus(id, status) {
  const response = await fetch(`${API_BASE}/prospects/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return parseResponse(response);
}

export async function generateDraft(id) {
  const response = await fetch(`${API_BASE}/prospects/${id}/draft`, {
    method: 'POST'
  });
  return parseResponse(response);
}

export function exportCsvUrl() {
  return `${API_BASE}/prospects/export.csv`;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed with ${response.status}`);
  return payload;
}
