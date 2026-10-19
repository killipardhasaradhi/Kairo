// Cloudflare Pages Function: a tiny shared "dream wishes" wall.
// Needs ONE setting: Pages project > Settings > Bindings > add KV namespace, variable name WISHES.
// Without that binding the site quietly falls back to a device-only guestbook.
const MAX = 60, HIDE_AT = 3;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const BAD = /(https?:\/\/|www\.|[\w.+-]+@[\w-]+\.[\w.-]+|(\+?\d[\s().-]?){7,}|\b(fuck|shit|bitch|asshole|cunt|nigg|rape|porn|sex)\w*)/i;
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
async function hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kairo-salt:' + s)); return [...new Uint8Array(b)].slice(0, 10).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function load(env) { try { return JSON.parse((await env.WISHES.get('list')) || '[]'); } catch (e) { return []; } }
async function limited(env, request, tag) {
  const k = 'rl:' + tag + ':' + (await hash(request.headers.get('CF-Connecting-IP') || 'x'));
  if (await env.WISHES.get(k)) return true;
  await env.WISHES.put(k, '1', { expirationTtl: 60 }); return false;   // only a short-lived hash is kept, never the IP itself
}
export async function onRequestGet({ env }) {
  if (!env.WISHES) return json({ live: false, wishes: [] });
  const list = (await load(env)).filter(w => (w.r || 0) < HIDE_AT).slice(-30).reverse().map(w => ({ id: w.id, name: w.name, msg: w.msg, t: w.t }));
  return json({ live: true, wishes: list });
}
export async function onRequestPost({ request, env }) {
  if (!env.WISHES) return json({ error: 'not-live' }, 503);
  let body; try { const txt = await request.text(); if (txt.length > 1200) return json({ error: 'too-big' }, 413); body = JSON.parse(txt); } catch (e) { return json({ error: 'bad-json' }, 400); }
  const url = new URL(request.url);
  if (body.report) {
    if (await limited(env, request, 'rep')) return json({ error: 'slow-down' }, 429);
    const list = await load(env), w = list.find(x => x.id === String(body.report)); if (w) { w.r = (w.r || 0) + 1; await env.WISHES.put('list', JSON.stringify(list)); }
    return json({ ok: true });
  }
  const name = clean(body.name, 24), msg = clean(body.msg, 140);
  if (!msg) return json({ error: 'empty' }, 400);
  if (BAD.test(msg) || BAD.test(name)) return json({ error: 'not-allowed' }, 400);
  if (await limited(env, request, 'new')) return json({ error: 'slow-down' }, 429);
  const list = await load(env);
  list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, msg, t: Date.now(), r: 0 });
  await env.WISHES.put('list', JSON.stringify(list.slice(-MAX)));
  return json({ ok: true });
}
