import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function Certification() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Typing Certification | ProType</title>
        <meta name="description" content="Get officially certified for your typing speed and accuracy. Boost your resume and career prospects." />
        <meta property="og:title" content="Typing Certification | ProType" />
        <meta property="og:description" content="Get officially certified for your typing speed and accuracy. Boost your resume and career prospects." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://protype.app/certification" />
        <meta property="og:image" content="https://protype.app/og-image.png" />
        <link rel="canonical" href="https://protype.app/certification" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Typing Certification',
          'description': 'Get officially certified for your typing speed and accuracy. Boost your resume and career prospects.',
          'url': 'https://protype.app/certification'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Typing Certification</h1>
        <p className="text-gray-600">Get officially certified for your typing speed and accuracy. Boost your resume and career prospects.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-gray-50 rounded-lg p-4 border">How to Get Certified</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Certification Benefits</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Sample Certificate</li>
        </ul>
      </main>
    </div>
  );
} 