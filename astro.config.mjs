import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    server: {
      // Allow requests from Docker containers via host.docker.internal
      allowedHosts: ['host.docker.internal']
    },
    ssr: {
      external: ['@supabase/supabase-js']
    }
  }
});
