import React from 'react';
const isNext = false;
const Head = isNext ? require('next/head').default : React.Fragment;

export default function Guides() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 max-w-2xl mx-auto">
      <Head>
        <title>Typing Guides | Typing Speed Test for Developers & Coders</title>
        <meta name="description" content="Step-by-step guides to help developers and coders master typing for any profession or purpose." />
        <meta property="og:title" content="Typing Guides | Typing Speed Test for Developers & Coders" />
        <meta property="og:description" content="Step-by-step guides to help developers and coders master typing for any profession or purpose." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://yourdomain.com/guides" />
        <meta property="og:image" content="/public/logo.png" />
        <link rel="canonical" href="https://yourdomain.com/guides" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          'name': 'Typing Guides',
          'description': 'Step-by-step guides to help developers and coders master typing for any profession or purpose.',
          'url': 'https://yourdomain.com/guides'
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Typing Guides</h1>
        <p className="text-gray-600">Step-by-step guides to help developers and coders master typing for any profession or purpose.</p>
      </header>
      <main>
        <ul className="space-y-4">
          <li className="bg-gray-50 rounded-lg p-4 border">Beginner's Guide to Touch Typing</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Typing for Developers: Best Practices</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Typing for Data Entry & Admin Work</li>
          <li className="bg-gray-50 rounded-lg p-4 border">Ergonomics & Healthy Typing Habits</li>
        </ul>
      </main>
    </div>
  );
} 