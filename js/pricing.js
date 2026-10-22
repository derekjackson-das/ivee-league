// Shared by the calculator and the inquiry form so an estimate is described
// the same way on both pages.

let cache;
export function loadPricing() {
  cache ??= fetch('data/pricing.json').then((r) => {
    if (!r.ok) throw new Error(`pricing.json: ${r.status}`);
    return r.json();
  });
  return cache;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatMoney = (n) => money.format(n);

// Selection shape: { package, hours, second, engagement, album, travel }
export function estimate(pricing, sel) {
  const tier = pricing.tiers.find((t) => t.id === sel.package);
  if (!tier) return null;
  const band = pricing.travelBands.find((b) => b.id === sel.travel) ?? pricing.travelBands[0];
  const { addOns } = pricing;

  const hours = clamp(Number(sel.hours) || tier.includedHours, tier.includedHours, tier.maxHours);
  const engagementIncluded = addOns.engagementSession.includedInTiers.includes(tier.id);
  const second = Boolean(sel.second) && tier.secondShooterAllowed;
  const engagement = Boolean(sel.engagement) && !engagementIncluded;

  const lines = [{ label: `${tier.name} package, ${tier.includedHours} hours`, price: tier.basePrice }];
  const extra = hours - tier.includedHours;
  if (extra > 0) lines.push({ label: `${extra} additional ${extra === 1 ? 'hour' : 'hours'}`, price: extra * addOns.extraHour.price });
  if (second) lines.push({ label: addOns.secondShooter.label, price: addOns.secondShooter.price });
  if (engagement) lines.push({ label: addOns.engagementSession.label, price: addOns.engagementSession.price });
  if (engagementIncluded) lines.push({ label: `${addOns.engagementSession.label} (included)`, price: 0 });
  if (sel.album) lines.push({ label: addOns.album.label, price: addOns.album.price });
  lines.push({ label: `Travel: ${band.label.split(' (')[0].toLowerCase()}`, price: band.price });

  const total = lines.reduce((sum, l) => sum + l.price, 0);
  const { high, roundTo } = pricing.estimateSpread;
  return {
    tier, band, hours, second, engagement, engagementIncluded, album: Boolean(sel.album), lines,
    low: total,
    high: Math.ceil((total * (1 + high)) / roundTo) * roundTo,
  };
}

export function describe(est) {
  const parts = [`${est.tier.name}, ${est.hours} hours`];
  if (est.second) parts.push('second photographer');
  if (est.engagement || est.engagementIncluded) parts.push(est.engagementIncluded ? 'engagement session (included)' : 'engagement session');
  if (est.album) parts.push('heirloom album');
  parts.push(est.band.price ? `travel ${est.band.label.split(' (')[0].toLowerCase()}` : 'local travel included');
  return `${parts.join(', ')}. Estimate ${formatMoney(est.low)} to ${formatMoney(est.high)} (sample pricing).`;
}

// Calculator selections travel to the inquiry form as URL parameters.
export const PARAM_KEYS = ['package', 'hours', 'second', 'engagement', 'album', 'travel'];

export function selectionToParams(sel) {
  const p = new URLSearchParams();
  for (const k of PARAM_KEYS) {
    const v = sel[k];
    if (v === true) p.set(k, '1');
    else if (v) p.set(k, String(v));
  }
  return p;
}

export function selectionFromParams(params) {
  if (!params.get('package')) return null;
  return {
    package: params.get('package'),
    hours: params.get('hours'),
    second: params.get('second') === '1',
    engagement: params.get('engagement') === '1',
    album: params.get('album') === '1',
    travel: params.get('travel'),
  };
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

// sessionStorage can throw (private mode, blocked storage); the URL is the primary channel.
export const store = {
  get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* URL still carries it */ } },
};
