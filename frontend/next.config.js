/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para desenvolvimento
  experimental: {
    turbo: false, // Desabilitar turbopack se causando problemas
  },
  
  // Configuração do webpack para HMR
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  
  // CORS para desenvolvimento
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
  
  // Configurações para melhor compatibilidade
  typescript: {
    // Durante o build, não falhar por erros de TypeScript
    ignoreBuildErrors: false,
  },
  eslint: {
    // TEMPORÁRIO: Ignorar ESLint durante build para deploy urgente
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;