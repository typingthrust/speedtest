import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function Careers() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Careers at ProType</title>
        <meta name="description" content="Join our mission to make typing mastery accessible to everyone. See open roles below." />
        <meta property="og:title" content="Careers at ProType" />
        <meta property="og:description" content="Join our mission to make typing mastery accessible to everyone. See open roles below." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://protype.app/careers" />
        <meta property="og:image" content="https://protype.app/og-image.png" />
        <link rel="canonical" href="https://protype.app/careers" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Careers at ProType',
          'description': 'Join our mission to make typing mastery accessible to everyone. See open roles below.',
          'url': 'https://protype.app/careers'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Careers at ProType</h1>
        <p className="text-gray-600">Join our mission to make typing mastery accessible to everyone. See open roles below.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-gray-50 rounded-lg p-4 border">Frontend Engineer (React/Next.js)</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Content Strategist & Writer</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Community Manager</li>
        </ul>
      </main>
    </div>
  );
} 