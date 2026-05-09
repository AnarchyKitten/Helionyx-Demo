(function () {
  'use strict';

  let data = null;
  const view = document.getElementById('view');

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function fmt(n, sign) {
    if (n == null || isNaN(n)) return '—';
    const v = Number(n);
    return (sign && v >= 0 ? '+' : '') + v.toFixed(1);
  }
  function polClass(p) {
    if (p === 'positive') return 'pos';
    if (p === 'negative') return 'neg';
    if (p === 'mixed') return 'mix';
    return 'neu';
  }

  function scoreBar(label, value) {
    const v = Number(value || 0);
    const mag = Math.min(Math.abs(v), 100) / 2;
    const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
    const left = v < 0 ? 50 - mag : 50;
    return `
      <div class="score-line">
        <span class="score-label">${esc(label)}</span>
        <div class="score-track">
          <span class="score-axis"></span>
          ${mag > 0 ? `<span class="score-bar score-bar-${cls}" style="left:${left}%; width:${mag}%"></span>` : ''}
        </div>
        <span class="score-num score-num-${cls}">${fmt(v, true)}</span>
      </div>`;
  }

  function rankingTable(title, kicker, rows, tone) {
    if (!rows.length) {
      return `<section class="surface">
        <div class="surface-header">
          <div><div class="kicker kicker-${tone}">${esc(kicker)}</div><h2>${esc(title)}</h2></div>
          <div class="meta">0 names</div>
        </div>
        <p class="empty">No names.</p>
      </section>`;
    }
    return `<section class="surface">
      <div class="surface-header">
        <div><div class="kicker kicker-${tone}">${esc(kicker)}</div><h2>${esc(title)}</h2></div>
        <div class="meta">${rows.length} names</div>
      </div>
      <div class="table-wrap">
        <table class="ranking-table">
          <thead><tr><th>#</th><th>Entity</th><th>Scores · Overall / Value / Growth / Trading</th><th>Signals</th></tr></thead>
          <tbody>
            ${rows.map((e, i) => `
              <tr>
                <td class="idx">${i + 1}</td>
                <td><a class="entity-cell" href="#/${encodeURIComponent(e.ticker)}">
                  <span class="ticker">${esc(e.ticker)}</span>
                  <span class="name">${esc(e.name)}</span>
                  ${e.sector ? `<span class="sector">${esc(e.sector)}</span>` : ''}
                </a></td>
                <td>
                  <div class="scores">
                    ${scoreBar('O', e.overall_score)}
                    ${scoreBar('V', e.value_score)}
                    ${scoreBar('G', e.growth_score)}
                    ${scoreBar('T', e.trading_score)}
                  </div>
                </td>
                <td><div class="sigsum">
                  <span class="total">${e.signal_count} total</span>
                  <span class="split">
                    <span class="pol-pos">${e.positive}</span> /
                    <span class="pol-neg">${e.negative}</span> /
                    <span class="pol-neu">${e.neutral}</span>
                  </span>
                </div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  function renderRanking() {
    const all = data.entities;
    const bullish = all.filter(e => e.overall_score > 0).sort((a, b) => b.overall_score - a.overall_score);
    const bearish = all.filter(e => e.overall_score < 0).sort((a, b) => a.overall_score - b.overall_score);
    const neutral = all.filter(e => e.overall_score === 0).sort((a, b) => b.signal_count - a.signal_count);

    view.innerHTML = `
      <section class="hero">
        <div class="kicker">Ranking</div>
        <h1>Entity Ranking</h1>
        <p class="hero-meta">
          ${all.length} entities ·
          <span class="pol-pos">${bullish.length} bullish</span> ·
          <span class="pol-neg">${bearish.length} bearish</span> ·
          <span class="pol-neu">${neutral.length} neutral</span>
        </p>
      </section>
      ${rankingTable('Bullish Book', 'Positive bias', bullish, 'pos')}
      ${rankingTable('Bearish Book', 'Negative bias', bearish, 'neg')}
      ${rankingTable('Neutral Coverage', 'Mixed / balanced', neutral, 'neu')}
    `;
    window.scrollTo(0, 0);
  }

  function contribRow(s) {
    const labels = ['O', 'V', 'G', 'T'];
    const keys = ['overall_points', 'value_points', 'growth_points', 'trading_points'];
    const cells = keys.map((k, i) => {
      const v = Number(s[k] || 0);
      const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
      return `<span class="cell"><span class="cell-l">${labels[i]}</span><strong class="${cls}">${fmt(v, true)}</strong></span>`;
    }).join('');

    const detailParts = [];
    if (s.what_changed) detailParts.push(`<div class="note"><span>What changed</span>${esc(s.what_changed)}</div>`);
    if (s.why_now) detailParts.push(`<div class="note"><span>Why now</span>${esc(s.why_now)}</div>`);
    (s.supporting_evidence || []).forEach(ev => detailParts.push(`<div class="ev ev-pos">${esc(ev)}</div>`));
    (s.opposing_evidence || []).forEach(ev => detailParts.push(`<div class="ev ev-neg">${esc(ev)}</div>`));

    return `<details class="contrib-row">
      <summary>
        <div class="contrib-main">
          <div class="contrib-head">
            <span class="badge">${esc(s.family_label || s.family || '')}</span>
            <strong>${esc(s.subtype_label || s.subtype || '')}</strong>
            <span class="pol pol-${polClass(s.polarity)}">${esc(s.polarity)}</span>
            ${s.dominant_sleeve ? `<span class="dominant">${esc(s.dominant_sleeve)}</span>` : ''}
          </div>
          ${s.summary ? `<div class="contrib-copy">${esc(s.summary)}</div>` : ''}
        </div>
        <div class="contrib-grid">${cells}</div>
      </summary>
      ${detailParts.length ? `<div class="contrib-detail">${detailParts.join('')}</div>` : ''}
    </details>`;
  }

  function renderEntity(ticker) {
    const entity = data.entities.find(e => e.ticker === ticker);
    const contrib = data.contributions[ticker];
    if (!entity || !contrib) {
      view.innerHTML = `<section class="surface"><p class="empty">Entity <strong>${esc(ticker)}</strong> not found. <a href="#/">← Back to ranking</a></p></section>`;
      return;
    }
    const rows = contrib.rows || [];
    const ctx = contrib.context_rows || [];

    view.innerHTML = `
      <section class="entity-hero">
        <a href="#/" class="back">← Back to ranking</a>
        <div class="entity-title">
          <h1>${esc(entity.ticker)}</h1>
          <div class="entity-name">${esc(entity.name)}</div>
          ${entity.sector ? `<div class="entity-sector">${esc(entity.sector)}</div>` : ''}
        </div>
        <div class="entity-scores">
          ${scoreBar('Overall', entity.overall_score)}
          ${scoreBar('Value', entity.value_score)}
          ${scoreBar('Growth', entity.growth_score)}
          ${scoreBar('Trading', entity.trading_score)}
        </div>
      </section>

      <section class="surface">
        <div class="surface-header">
          <div><div class="kicker">Signals</div><h2>Signal contribution map</h2></div>
          <div class="chips">
            <span class="chip chip-pos">${contrib.positive_count} positive</span>
            <span class="chip chip-neg">${contrib.negative_count} negative</span>
            ${contrib.context_count ? `<span class="chip chip-neu">${contrib.context_count} context</span>` : ''}
          </div>
        </div>
        <p class="legend">Each row shows the score points the signal adds or subtracts. Click to expand.</p>
        ${rows.length ? `<div class="contrib-list">${rows.map(contribRow).join('')}</div>` : `<p class="empty">No active directional signals.</p>`}
        ${ctx.length ? `
          <details class="ctx-group">
            <summary>Context-only signals (${ctx.length})</summary>
            <div class="ctx-list">
              ${ctx.map(s => `
                <div class="ctx-row">
                  <div class="contrib-head">
                    <span class="badge">${esc(s.family_label || '')}</span>
                    <strong>${esc(s.subtype_label || '')}</strong>
                    <span class="pol pol-${polClass(s.polarity)}">${esc(s.polarity)}</span>
                  </div>
                  ${s.summary ? `<div class="contrib-copy">${esc(s.summary)}</div>` : ''}
                </div>`).join('')}
            </div>
          </details>` : ''}
      </section>`;
    window.scrollTo(0, 0);
  }

  function route() {
    const hash = location.hash || '#/';
    const m = hash.match(/^#\/([A-Za-z0-9._-]+)$/);
    if (m) renderEntity(decodeURIComponent(m[1]));
    else renderRanking();
  }

  fetch('data.json')
    .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
    .then(d => {
      data = d;
      const badge = document.getElementById('snapshot-badge');
      const ts = (d.generated_at || '').slice(0, 16).replace('T', ' ');
      badge.textContent = ts ? `Snapshot · ${ts} UTC` : 'Snapshot';
      window.addEventListener('hashchange', route);
      route();
    })
    .catch(err => {
      view.innerHTML = `<section class="surface"><p class="empty error">Failed to load data.json (${esc(err)})</p></section>`;
    });
})();
