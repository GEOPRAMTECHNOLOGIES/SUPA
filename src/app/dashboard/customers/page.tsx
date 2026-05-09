'use client';
import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, ShoppingBag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type Customer = {
  name: string; email: string; phone: string;
  totalOrders: number; totalSpent: number; lastOrder: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/list');
      const data = await res.json();
      if (data.success) {
        // Aggregate by email
        const map: Record<string, Customer> = {};
        for (const sale of data.data) {
          const key = sale.customer_email;
          if (!map[key]) {
            map[key] = { name: sale.customer_name, email: sale.customer_email,
              phone: sale.customer_phone, totalOrders: 0, totalSpent: 0, lastOrder: sale.created_at };
          }
          map[key].totalOrders++;
          map[key].totalSpent += Number(sale.amount);
          if (new Date(sale.created_at) > new Date(map[key].lastOrder)) map[key].lastOrder = sale.created_at;
        }
        setCustomers(Object.values(map).sort((a,b) => b.totalSpent - a.totalSpent));
      }
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} unique customers</p>
        </div>
        <button onClick={fetchCustomers} className="flex items-center gap-2 text-sm bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
          className="input-field pl-10" placeholder="Search customers..." />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label:'Total Customers', value:customers.length, icon:<Users className="w-5 h-5"/>, color:'text-purple-700', bg:'bg-purple-50' },
          { label:'Total Revenue', value:`KES ${customers.reduce((s,c)=>s+c.totalSpent,0).toLocaleString()}`, icon:<ShoppingBag className="w-5 h-5"/>, color:'text-green-700', bg:'bg-green-50' },
          { label:'Avg. Spend', value:`KES ${customers.length ? Math.round(customers.reduce((s,c)=>s+c.totalSpent,0)/customers.length).toLocaleString() : 0}`, icon:<ShoppingBag className="w-5 h-5"/>, color:'text-blue-700', bg:'bg-blue-50' },
        ].map(c=>(
          <div key={c.label} className="card p-5">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.color} mb-3`}>{c.icon}</div>
            <p className={`font-display text-xl font-bold ${c.color}`}>{loading?'—':c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="card">
        {loading ? (
          <div className="p-12 text-center text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No customers found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((c, i) => (
              <div key={c.email} className="flex items-center gap-4 p-4 hover:bg-green-50/40 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {i < 3 && <span className="badge bg-yellow-100 text-yellow-800 text-xs">Top</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3"/>{c.email}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3"/>{c.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">KES {c.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{c.totalOrders} order{c.totalOrders!==1?'s':''}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400">Last order</p>
                  <p className="text-xs text-gray-600">{new Date(c.lastOrder).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
