import { loadPricing, estimate, describe, selectionFromParams, store } from './pricing.js';

const form = document.getElementById('inquiry');
const summary = document.getElementById('error-summary');
const errorList = document.getElementById('error-list');
const field = (id) => document.getElementById(id);

// Pre-fill: URL parameters first, sessionStorage second, manual entry always.
async function prefill() {
  const params = new URLSearchParams(location.search);
  const date = params.get('date') ?? store.get('ivee-date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    field('wedding-date').value ||= date;
    field('check-date').value ||= date;
  }

  const sel = selectionFromParams(params) ?? store.get('ivee-estimate');
  if (!sel || field('estimate-text').value) return;
  try {
    const est = estimate(await loadPricing(), sel);
    if (est) field('estimate-text').value = describe(est);
  } catch {
    // No pricing data: the field stays empty and editable, which is the fallback anyway.
  }
}

const rules = [
  { id: 'name', test: (v) => v.trim() !== '', message: 'Enter your name' },
  { id: 'email', test: (v) => v.trim() !== '', message: 'Enter your email address' },
  { id: 'email', test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), message: 'Enter an email address in the format name@example.com' },
  { id: 'wedding-date', test: (v) => v !== '', message: 'Enter your wedding date, or your best guess' },
];

function setError(id, message) {
  const input = field(id);
  const text = field(`${id}-error`);
  input.closest('.field').classList.toggle('has-error', Boolean(message));
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  text.hidden = !message;
  text.textContent = message ? `Error: ${message}.` : '';
}

function validate() {
  const errors = new Map();
  for (const rule of rules) {
    if (!errors.has(rule.id) && !rule.test(field(rule.id).value)) errors.set(rule.id, rule.message);
  }
  for (const id of new Set(rules.map((r) => r.id))) setError(id, errors.get(id));
  return errors;
}

function showSummary(errors) {
  errorList.replaceChildren(...[...errors].map(([id, message]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = message;
    // Following a fragment scrolls but doesn't reliably focus the input; do it explicitly.
    a.addEventListener('click', (e) => { e.preventDefault(); field(id).focus(); });
    li.append(a);
    return li;
  }));
  summary.hidden = false;
  summary.focus();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const errors = validate();
  if (errors.size) {
    showSummary(errors);
    document.title = `Error: ${document.title.replace(/^Error: /, '')}`;
    return;
  }
  summary.hidden = true;
  store.set('ivee-inquiry', {
    name: field('name').value.trim(),
    partner: field('partner').value.trim(),
    email: field('email').value.trim(),
    phone: field('phone').value.trim(),
    date: field('wedding-date').value,
    venue: field('venue').value.trim(),
    guests: field('guests').value,
    estimate: field('estimate-text').value.trim(),
    message: field('message').value.trim(),
    contact: new FormData(form).get('contact'),
  });
  location.href = 'confirmation.html';
});

prefill();
