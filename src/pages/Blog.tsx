import React from 'react';
// If using Next.js, use Head from 'next/head'. If not, use react-helmet.
const isNext = false; // Set to true if using Next.js
const Head = isNext ? require('next/head').default : React.Fragment;

const articles = Array.from({ length: 50 }, (_, i) => ({
  title: `How to Improve Typing Speed ${i + 1}`,
  summary: `Learn proven techniques and exercises to boost your typing speed and accuracy. Article #${i + 1}.`,
  slug: `improve-typing-speed-${i + 1}`,
}));

export default function Blog() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 max-w-3xl mx-auto">
      <Head>
        <title>ProType Blog & Learning Hub | Improve Typing Speed, Accuracy, and More</title>
        <meta name="description" content="Tips, guides, and research to help you type faster, smarter, and healthier. ProType Blog & Learning Hub." />
        <meta property="og:title" content="ProType Blog & Learning Hub" />
        <meta property="og:description" content="Tips, guides, and research to help you type faster, smarter, and healthier." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://protype.app/blog" />
        <meta property="og:image" content="https://protype.app/og-image.png" />
        <link rel="canonical" href="https://protype.app/blog" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          'name': 'ProType Blog & Learning Hub',
          'description': 'Tips, guides, and research to help you type faster, smarter, and healthier.',
          'url': 'https://protype.app/blog',
          'publisher': {
            '@type': 'Organization',
            'name': 'ProType',
            'url': 'https://protype.app',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://protype.app/logo.png'
            }
          }
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">ProType Blog & Learning Hub</h1>
        <p className="text-gray-600">Tips, guides, and research to help you type faster, smarter, and healthier.</p>
      </header>
      <main>
        <ul className="space-y-6">
          {articles.map(article => (
            <li key={article.slug} className="bg-gray-50 rounded-lg p-6 border hover:shadow transition">
              <a href={`#${article.slug}`} className="block">
                <h2 className="text-2xl font-semibold text-blue-700 mb-1">{article.title}</h2>
                <p className="text-gray-500 text-sm">{article.summary}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
} 