import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function Careers() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Careers | Typing Speed Test for Developers & Coders</title>
        <meta name="description" content="Join our mission to help developers and coders improve their typing speed and accuracy. See open roles below." />
        <meta property="og:title" content="Careers | Typing Speed Test for Developers & Coders" />
        <meta property="og:description" content="Join our mission to help developers and coders improve their typing speed and accuracy. See open roles below." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://yourdomain.com/careers" />
        <meta property="og:image" content="/logonew.png" />
        <link rel="canonical" href="https://yourdomain.com/careers" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Careers',
          'description': 'Join our mission to help developers and coders improve their typing speed and accuracy. See open roles below.',
          'url': 'https://yourdomain.com/careers'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-100">Careers</h1>
        <p className="text-slate-400">Join our mission to help developers and coders improve their typing speed and accuracy. See open roles below.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">Frontend Engineer (React/Next.js)</li>
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">Content Strategist & Writer</li>
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">Community Manager</li>
        </ul>
      </main>
    </div>
  );
} 