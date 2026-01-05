import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Typing Speed Test for Developers & Coders | Online WPM Test - TypingThrust',
  description = 'Free online typing speed test for developers, coders, and programmers. Practice typing code, measure your WPM, and improve typing accuracy with real code samples. Track progress, compete on leaderboards, and get certified.',
  keywords = 'typing speed test, code typing test, typing test for coders, typing practice online, wpm typing test, typing test website, typing speed checker, developer typing speed',
  image = 'https://typingthrust.com/logonew.png',
  url = 'https://typingthrust.com',
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title.includes('TypingThrust') ? title : `${title} | TypingThrust`;
  const fullUrl = url.startsWith('http') ? url : `https://typingthrust.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://typingthrust.com${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="TypingThrust" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

