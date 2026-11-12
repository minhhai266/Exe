import { defineConfig,loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {adminPlugin} from './server/admin/plugin';
export default defineConfig(({mode})=>{const env=loadEnv(mode,'.',['GEMINI_','ADMIN_','AI_STUDIO_','GOOGLE_']);return {plugins:[react(),tailwindcss(),adminPlugin(env)],server:{watch:{ignored:['**/.data/**','**/artifacts/**','**/test-results/**']}}}});
