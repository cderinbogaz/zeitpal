import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true';
const ENABLE_TURBO = !IS_PRODUCTION;

const INTERNAL_PACKAGES = [
  '@kit/ui',
  '@kit/auth',
  '@kit/accounts',
  '@kit/shared',
  '@kit/i18n',
  '@kit/next',
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: [],
  // needed for supporting dynamic imports for local content
  outputFileTracingIncludes: {
    '/*': ['./content/**/*'],
  },
  experimental: {
    mdxRs: true,
    reactCompiler: ENABLE_REACT_COMPILER,
    ...(ENABLE_TURBO
      ? {
          turbo: {
            resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
          },
        }
      : {}),
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      'date-fns',
      ...INTERNAL_PACKAGES,
    ],
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;

function getRemotePatterns() {
  /** @type {import('next').NextConfig['remotePatterns']} */
  const remotePatterns = [];

  // Add any external image hosts here
  // Example:
  // remotePatterns.push({
  //   protocol: 'https',
  //   hostname: 'example.com',
  // });

  return IS_PRODUCTION
    ? remotePatterns
    : [
        {
          protocol: 'http',
          hostname: '127.0.0.1',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
        },
      ];
}
