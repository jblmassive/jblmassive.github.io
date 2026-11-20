const storageKey = 'jbl-equipment-basket';
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const formatPrice = (pence) => money.format(pence / 100);
const catalogue = new Map();
const quantities = new Map();

for (const row of document.querySelectorAll('[data-item]')) {
  const id = row.dataset.item;
  const name = row.querySelector('strong').textContent;
  const button = row.querySelector('[data-add]');
  catalogue.set(id, { name, price: row.dataset.price === '' ? null : Number(row.dataset.price) });
  button.setAttribute('aria-label', 'Add ' + name);
  button.addEventListener('click', () => changeQuantity(id, 1));
  button.hidden = false;
}

try {
  const saved = Object.entries(JSON.parse(localStorage.getItem(storageKey)) ?? {});
  for (const [id, quantity] of saved) {
    if (catalogue.has(id) && Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 99) {
      quantities.set(id, quantity);
    }
  }
} catch {
  // The basket remains usable when storage is unavailable.
}

const basket = document.querySelector('.equipment-basket');
const items = document.querySelector('#basket-items');
const status = document.querySelector('#basket-status');
const total = document.querySelector('#basket-total');
const unpriced = document.querySelector('#basket-unpriced');
const jump = document.querySelector('#basket-jump');

function changeQuantity(id, change) {
  const quantity = Math.min(99, (quantities.get(id) ?? 0) + change);
  if (quantity > 0) quantities.set(id, quantity);
  else quantities.delete(id);
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(quantities)));
  } catch {
    // Keep the current selection in memory.
  }
  renderBasket();
  basket.dispatchEvent(new Event('basketchange', { bubbles: true }));
}

function subtotal() {
  let amount = 0;
  for (const [id, quantity] of quantities) amount += (catalogue.get(id).price ?? 0) * quantity;
  return formatPrice(amount);
}

function linePrice(item, quantity) {
  return item.price === null ? 'Price on request' : formatPrice(item.price * quantity);
}

function renderBasket() {
  const focused = document.activeElement;
  const focusedControl = items.contains(focused) ? focused.getAttribute('aria-label') : null;
  items.replaceChildren();
  let count = 0;
  let hasUnpriced = false;
  for (const [id, quantity] of quantities) {
    const item = catalogue.get(id);
    count += quantity;
    hasUnpriced ||= item.price === null;
    const row = document.createElement('li');
    row.className = 'basket-item';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const controls = document.createElement('div');
    controls.className = 'basket-controls';
    for (const [label, text, change] of [
      ['Decrease quantity of ', '−', -1],
      ['Increase quantity of ', '+', 1],
      ['Remove ', 'Remove', -quantity]
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button small outline';
      button.textContent = text;
      button.setAttribute('aria-label', label + item.name);
      button.disabled = change > 0 && quantity === 99;
      button.addEventListener('click', () => changeQuantity(id, change));
      if (change > 0) {
        const value = document.createElement('span');
        value.textContent = quantity;
        controls.append(value);
      }
      controls.append(button);
    }
    const price = document.createElement('span');
    price.textContent = linePrice(item, quantity);
    row.append(name, controls, price);
    items.append(row);
  }
  const amount = subtotal();
  status.textContent = count ? count + (count === 1 ? ' item' : ' items') + ' · ' + amount : 'Your basket is empty.';
  total.textContent = amount;
  unpriced.hidden = !hasUnpriced;
  jump.hidden = !count;
  jump.textContent = 'View basket · ' + status.textContent;
  if (focusedControl) {
    const replacement = Array.from(items.querySelectorAll('button:not(:disabled)'))
      .find((button) => button.getAttribute('aria-label') === focusedControl);
    (replacement ?? items.querySelector('button') ?? document.querySelector('.hire-category summary')).focus();
  }
}

renderBasket();
basket.hidden = false;

export function equipmentSelection() {
  return Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
}


export function equipmentReview() {
  const lines = Array.from(quantities, ([id, quantity]) => {
    const item = catalogue.get(id);
    return quantity + ' × ' + item.name + ' · ' + linePrice(item, quantity);
  });
  return { lines, subtotal: subtotal() };
}
