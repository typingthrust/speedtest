import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('contact_messages').insert([
      { name, email, message }
    ]);
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-2 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-4 text-black">Contact Us</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Name"
            className="border border-gray-300 rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200 w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            className="border border-gray-300 rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200 w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <textarea
            placeholder="Your Message"
            className="border border-gray-300 rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-200 min-h-[100px] w-full"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-black text-white rounded px-6 py-2 font-semibold hover:bg-gray-900 transition w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending...' : 'Send Message'}
          </button>
          {status === 'success' && <div className="text-green-600 text-sm mt-2">Message sent! Thank you.</div>}
          {status === 'error' && <div className="text-red-600 text-sm mt-2">Something went wrong. Please try again.</div>}
        </form>
      </div>
    </div>
  );
} 