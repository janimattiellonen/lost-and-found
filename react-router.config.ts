import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  // Server-side render by default (matches the previous Remix setup).
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
