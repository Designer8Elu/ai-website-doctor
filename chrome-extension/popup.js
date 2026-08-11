const DEFAULT_API_URL = 'http://localhost:3000/api/audit';
const apiUrlInput = document.getElementById('apiUrl');
const pageUrlInput = document.getElementById('pageUrl');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const reportEl = document.getElementById('report');
const runButton = document.getElementById('runButton');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPill(status) {
  return `<span class="pill ${escapeHtml(status)}">${escapeHtml(status.toUpperCase())}</span>`;
}

function performanceClass(score) {
  if (score == null) return 'medium';
  if (score >= 90) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function metricValueClass(metric) {
  if (metric.score == null) return 'perf-value';
  if (metric.score >= 0.9) return 'perf-value good';
  if (metric.score >= 0.5) return 'perf-value ok';
  return 'perf-value bad';
}

function renderSection(title, content) {
  return `
    <section class="section">
      <div class="section-title">${escapeHtml(title)}</div>
      ${content}
    </section>
  `;
}

function renderField(label, value) {
  return `
    <div class="field-row">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderError(message) {
  return `<div class="section-note error-text">${escapeHtml(message)}</div>`;
}

function renderSummary(report) {
  const requested = report.requestedUrl || 'Unknown';
  const duration = report.durationMs != null ? `${report.durationMs} ms` : 'N/A';
  const fetched = report.page?.data?.finalUrl || 'N/A';
  const statusLabel = report.page?.data?.status ?? 'N/A';

  return renderSection('Audit summary', `
    <div class="section-note">Request completed with the current active tab URL.</div>
    ${renderField('Requested URL', requested)}
    ${renderField('Final URL', fetched)}
    ${renderField('HTTP status', statusLabel)}
    ${renderField('Duration', duration)}
  `);
}

function renderStrategyReport(report) {
  if (!report || report.error) {
    return renderError(report?.error || 'No performance data available.');
  }

  const score = report.data.performanceScore != null ? `${report.data.performanceScore}` : 'N/A';
  const scoreClass = performanceClass(report.data.performanceScore);

  const metrics = report.data.metrics
    .map(metric => `
      <div class="perf-card">
        <strong>${escapeHtml(metric.label)}</strong>
        <span class="${metricValueClass(metric)}">${escapeHtml(metric.displayValue ?? 'N/A')}</span>
      </div>
    `)
    .join('');

  const suggestions = report.data.suggestions
    .map(suggestion => `
      <div class="field-wrap">
        <div class="field-row">
          <div class="field-label">${escapeHtml(suggestion.title)}</div>
          <div class="field-value">${escapeHtml(suggestion.displayValue ?? (suggestion.score != null ? `${suggestion.score * 100}` : 'N/A'))}${suggestion.savingsMs ? ` • ${escapeHtml(`${suggestion.savingsMs} ms`)} saved` : ''}</div>
        </div>
        <div class="detail-text">${escapeHtml(suggestion.description)}</div>
      </div>
    `)
    .join('');

  return `
    <div class="section-note">Lighthouse score, metrics and guidance for ${escapeHtml(report.data.strategy)}.</div>
    <div class="field-row">
      <div class="field-label">Performance score</div>
      <div class="field-value"><span class="score-pill ${scoreClass}">${escapeHtml(score)}</span></div>
    </div>
    <div class="perf-summary">
      ${metrics}
    </div>
    ${suggestions ? `<div class="section-note">Recommended improvements</div>${suggestions}` : ''}
  `;
}

function renderCountSummary(report) {
  if (!report || report.error) {
    return renderError(report?.error || 'No data available.');
  }

  const data = report.data;
  const fields = Object.entries(data)
    .filter(([key]) => ['passed', 'warned', 'failed', 'total', 'missingAlt', 'found', 'checked', 'wordCount', 'h1Count'].includes(key))
    .map(([key, value]) => renderField(key.replace(/([A-Z])/g, ' $1'), String(value)));

  return `
    ${fields.join('')}
  `;
}

function renderSeoReport(report) {
  if (!report || report.error) {
    return renderError(report?.error || 'No SEO data available.');
  }

  const checks = report.data.checks
    .map(check => `
        <div class="field-wrap">
      <div class="field-row">
        <div class="field-label">${escapeHtml(check.label)}</div>
        <div class="field-value">${renderPill(check.status)}</div>
      </div>
      ${check.status !== 'pass' ? `<div class="detail-text">${escapeHtml(check.detail)}</div>` : ''}
      </div
    `)
    .join('');

  return `
    <div class="section-note">SEO and metadata checks.</div>
    ${renderField('Passed', String(report.data.passed))}
    ${renderField('Warned', String(report.data.warned))}
    ${renderField('Failed', String(report.data.failed))}
    ${checks}
  `;
}

function renderImagesReport(report) {
  if (!report || report.error) {
    return renderError(report?.error || 'No image data available.');
  }

  const issues = report.data.items
    .filter(item => item.issues.length)
    .slice(0, 3)
    .map(item => `
      <div class="field-row">
        <div class="field-label">${escapeHtml(item.src)}</div>
        <div class="field-value">${escapeHtml(item.issues.join(', '))}</div>
      </div>
    `)
    .join('');

  return `
    <div class="section-note">Image hygiene checks from the page HTML.</div>
    ${renderField('Total images', String(report.data.total))}
    ${renderField('Missing alt', String(report.data.missingAlt))}
    ${renderField('Empty alt', String(report.data.emptyAlt))}
    ${renderField('Missing lazy', String(report.data.missingLazy))}
    ${renderField('Missing dimensions', String(report.data.missingDimensions))}
    ${issues ? `<div class="section-note">Sample image issues</div>${issues}` : ''}
  `;
}

function renderLinksReport(report) {
  if (!report || report.error) {
    return renderError(report?.error || 'No link data available.');
  }

  const broken = report.data.broken
    .slice(0, 3)
    .map(link => `
        <div class="field-wrap">
      <div class="field-row">
        <div class="field-label">${escapeHtml(link.url)}</div>
        <div class="field-value">${link.status ?? 'error'}</div>
        </div>
        <div class="detail-text">${escapeHtml(link.error ?? (link.ok ? 'OK' : 'Failed'))}</div>
        </div>
    `)
    .join('');

  return `
    <div class="section-note">Internal link health and broken link summary.</div>
    ${renderField('Found', String(report.data.found))}
    ${renderField('Checked', String(report.data.checked))}
    ${renderField('Broken', String(report.data.broken.length))}
    ${broken ? `<div class="section-note">Sample broken links</div>${broken}` : ''}
  `;
}

function renderReport(report) {
  reportEl.innerHTML = `
    ${renderSummary(report)}
    ${renderSection('Performance — Mobile', renderStrategyReport(report.performance.mobile))}
    ${renderSection('Performance — Desktop', renderStrategyReport(report.performance.desktop))}
    ${renderSection('SEO', renderSeoReport(report.seo))}
    ${renderSection('Content SEO', renderCountSummary(report.contentSeo))}
    ${renderSection('Images', renderImagesReport(report.images))}
    ${renderSection('Links', renderLinksReport(report.links))}
  `;
  reportEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
}

async function loadCurrentTabUrl() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    const url = tab?.url || '';
    if (!url) {
      setStatus('Could not detect the active tab URL.', true);
      pageUrlInput.value = '';
      return;
    }
    pageUrlInput.value = url;
    setStatus('Ready to audit.');
  } catch (error) {
    setStatus(error.message || 'Unable to access the current tab.', true);
  }
}

async function runAudit() {
  const url = pageUrlInput.value.trim();
  if (!url) {
    setStatus('No URL found to audit.', true);
    return;
  }

  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  const requestUrl = apiUrl.replace(/\?.*$/, '') + '?url=' + encodeURIComponent(url);

  runButton.disabled = true;
  setStatus('Running audit...');
  resultEl.textContent = '';
  reportEl.classList.add('hidden');

  try {
    const response = await fetch(requestUrl, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    renderReport(data);
    setStatus('Audit complete.');
    await chrome.storage.local.set({ apiUrl });
  } catch (error) {
    setStatus(error.message || 'Audit failed.', true);
    resultEl.textContent = error.message || 'Audit failed.';
    resultEl.classList.remove('hidden');
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener('click', runAudit);
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = await chrome.storage.local.get({ apiUrl: DEFAULT_API_URL });
    apiUrlInput.value = stored.apiUrl || DEFAULT_API_URL;
  } catch {
    apiUrlInput.value = DEFAULT_API_URL;
  }

  await loadCurrentTabUrl();
});
