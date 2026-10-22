import { store } from './pricing.js';

const data = store.get('ivee-inquiry');
const labels = [
  ['name', 'Name'], ['partner', "Partner's name"], ['email', 'Email'], ['phone', 'Phone'],
  ['date', 'Wedding date'], ['venue', 'Venue or town'], ['guests', 'Guests'],
  ['estimate', 'Estimate'], ['message', 'Message'], ['contact', 'Reach me first by'],
];

if (data) {
  const list = document.getElementById('summary-list');
  for (const [key, label] of labels) {
    if (!data[key]) continue;
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    // textContent, never innerHTML: these are the reader's own words.
    dd.textContent = key === 'date' ? formatDate(data[key]) : data[key];
    list.append(dt, dd);
  }
  document.getElementById('inquiry-summary').hidden = false;
  document.getElementById('no-summary').hidden = true;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(Date.UTC(y, m - 1, d));
}
