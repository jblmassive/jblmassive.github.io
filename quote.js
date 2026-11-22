// Keep the imported module on the same deployment revision as this script.
const basketUrl = new URL('./basket.js', import.meta.url);
basketUrl.search = new URL(import.meta.url).search;
const { equipmentSelection, equipmentReview } = await import(basketUrl);
const retryMessage = 'Your enquiry could not be sent. Please try again.';

const form = document.querySelector('#quote-form');
const status = document.querySelector('#quote-status');
const review = document.querySelector('#enquiry-review');
const reviewTitle = document.querySelector('#review-title');
const reviewButton = document.querySelector('#review-enquiry');
const editButton = document.querySelector('#edit-enquiry');
const next = document.querySelector('#quote-next');
const sendButton = form.querySelector('button[type="submit"]');
const groups = [document.querySelector('#event-step-heading'), ...form.querySelectorAll('fieldset')];
const prices = document.querySelector('#prices');
const quote = document.querySelector('#quote');
const progress = document.querySelector('.enquiry-steps');
const steps = [...progress.querySelectorAll('a')];
const confirmation = document.querySelector('#enquiry-confirmation');
const incomplete = document.querySelector('#review-incomplete');
const draftKey = 'jbl-event-enquiry-draft';

function updateDraft(details) {
  try {
    if (details) sessionStorage.setItem(draftKey, JSON.stringify(details));
    else sessionStorage.removeItem(draftKey);
  } catch {
    // The form retains its values during navigation without storage.
  }
}

try {
  const saved = JSON.parse(sessionStorage.getItem(draftKey));
  for (const field of form.elements) {
    if (field.name && typeof saved?.[field.name] === 'string') field.value = saved[field.name];
  }
} catch {
  // An unavailable or invalid draft does not prevent using the form.
}

form.addEventListener('input', () => updateDraft(Object.fromEntries(new FormData(form))));

function activate(step) {
  prices.hidden = step !== 1;
  quote.hidden = step === 1;
  steps.forEach((item, index) => {
    if (index === step - 1) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
}

function showStepFromHash(focus = true) {
  const details = location.hash === '#quote';
  const reviewing = location.hash === '#review';
  if (reviewing && !confirmation.hidden) {
    activate(3);
    return;
  }
  confirmation.hidden = true;
  form.hidden = false;
  if (reviewing) {
    showReview(focus);
    return;
  }
  activate(details ? 2 : 1);
  showDetails();
  if (!focus) return;
  const target = location.hash === '#equipment-basket'
    ? document.querySelector('#equipment-basket')
    : document.querySelector(details ? '#quote-title' : '#price-title');
  target.scrollIntoView();
  if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
}
let reference;
let lastPayload;

function showDetails() {
  groups.forEach((group) => { group.hidden = false; });
  next.hidden = false;
  review.hidden = true;
}

function showReview(focus = true) {
  const eventDetails = document.querySelector('#review-event');
  eventDetails.replaceChildren();
  for (const [field, answer] of new FormData(form)) {
    if (!answer.trim()) continue;
    const label = document.createElement('dt');
    const value = document.createElement('dd');
    label.textContent = field;
    value.textContent = answer;
    eventDetails.append(label, value);
  }
  incomplete.hidden = form.checkValidity();
  const equipment = equipmentReview();
  const list = document.querySelector('#review-equipment');
  list.replaceChildren();
  for (const line of equipment.lines.length ? equipment.lines : ['No equipment selected. You can still send your enquiry.']) {
    const item = document.createElement('li');
    item.textContent = line;
    list.append(item);
  }
  document.querySelector('#review-subtotal').textContent = equipment.lines.length ? 'Estimated subtotal: ' + equipment.subtotal : '';
  groups.forEach((group) => { group.hidden = true; });
  next.hidden = true;
  review.hidden = false;
  activate(3);
  if (focus) reviewTitle.focus();
}

progress.hidden = false;
showStepFromHash(Boolean(location.hash));
window.addEventListener('hashchange', () => showStepFromHash());
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href="#prices"], a[href="#quote"], a[href="#equipment-basket"], a[href="#review"]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (progress.contains(link)) {
    event.preventDefault();
    if (link.hash !== location.hash) history.pushState(null, '', link.hash);
    showStepFromHash(false);
    return;
  }
  if (link.hash === location.hash) {
    event.preventDefault();
    showStepFromHash();
  }
});
reviewButton.addEventListener('click', () => {
  if (form.reportValidity()) {
    status.textContent = '';
    location.hash = 'review';
  }
});
editButton.addEventListener('click', () => {
  if (location.hash !== '#quote') location.hash = 'quote';
  else showStepFromHash();
});
document.addEventListener('basketchange', () => {
  if (location.hash === '#review' && !review.hidden && !sendButton.disabled) showReview(false);
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sendButton.disabled) return;
  if (review.hidden) {
    reviewButton.click();
    return;
  }
  if (!form.checkValidity()) {
    history.replaceState(null, '', '#quote');
    showStepFromHash(false);
    form.reportValidity();
    return;
  }
  const details = Object.fromEntries(new FormData(form));
  const items = equipmentSelection();
  const payload = JSON.stringify({ details, items });
  if (payload !== lastPayload) reference = crypto.randomUUID();
  lastPayload = payload;
  sendButton.disabled = true;
  editButton.disabled = true;
  status.textContent = 'Sending your enquiry…';
  try {
    const response = await fetch('https://jungle-book-legion.ruddystarfish32.chatgpt.site/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, details, items })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 409) lastPayload = null;
      status.textContent = response.status < 500 && typeof result?.error === 'string' && result.error.trim()
        ? result.error
        : retryMessage;
      return;
    }
    if (typeof result?.reference !== 'string' || !result.reference.trim()) {
      status.textContent = retryMessage;
      return;
    }
    form.reset();
    updateDraft(null);
    activate(3);
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector('p').textContent = 'Your reference is ' + result.reference + '. JBL will confirm availability and pricing.';
    confirmation.querySelector('h2').focus();
    status.textContent = '';
    lastPayload = null;
  } catch {
    status.textContent = retryMessage;
  } finally {
    sendButton.disabled = false;
    editButton.disabled = false;
  }
});
