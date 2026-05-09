'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, RefreshCw, Eye, CheckCircle, XCircle,
  Download, Image as ImageIcon, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

type Sale = {
  id: string; created_at: string; customer_name: string; customer_email: string;
  customer_phone: string; transaction_code: string; amount: number; items: string;
  payment_proof_url: string | null; status: 'pending' | 'confirmed' | 'rejected';
  mpesa_checkout_id?: string;
};

const PER_PAGE = 10;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Sale | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/list');
      const data = await res.json();
      if (data.success) setSales(data.data);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.customer_name?.toLowerCase().includes(q) ||
      s.customer_email?.toLowerCase().includes(q) || s.transaction_code?.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || s.status === statusFilter;
    return matchQ && matchS;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const updateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    setUpdating(id);
    try {
      const res = await fetch('/api/sales/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${status}!`);
        setSales(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        if (selected?.id === id) setSelected(p => p ? { ...p, status } : p);
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch { toast.error('Network error'); }
    finally { setUpdating(null); }
  };

  const exportCSV = () => {
    const headers = ['ID','Date','Name','Email','Phone','Transaction','Amount','Status','Items'];
    const rows = filtered.map(s => [
      s.id, new Date(s.created_at).toLocaleDateString(), s.customer_name,
      s.customer_email, s.customer_phone, s.transaction_code, s.amount, s.status, `"${s.items}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'greenmart-sales.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-sm text-gray-500">{filtered.length} orders total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={fetchSales} className="flex items-center gap-2 text-sm bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
            placeholder="Search by name, email, or transaction code..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field py-2.5 w-auto pr-8"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No orders match your filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Customer','Contact','Transaction','Amount','Items','Status','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(sale => (
                <tr key={sale.id} className="hover:bg-green-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                        {sale.customer_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sale.customer_name}</p>
                        <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{sale.customer_email}</p>
                    <p className="text-xs text-gray-400">{sale.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                      {sale.transaction_code || sale.mpesa_checkout_id?.slice(0,12) || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-700">
                    KES {Number(sale.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="truncate text-gray-600 text-xs">{sale.items}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      sale.status === 'confirmed' ? 'badge-confirmed' :
                      sale.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(sale)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {sale.payment_proof_url && (
                        <button onClick={() => setViewProof(sale.payment_proof_url)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Proof">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      {sale.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(sale.id, 'confirmed')}
                            disabled={updating === sale.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Confirm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(sale.id, 'rejected')}
                            disabled={updating === sale.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${n===page?'bg-green-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>
                  {n}
                </button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display font-bold text-gray-900">Order Detail</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label:'Customer', value: selected.customer_name },
                { label:'Email', value: selected.customer_email },
                { label:'Phone', value: selected.customer_phone },
                { label:'Transaction', value: selected.transaction_code || '—' },
                { label:'Amount', value: `KES ${Number(selected.amount).toLocaleString()}` },
                { label:'Date', value: new Date(selected.created_at).toLocaleString() },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-medium text-gray-900">{r.value}</span>
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-500 mb-1">Items</p>
                <p className="text-sm text-gray-900 bg-green-50 rounded-xl p-3">{selected.items}</p>
              </div>
              {selected.payment_proof_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                  <Image src={selected.payment_proof_url} alt="proof" width={400} height={200} className="w-full h-40 object-cover rounded-xl border border-green-100" />
                </div>
              )}
              {selected.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => updateStatus(selected.id, 'confirmed')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Confirm
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof image modal */}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setViewProof(null)}>
          <div className="relative max-w-2xl w-full">
            <button onClick={() => setViewProof(null)} className="absolute -top-10 right-0 text-white p-2">
              <X className="w-6 h-6" />
            </button>
            <Image src={viewProof} alt="Payment Proof" width={800} height={600} className="w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
