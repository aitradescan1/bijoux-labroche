// js/track.js — enregistre chaque visite de page pour les stats admin
(function () {
  var API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? '' : 'https://bijoux-labroche-aitradescan1s-projects.vercel.app';

  var sid = sessionStorage.getItem('_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_sid', sid);
  }

  var params = new URLSearchParams(location.search);
  var sku = params.get('sku') || null;

  var ref = null;
  try { if (document.referrer) ref = new URL(document.referrer).hostname; } catch (e) {}

  var body = JSON.stringify({
    page: location.pathname + (sku ? '?sku=' + sku : ''),
    sku: sku,
    referrer: ref,
    session_id: sid,
  });

  try {
    fetch(API + '/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
    }).catch(function () {});
  } catch (e) {}
}());
