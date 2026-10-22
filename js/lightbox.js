// A native <dialog> opened with showModal() makes the rest of the page inert,
// which gives us the focus trap and Escape-to-close without custom key handling.
const grid = document.getElementById('portfolio-grid');
const items = [...grid.children];

const dialog = document.createElement('dialog');
dialog.className = 'lightbox';
dialog.setAttribute('aria-labelledby', 'lightbox-caption');
dialog.innerHTML = `
  <div class="lightbox-inner">
    <figure>
      <img id="lightbox-img" alt="">
      <figcaption id="lightbox-caption"></figcaption>
    </figure>
    <div class="lightbox-controls">
      <button type="button" data-step="-1">Previous photo</button>
      <button type="button" data-close>Close</button>
      <button type="button" data-step="1">Next photo</button>
    </div>
  </div>`;
document.body.append(dialog);

const img = dialog.querySelector('#lightbox-img');
const caption = dialog.querySelector('#lightbox-caption');
let current = 0;
let opener = null;

const visible = () => items.filter((li) => !li.hidden);

function show(li) {
  const list = visible();
  const source = li.querySelector('img');
  current = list.indexOf(li);
  img.src = source.currentSrc || source.src;
  img.alt = source.alt;
  img.width = source.width;
  img.height = source.height;
  caption.textContent = `${li.querySelector('figcaption').textContent}, photo ${current + 1} of ${list.length}`;
}

function step(delta) {
  const list = visible();
  show(list[(current + delta + list.length) % list.length]);
}

for (const li of items) {
  const figure = li.querySelector('figure');
  const source = figure.querySelector('img');
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  // Button's accessible name comes from the image alt plus this prefix.
  button.innerHTML = '<span class="visually-hidden">View larger: </span>';
  source.replaceWith(button);
  button.append(source);
  button.addEventListener('click', () => {
    opener = button;
    show(li);
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  });
}

dialog.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (target?.dataset.step) step(Number(target.dataset.step));
  else if (target?.hasAttribute('data-close') || e.target === dialog) dialog.close();
});
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
dialog.addEventListener('close', () => opener?.focus());
