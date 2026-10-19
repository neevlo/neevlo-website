/* =========================================================
   SETTINGS: shared by every page
   ========================================================= */
var CONFIG = {
  phone: '918764055535',          // calling number: country code + number, no + or spaces
  phoneDisplay: '+91 87640 55535', // how the number is shown on the page
  whatsapp: '918764055535',       // WhatsApp number: country code + number, no + or spaces
  leadsEndpoint: 'https://script.google.com/macros/s/AKfycbz2cd7RL9MTmSdCmxlcJDJXbb4zD8d-LjLxQenrXbNzDiOHV9BmR0rJPAn6Wk3dlPRVDQ/exec', // Google Apps Script web app URL (see SETUP.md)
  ga4Id: '',                      // Google Analytics 4 measurement ID, e.g. G-XXXXXXX
  clarityId: ''                   // Microsoft Clarity project ID
};

/* Pre-written WhatsApp messages, one per button context */
var SIGN = "\n\n(Sent from your website)";
var WA = {
  general: "Hi Neevlo, I'd like to enquire about a home inspection.\n\nName:\nProperty type (1/2/3 BHK, villa):\nArea / locality in Jaipur:\nNew flat handover or resale:\nBasic or Premium:\nPreferred date:" + SIGN,
  handover: "Hi Neevlo, I'm taking handover of a new flat and would like a pre-handover inspection and snag list.\n\nName:\nProject / building name:\nFlat type (1/2/3 BHK):\nHandover date:" + SIGN,
  resale: "Hi Neevlo, I'm planning to buy a resale property and would like a pre-purchase inspection.\n\nName:\nProperty type (1/2/3 BHK, villa):\nArea / locality:\nPreferred date:" + SIGN,
  remote: "Hi Neevlo, I'm buying a property in Jaipur but can't visit in person. I'd like an inspection with the live video call add-on.\n\nName:\nCity / country I'm in:\nProperty type and locality:\nPreferred date:" + SIGN,
  rental: "Hi Neevlo, I'm moving into a rented home and would like a move-in condition report.\n\nName:\nFlat type (1/2/3 BHK):\nArea / locality:\nMove-in date:" + SIGN,
  basic: "Hi Neevlo, I'd like to book a Basic inspection.\n\nName:\nProperty type (1/2/3 BHK, villa):\nArea / locality:\nPreferred date:" + SIGN,
  premium: "Hi Neevlo, I'd like to book a Premium inspection.\n\nName:\nProperty type (1/2/3 BHK, villa):\nArea / locality:\nHandover / purchase date:\nPreferred date:" + SIGN,
  walkthrough: "Hi Neevlo, I'd like to book a 1-hour walkthrough consultation.\n\nName:\nProperty type and locality:\nPreferred date:" + SIGN,
  monsoon: "Hi Neevlo, I'd like to book a pre-monsoon home check.\n\nName:\nFlat or independent house:\nArea / locality:\nPreferred date:" + SIGN,
  group: "Hi Neevlo, several of us in the same society want inspections (group booking).\n\nName:\nProject / society name:\nNumber of flats:\nHandover date:" + SIGN,
  sample: "Hi Neevlo, could you please share the full sample inspection report (PDF)? I'm considering booking an inspection." + SIGN,
  checklist: "Hi Neevlo, please send me the free pre-handover checklist (PDF)." + SIGN,
  refer: "Hi Neevlo, I was referred by a friend and would like to book an inspection.\n\nMy name:\nReferred by (name and phone):\nProperty type and locality:" + SIGN,
  soon: "Hi Neevlo, please let me know when this service is available:\n\nService:\nMy name:\nArea / locality:" + SIGN
};

/* ---------- Helpers ---------- */
function store(type){ try { return window[type]; } catch(e){ return null; } }
function getItem(type,key){ var s=store(type); try { return s ? s.getItem(key) : null; } catch(e){ return null; } }
function setItem(type,key,val){ var s=store(type); try { if(s) s.setItem(key,val); } catch(e){} }
function uid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function waLink(text){ return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text); }
function track(name, params){ if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }
function byId(id){ return document.getElementById(id); }

/* ---------- Visit attribution (where the visitor came from) ---------- */
(function(){
  if (getItem('sessionStorage','neevlo_attr')) return;
  var p = new URLSearchParams(location.search);
  var attr = {
    source: p.get('utm_source') || '', medium: p.get('utm_medium') || '', campaign: p.get('utm_campaign') || '',
    referrer: document.referrer || '', landing: location.pathname + location.search,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
  };
  setItem('sessionStorage','neevlo_attr', JSON.stringify(attr));
})();
function attribution(){ try { return JSON.parse(getItem('sessionStorage','neevlo_attr') || '{}'); } catch(e){ return {}; } }

/* ---------- Call + WhatsApp buttons ---------- */
document.querySelectorAll('[data-phone-text]').forEach(function(el){ el.textContent = CONFIG.phoneDisplay; });
document.querySelectorAll('[data-call]').forEach(function(a){
  a.href = 'tel:+' + CONFIG.phone;
  a.addEventListener('click', function(){ track('call_click', { location: a.getAttribute('data-call') }); });
});
document.querySelectorAll('[data-wa]').forEach(function(a){
  a.href = waLink(WA[a.getAttribute('data-wa')] || WA.general);
  a.target = '_blank'; a.rel = 'noopener';
  a.addEventListener('click', function(){ track('whatsapp_click', { location: a.getAttribute('data-ctx') || a.getAttribute('data-wa') }); });
});
document.querySelectorAll('[data-track]').forEach(function(a){
  a.addEventListener('click', function(){ track(a.getAttribute('data-track')); });
});
/* Close the mobile menu after picking a same-page link */
document.querySelectorAll('.menu-panel a').forEach(function(a){
  a.addEventListener('click', function(){ var d = a.closest('details'); if (d) d.removeAttribute('open'); });
});

/* ---------- Safety check quiz (homepage only) ---------- */
var quizSummary = '';
(function(){
  var quizEl = byId('quiz');
  if (!quizEl) return;
  var QUESTIONS = [
    { id:'rain',   text:'Have you seen the home after heavy rain?', risky:'no' },
    { id:'area',   text:'Do you know the actual measured carpet area (not the brochure figure)?', risky:'no' },
    { id:'wiring', text:'Has anyone checked the wiring and earthing?', risky:'no' },
    { id:'paint',  text:'Are there fresh paint or new tiles on walls or floors?', risky:'yes' },
    { id:'water',  text:'Has the plumbing been tested with water running?', risky:'no' }
  ];
  var quizAnswers = {};
  QUESTIONS.forEach(function(q){
    var row = document.createElement('div'); row.className = 'q';
    var p = document.createElement('p'); p.textContent = q.text; p.id = 'q-' + q.id;
    var opts = document.createElement('div'); opts.className = 'q-opts'; opts.setAttribute('role','group'); opts.setAttribute('aria-labelledby', p.id);
    ['yes','no'].forEach(function(v){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = v === 'yes' ? 'Yes' : 'No';
      b.setAttribute('aria-pressed','false'); b.dataset.q = q.id; b.dataset.v = v;
      b.addEventListener('click', function(){ quizAnswers[q.id] = v; renderQuiz(); });
      opts.appendChild(b);
    });
    row.appendChild(p); row.appendChild(opts); quizEl.appendChild(row);
  });
  function renderQuiz(){
    quizEl.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', quizAnswers[b.dataset.q] === b.dataset.v ? 'true' : 'false'); });
    var answered = QUESTIONS.filter(function(q){ return quizAnswers[q.id]; }).length;
    var flags = QUESTIONS.filter(function(q){ return quizAnswers[q.id] === q.risky; }).length;
    var done = answered === QUESTIONS.length;
    byId('quiz-progress').hidden = done;
    byId('quiz-progress').textContent = answered + ' of 5 answered';
    byId('quiz-result').hidden = !done;
    if (!done) { quizSummary = ''; return; }
    var title = 'Looks good so far.';
    var text = "No obvious blind spots. A professional inspection confirms what you can't see before you commit.";
    if (flags >= 3) { title = 'High risk: get it inspected before you pay.'; text = 'Several important things are still unchecked. These are exactly where costly surprises usually hide.'; }
    else if (flags >= 1) { title = 'A few blind spots to clear up.'; text = 'Some key checks are missing. An inspection will tell you whether they are minor or expensive.'; }
    byId('quiz-flags').textContent = flags + (flags === 1 ? ' red flag' : ' red flags');
    byId('quiz-title').textContent = title;
    byId('quiz-text').textContent = text;
    quizSummary = flags + ' red flags (' + QUESTIONS.map(function(q){ return q.id + ':' + quizAnswers[q.id]; }).join(', ') + ')';
    var msg = "Hi Neevlo, I took the safety check on your website and got " + flags + (flags === 1 ? ' red flag' : ' red flags') + ". I'd like to get the property inspected.\n\nName:\nProperty type and locality:\nPreferred date:" + SIGN;
    byId('quiz-wa').href = waLink(msg);
    track('safety_check_complete', { red_flags: flags });
  }
  var qwa = byId('quiz-wa');
  qwa.target = '_blank'; qwa.rel = 'noopener';
  qwa.addEventListener('click', function(){ track('whatsapp_click', { location: 'quiz-result' }); });
  byId('quiz-reset').addEventListener('click', function(){ quizAnswers = {}; renderQuiz(); });
})();

/* ---------- Lead form: saves partial and complete enquiries to the Google Sheet ---------- */
(function(){
  var form = byId('lead-form');
  if (!form) return;
  var leadId = getItem('localStorage','neevlo_lead') || uid();
  setItem('localStorage','neevlo_lead', leadId);
  var lastSent = '';
  var started = false;
  var debounceTimer = null;
  var FIELDS = ['name','phone','area','propertyType','inspectionType','package','preferredDate','message'];

  /* Pre-select a package or service from links like index.html?package=Premium#enquire */
  var qs = new URLSearchParams(location.search);
  ['package','inspectionType','propertyType'].forEach(function(k){
    var v = qs.get(k); var el = form.elements[k];
    if (v && el) { Array.prototype.forEach.call(el.options, function(o){ if (o.value === v || o.text === v) el.value = o.value; }); }
  });

  function formData(){
    var d = {};
    FIELDS.forEach(function(k){ var el = form.elements[k]; d[k] = el ? String(el.value || '').trim() : ''; });
    return d;
  }
  function hasContent(d){ return Object.keys(d).some(function(k){ return d[k] !== ''; }); }
  function sendLead(stage){
    if (!CONFIG.leadsEndpoint) return;
    var d = formData();
    if (stage === 'partial' && !hasContent(d)) return;
    var payload = Object.assign({ leadId: leadId, stage: stage, safetyCheck: quizSummary, page: location.href }, d, attribution());
    /* the Sheet's script may not have a "package" column yet, so also fold it into the notes */
    if (d['package']) payload.message = '[Package: ' + d['package'] + '] ' + (d.message || '');
    var signature = stage + JSON.stringify(d) + quizSummary;
    if (stage === 'partial' && signature === lastSent) return;
    lastSent = signature;
    try {
      fetch(CONFIG.leadsEndpoint, { method:'POST', mode:'no-cors', keepalive:true, headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    } catch(e){}
  }
  form.addEventListener('focusin', function(){ if (!started){ started = true; track('form_start'); } });
  form.addEventListener('change', function(){ clearTimeout(debounceTimer); debounceTimer = setTimeout(function(){ sendLead('partial'); }, 600); });
  form.addEventListener('focusout', function(){ clearTimeout(debounceTimer); debounceTimer = setTimeout(function(){ sendLead('partial'); }, 600); });
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') sendLead('partial'); });

  function validPhone(v){ var digits = v.replace(/\D/g,''); if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2); if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1); return /^[6-9]\d{9}$/.test(digits); }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var d = formData(); var ok = true;
    var nameField = form.querySelector('[data-field="name"]');
    var phoneField = form.querySelector('[data-field="phone"]');
    nameField.classList.toggle('invalid', !d.name); if (!d.name) ok = false;
    phoneField.classList.toggle('invalid', !validPhone(d.phone)); if (!validPhone(d.phone)) ok = false;
    if (!ok){ (d.name ? form.elements.phone : form.elements.name).focus(); return; }
    sendLead('complete');
    track('generate_lead', { inspection_type: d.inspectionType || 'unspecified', package: d['package'] || 'unspecified' });
    var msg = "Hi Neevlo, I just requested a call back on your website.\n\nName: " + d.name +
      "\nProperty type: " + (d.propertyType || '-') +
      "\nArea / locality: " + (d.area || '-') +
      "\nInspection for: " + (d.inspectionType || '-') +
      "\nPackage: " + (d['package'] || '-') +
      "\nPreferred date: " + (d.preferredDate || '-') +
      (d.message ? "\nNotes: " + d.message : '');
    var sw = byId('success-wa');
    sw.href = waLink(msg); sw.target = '_blank'; sw.rel = 'noopener';
    sw.addEventListener('click', function(){ track('whatsapp_click', { location: 'form-success' }); });
    form.style.display = 'none';
    byId('form-success').style.display = 'block';
    /* start a fresh lead ID for any future enquiry from this browser */
    leadId = uid(); setItem('localStorage','neevlo_lead', leadId); lastSent = '';
  });
})();

/* ---------- Analytics (loads only after consent) ---------- */
function loadAnalytics(){
  if (CONFIG.ga4Id){
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4Id; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CONFIG.ga4Id);
  }
  if (CONFIG.clarityId){
    (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}; t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i; y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y); })(window, document, "clarity", "script", CONFIG.clarityId);
  }
}
(function(){
  var banner = byId('consent');
  if (!banner) return;
  var choice = getItem('localStorage','neevlo_consent');
  if (choice === 'yes') loadAnalytics();
  else if (!choice) banner.style.display = 'block';
  byId('consent-yes').addEventListener('click', function(){ setItem('localStorage','neevlo_consent','yes'); banner.style.display = 'none'; loadAnalytics(); });
  byId('consent-no').addEventListener('click', function(){ setItem('localStorage','neevlo_consent','no'); banner.style.display = 'none'; });
})();
