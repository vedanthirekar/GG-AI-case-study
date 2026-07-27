import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/gemini.js'

// `npm run dev` serves the SPA but knows nothing about the /api functions Vercel
// runs in production, which would leave the assistant dead locally. Rather than
// keep a second implementation in sync, this mounts the *same* Edge handler on
// Vite's Node middleware and translates between the two request shapes.
//
// `vercel dev` would also work, but it shouldn't be required to run the app.
function apiDev(env) {
  return {
    name: 'vantage-api-dev',
    apply: 'serve',
    configureServer(server) {
      // The function reads process.env; in dev the key lives in .env.local,
      // which Vite parses but does not export to the Node process.
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v

      server.middlewares.use('/api/gemini', async (req, res) => {
        try {
          const body = req.method === 'POST' ? await readBody(req) : undefined
          const out = await handler(new Request('http://localhost/api/gemini', {
            method: req.method,
            headers: req.headers,
            body,
          }))

          res.statusCode = out.status
          out.headers.forEach((v, k) => res.setHeader(k, v))
          if (!out.body) return res.end()

          // Pipe chunk by chunk - buffering here would undo the whole point of
          // streaming the answer.
          const reader = out.body.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ kind: 'network', message: e?.message || 'Dev proxy failed.' }))
        }
      })
    },
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default defineConfig(({ mode }) => ({
  // Prefix '' loads every variable in .env.local, not just the VITE_ ones -
  // the key is deliberately unprefixed now so it never reaches the bundle.
  plugins: [react(), apiDev(loadEnv(mode, process.cwd(), ''))],
  server: { port: 5173, open: true },
}))
