const STORAGE_KEY = 'backlink-desk-prospects-v1';

const statuses = [
  'Not Contacted',
  'Drafted',
  'Sent',
  'Follow Up 1',
  'Follow Up 2',
  'Replied',
  'Accepted',
  'Live',
  'Rejected',
  'Lost'
];

let prospects = loadProspects();
let activeView = 'all';

const els = {
  rows: document.querySelector('#prospectRows'),
  empty: document.querySelector('#emptyState'),
  search: document.querySelector('#searchInput'),
  statusFilter: document.querySelector('#statusFilter'),
  add: document.querySelector('#addProspect'),
  seed: document.querySelector('#seedData'),
  exportCsv: document.querySelector('#exportCsv'),
  importCsv: document.querySelector('#importCsv'),
  bulkDrafts: document.querySelector('#bulkDrafts'),
  prospectDialog: document.querySelector('#prospectDialog'),
  draftDialog: document.querySelector('#draftDialog'),
  draftText: document.querySelector('#draftText'),
  copyDraft: document.querySelector('#copyDraft'),
  form: document.querySelector('#prospectForm'),
  dialogTitle: document.querySelector('#dialogTitle'),
  metrics: {
    total: document.querySelector('#metricTotal'),
    due: document.querySelector('#metricDue'),
    live: document.querySelector('#metricLive'),
    dr: document.querySelector('#metricDr')
  }
};

const fields = {
  id: document.querySelector('#prospectId'),
  domain: document.querySelector('#domain'),
  prospectUrl: document.querySelector('#prospectUrl'),
  contactEmail: document.querySelector('#contactEmail'),
  contactName: document.querySelector('#contactName'),
  niche: document.querySelector('#niche'),
  dr: document.querySelector('#dr'),
  status: document.querySelector('#status'),
  lastContacted: document.querySelector('#lastContacted'),
  targetUrl: document.querySelector('#targetUrl'),
  anchor: document.querySelector('#anchor'),
  liveUrl: document.querySelector('#liveUrl'),
  notes: document.querySelector('#notes')
};

function loadProspects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProspects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getNextFollowUp(item) {
  if (!item.lastContacted || ['Replied', 'Accepted', 'Live', 'Rejected', 'Lost'].includes(item.status)) return '';
  const count = Number(item.followUpCount || 0);
  return addDays(item.lastContacted, count === 0 ? 4 : 7);
}

function isDue(item) {
  const next = item.nextFollowUp || getNextFollowUp(item);
  return Boolean(next && next <= todayIso() && !['Live', 'Rejected', 'Lost', 'Replied'].includes(item.status));
}

function render() {
  const filtered = getFilteredProspects();
  renderMetrics();
  els.rows.innerHTML = filtered.map(rowTemplate).join('');
  els.empty.classList.toggle('is-visible', prospects.length === 0);
  bindRowActions();
}

function getFilteredProspects() {
  const query = els.search.value.trim().toLowerCase();
  const status = els.statusFilter.value;

  return prospects.filter((item) => {
    const haystack = [
      item.domain,
      item.niche,
      item.contactEmail,
      item.contactName,
      item.status,
      item.linkStatus
    ].join(' ').toLowerCase();

    if (activeView === 'due' && !isDue(item)) return false;
    if (activeView === 'live' && item.status !== 'Live') return false;
    if (status && item.status !== status) return false;
    return !query || haystack.includes(query);
  });
}

function renderMetrics() {
  const due = prospects.filter(isDue).length;
  const live = prospects.filter((item) => item.status === 'Live').length;
  const drValues = prospects.map((item) => Number(item.dr)).filter((value) => value > 0);
  const avgDr = drValues.length
    ? Math.round(drValues.reduce((sum, value) => sum + value, 0) / drValues.length)
    : 0;

  els.metrics.total.textContent = prospects.length;
  els.metrics.due.textContent = due;
  els.metrics.live.textContent = live;
  els.metrics.dr.textContent = avgDr;
}

function rowTemplate(item) {
  const nextFollowUp = item.nextFollowUp || getNextFollowUp(item);
  const statusClass = statusClassName(item.status);
  const linkStatus = item.linkStatus || 'Unchecked';

  return `
    <tr data-id="${escapeHtml(item.id)}">
      <td class="domain-cell">
        <strong>${escapeHtml(item.domain || 'Untitled')}</strong>
        <span>${escapeHtml(item.prospectUrl || '')}</span>
      </td>
      <td>${escapeHtml(item.niche || '-')}</td>
      <td class="contact-cell">
        <strong>${escapeHtml(item.contactName || '-')}</strong>
        <span>${escapeHtml(item.contactEmail || '')}</span>
      </td>
      <td>${escapeHtml(item.dr || '-')}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(item.status || 'Not Contacted')}</span></td>
      <td>${escapeHtml(nextFollowUp || '-')}</td>
      <td>${escapeHtml(linkStatus)}</td>
      <td>
        <div class="row-actions">
          <button class="mini-button" data-action="draft" type="button">Draft</button>
          <button class="mini-button" data-action="check" type="button">Check</button>
          <button class="mini-button" data-action="sent" type="button">Sent</button>
          <button class="mini-button" data-action="edit" type="button">Edit</button>
          <button class="mini-button" data-action="delete" type="button">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function statusClassName(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'live' || value === 'accepted') return 'live';
  if (value === 'lost' || value === 'rejected') return value;
  if (value.includes('follow')) return 'follow';
  return '';
}

function bindRowActions() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('tr').dataset.id;
      const action = button.dataset.action;
      const item = prospects.find((prospect) => prospect.id === id);
      if (!item) return;

      if (action === 'draft') showDraft(item);
      if (action === 'check') checkBacklink(item);
      if (action === 'sent') markSent(item);
      if (action === 'edit') openForm(item);
      if (action === 'delete') deleteProspect(item);
    });
  });
}

function openForm(item = null) {
  els.dialogTitle.textContent = item ? 'Edit Prospect' : 'Add Prospect';
  fields.id.value = item?.id || '';
  fields.domain.value = item?.domain || '';
  fields.prospectUrl.value = item?.prospectUrl || '';
  fields.contactEmail.value = item?.contactEmail || '';
  fields.contactName.value = item?.contactName || '';
  fields.niche.value = item?.niche || '';
  fields.dr.value = item?.dr || '';
  fields.status.value = item?.status || 'Not Contacted';
  fields.lastContacted.value = item?.lastContacted || '';
  fields.targetUrl.value = item?.targetUrl || '';
  fields.anchor.value = item?.anchor || '';
  fields.liveUrl.value = item?.liveUrl || '';
  fields.notes.value = item?.notes || '';
  els.prospectDialog.showModal();
}

function readForm() {
  const nextFollowUp = getNextFollowUp({
    lastContacted: fields.lastContacted.value,
    followUpCount: fields.id.value ? prospects.find((item) => item.id === fields.id.value)?.followUpCount : 0,
    status: fields.status.value
  });

  return {
    id: fields.id.value || uid(),
    domain: fields.domain.value.trim(),
    prospectUrl: fields.prospectUrl.value.trim(),
    contactEmail: fields.contactEmail.value.trim(),
    contactName: fields.contactName.value.trim(),
    niche: fields.niche.value.trim(),
    dr: fields.dr.value.trim(),
    status: fields.status.value,
    lastContacted: fields.lastContacted.value,
    nextFollowUp,
    targetUrl: fields.targetUrl.value.trim(),
    anchor: fields.anchor.value.trim(),
    liveUrl: fields.liveUrl.value.trim(),
    linkStatus: fields.id.value ? prospects.find((item) => item.id === fields.id.value)?.linkStatus || '' : '',
    followUpCount: fields.id.value ? prospects.find((item) => item.id === fields.id.value)?.followUpCount || 0 : 0,
    notes: fields.notes.value.trim(),
    draft: fields.id.value ? prospects.find((item) => item.id === fields.id.value)?.draft || '' : ''
  };
}

function upsertProspect(item) {
  const index = prospects.findIndex((prospect) => prospect.id === item.id);
  if (index >= 0) {
    prospects[index] = item;
  } else {
    prospects.unshift(item);
  }
  saveProspects();
  render();
}

function generateDraft(item) {
  const name = item.contactName || 'there';
  const niche = item.niche || 'your website';
  const domain = item.domain || 'your site';
  const target = item.targetUrl || '[your URL]';
  const anchorLine = item.anchor
    ? `If it fits naturally, the anchor "${item.anchor}" would make sense.`
    : 'If it fits naturally, a contextual mention would be great.';

  return [
    `Hi ${name},`,
    '',
    `I was checking out ${domain} and noticed you publish useful content around ${niche}.`,
    '',
    'I thought this page might be a helpful additional resource for your readers:',
    target,
    '',
    anchorLine,
    '',
    'Would you be open to including it if it adds value to the page?',
    '',
    'Best,',
    '[Your Name]'
  ].join('\n');
}

function showDraft(item) {
  item.draft = item.draft || generateDraft(item);
  if (item.status === 'Not Contacted') item.status = 'Drafted';
  saveProspects();
  els.draftText.value = item.draft;
  els.draftDialog.showModal();
  render();
}

async function checkBacklink(item) {
  if (!item.liveUrl || !item.targetUrl) {
    item.linkStatus = 'Needs live URL + target URL';
    saveProspects();
    render();
    return;
  }

  item.linkStatus = 'Checking...';
  saveProspects();
  render();

  try {
    const response = await fetch('/api/check-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveUrl: item.liveUrl, targetUrl: item.targetUrl })
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Check failed');

    item.linkStatus = result.found
      ? `Live - ${result.nofollow ? 'nofollow' : 'dofollow'}`
      : 'Missing';
    if (result.found) item.status = 'Live';
  } catch (error) {
    item.linkStatus = `Check failed: ${error.message}`;
  }

  saveProspects();
  render();
}

function markSent(item) {
  if (item.status === 'Follow Up 1') {
    item.followUpCount = 2;
    item.status = 'Follow Up 2';
  } else if (item.status === 'Sent' && isDue(item)) {
    item.followUpCount = 1;
    item.status = 'Follow Up 1';
  } else {
    item.followUpCount = 0;
    item.status = 'Sent';
  }

  item.lastContacted = todayIso();
  item.nextFollowUp = getNextFollowUp(item);
  saveProspects();
  render();
}

function deleteProspect(item) {
  const ok = confirm(`Delete ${item.domain || 'this prospect'}?`);
  if (!ok) return;
  prospects = prospects.filter((prospect) => prospect.id !== item.id);
  saveProspects();
  render();
}

function seedData() {
  if (prospects.length && !confirm('Add sample rows to your current data?')) return;
  prospects = [
    {
      id: uid(),
      domain: 'searchjournal.example',
      prospectUrl: 'https://searchjournal.example/resources',
      contactEmail: 'editor@searchjournal.example',
      contactName: 'Maya',
      niche: 'SEO resources',
      dr: '62',
      status: 'Sent',
      lastContacted: addDays(todayIso(), -5),
      nextFollowUp: todayIso(),
      targetUrl: 'https://your-site.com/seo-automation-guide',
      anchor: 'SEO automation guide',
      liveUrl: '',
      linkStatus: 'Unchecked',
      followUpCount: 0,
      notes: 'Resource page prospect.',
      draft: ''
    },
    {
      id: uid(),
      domain: 'localgrowth.example',
      prospectUrl: 'https://localgrowth.example/write-for-us',
      contactEmail: 'hello@localgrowth.example',
      contactName: 'Sam',
      niche: 'Local marketing',
      dr: '41',
      status: 'Drafted',
      lastContacted: '',
      nextFollowUp: '',
      targetUrl: 'https://your-site.com/local-seo-checklist',
      anchor: 'local SEO checklist',
      liveUrl: '',
      linkStatus: 'Unchecked',
      followUpCount: 0,
      notes: 'Guest post angle.',
      draft: ''
    }
  ].concat(prospects);
  saveProspects();
  render();
}

function exportCsv() {
  const headers = [
    'Domain',
    'Prospect URL',
    'Contact Email',
    'Contact Name',
    'Niche',
    'DR',
    'Status',
    'Last Contacted',
    'Next Follow Up',
    'Target URL',
    'Anchor',
    'Live Backlink URL',
    'Link Status',
    'Follow Up Count',
    'Notes',
    'Draft'
  ];

  const rows = prospects.map((item) => [
    item.domain,
    item.prospectUrl,
    item.contactEmail,
    item.contactName,
    item.niche,
    item.dr,
    item.status,
    item.lastContacted,
    item.nextFollowUp,
    item.targetUrl,
    item.anchor,
    item.liveUrl,
    item.linkStatus,
    item.followUpCount,
    item.notes,
    item.draft
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backlink-prospects-${todayIso()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function importCsv(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result || ''));
    const imported = rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
      id: uid(),
      domain: row[0] || '',
      prospectUrl: row[1] || '',
      contactEmail: row[2] || '',
      contactName: row[3] || '',
      niche: row[4] || '',
      dr: row[5] || '',
      status: statuses.includes(row[6]) ? row[6] : 'Not Contacted',
      lastContacted: row[7] || '',
      nextFollowUp: row[8] || '',
      targetUrl: row[9] || '',
      anchor: row[10] || '',
      liveUrl: row[11] || '',
      linkStatus: row[12] || 'Unchecked',
      followUpCount: Number(row[13] || 0),
      notes: row[14] || '',
      draft: row[15] || ''
    }));
    prospects = imported.concat(prospects);
    saveProspects();
    render();
  };
  reader.readAsText(file);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

els.add.addEventListener('click', () => openForm());
document.querySelector('[data-empty-add]').addEventListener('click', () => openForm());
els.seed.addEventListener('click', seedData);
els.exportCsv.addEventListener('click', exportCsv);
els.importCsv.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) importCsv(file);
  event.target.value = '';
});
els.bulkDrafts.addEventListener('click', () => {
  prospects = prospects.map((item) => ({
    ...item,
    status: item.status === 'Not Contacted' ? 'Drafted' : item.status,
    draft: item.draft || generateDraft(item)
  }));
  saveProspects();
  render();
});
els.search.addEventListener('input', render);
els.statusFilter.addEventListener('change', render);

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    activeView = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    render();
  });
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => els.prospectDialog.close());
});

document.querySelector('[data-close-draft]').addEventListener('click', () => els.draftDialog.close());

els.copyDraft.addEventListener('click', async () => {
  await navigator.clipboard.writeText(els.draftText.value);
  els.copyDraft.textContent = 'Copied';
  setTimeout(() => {
    els.copyDraft.textContent = 'Copy Draft';
  }, 1200);
});

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  upsertProspect(readForm());
  els.prospectDialog.close();
});

render();
