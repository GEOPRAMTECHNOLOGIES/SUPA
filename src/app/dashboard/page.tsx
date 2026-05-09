'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Users, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  total: number; pending: number; confirmed: number; rejected: number;
  revenue: number; customers: number;
};

type Sale = {
  id: string; created_at: string; customer_name: string; customer_phone: string;
  amount: number; status: string; transaction_code: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total:0,pending:0,confirmed:0,rejected:0,revenue:0,customers:0 });
  const [recent, setRecent] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/list');
      const data = await res.json();
      if (data.success) {
        const sales: Sale[] = data.data;
        const confirmed = sales.filter(s => s.status === 'confirmed');
        setStats({
          total: sales.length,
          pending: sales.filter(s=>s.status==='pending').length,
          confirmed: confirmed.length,
          rejected: sales.filter(s=>s.status==='rejected').length,
          revenue: confirmed.reduce((s:number, i:any)=>s+Number(i.amount),0),
          customers: new Set(sales.map((s:any)=>s.customer_email)).size,
        });
        setRecent(sales.slice(0, 5));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    { label:'Total Sales', value: stats.total, icon:<ShoppingBag className="w-5 h-5"/>, color:'bg-blue-500', bg:'bg-blue-50', text:'text-blue-700' },
    { label:'Revenue (KES)', value:`${stats.revenue.toLocaleString()}`, icon:<DollarSign className="w-5 h-5"/>, color:'bg-green-500', bg:'bg-green-50', text:'text-green-700' },
    { label:'Customers', value: stats.customers, icon:<Users className="w-5 h-5"/>, color:'bg-purple-500', bg:'bg-purple-50', text:'text-purple-700' },
    { label:'Pending', value: stats.pending, icon:<Clock className="w-5 h-5"/>, color:'bg-yellow-500', bg:'bg-yellow-50', text:'text-yellow-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, Kimathi! Here&apos;s what&apos;s happening.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 bg-green-50 px-4 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center ${card.text}`}>
                {card.icon}
              </div>
            </div>
            <p className={`font-display text-2xl font-bold ${card.text}`}>{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Sales Status Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Confirmed', value:stats.confirmed, icon:<CheckCircle className="w-5 h-5"/>, color:'text-green-600', bg:'bg-green-100' },
            { label:'Pending', value:stats.pending, icon:<Clock className="w-5 h-5"/>, color:'text-yellow-600', bg:'bg-yellow-100' },
            { label:'Rejected', value:stats.rejected, icon:<XCircle className="w-5 h-5"/>, color:'text-red-600', bg:'bg-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <div className={`${s.color} flex justify-center mb-1`}>{s.icon}</div>
              <p className={`font-display text-xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/dashboard/sales" className="text-sm text-green-600 hover:text-green-800 font-medium">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(sale => (
              <div key={sale.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                  {sale.customer_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{sale.customer_name}</p>
                  <p className="text-xs text-gray-500 font-mono">{sale.transaction_code || 'STK Push'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">KES {Number(sale.amount).toLocaleString()}</p>
                  <span className={`badge text-xs ${
                    sale.status === 'confirmed' ? 'badge-confirmed' :
                    sale.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
