/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The commit the dataset is built from: GitHub Actions provides it; locally, ask git.
const datasetCommit = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

// GitHub Pages serves the site from /bin-it-right/.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/bin-it-right/',
  plugins: [react(), tailwindcss(), {
    name: 'precache-release',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const template = readFileSync(new URL('./public/sw.js', import.meta.url), 'utf8')
        const hash = createHash('sha256').update(datasetCommit).update(template)
        for (const name of Object.keys(bundle).sort()) {
          const output = bundle[name]
          if (output !== undefined) hash.update(name).update(output.type === 'chunk' ? output.code : output.source)
        }
        const release = {
          version: hash.digest('hex'),
          urls: ['./', ...Object.keys(bundle).map((name) => `./${name}`),
            ...readdirSync(new URL('./public/', import.meta.url)).filter((name) => name !== 'sw.js').map((name) => `./${name}`)],
        }
        this.emitFile({
          type: 'asset', fileName: 'sw.js',
          source: template.replace('/* BUILD_RELEASE */ null', JSON.stringify(release)),
        })
      },
    },
  }],
  define: { __DATASET_COMMIT__: JSON.stringify(datasetCommit) },
  build: {
    rolldownOptions: {
      output: {
        // Vendor code changes less often than the app and the rules data, so it caches separately.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
