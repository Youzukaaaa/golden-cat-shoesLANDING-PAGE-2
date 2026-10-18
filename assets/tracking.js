/* Shared by index.html and thank-you.html:
   - Meta Pixel (disabled until META_PIXEL_ID is filled in)
   - Campaign attribution (utm_*, fbclid, ttclid, gclid) kept until the order is sent */
(function (w, d) {
  'use strict';

  var META_PIXEL_ID = '29588645320737181';   // Meta Pixel ID. Set to '' to switch the pixel off.

  var ATTR_KEY = 'gc_attribution';
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'ttclid', 'gclid'];

  function storage() { try { return w.localStorage; } catch (e) { return null; } }

  /* ---- Attribution: save campaign parameters on arrival (last campaign click wins) ---- */
  function captureAttribution() {
    var q;
    try { q = new URLSearchParams(w.location.search); } catch (e) { return; }
    var found = {}, any = false;
    PARAMS.forEach(function (p) {
      var v = q.get(p);
      if (v) { found[p] = v.slice(0, 200); any = true; }
    });
    if (!any) return;                       // no new campaign data: keep what was stored earlier
    found.landing_page = (w.location.origin + w.location.pathname).slice(0, 200);
    found.landed_at = new Date().toISOString();
    var s = storage();
    if (s) { try { s.setItem(ATTR_KEY, JSON.stringify(found)); } catch (e) { /* storage full or blocked */ } }
    w.__gcAttribution = found;              // also kept in memory for this page view
  }
  function getAttribution() {
    if (w.__gcAttribution) return w.__gcAttribution;
    var s = storage();
    try { return (s && JSON.parse(s.getItem(ATTR_KEY) || 'null')) || {}; } catch (e) { return {}; }
  }

  /* ---- Meta Pixel (standard base code, initialised once) ---- */
  function initPixel() {
    if (!META_PIXEL_ID || w.__gcPixelReady) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    w.fbq('init', META_PIXEL_ID);
    w.fbq('track', 'PageView');
    w.__gcPixelReady = true;
  }

  function track(name, params, eventId) {
    if (!w.__gcPixelReady || typeof w.fbq !== 'function') return false;
    if (eventId) w.fbq('track', name, params || {}, { eventID: eventId });
    else w.fbq('track', name, params || {});
    return true;
  }

  /* Fires the Lead event at most once per order id, even if the thank-you page is reloaded.
     The thank-you page only opens after Formspree accepted the order, so a Lead = an order received. */
  function trackLeadOnce(orderId, params) {
    if (!orderId) return false;
    var s = storage(), key = 'gc_tracked_leads', done = [];
    try { done = JSON.parse((s && s.getItem(key)) || '[]'); } catch (e) { done = []; }
    if (done.indexOf(orderId) !== -1) return false;
    if (!track('Lead', params, orderId)) return false;
    done.push(orderId);
    try { s && s.setItem(key, JSON.stringify(done.slice(-20))); } catch (e) { /* ignore */ }
    return true;
  }

  captureAttribution();
  initPixel();

  w.GCTrack = {
    attribution: getAttribution,
    track: track,
    trackLeadOnce: trackLeadOnce,
    pixelEnabled: function () { return !!META_PIXEL_ID; }
  };
})(window, document);
