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
    <div className="min-h-screen bg-background py-12 px-4 max-w-3xl mx-auto">
      <Head>
        <title>Blog & Learning Hub | Typing Speed Test for Developers & Coders</title>
        <meta name="description" content="Tips, guides, and research to help developers and coders type faster, smarter, and healthier. Blog & Learning Hub." />
        <meta property="og:title" content="Blog & Learning Hub | Typing Speed Test for Developers & Coders" />
        <meta property="og:description" content="Tips, guides, and research to help developers and coders type faster, smarter, and healthier." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/blog" />
        <meta property="og:image" content="/logonew.png" />
        <link rel="canonical" href="https://yourdomain.com/blog" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          'name': 'Blog & Learning Hub',
          'description': 'Tips, guides, and research to help developers and coders type faster, smarter, and healthier.',
          'url': 'https://yourdomain.com/blog',
          'publisher': {
            '@type': 'Organization',
            'name': 'Typing Speed Test for Developers & Coders',
            'url': 'https://yourdomain.com',
            'logo': {
              '@type': 'ImageObject',
              'url': '/logonew.png'
            }
          }
        }) }} />
      </Head>
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2 text-slate-100">Blog & Learning Hub</h1>
        <p className="text-slate-400">Tips, guides, and research to help developers and coders type faster, smarter, and healthier.</p>
      </header>
      <main>
        <ul className="space-y-6">
          {articles.map(article => (
            <li key={article.slug} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:shadow-lg transition">
              <a href={`#${article.slug}`} className="block">
                <h2 className="text-2xl font-semibold text-primary mb-1">{article.title}</h2>
                <p className="text-slate-400 text-sm">{article.summary}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
} 