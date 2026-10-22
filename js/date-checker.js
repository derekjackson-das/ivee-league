import { store } from './pricing.js';

const form = document.getElementById('date-form');
const input = document.getElementById('check-date');
const result = document.getElementById('date-result');
const weddingDate = document.getElementById('wedding-date');

const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

let datesPromise;
const loadDates = () => (datesPromise ??= fetch('data/sample-dates.json').then((r) => {
  if (!r.ok) throw new Error(`sample-dates.json: ${r.status}`);
  return r.json();
}));

// Compare calendar days as UTC midnights so the reader's time zone can't shift a date by one.
function todayUTC() {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function show(status, html) {
  result.dataset.status = status;
  result.innerHTML = html;
}

function useDate(iso) {
  weddingDate.value = iso;
  store.set('ivee-date', iso);
}

async function check(event) {
  event.preventDefault();
  const iso = input.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    show('error', '<p>Enter a date to check, for example June 12, 2027.</p>');
    return;
  }

  const [y, m, d] = iso.split('-').map(Number);
  const day = Date.UTC(y, m - 1, d);
  const label = longDate.format(day);
  const today = todayUTC();
  const now = new Date(today);
  const horizon = Date.UTC(now.getUTCFullYear() + 2, now.getUTCMonth(), now.getUTCDate());

  if (day < today) {
    show('error', `<p>${label} has already passed. Check a date that is still ahead.</p>`);
    return;
  }

  let data;
  try {
    data = await loadDates();
  } catch {
    show('error', '<p>The date checker could not load. Put your date in the form below and I will confirm it by email.</p>');
    return;
  }

  const estimateLink = `<a href="calculator.html?date=${iso}">get an estimate</a>`;
  const formLink = '<a href="#inquiry-form">the inquiry form</a>';

  if (day > horizon) {
    useDate(iso);
    show('limited', `<p><strong>${label} is more than 24 months away.</strong> I don't take bookings that far ahead yet, but I keep a list. I've added the date to ${formLink}; send it and I'll be in touch when the calendar opens.</p>`);
    return;
  }

  const status = data.dates[iso] ?? 'available';
  if (status === 'booked') {
    show('booked', `<p><strong>${label} is booked.</strong> Try a nearby date, or send an inquiry anyway: I can recommend photographers I trust.</p>`);
    return;
  }

  useDate(iso);
  const headline = status === 'limited'
    ? `<strong>${label} has limited availability.</strong> I'm partly committed that day and may cover it with an associate photographer; I'll confirm when I reply.`
    : `<strong>${label} is available.</strong>`;
  show(status, `<p>${headline} I've added it to ${formLink}. Next, ${estimateLink} or go straight to the form.</p><p class="muted">Sample dates for demo purposes.</p>`);
}

form.addEventListener('submit', check);
