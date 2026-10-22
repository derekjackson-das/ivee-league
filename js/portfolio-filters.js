// Filters are added by script so the page without JavaScript shows every photo with no dead buttons.
const grid = document.getElementById('portfolio-grid');
const items = [...grid.children];
const categories = [...new Set(items.map((li) => li.dataset.category))];
const title = (s) => s[0].toUpperCase() + s.slice(1);

const group = document.createElement('div');
group.className = 'filters';
group.setAttribute('role', 'group');
group.setAttribute('aria-label', 'Filter photographs by part of the day');

const status = document.createElement('p');
status.className = 'visually-hidden';
status.setAttribute('aria-live', 'polite');

const buttons = ['all', ...categories].map((cat) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = cat === 'all' ? 'All' : title(cat);
  b.setAttribute('aria-pressed', String(cat === 'all'));
  b.addEventListener('click', () => apply(cat));
  group.append(b);
  return [cat, b];
});

function apply(cat) {
  for (const [c, b] of buttons) b.setAttribute('aria-pressed', String(c === cat));
  let shown = 0;
  for (const li of items) {
    li.hidden = cat !== 'all' && li.dataset.category !== cat;
    if (!li.hidden) shown += 1;
  }
  status.textContent = `Showing ${shown} ${cat === 'all' ? 'photographs' : `${title(cat)} photographs`}.`;
}

grid.before(group, status);
