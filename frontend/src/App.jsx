import { useEffect, useMemo, useState } from 'react';
import { Download, FileUp, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { exportCsvUrl, fetchProspects, generateDraft, updateStatus, uploadCsv } from './lib/api.js';

const statuses = ['New', 'Contacted', 'Replied', 'Won', 'Rejected'];

export default function App() {
  const [prospects, setProspects] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    fetchProspects()
      .then((data) => setProspects(data.prospects))
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    return prospects.filter((item) => {
      const text = `${item.domain} ${item.url} ${item.category} ${item.outreachStatus}`.toLowerCase();
      if (status && item.outreachStatus !== status) return false;
      return !query || text.includes(query.toLowerCase());
    });
  }, [prospects, query, status]);

  const metrics = useMemo(() => {
    const won = prospects.filter((item) => item.outreachStatus === 'Won').length;
    const avgAuthority = prospects.length
      ? Math.round(prospects.reduce((sum, item) => sum + Number(item.authorityScore || 0), 0) / prospects.length)
      : 0;
    return {
      total: prospects.length,
      newItems: prospects.filter((item) => item.outreachStatus === 'New').length,
      won,
      avgAuthority
    };
  }, [prospects]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await uploadCsv(file);
      setProspects(data.prospects);
      setMessage(`Imported ${data.kept} qualified prospects. Removed ${data.removed}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  async function handleStatusChange(id, nextStatus) {
    const data = await updateStatus(id, nextStatus);
    setProspects((items) => items.map((item) => (item.id === id ? data.prospect : item)));
  }

  async function handleDraft(id) {
    setLoading(true);
    try {
      const data = await generateDraft(id);
      setDraft(data.draft);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-ink dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-mint">SEO Outreach</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">Backlink Prospect Manager</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-coral px-4 py-3 font-bold text-white shadow-sm">
              <FileUp size={18} />
              <span>{loading ? 'Working...' : 'Upload CSV'}</span>
              <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleUpload} disabled={loading} />
            </label>
            <a className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 font-bold dark:border-slate-700 dark:bg-slate-900" href={exportCsvUrl()}>
              <Download size={18} />
              Export CSV
            </a>
            <button className="rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" type="button" onClick={() => setIsDark((value) => !value)}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total Prospects" value={metrics.total} />
          <Metric label="New" value={metrics.newItems} />
          <Metric label="Won" value={metrics.won} />
          <Metric label="Avg Authority" value={metrics.avgAuthority} />
        </section>

        <section className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-mint dark:border-slate-700 dark:bg-slate-950" placeholder="Search domain, URL, category, status" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="rounded-md border border-slate-300 bg-white px-3 py-3 font-bold dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </section>

        {message && <div className="rounded-md border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-semibold">{message}</div>}

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4">Domain</th>
                  <th className="px-4 py-4">Authority</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Local SEO</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date Added</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <div className="font-black">{item.domain}</div>
                      <a className="mt-1 block max-w-md truncate text-slate-500 hover:text-mint" href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                    </td>
                    <td className="px-4 py-4 font-bold">{item.authorityScore}</td>
                    <td className="px-4 py-4"><Badge>{item.category}</Badge></td>
                    <td className="px-4 py-4">{item.localSeo ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-4">
                      <select className="rounded-md border border-slate-300 bg-white px-3 py-2 font-bold dark:border-slate-700 dark:bg-slate-950" value={item.outreachStatus} onChange={(event) => handleStatusChange(item.id, event.target.value)}>
                        {statuses.map((nextStatus) => (
                          <option key={nextStatus}>{nextStatus}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">{item.dateAdded}</td>
                    <td className="px-4 py-4">
                      <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-bold dark:border-slate-700" type="button" onClick={() => handleDraft(item.id)}>
                        <Sparkles size={16} />
                        Draft
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="px-4 py-12 text-center text-slate-500" colSpan="7">No prospects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {draft && (
          <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Outreach Draft</h2>
              <button className="rounded-md border border-slate-300 px-3 py-2 font-bold dark:border-slate-700" type="button" onClick={() => navigator.clipboard.writeText(draft)}>Copy</button>
            </div>
            <textarea className="h-56 w-full rounded-md border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" value={draft} onChange={(event) => setDraft(event.target.value)} />
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </article>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex rounded-md bg-mint/10 px-3 py-1 text-xs font-black uppercase text-mint">
      {children}
    </span>
  );
}
