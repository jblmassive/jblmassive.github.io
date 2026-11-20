import { assets, catalogue } from './assets.mjs';

const fields = {
  Name: 150, Email: 254, 'Phone number': 60, 'Event date': 10,
  'Event type': 60, 'Venue name': 200, 'Town or city': 120,
  'Estimated attendance': 40, 'Venue access for setup': 300,
  'Event start time': 5, 'Event end time': 5, Services: 500,
  'Event requirements': 5000, 'Technical documents': 1500, 'Approximate budget': 150
};
const optional = new Set(['Venue access for setup', 'Services', 'Event requirements', 'Technical documents', 'Approximate budget']);

async function receive(request, env, url) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (request.headers.get('Origin') !== url.origin ||
      !request.headers.get('Content-Type')?.startsWith('application/json')) {
    return Response.json({ error: 'Invalid request.' }, { status: 403 });
  }
  let input;
  try {
    const body = await request.text();
    if (body.length > 24000) return Response.json({ error: 'Enquiry is too long.' }, { status: 413 });
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: 'Invalid enquiry.' }, { status: 400 });
  }
  if (!input || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(input.reference)
      || !input.details || !Array.isArray(input.items) || input.items.length > catalogue.length) {
    return Response.json({ error: 'Invalid enquiry.' }, { status: 400 });
  }
  const details = {};
  for (const [name, max] of Object.entries(fields)) {
    const value = input.details[name] ?? '';
    if (typeof value !== 'string' || value.length > max || (!value.trim() && !optional.has(name))) {
      return Response.json({ error: 'Please check the ' + name.toLowerCase() + ' field.' }, { status: 400 });
    }
    if (value.trim()) details[name] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.Email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  const items = [];
  const seen = new Set();
  let subtotalPence = 0;
  for (const item of input.items) {
    const product = catalogue.find(({ id }) => id === item?.id);
    if (!product || seen.has(product.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return Response.json({ error: 'Please review the equipment basket.' }, { status: 400 });
    }
    seen.add(product.id);
    items.push({ ...product, quantity: item.quantity });
    subtotalPence += (product.pricePence ?? 0) * item.quantity;
  }
  const payload = JSON.stringify({ details, items, subtotalPence });
  try {
    await env.DB.prepare('INSERT INTO enquiries (reference, payload) VALUES (?, ?) ON CONFLICT(reference) DO NOTHING')
      .bind(input.reference, payload).run();
    const saved = await env.DB.prepare('SELECT payload FROM enquiries WHERE reference = ?').bind(input.reference).first();
    if (saved?.payload !== payload) return Response.json({ error: 'Please retry with a new enquiry.' }, { status: 409 });
    return Response.json({ reference: input.reference }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Your enquiry could not be saved. Your details are still here. Try again.' }, { status: 503 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enquiries') return receive(request, env, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const asset = Object.hasOwn(assets, path) ? assets[path] :
      Object.hasOwn(assets, path + '.html') ? assets[path + '.html'] : null;
    if (!asset) return new Response('Page not found', { status: 404 });
    const [mime, contents] = asset;
    return new Response(request.method === 'HEAD' ? null : Uint8Array.from(atob(contents), (c) => c.charCodeAt(0)), {
      headers: { 'Content-Type': mime, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }
    });
  }
};
