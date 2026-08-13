import { calculateScore, calculateScoreBreakdown, filterSignals, sortSignals, toCsv } from './radar.js';

const $ = (selector) => document.querySelector(selector);
const state = { signals: [], visible: [], emerging: [] };

async function init() {
  $('#load-error').hidden = true;
  const response = await fetch('./data/signals.json');
  if (!response.ok) throw new Error(`Signal dataset returned HTTP ${response.status}`);
  state.signals = await response.json();
  const emergingResponse = await fetch('./data/emerging-signals.json');
  if (!emergingResponse.ok) throw new Error(`Collected dataset returned HTTP ${emergingResponse.status}`);
  const emerging = await emergingResponse.json();
  state.emerging = emerging.clusters || [];
  renderEmerging();
  renderFreshness(emerging.generatedAt);
  const categories = [...new Set(state.signals.map((s) => s.category))].sort();
  categories.forEach((category) => $('#category').insertAdjacentHTML('beforeend', `<option>${category}</option>`));
  const sources = new Set(state.signals.flatMap((s) => s.evidence.map((e) => e.source)));
  animateNumber($('#request-count'), state.signals.reduce((sum, s) => sum + s.requests, 0));
  animateNumber($('#idea-count'), state.signals.length);
  animateNumber($('#source-count'), sources.size);
  render();
}

function renderFreshness(generatedAt) {
  const generated = new Date(generatedAt);
  if (Number.isNaN(generated.getTime())) {
    $('#data-status').textContent = 'Freshness unknown';
    $('#data-status-detail').textContent = 'The collected dataset has no valid generation date.';
    $('#emerging-updated').textContent = 'Update date unavailable';
    return;
  }
  const ageDays = Math.max(0, Math.floor((Date.now() - generated.getTime()) / 86400000));
  const stale = ageDays > 7;
  $('#data-status').textContent = stale ? 'Data may be stale' : 'Recently refreshed';
  $('#data-status').classList.toggle('stale', stale);
  $('#data-status-detail').textContent = stale
    ? `Last collection was ${ageDays} days ago. Verify sources before acting.`
    : `Collected ${ageDays === 0 ? 'today' : `${ageDays} day${ageDays === 1 ? '' : 's'} ago`}.`;
  $('#emerging-updated').textContent = `Updated ${generated.toLocaleDateString()}`;
}

function renderEmerging() {
  $('#emerging-grid').innerHTML = state.emerging.slice(0, 8).map((cluster) => `<article class="emerging-card"><div class="card-top"><span class="category">${cluster.reviewStatus === 'reviewed' ? 'Human reviewed' : 'Automatic lead'}</span><strong>${cluster.score}/100</strong></div><h3>${escapeHtml(cluster.title)}</h3><p>${escapeHtml(cluster.summary)}</p><div class="tags">${cluster.keywords.map((word) => `<span>${escapeHtml(word)}</span>`).join('')}</div><p class="score-note">Score: ${cluster.scoreComponents?.base ?? '—'} base + ${cluster.scoreComponents?.volume ?? '—'} volume + ${cluster.scoreComponents?.engagement ?? '—'} engagement</p><div class="card-bottom"><span>${cluster.requests} requests · ${new Set(cluster.evidence.map((item) => item.source)).size} source(s)</span><a href="${cluster.evidence[0].url}" target="_blank" rel="noopener">Check evidence →</a></div></article>`).join('') || '<p class="muted">The first automatic refresh is still being prepared.</p>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
}

function render() {
  const filters = { query: $('#search').value, category: $('#category').value, effort: $('#effort').value };
  state.visible = sortSignals(filterSignals(state.signals, filters), $('#sort').value);
  $('#idea-grid').innerHTML = state.visible.map(card).join('');
  $('#empty-state').hidden = state.visible.length > 0;
  const active = [filters.category !== 'all' && filters.category, filters.effort !== 'all' && `${filters.effort} effort`, filters.query && `“${filters.query}”`].filter(Boolean);
  $('#active-filters').textContent = `${state.visible.length} result${state.visible.length === 1 ? '' : 's'}${active.length ? ` · ${active.join(' · ')}` : ''}`;
  document.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => openDetail(button.dataset.id)));
}

function card(signal, index) {
  const score = calculateScore(signal);
  return `<article class="idea-card" style="--delay:${index * 45}ms">
    <div class="card-top"><span class="category">${signal.category}</span><span class="effort ${signal.effort.toLowerCase()}">${signal.effort}</span></div>
    <h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(signal.summary)}</p>
    <div class="tags">${signal.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    <div class="card-bottom"><div class="score"><strong>${score}</strong><span>signal score</span></div><div class="request-total"><strong>${signal.requests}</strong><span>requests</span></div><button data-id="${signal.id}">View evidence →</button></div>
  </article>`;
}

function openDetail(id) {
  const signal = state.signals.find((item) => item.id === id);
  const score = calculateScoreBreakdown(signal);
  $('#dialog-content').innerHTML = `<p class="eyebrow">${escapeHtml(signal.category)} · ${escapeHtml(signal.effort)} effort</p><h2>${escapeHtml(signal.title)}</h2><p class="dialog-summary">${escapeHtml(signal.summary)}</p><h3>Why it scored ${score.total}</h3><div class="score-breakdown"><span>Volume <b>${score.volume}/40</b></span><span>Recency <b>${score.recency}/25</b></span><span>Pain <b>${score.pain}/20</b></span><span>Whitespace <b>${score.whitespace}/15</b></span></div><h3>Suggested MVP</h3><ul>${signal.mvp.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><h3>Evidence</h3><div class="evidence">${signal.evidence.map((item) => `<a href="${item.url}" target="_blank" rel="noopener"><span>${escapeHtml(item.source)}</span>${escapeHtml(item.label)}<b>↗</b></a>`).join('')}</div>`;
  $('#detail-dialog').showModal();
}

function download(filename, content, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}

function animateNumber(element, target) {
  let current = 0; const step = Math.max(1, Math.ceil(target / 30));
  const tick = () => { current = Math.min(target, current + step); element.textContent = current; if (current < target) requestAnimationFrame(tick); };
  tick();
}

['#search', '#category', '#effort', '#sort'].forEach((selector) => $(selector).addEventListener('input', render));
$('#explore-button').addEventListener('click', () => $('#radar').scrollIntoView({ behavior: 'smooth' }));
$('#method-button').addEventListener('click', () => $('#method-dialog').showModal());
document.querySelectorAll('dialog .close').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
$('#export-json').addEventListener('click', () => download('missing-app-signals.json', JSON.stringify(state.visible, null, 2), 'application/json'));
$('#export-csv').addEventListener('click', () => download('missing-app-signals.csv', toCsv(state.visible), 'text/csv'));
$('#retry-button').addEventListener('click', () => init().catch(showLoadError));

function showLoadError(error) {
  $('#load-error').hidden = false;
  $('#load-error-detail').textContent = `${error.message}. Refresh the page or check the project status on GitHub.`;
  $('#data-status').textContent = 'Data unavailable';
  $('#data-status').classList.add('stale');
  $('#data-status-detail').textContent = 'No scores are being presented as current.';
}

init().catch(showLoadError);
