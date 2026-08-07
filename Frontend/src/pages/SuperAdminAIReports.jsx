import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Sparkles, Download, Loader, AlertCircle, Database, Search } from 'lucide-react';

const EXAMPLES = [
  'All recruiters who submitted candidates on 20 June 2026',
  'Positions that are paused with commission above 8%',
  'Candidates with status Offer Accepted, show recruiter and client',
  'Free plan recruiters registered this year',
  'Coach assignments that are still pending',
];

const SuperAdminAIReports = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { columns, rows, total, returned, plan }
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    axios.get('/api/ai-report/datasets', { withCredentials: true })
      .then(r => setDatasets(r.data?.datasets || []))
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post('/api/ai-report/generate', { query }, { withCredentials: true });
      if (res.data?.success) {
        setResult(res.data);
      } else {
        setError(res.data?.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!result?.rows?.length) return;
    const ws = XLSX.utils.json_to_sheet(result.rows, { header: result.columns });
    ws['!cols'] = result.columns.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl"><Sparkles className="text-white" size={26} /></div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">AI Report Generator</h2>
            <p className="text-indigo-100 text-sm">Describe the report you want in plain English — get a table and download it as Excel.</p>
          </div>
        </div>
      </div>

      {/* Query box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate(); }}
          rows={3}
          placeholder="e.g. All recruiters who submitted candidates on a position on 20 June 2026"
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setQuery(ex)}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border border-gray-200 transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Tip: press ⌘/Ctrl + Enter to run.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database size={15} className="text-indigo-500" />
              <span className="font-semibold text-gray-800">{result.plan?.datasetLabel}</span>
              <span className="text-gray-400">•</span>
              <span>{result.returned}{result.total > result.returned ? ` of ${result.total}` : ''} rows</span>
            </div>
            <button
              onClick={exportExcel}
              disabled={!result.rows.length}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              <Download size={15} /> Export to Excel
            </button>
          </div>

          {result.rows.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No rows matched your query.</div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    {result.columns.map((c) => (
                      <th key={c} className="text-left font-semibold text-gray-700 px-3 py-2 whitespace-nowrap border-b-2 border-indigo-100">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="even:bg-gray-50 hover:bg-indigo-50/40">
                      {result.columns.map((c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-700 border-b border-gray-100">{String(row[c] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dataset reference */}
      {datasets.length > 0 && (
        <details className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">What can I ask about? ({datasets.length} datasets)</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {datasets.map((d) => (
              <div key={d.key} className="border border-gray-100 rounded-xl p-3">
                <p className="font-semibold text-gray-800 text-sm">{d.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1"><span className="font-medium">Fields:</span> {d.columns.join(', ')}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default SuperAdminAIReports;
