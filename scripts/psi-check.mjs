import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const API_KEY = envContent.match(/PSI_API_KEY=(.+)/)?.[1]?.trim();

if (!API_KEY) {
  console.error('PSI_API_KEY not found in .env.local');
  process.exit(1);
}

const BASE_URL = 'https://kanto.shisokai.info';
const PATHS = ['/', '/about/', '/voices/', '/media/', '/faqs/', '/contact/'];
const PAGES = PATHS.map(p => ({ name: p, url: `${BASE_URL}${p}` }));

// Usage: node psi-check.mjs [mobile|desktop] [--details] [/path ...]
const args = process.argv.slice(2);
const strategy = (args[0] === 'mobile' || args[0] === 'desktop') ? args.shift() : 'mobile';
const showDetails = args.includes('--details');
const pageFilter = args.filter(a => a !== '--details').map(a => a.toLowerCase());

const normalize = (s) => s === '/' ? '/' : s.replace(/\/+$/, '');
const pages = pageFilter.length > 0
  ? PAGES.filter(p => pageFilter.some(f => normalize(p.name) === normalize(f)))
  : PAGES;

if (pages.length === 0) {
  console.error(`Page not found. Available: ${PATHS.join(', ')}`);
  process.exit(1);
}

const catNames = { performance: 'Perf', accessibility: 'A11y', 'best-practices': 'BP', seo: 'SEO' };

// Audit IDs that cannot be fixed on our side (server/third-party)
const unfixable = new Set([
  'uses-long-cache-ttl',              // third-party cache headers
  'cache-insight',                    // third-party cache headers (new ID)
  'forced-reflow-insight',            // browser internals
  'critical-request-chains',          // network dependency (info only)
  'network-dependency-tree-insight',  // network dependency (info only)
  'unused-javascript',                // GA / reCAPTCHA bundles
  'total-byte-weight',                // includes third-party
  'mainthread-work-breakdown',        // third-party scripts
  'bootup-time',                      // third-party JS execution
  'total-blocking-time',              // third-party blocking
  'max-potential-fid',                // derived from TBT
  'font-display',                     // third-party fonts (legacy ID)
  'font-display-insight',             // third-party fonts (new ID)
  'server-response-time',             // server latency
  'redirects',                        // server-side redirects
  'document-request-latency',         // server latency
]);

const taskIcon = (score) => {
  const s = score !== null ? Math.round(score * 100) : 0;
  if (s === 0) return '🔴';
  if (s < 50) return '🟠';
  if (s < 90) return '🟡';
  return '🟢';
};

async function checkPage(page) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(page.url)}&key=${API_KEY}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    const err = await res.text();
    return { name: page.name, url: page.url, error: err };
  }
  const data = await res.json();
  const cats = data.lighthouseResult?.categories || {};
  const audits = data.lighthouseResult?.audits || {};

  const failures = {};
  for (const [catKey, cat] of Object.entries(cats)) {
    const failed = (cat.auditRefs || [])
      .filter(ref => {
        const audit = audits[ref.id];
        return audit && audit.score !== null && audit.score < 1;
      })
      .map(ref => {
        const audit = audits[ref.id];
        const rawItems = Array.isArray(audit.details?.items) ? audit.details.items : [];
        const details = rawItems.map(item => {
          const parts = [];
          if (item.node?.selector) parts.push(`selector: ${item.node.selector}`);
          if (item.node?.snippet) parts.push(`html: ${item.node.snippet.slice(0, 120)}`);
          if (item.foreground) parts.push(`fg: ${item.foreground}`);
          if (item.background) parts.push(`bg: ${item.background}`);
          if (item.contrastRatio) parts.push(`ratio: ${item.contrastRatio.toFixed(2)}`);
          if (item.expectedContrastRatio) parts.push(`required: ${item.expectedContrastRatio}`);
          if (item.label) parts.push(item.label);
          if (item.source?.url) parts.push(`src: ${item.source.url.slice(0, 100)}`);
          if (item.url) parts.push(`url: ${item.url.slice(0, 100)}`);
          if (item.totalBytes) parts.push(`size: ${(item.totalBytes / 1024).toFixed(1)}KB`);
          if (item.wastedMs) parts.push(`wasted: ${Math.round(item.wastedMs)}ms`);
          if (item.wastedBytes) parts.push(`wasted: ${(item.wastedBytes / 1024).toFixed(1)}KB`);
          return parts.length > 0 ? parts.join(' | ') : null;
        }).filter(Boolean);
        return { id: ref.id, title: audit.title, score: audit.score, details };
      })
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    if (failed.length > 0) failures[catKey] = failed;
  }

  return {
    name: page.name,
    url: page.url,
    performance: Math.round((cats.performance?.score || 0) * 100),
    accessibility: Math.round((cats.accessibility?.score || 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
    seo: Math.round((cats.seo?.score || 0) * 100),
    failures,
  };
}

const icon = (score) => score >= 90 ? '🟢' : score >= 50 ? '🟠' : '🔴';

console.log(`\nPageSpeed Insights (${strategy})\n`);
console.log('Checking...\n');

const results = [];
for (const page of pages) {
  const result = await checkPage(page);
  if (result.error) {
    console.log(`X ${result.name}: Error - ${result.error}`);
  } else {
    console.log(
      `${result.name.padEnd(10)} | ` +
      `${icon(result.performance)} Perf: ${String(result.performance).padStart(3)} | ` +
      `${icon(result.accessibility)} A11y: ${String(result.accessibility).padStart(3)} | ` +
      `${icon(result.bestPractices)} BP: ${String(result.bestPractices).padStart(3)} | ` +
      `${icon(result.seo)} SEO: ${String(result.seo).padStart(3)}`
    );
  }
  results.push(result);
}

if (results.length > 1) {
  console.log('---');
  const avg = (key) => Math.round(results.reduce((sum, r) => sum + (r[key] || 0), 0) / results.length);
  console.log(
    `${'Average'.padEnd(10)} | ` +
    `   Perf: ${String(avg('performance')).padStart(3)} | ` +
    `   A11y: ${String(avg('accessibility')).padStart(3)} | ` +
    `   BP: ${String(avg('bestPractices')).padStart(3)} | ` +
    `   SEO: ${String(avg('seo')).padStart(3)}`
  );
}

// Collect tasks: deduplicate by audit id, group affected pages
const taskMap = new Map();
for (const result of results) {
  if (!result.failures) continue;
  for (const [cat, items] of Object.entries(result.failures)) {
    for (const item of items) {
      const key = `${cat}::${item.id}`;
      if (!taskMap.has(key)) {
        taskMap.set(key, { cat, id: item.id, title: item.title, score: item.score, pages: [], details: [] });
      }
      const task = taskMap.get(key);
      task.pages.push(result.name);
      if (item.score < task.score) task.score = item.score;
      if (item.details?.length > 0) {
        task.details.push({ page: result.name, items: item.details });
      }
    }
  }
}

if (taskMap.size > 0) {
  console.log(`\n\nTasks (${taskMap.size})\n`);

  // Group by category
  const byCat = {};
  for (const task of taskMap.values()) {
    const cn = catNames[task.cat] || task.cat;
    if (!byCat[cn]) byCat[cn] = [];
    byCat[cn].push(task);
  }

  let i = 1;
  for (const [cn, tasks] of Object.entries(byCat)) {
    console.log(`[${cn}]`);
    for (const task of tasks) {
      const score = task.score !== null ? ` (${Math.round(task.score * 100)})` : '';
      const affected = task.pages.length === pages.length ? 'all pages' : task.pages.join(', ');
      const sev = taskIcon(task.score);
      const fix = unfixable.has(task.id) ? ' [EXTERNAL]' : ' [FIXABLE]';
      console.log(`  ${String(i++).padStart(2)}. ${sev}${fix} ${task.title}${score} — ${affected}`);
      if (showDetails) {
        for (const d of task.details) {
          const prefix = task.details.length > 1 ? `      [${d.page}]` : '     ';
          for (const line of d.items) {
            console.log(`${prefix} - ${line}`);
          }
        }
      }
    }
  }
}

console.log('');
