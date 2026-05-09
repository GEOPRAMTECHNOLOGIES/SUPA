'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Leaf, Phone, Mail, User, CreditCard,
  Upload, CheckCircle, ArrowRight, Shield, Truck, Star,
  ChevronDown, Package, X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PRODUCTS = [
  { id: 1, name: 'Organic Tomatoes', price: 120, unit: 'kg', emoji: '🍅', category: 'Vegetables' },
  { id: 2, name: 'Fresh Milk', price: 65, unit: 'L', emoji: '🥛', category: 'Dairy' },
  { id: 3, name: 'Whole Wheat Bread', price: 85, unit: 'loaf', emoji: '🍞', category: 'Bakery' },
  { id: 4, name: 'Free Range Eggs', price: 18, unit: 'pc', emoji: '🥚', category: 'Dairy' },
  { id: 5, name: 'Spinach Bundle', price: 40, unit: 'bunch', emoji: '🥬', category: 'Vegetables' },
  { id: 6, name: 'Ripe Avocados', price: 30, unit: 'pc', emoji: '🥑', category: 'Fruits' },
  { id: 7, name: 'Orange Juice', price: 150, unit: '1L', emoji: '🍊', category: 'Beverages' },
  { id: 8, name: 'Chicken Breast', price: 380, unit: 'kg', emoji: '🍗', category: 'Meat' },
  { id: 9, name: 'Brown Rice', price: 220, unit: '2kg', emoji: '🌾', category: 'Grains' },
  { id: 10, name: 'Coconut Oil', price: 280, unit: '500ml', emoji: '🫙', category: 'Oils' },
  { id: 11, name: 'Sweet Bananas', price: 60, unit: 'bunch', emoji: '🍌', category: 'Fruits' },
  { id: 12, name: 'Greek Yogurt', price: 130, unit: '400g', emoji: '🍶', category: 'Dairy' },
];

type CartItem = { id: number; name: string; price: number; unit: string; emoji: string; qty: number };

export default function StoreFront() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'payment' | 'success'>('cart');
  const [form, setForm] = useState({ name: '', email: '', phone: '', transactionCode: '' });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stk' | 'manual'>('stk');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const filtered = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.emoji} ${product.name} added!`);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP or GIF allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxFiles: 1,
  });

  const handleStkPush = async () => {
    if (!form.phone || !form.name || !form.email) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          amount: total,
          name: form.name,
          email: form.email,
          items: cart.map(i => `${i.name} x${i.qty}`).join(', '),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('STK Push sent! Check your phone to complete payment.');
        setCheckoutStep('success');
      } else {
        toast.error(data.message || 'STK Push failed. Try manual payment.');
      }
    } catch {
      toast.error('Network error. Try manual payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.transactionCode) {
      toast.error('Please fill all fields including transaction code');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('transactionCode', form.transactionCode);
      fd.append('amount', String(total));
      fd.append('items', cart.map(i => `${i.name} x${i.qty}`).join(', '));
      if (proofFile) fd.append('proof', proofFile);

      const res = await fetch('/api/sales/submit', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setCheckoutStep('success');
        toast.success('Order submitted! We\'ll confirm shortly.');
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 glass border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-green-800">GreenMart</span>
              <span className="text-xs text-green-500 block -mt-1">by Geopram Technologies</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#products" className="hover:text-green-700 transition-colors">Products</a>
            <a href="#about" className="hover:text-green-700 transition-colors">About</a>
            <a href="#contact" className="hover:text-green-700 transition-colors">Contact</a>
            <Link href="/dashboard" className="hover:text-green-700 transition-colors">Admin</Link>
          </div>

          <button
            onClick={() => { setCartOpen(true); setCheckoutStep('cart'); }}
            className="relative flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm font-semibold">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center justify-center">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-800 to-green-600 text-white">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-400 rounded-full blur-3xl opacity-20 animate-float" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-yellow-400 rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-green-700/50 border border-green-500/50 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-green-200">
              <Leaf className="w-3.5 h-3.5" />
              Fresh • Organic • Local
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Your Green<br />
              <span className="text-green-300">Smart Market</span>
            </h1>
            <p className="text-green-100 text-xl leading-relaxed mb-8 max-w-lg">
              Shop fresh produce and essentials. Pay conveniently with M-Pesa.
              Delivered with care by Geopram Technologies.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#products" className="btn-primary bg-white text-green-800 hover:bg-green-50 flex items-center gap-2">
                Shop Now <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contact" className="btn-outline border-white/50 text-white hover:bg-white/10 flex items-center gap-2">
                Learn More <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-green-700/50 bg-green-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Products', value: '500+' },
              { label: 'Happy Customers', value: '2,000+' },
              { label: 'Daily Orders', value: '150+' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display text-2xl font-bold text-green-300">{s.value}</div>
                <div className="text-xs text-green-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 bg-green-50 border-b border-green-100" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Leaf className="w-6 h-6" />, title: 'Fresh & Organic', desc: 'Direct from farms. No preservatives, no compromise.' },
            { icon: <Shield className="w-6 h-6" />, title: 'Secure M-Pesa', desc: 'STK Push & manual payment. Fast, safe, and verified.' },
            { icon: <Truck className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Same-day delivery within Nairobi. Track in real-time.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">
              Fresh <span className="text-gradient">Arrivals</span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Sourced daily from trusted local farmers and suppliers across Kenya.
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <div
                key={product.id}
                className="card hover:shadow-md hover:border-green-200 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">
                  <span className="text-4xl">{product.emoji}</span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2 mb-1 text-sm leading-tight">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="font-bold text-green-700">KES {product.price}</span>
                      <span className="text-xs text-gray-400">/{product.unit}</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 bg-green-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">Get in Touch</h2>
          <p className="text-green-300 mb-8">Powered by Geopram Technologies</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="mailto:celestakim018@gmail.com" className="flex items-center gap-2 text-green-300 hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> celestakim018@gmail.com
            </a>
            <a href="tel:0702781490" className="flex items-center gap-2 text-green-300 hover:text-white transition-colors">
              <Phone className="w-4 h-4" /> 0702 781 490
            </a>
          </div>
          <p className="text-green-600 text-sm mt-8">© 2024 GreenMart · Geopram Technologies · Built by Kimathi Joram</p>
        </div>
      </section>

      {/* CART MODAL */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-100">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900">
                  {checkoutStep === 'cart' && 'Your Cart'}
                  {checkoutStep === 'details' && 'Your Details'}
                  {checkoutStep === 'payment' && 'Payment'}
                  {checkoutStep === 'success' && 'Order Placed!'}
                </h2>
                {checkoutStep === 'cart' && (
                  <p className="text-sm text-gray-500">{cart.reduce((s,i)=>s+i.qty,0)} items</p>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {/* STEP: CART */}
              {checkoutStep === 'cart' && (
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Your cart is empty</p>
                      <p className="text-sm mt-1">Add items from the store</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-green-600">KES {item.price}/{item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-white border border-green-200 rounded-lg text-green-700 font-bold hover:bg-green-100 transition-colors">−</button>
                          <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-green-600 rounded-lg text-white font-bold hover:bg-green-700 transition-colors">+</button>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <p className="text-sm font-bold text-gray-900">KES {item.price * item.qty}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STEP: DETAILS */}
              {checkoutStep === 'details' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Please provide your contact information for order confirmation.</p>
                  {[
                    { key: 'name', label: 'Full Name', icon: <User className="w-4 h-4" />, type: 'text', placeholder: 'John Doe' },
                    { key: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4" />, type: 'email', placeholder: 'john@example.com' },
                    { key: 'phone', label: 'M-Pesa Phone', icon: <Phone className="w-4 h-4" />, type: 'tel', placeholder: '07XXXXXXXX' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{f.icon}</div>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="input-field pl-10"
                          placeholder={f.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP: PAYMENT */}
              {checkoutStep === 'payment' && (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Order Summary</p>
                    <div className="space-y-1">
                      {cart.map(i => (
                        <div key={i.id} className="flex justify-between text-xs text-gray-600">
                          <span>{i.emoji} {i.name} ×{i.qty}</span>
                          <span>KES {i.price * i.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-green-200 mt-3 pt-3 flex justify-between font-bold text-green-800">
                      <span>Total</span><span>KES {total}</span>
                    </div>
                  </div>

                  {/* Payment tabs */}
                  <div className="flex rounded-xl overflow-hidden border border-green-200">
                    <button
                      onClick={() => setPaymentMethod('stk')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        paymentMethod === 'stk' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      📲 STK Push
                    </button>
                    <button
                      onClick={() => setPaymentMethod('manual')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        paymentMethod === 'manual' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      🧾 Manual
                    </button>
                  </div>

                  {paymentMethod === 'stk' ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm font-medium text-blue-800 mb-1">📲 M-Pesa STK Push</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        A payment prompt of <strong>KES {total}</strong> will be sent to{' '}
                        <strong>{form.phone}</strong>. Enter your M-Pesa PIN to confirm.
                      </p>
                      <p className="text-xs text-blue-500 mt-2">
                        Paybill: <strong>4574727</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Manual M-Pesa Payment</p>
                        <p className="text-xs text-yellow-700">
                          Pay <strong>KES {total}</strong> via Paybill <strong>4574727</strong>, then enter your transaction code below.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">M-Pesa Transaction Code</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={form.transactionCode}
                            onChange={e => setForm(p => ({ ...p, transactionCode: e.target.value.toUpperCase() }))}
                            className="input-field pl-10 uppercase tracking-widest font-mono"
                            placeholder="e.g. RBC4KQ8A3X"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Payment Proof <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        {proofPreview ? (
                          <div className="relative">
                            <Image src={proofPreview} alt="proof" width={400} height={200} className="w-full h-32 object-cover rounded-xl border border-green-200" />
                            <button
                              onClick={() => { setProofFile(null); setProofPreview(null); }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                              isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                            }`}
                          >
                            <input {...getInputProps()} />
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              {isDragActive ? 'Drop here...' : 'Drag & drop or click to upload (JPEG, PNG, max 5MB)'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: SUCCESS */}
              {checkoutStep === 'success' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">Order Received!</h3>
                  <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                    Thank you, <strong>{form.name}</strong>! Your order has been submitted and will be confirmed shortly.
                    A receipt will be sent to <strong>{form.email}</strong>.
                  </p>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-left mb-6">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1.5">
                      <Package className="w-4 h-4" /> Order Details
                    </p>
                    {cart.map(i => (
                      <div key={i.id} className="text-xs text-gray-600 flex justify-between py-0.5">
                        <span>{i.emoji} {i.name} ×{i.qty}</span>
                        <span>KES {i.price * i.qty}</span>
                      </div>
                    ))}
                    <div className="border-t border-green-200 mt-2 pt-2 text-sm font-bold text-green-800 flex justify-between">
                      <span>Total</span><span>KES {total}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCartOpen(false); setCart([]); setCheckoutStep('cart'); setForm({ name:'', email:'', phone:'', transactionCode:'' }); setProofFile(null); setProofPreview(null); }}
                      className="btn-primary w-full"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {checkoutStep !== 'success' && (
              <div className="p-6 border-t border-green-100 space-y-3">
                {checkoutStep !== 'cart' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-green-800 text-lg">KES {total}</span>
                  </div>
                )}

                {checkoutStep === 'cart' && (
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep('details')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {checkoutStep === 'details' && (
                  <button
                    onClick={() => {
                      if (!form.name || !form.email || !form.phone) { toast.error('Please fill all fields'); return; }
                      setCheckoutStep('payment');
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {checkoutStep === 'payment' && (
                  <button
                    onClick={paymentMethod === 'stk' ? handleStkPush : handleManualSubmit}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : paymentMethod === 'stk' ? (
                      <><span>📲</span> Send STK Push — KES {total}</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Submit Order</>
                    )}
                  </button>
                )}

                {checkoutStep !== 'cart' && (
                  <button
                    onClick={() => setCheckoutStep(s => s === 'payment' ? 'details' : 'cart')}
                    className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
                  >
                    ← Back
                  </button>
                )}

                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-2">
                  <Shield className="w-3 h-3" />
                  Secured by Safaricom M-Pesa
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
