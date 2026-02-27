import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// 大きなライブラリを分割
					'vendor': ['svelte']
				}
			}
		}
	}
});
