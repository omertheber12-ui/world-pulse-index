/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/': ['./data/daily/**/*', './data/correlations/**/*'],
    '/week': ['./data/daily/**/*', './data/correlations/**/*'],
    '/connections': ['./data/connections/**/*', './data/fallback.json', './data/correlations/**/*'],
    '/connections/[pair_id]': ['./data/connections/**/*', './data/fallback.json', './data/correlations/**/*'],
  },
  async redirects() {
    return [
      { source: '/strongest-links', destination: '/connections', permanent: true },
      { source: '/today.html', destination: '/', permanent: false },
      { source: '/index.html', destination: '/', permanent: false },
      { source: '/events.html', destination: '/events', permanent: false },
      { source: '/portfolio.html', destination: '/portfolio', permanent: false },
      { source: '/how.html', destination: '/how', permanent: false },
      {
        source: '/event.html',
        has: [{ type: 'query', key: 'id', value: '(?<id>\\d+)' }],
        destination: '/event/:id',
        permanent: false,
      },
      { source: '/event.html', destination: '/events', permanent: false },
    ];
  },
};

export default nextConfig;
