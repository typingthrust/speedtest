import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function Certification() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Typing Certification | Typing Speed Test for Developers & Coders</title>
        <meta name="description" content="Get officially certified for your typing speed and accuracy. Boost your resume and career prospects as a developer or coder." />
        <meta property="og:title" content="Typing Certification | Typing Speed Test for Developers & Coders" />
        <meta property="og:description" content="Get officially certified for your typing speed and accuracy. Boost your resume and career prospects as a developer or coder." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://yourdomain.com/certification" />
        <meta property="og:image" content="/logonew.png" />
        <link rel="canonical" href="https://yourdomain.com/certification" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Typing Certification',
          'description': 'Get officially certified for your typing speed and accuracy. Boost your resume and career prospects as a developer or coder.',
          'url': 'https://yourdomain.com/certification'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-100">Typing Certification</h1>
        <p className="text-slate-400">Get officially certified for your typing speed and accuracy. Boost your resume and career prospects as a developer or coder.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">How to Get Certified</li>
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">Certification Benefits</li>
          <li className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-slate-200">Sample Certificate</li>
        </ul>
      </main>
    </div>
  );
} 