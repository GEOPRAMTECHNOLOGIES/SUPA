'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('gm_admin', 'authenticated');
        toast.success('Welcome back, Admin!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">GreenMart Admin</h1>
            <p className="text-green-200 text-sm mt-1">Geopram Technologies</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <><Lock className="w-4 h-4" /> Sign In</>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-2">
              <Shield className="w-3 h-3" />
              Secured access · Geopram Technologies
            </div>
          </form>
        </div>
        <p className="text-center text-green-300/60 text-xs mt-4">
          © 2024 GreenMart · Built by Kimathi Joram
        </p>
      </div>
    </div>
  );
}
