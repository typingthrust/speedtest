import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function BenchmarkReports() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Benchmark Reports | Typing Speed Test for Developers & Coders</title>
        <meta name="description" content="Industry-leading typing speed and accuracy benchmarks for developers and coders in 2025 and beyond." />
        <meta property="og:title" content="Benchmark Reports | Typing Speed Test for Developers & Coders" />
        <meta property="og:description" content="Industry-leading typing speed and accuracy benchmarks for developers and coders in 2025 and beyond." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://yourdomain.com/benchmark-reports" />
        <meta property="og:image" content="/public/logo.png" />
        <link rel="canonical" href="https://yourdomain.com/benchmark-reports" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Benchmark Reports',
          'description': 'Industry-leading typing speed and accuracy benchmarks for developers and coders in 2025 and beyond.',
          'url': 'https://yourdomain.com/benchmark-reports'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Benchmark Reports</h1>
        <p className="text-gray-600">Industry-leading typing speed and accuracy benchmarks for developers and coders in 2025 and beyond.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-gray-50 rounded-lg p-4 border">2025 Global Typing Speed Report</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Developer Typing Benchmarks</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Medical & Legal Typing Standards</li>
        </ul>
      </main>
    </div>
  );
} 