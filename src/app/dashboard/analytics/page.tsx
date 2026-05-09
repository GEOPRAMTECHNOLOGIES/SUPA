'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, BarChart3, PieChart, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

type Sale = { created_at: string; amount: number; status: string; items: string; };

export default function AnalyticsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales/list').then(r=>r.json()).then(d=>{
      if(d.success) setSales(d.data);
    }).catch(()=>toast.error('Failed to load')).finally(()=>setLoading(false));
  }, []);

  // Last 7 days
  const last7 = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    const label = d.toLocaleDateString('en-KE',{weekday:'short',day:'numeric'});
    const dayStr = d.toISOString().slice(0,10);
    const daySales = sales.filter(s=>s.created_at.slice(0,10)===dayStr && s.status!=='rejected');
    return { label, revenue: daySales.reduce((s,i)=>s+Number(i.amount),0), count: daySales.length };
  }).reverse();

  const maxRevenue = Math.max(...last7.map(d=>d.revenue), 1);

  // Status breakdown
  const statusData = [
    { label:'Confirmed', count:sales.filter(s=>s.status==='confirmed').length, color:'bg-green-500' },
    { label:'Pending',   count:sales.filter(s=>s.status==='pending').length,   color:'bg-yellow-500' },
    { label:'Rejected',  count:sales.filter(s=>s.status==='rejected').length,  color:'bg-red-500' },
  ];

  const confirmedSales = sales.filter(s=>s.status==='confirmed');
  const totalRevenue = confirmedSales.reduce((s,i)=>s+Number(i.amount),0);
  const avgOrderValue = confirmedSales.length ? Math.round(totalRevenue/confirmedSales.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Business insights for GreenMart</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
          <Calendar className="w-4 h-4" />
          Last 7 days
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Revenue', value:`KES ${totalRevenue.toLocaleString()}`, sub:'Confirmed orders' },
          { label:'Total Orders', value:sales.length, sub:'All time' },
          { label:'Avg. Order', value:`KES ${avgOrderValue.toLocaleString()}`, sub:'Per transaction' },
          { label:'Conv. Rate', value:`${sales.length ? Math.round((confirmedSales.length/sales.length)*100) : 0}%`, sub:'Confirmed / Total' },
        ].map(k=>(
          <div key={k.label} className="card p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{k.label}</p>
            <p className="font-display text-2xl font-bold text-green-700 mb-1">{loading?'—':k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Daily Revenue (Last 7 Days)</h3>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {last7.map(day=>(
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-green-700">
                  {day.revenue > 0 ? `${Math.round(day.revenue/1000)}k` : ''}
                </span>
                <div className="w-full bg-green-100 rounded-t-lg relative overflow-hidden" style={{height:'100px'}}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-700"
                    style={{height:`${(day.revenue/maxRevenue)*100}%`, minHeight: day.revenue>0?'4px':'0'}}
                  />
                </div>
                <span className="text-xs text-gray-500 text-center leading-tight">{day.label}</span>
                <span className="text-xs text-gray-400">{day.count} orders</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <PieChart className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Order Status Breakdown</h3>
        </div>
        <div className="space-y-3">
          {statusData.map(s=>{
            const pct = sales.length ? Math.round((s.count/sales.length)*100) : 0;
            return (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{s.label}</span>
                  <span className="text-gray-500">{s.count} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`${s.color} h-2.5 rounded-full transition-all duration-700`} style={{width:`${pct}%`}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top items */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Popular Items
        </h3>
        {loading ? <div className="text-gray-400 text-sm">Loading...</div> : (() => {
          const itemCounts: Record<string, number> = {};
          confirmedSales.forEach(s=>{
            s.items?.split(',').forEach(item=>{
              const name = item.replace(/x\d+/,'').trim();
              itemCounts[name] = (itemCounts[name]||0)+1;
            });
          });
          const sorted = Object.entries(itemCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
          if(!sorted.length) return <p className="text-sm text-gray-400">No data yet.</p>;
          return (
            <div className="space-y-2">
              {sorted.map(([name, count], i)=>(
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center justify-center">{i+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{name}</span>
                      <span className="text-gray-500">{count} orders</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{width:`${(count/sorted[0][1])*100}%`}} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
