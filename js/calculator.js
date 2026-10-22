import { loadPricing, estimate, formatMoney, selectionToParams, selectionFromParams, store } from './pricing.js';

const form = document.getElementById('calc-form');
const hours = document.getElementById('hours');
const down = document.getElementById('hours-down');
const up = document.getElementById('hours-up');
const second = document.getElementById('second');
const engagement = document.getElementById('engagement');
const output = document.getElementById('estimate');
const dateLink = document.getElementById('check-date-link');

// The live region carries only the headline so screen readers hear one short
// sentence per change; the itemised breakdown sits beside it, not inside it.
const breakdown = document.createElement('div');
breakdown.id = 'estimate-breakdown';
output.after(breakdown);

let pricing;
let lastTier;

function readSelection() {
  const data = new FormData(form);
  return {
    package: data.get('package'),
    hours: hours.value,
    second: second.checked,
    engagement: engagement.checked,
    album: form.elements.album.checked,
    travel: data.get('travel'),
  };
}

function applyRules(sel) {
  const tier = pricing.tiers.find((t) => t.id === sel.package);
  hours.min = tier.includedHours;
  hours.max = tier.maxHours;
  // A new package starts at its included hours; otherwise keep the reader's number within range.
  if (tier.id !== lastTier) hours.value = tier.includedHours;
  else hours.value = Math.min(tier.maxHours, Math.max(tier.includedHours, Number(hours.value) || tier.includedHours));
  lastTier = tier.id;
  // aria-disabled rather than disabled so focus stays on the button at the limit.
  down.setAttribute('aria-disabled', String(Number(hours.value) <= tier.includedHours));
  up.setAttribute('aria-disabled', String(Number(hours.value) >= tier.maxHours));

  second.disabled = !tier.secondShooterAllowed;
  if (second.disabled) second.checked = false;

  const included = pricing.addOns.engagementSession.includedInTiers.includes(tier.id);
  engagement.disabled = included;
  if (included) engagement.checked = true;
}

function render() {
  const sel = readSelection();
  applyRules(sel);
  const current = readSelection();
  const est = estimate(pricing, current);

  output.innerHTML = `<p><span class="estimate-total">${formatMoney(est.low)} to ${formatMoney(est.high)}</span><br>
    Estimate for ${est.tier.name}, ${est.hours} hours. Sample pricing for demo purposes.</p>`;
  breakdown.innerHTML = `
    <table>
      <caption class="visually-hidden">Estimate breakdown</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Price</th></tr></thead>
      <tbody>${est.lines.map((l) => `<tr><td>${l.label}</td><td>${formatMoney(l.price)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">Starting total</th><td>${formatMoney(est.low)}</td></tr></tfoot>
    </table>
    <p class="muted">${pricing.estimateSpread.explanation}</p>`;

  const params = selectionToParams(current);
  // A date picked in the date checker rides along so the inquiry form gets both.
  const carriedDate = new URLSearchParams(location.search).get('date');
  if (carriedDate) params.set('date', carriedDate);
  store.set('ivee-estimate', current);
  dateLink.href = `inquire.html?${params}#date-checker`;
  return params;
}

function step(delta) {
  hours.value = Number(hours.value) + delta;
  render();
}

async function init() {
  try {
    pricing = await loadPricing();
  } catch {
    output.textContent = 'The estimate could not load. You can still send your selections to the inquiry form.';
    return;
  }

  // Returning from the inquiry page: restore what the reader chose before.
  const saved = selectionFromParams(new URLSearchParams(location.search)) ?? store.get('ivee-estimate');
  if (saved) {
    const radio = form.querySelector(`input[name="package"][value="${CSS.escape(saved.package ?? '')}"]`);
    if (radio) {
      radio.checked = true;
      lastTier = saved.package;
      hours.value = saved.hours ?? hours.value;
      second.checked = Boolean(saved.second);
      engagement.checked = Boolean(saved.engagement);
      form.elements.album.checked = Boolean(saved.album);
      if (saved.travel) form.elements.travel.value = saved.travel;
    }
  }

  down.hidden = false;
  up.hidden = false;
  down.addEventListener('click', () => step(-1));
  up.addEventListener('click', () => step(1));
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    location.href = `inquire.html?${render()}#inquiry-form`;
  });
  render();
}

init();
