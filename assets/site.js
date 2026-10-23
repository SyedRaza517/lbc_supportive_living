(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PHOTOS = window.LBC_PHOTOS || {};
  var EMAIL = 'info@lbcsupportedliving.com', PHONE = '020 8259 6298';
  var pages = $$('.page');
  var single = pages.length > 1; // the single-file preview holds every page

  /* ---------- Site settings: edit these ---------- */
  // Set available to a number (e.g. 2) to show live vacancies, or null to show "Ask about current vacancies".
  var VACANCIES = { available: null, updated: '' };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function photo(key, cls) {
    var p = PHOTOS[key]; if (!p) return '';
    return '<figure class="ph' + (cls ? ' ' + cls : '') + '"><img src="' + p.src + '" alt="' + esc(p.alt) + '" decoding="async"><figcaption>Photo: ' + esc(p.by) + ' / Unsplash</figcaption></figure>';
  }
  function icons() { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------- Routing (single-file preview) ---------- */
  function markNav(id) {
    if (/^yp-/.test(id)) id = 'young-people';
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function openTarget(t) {
    if (t && t.tagName === 'DETAILS') t.open = true;
  }
  function route() {
    var h = decodeURIComponent((location.hash || '').slice(1)) || 'home';
    var page = document.getElementById(h), target = null;
    if (!page || !page.classList.contains('page')) {
      target = page;
      page = target ? target.closest('.page') : null;
      if (!page) { page = document.getElementById('home'); target = null; }
    }
    pages.forEach(function (p) { p.hidden = p !== page; });
    markNav(page.id);
    var t = page.getAttribute('data-title');
    document.title = page.id === 'home' ? 'LBC Supported Living' : (t ? t + ' · LBC Supported Living' : 'LBC Supported Living');
    closeMenu(); stopReading();
    if (target && target !== page) { openTarget(target); requestAnimationFrame(function () { target.scrollIntoView({ block: 'start' }); }); }
    else window.scrollTo(0, 0);
  }
  if (single) { window.addEventListener('hashchange', route); }
  else {
    if (pages[0]) markNav(pages[0].id);
    if (location.hash) { var tg = document.getElementById(location.hash.slice(1)); openTarget(tg); }
    window.addEventListener('hashchange', function () { var tg = document.getElementById(location.hash.slice(1)); openTarget(tg); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn'), mnav = $('#mobileNav');
  function closeMenu() { if (mnav) { mnav.classList.remove('open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); } }
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = !mnav.classList.contains('open');
    mnav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#mobileNav a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---------- Modal ---------- */
  var modal = $('#modal'), modalContent = $('#modalContent'), lastFocus = null;
  function openModal(html, label) {
    lastFocus = document.activeElement;
    modalContent.innerHTML = html; modal.hidden = false;
    $('.modal-card', modal).setAttribute('aria-label', label || 'Details');
    icons();
    var c = $('.modal-close', modal); if (c) c.focus();
    document.documentElement.style.overflow = 'hidden';
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true; modalContent.innerHTML = ''; document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });

  /* ---------- Copy ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }
  function copy(text, done) {
    var ok = function () { toast(done || 'Copied'); };
    try { navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text); ok(); }); }
    catch (e) { fallbackCopy(text); ok(); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (b) copy(b.getAttribute('data-copy'), 'Copied');
  });

  /* ---------- Email hand-off (static site: no server) ---------- */
  function mailModal(subject, rows, note) {
    var body = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    var text = 'To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body;
    openModal('<div class="modal-body" style="padding-top:28px"><span class="kicker">Ready to send</span><h2 id="modalTitle">' + esc(subject) + '</h2>' +
      '<p class="muted">' + (note || 'Your email app will open with this message. If it does not, copy the text and email it to ' + EMAIL + '.') + '</p>' +
      '<dl class="review">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]).replace(/\n/g, '<br>') + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="row" style="margin-top:8px"><a class="btn btn-teal" href="' + href + '">Open email</a><button class="btn btn-line" type="button" data-mailcopy>Copy text</button></div></div>', subject);
    $('[data-mailcopy]', modalContent).addEventListener('click', function () { copy(text, 'Message copied'); });
    try { window.location.href = href; } catch (e) {}
  }

  /* Validation helpers */
  function fieldError(el, msg) {
    var f = el.closest('.field') || el.parentNode, err = $('.err', f);
    if (!err) { err = document.createElement('span'); err.className = 'err'; err.setAttribute('aria-live', 'polite'); f.appendChild(err); }
    f.classList.toggle('bad', !!msg); err.textContent = msg || '';
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function validate(scope) {
    var first = null;
    $$('input[required], select[required], textarea[required]', scope).forEach(function (el) {
      if (el.type === 'checkbox') return;
      var v = (el.value || '').trim(), msg = '';
      if (!v) msg = 'Please complete this field.';
      else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email address looks incomplete.';
      else if (el.type === 'tel' && v.replace(/\D/g, '').length < 10) msg = 'Please check the phone number.';
      fieldError(el, msg); if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  function labelFor(el) {
    var l = el.id && $('label[for="' + el.id + '"]'); return l ? l.textContent.trim() : (el.name || '');
  }
  function collect(scope) {
    var rows = [], groups = {};
    $$('input, select, textarea', scope).forEach(function (el) {
      if (!el.name || el.type === 'file') return;
      if (el.type === 'checkbox') { if (el.checked) (groups[el.name] = groups[el.name] || []).push(el.value); return; }
      var v = (el.value || '').trim(); if (v) rows.push([labelFor(el), v]);
    });
    Object.keys(groups).forEach(function (k) { rows.push([k, groups[k].join(', ')]); });
    return rows;
  }

  /* Simple enquiry forms */
  $$('form[data-mailform]').forEach(function (form) {
    $$('input, select, textarea', form).forEach(function (el) { el.addEventListener('input', function () { if (el.closest('.bad')) fieldError(el, ''); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var rows = collect(form), subject = form.getAttribute('data-mailform');
      var who = rows.filter(function (r) { return /^(Name|Your name)$/.test(r[0]); })[0];
      mailModal(subject + (who ? ' from ' + who[1] : ''), rows);
    });
  });

  /* Document requests */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-request]'); if (!b) return;
    var doc = b.getAttribute('data-request');
    mailModal('Document request: ' + doc, [['Document', doc], ['Name', ''], ['Organisation', '']].filter(function (r) { return r[1] !== '' || r[0] === 'Document'; }),
      'We will email you a copy of the ' + esc(doc) + '. Add your name and organisation to the email, then send it.');
  });

  /* Book a visit */
  $$('[data-book-visit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var sel = $('#ct-reason'); if (sel) sel.value = 'Book a visit';
      var msg = $('#ct-msg'); if (msg && !msg.value) msg.value = 'I would like to arrange a visit. Days and times that suit me: ';
      var n = $('#ct-name'); if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { n.focus({ preventScroll: true }); }, 350); }
    });
  });

  /* ---------- Vacancy widget ---------- */
  $$('[data-vacancy]').forEach(function (w) {
    var t = $('[data-vac-title]', w), n = $('[data-vac-note]', w);
    if (typeof VACANCIES.available === 'number') {
      t.textContent = VACANCIES.available > 0 ? VACANCIES.available + ' room' + (VACANCIES.available === 1 ? '' : 's') + ' available' : 'Currently full';
      n.textContent = VACANCIES.available > 0 ? (VACANCIES.updated ? 'Updated ' + VACANCIES.updated : 'Call to discuss a referral') : 'Call to join our waiting list';
    }
  });

  /* ---------- Reveal cards, show-more, why rows ---------- */
  $$('.reveal').forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true')); }); });
  $$('.more-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') !== 'true';
      el.hidden = !open; b.setAttribute('aria-expanded', String(open));
      b.firstChild.textContent = open ? 'Show less ' : 'Show more ';
    });
  });
  $$('[data-why]').forEach(function (b) {
    b.addEventListener('click', function () {
      var row = document.getElementById(b.getAttribute('data-why')), open = row.hidden;
      row.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Hide' : 'Why it matters';
    });
  });

  /* ---------- Day in the life ---------- */
  var DAY = [
    { label: 'Morning', img: 'study', items: [['7:30', 'Wake up and make your own breakfast, with help if you want it.'], ['9:00', 'College, school or a session at the Skills and Development Centre.'], ['11:30', 'Keywork check-in to look at your goals for the week.']] },
    { label: 'Afternoon', img: 'bus', items: [['13:00', 'Lunch, then travel training or an appointment.'], ['14:30', 'ASDAN life skills: budgeting, shopping or a job search.'], ['16:00', 'Free time, sport or a local activity.']] },
    { label: 'Evening', img: 'kitchen', items: [['18:00', 'Cook a meal, on your own or with staff.'], ['19:30', 'Relax in the lounge, call family or friends.'], ['22:00', 'Quiet time. Staff are awake and on site all night.']] },
    { label: 'Weekend', img: 'garden', items: [['10:00', 'Lie-in, laundry and tidying your room.'], ['13:00', 'Trips out, the gym, a place of worship or time with family.'], ['18:00', 'House meeting or a shared meal.']] }
  ];
  var dayPanel = $('#dayPanel'), dayIdx = 0;
  function renderDay(i) {
    if (!dayPanel) return;
    dayIdx = (i + DAY.length) % DAY.length; var d = DAY[dayIdx];
    dayPanel.innerHTML = photo(d.img) + '<div class="stack"><h3>' + d.label + '</h3><ul class="day-list">' + d.items.map(function (x) { return '<li><time>' + x[0] + '</time><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul></div>';
    $$('#dayTabs [data-day]').forEach(function (t) { t.setAttribute('aria-selected', String(+t.getAttribute('data-day') === dayIdx)); });
    var c = $('#dayCount'); if (c) c.textContent = (dayIdx + 1) + ' of ' + DAY.length;
  }
  if (dayPanel) {
    renderDay(0);
    $$('#dayTabs [data-day]').forEach(function (t) { t.addEventListener('click', function () { renderDay(+t.getAttribute('data-day')); }); });
    $('#dayPrev').addEventListener('click', function () { renderDay(dayIdx - 1); });
    $('#dayNext').addEventListener('click', function () { renderDay(dayIdx + 1); });
  }

  /* ---------- Success stories (examples until real stories are added) ---------- */
  var STORIES = [
    { cat: 'independence', tag: 'Independence', img: 'kitchen', name: 'Example: J, 17', challenge: 'Had never cooked or managed money.', support: 'Weekly cooking sessions and a budgeting plan with a keyworker.', progress: 'Cooks most evening meals and manages a weekly budget.', outcome: 'Moved on to a semi-independent flat.', quote: 'I can actually look after myself now.' },
    { cat: 'education', tag: 'Education', img: 'study', name: 'Example: A, 16', challenge: 'Out of education for a year.', support: 'Functional Skills at the Skills and Development Centre, then help enrolling at college.', progress: 'Passed Functional Skills English and Maths.', outcome: 'Started a college course.', quote: 'I didn’t think college was for me.' },
    { cat: 'employment', tag: 'Employment', img: 'keyworker', name: 'Example: M, 18', challenge: 'No work experience and low confidence.', support: 'CV writing, mock interviews and a volunteering placement.', progress: 'Completed three months of volunteering.', outcome: 'First part-time job.', quote: 'Getting that first payslip felt amazing.' },
    { cat: 'life-skills', tag: 'Life skills', img: 'bus', name: 'Example: R, 17', challenge: 'Anxious about travelling alone.', support: 'Step-by-step travel training around Hendon and central London.', progress: 'Travels independently to college and appointments.', outcome: 'Plans their own trips.', quote: 'I know my routes now.' },
    { cat: 'mental-health', tag: 'Mental health', img: 'garden', name: 'Example: S, 16', challenge: 'Struggling with low mood after a placement breakdown.', support: 'A consistent keyworker, gardening, and help accessing therapy.', progress: 'Attends appointments and joins house activities.', outcome: 'Feels settled and has clear goals.', quote: 'Someone was always there to talk to.' },
    { cat: 'independence', tag: 'Independence', img: 'bedroom', name: 'Example: T, 18', challenge: 'Needed support with routines and appointments.', support: 'A visual planner and regular keywork reviews.', progress: 'Manages own appointments and room.', outcome: 'Ready for a planned move on.', quote: 'I sorted everything for my move myself.' }
  ];
  function storyCard(s) {
    return '<article class="story" data-scat="' + s.cat + '">' + photo(s.img) + '<div class="in"><span class="example-flag">Example story · replace before launch</span>' +
      '<span class="tag">' + s.tag + '</span><h3>' + esc(s.name) + '</h3><dl>' +
      '<div><dt>Challenge</dt><dd>' + esc(s.challenge) + '</dd></div><div><dt>Support received</dt><dd>' + esc(s.support) + '</dd></div>' +
      '<div><dt>Progress made</dt><dd>' + esc(s.progress) + '</dd></div><div><dt>Outcome</dt><dd>' + esc(s.outcome) + '</dd></div></dl>' +
      '<blockquote>“' + esc(s.quote) + '”</blockquote></div></article>';
  }
  $$('[data-stories]').forEach(function (box) {
    var list = box.getAttribute('data-stories') === 'home' ? STORIES.slice(0, 3) : STORIES;
    box.innerHTML = list.map(storyCard).join('');
  });
  var sf = $('[data-sfilters]');
  if (sf) $$('button', sf).forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.getAttribute('data-s');
      $$('button', sf).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('[data-stories="all"] .story').forEach(function (s) { s.hidden = c !== 'all' && s.getAttribute('data-scat') !== c; });
    });
  });

  /* ---------- Service finder ---------- */
  var FQ = [
    { q: 'How old is the young person?', key: 'age', o: [['u16', 'Under 16', 'baby'], ['16-17', '16 or 17', 'user-round'], ['18+', '18 or over', 'user-round-check'], ['unsure', 'Not sure', 'help-circle']] },
    { q: 'What is the main support need?', key: 'need', o: [['skills', 'Independent living skills', 'chef-hat'], ['edu', 'Education or training', 'graduation-cap'], ['mh', 'Emotional wellbeing', 'heart-handshake'], ['ld', 'Learning disability', 'puzzle']] },
    { q: 'Where is the young person now?', key: 'loc', o: [['barnet', 'Barnet or North London', 'map-pin'], ['london', 'Elsewhere in London', 'building-2'], ['outside', 'Outside London', 'map'], ['unsure', 'Not sure', 'help-circle']] },
    { q: 'What type of placement is needed?', key: 'type', o: [['planned', 'Planned move', 'calendar-check'], ['emergency', 'Emergency', 'siren'], ['step', 'Step-down from residential', 'trending-down'], ['unsure', 'Not sure yet', 'help-circle']] }
  ];
  var finder = $('[data-finder]');
  if (finder) {
    var fi = 0, ans = {};
    var fq = $('[data-fq]', finder), fo = $('[data-fopts]', finder), fs = $('[data-fstep]', finder), fb = $('[data-fback]', finder), fres = $('[data-fres]', finder), bar = $('.finder-bar i', finder);
    function fRender() {
      var q = FQ[Math.min(fi, FQ.length - 1)];
      fq.textContent = fi < FQ.length ? q.q : 'All done';
      fs.textContent = fi < FQ.length ? 'Question ' + (fi + 1) + ' of ' + FQ.length : 'Complete';
      bar.style.width = (Math.min(fi + 1, FQ.length) / FQ.length * 100) + '%';
      fb.hidden = fi === 0;
      fo.innerHTML = fi < FQ.length ? q.o.map(function (o) { return '<button class="opt" type="button" aria-pressed="' + (ans[q.key] === o[0]) + '" data-v="' + o[0] + '"><i data-lucide="' + o[2] + '"></i>' + o[1] + '</button>'; }).join('') : '<p class="muted">See the suggestion. You can go back to change an answer.</p>';
      $$('.opt', fo).forEach(function (b) { b.addEventListener('click', function () { ans[q.key] = b.getAttribute('data-v'); fi++; fRender(); if (fi >= FQ.length) fResult(); }); });
      icons();
    }
    function fResult() {
      var title, why = [], next = '';
      if (ans.age === 'u16') {
        title = 'Talk to us first';
        why.push('Our home is for young people preparing for independence. We can tell you quickly if we can help or suggest where to look.');
      } else {
        var semi = ans.age === '18+' || ans.need === 'skills';
        title = semi ? 'Semi-independent living' : 'Supported living';
        if (ans.need === 'edu') why.push('Education support from our on-site Skills and Development Centre and links with local colleges.');
        if (ans.need === 'mh') why.push('A consistent named keyworker, coaching and help to access health and therapy services.');
        if (ans.need === 'ld') why.push('Clear routines and skills practised in small steps, for mild to moderate learning disabilities.');
        if (ans.need === 'skills') why.push('ASDAN-accredited life skills: cooking, budgeting, shopping and travel training.');
        why.push('Staff on site 24 hours a day and an individual support plan.');
      }
      if (ans.loc === 'outside' || ans.loc === 'london') why.push('Our home is in Hendon, North West London. We can talk through whether a placement here fits the young person’s plan.');
      if (ans.type === 'emergency') next = '<p><b style="color:#fff">For an emergency placement, call ' + PHONE + ' now.</b></p>';
      fres.innerHTML = '<span class="q-step" style="color:var(--marker)">Suggested service</span><h3>' + title + '</h3><ul>' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' + next +
        '<p class="tiny">A guide only. We confirm suitability through assessment.</p><div class="row"><a class="btn btn-warm btn-sm" href="' + (single ? '#refer-form' : 'referrals.html#refer-form') + '">Make a referral</a><a class="btn btn-line btn-sm" style="border-color:#fff;color:#fff" href="tel:+442082596298">Call us</a></div>';
    }
    fb.addEventListener('click', function () { fi = Math.max(0, fi - 1); fRender(); });
    $('[data-freset]', finder).addEventListener('click', function () { fi = 0; ans = {}; fRender(); fres.innerHTML = '<h3>Your suggestion will appear here</h3><p>Choose an answer to each question on the left.</p>'; });
    fRender();
  }

  /* ---------- House map ---------- */
  var ROOMS = {
    bed1: ['Bedroom 1', 'bedroom', 'A private en-suite room with a bed, desk, storage and space to make it your own.'],
    bed2: ['Bedroom 2', 'bedroom', 'Every one of the eight bedrooms has its own en-suite bathroom.'],
    bed3: ['Bedroom 3', 'bedroom', 'Rooms are decorated with the young person, so they feel like home.'],
    lounge: ['Lounge', 'lounge', 'The communal living area for films, games, house meetings and time together.'],
    kitchen: ['Kitchen and dining', 'kitchen', 'Where cooking sessions happen. Young people learn to plan, shop for and cook meals.'],
    activity: ['Activity room', 'study', 'Used for learning, homework, ASDAN sessions and hobbies.'],
    garden: ['Garden', 'garden', 'A fenced and gated garden for relaxing, growing food and fresh air.']
  };
  function showRoom(k) {
    var r = ROOMS[k]; if (!r) return;
    $$('.room').forEach(function (g) { g.classList.toggle('active', g.getAttribute('data-room') === k); });
    openModal(photo(r[1]) + '<div class="modal-body"><span class="kicker">79 Watford Way</span><h2 id="modalTitle">' + r[0] + '</h2><p class="muted">' + r[2] + '</p><p class="tiny muted">Stock photograph until photos of the home are ready.</p></div>', r[0]);
  }
  $$('[data-room]').forEach(function (el) {
    el.addEventListener('click', function () { showRoom(el.getAttribute('data-room')); });
    if (el.tagName.toLowerCase() === 'g') el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRoom(el.getAttribute('data-room')); } });
  });

  /* ---------- Gallery filter ---------- */
  var gf = $('[data-gfilters]');
  if (gf) $$('button', gf).forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.getAttribute('data-g');
      $$('button', gf).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('[data-gallery] > [data-gcat]').forEach(function (g) { g.hidden = c !== 'all' && g.getAttribute('data-gcat') !== c; });
    });
  });

  /* ---------- Referral wizard ---------- */
  var wz = $('[data-wizard]');
  if (wz) {
    var steps = $$('[data-step]', wz), prog = $$('.progress li', wz), wi = 0;
    var prev = $('[data-wprev]', wz), next = $('[data-wnext]', wz), sub = $('[data-wsubmit]', wz), cnt = $('[data-wcount]', wz);
    function wGo(i) {
      wi = i;
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      prog.forEach(function (p, n) { p.classList.toggle('on', n === i); p.classList.toggle('done', n < i); if (n === i) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current'); });
      prev.hidden = i === 0; next.hidden = i === steps.length - 1; sub.hidden = i !== steps.length - 1;
      cnt.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      if (i === steps.length - 1) {
        var rows = collect(wz), files = $('[data-files]', wz).textContent;
        if (files) rows.push(['Files to send', files]);
        $('[data-review]', wz).innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
      }
    }
    next.addEventListener('click', function () {
      if (!validate(steps[wi])) return;
      wGo(wi + 1);
      var h = $('h3', steps[wi]); h.setAttribute('tabindex', '-1'); h.focus(); wz.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    prev.addEventListener('click', function () { wGo(wi - 1); });
    $$('input, select, textarea', wz).forEach(function (el) { el.addEventListener('input', function () { if (el.closest('.bad')) fieldError(el, ''); }); });
    var fileIn = $('#rf-files', wz);
    fileIn.addEventListener('change', function () { $('[data-files]', wz).textContent = Array.prototype.map.call(fileIn.files, function (f) { return f.name; }).join(', '); });
    wz.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = $('#rf-consent');
      if (!c.checked) { toast('Please confirm the declaration first'); c.focus(); return; }
      var rows = collect(wz), files = $('[data-files]', wz).textContent;
      if (files) rows.push(['Files to send', files]);
      var init = $('#rf-initials').value.trim(), la = $('#rf-la').value.trim();
      mailModal('Referral: ' + init + (la ? ' (' + la + ')' : ''), rows, 'Your email app will open with the referral. Please attach the documents, or send them separately by secure email. If your email does not open, copy the text and send it to ' + EMAIL + '.');
      draft(null); if (draftNote) draftNote.textContent = '';
    });

    /* Unsent draft, kept for this browser tab only (sessionStorage), never the declaration or files */
    var DRAFT = 'lbc-referral-draft', draftNote = document.createElement('span');
    draftNote.className = 'draft-note'; draftNote.setAttribute('aria-live', 'polite');
    cnt.parentNode.insertBefore(draftNote, cnt.nextSibling);
    function draft(v) { try { if (v === undefined) return sessionStorage.getItem(DRAFT); if (v === null) sessionStorage.removeItem(DRAFT); else sessionStorage.setItem(DRAFT, v); } catch (e) { return null; } }
    function draftKey(el) { return el.id || (el.name + ':' + el.value); }
    function draftFields() { return $$('input, select, textarea', wz).filter(function (el) { return el.type !== 'file' && el.id !== 'rf-consent' && (el.id || el.name); }); }
    var draftTimer;
    wz.addEventListener('input', function () {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(function () {
        var d = {};
        draftFields().forEach(function (el) { d[draftKey(el)] = el.type === 'checkbox' ? el.checked : el.value; });
        draft(JSON.stringify(d)); draftNote.textContent = 'Draft saved in this tab';
      }, 400);
    });
    try {
      var draftSaved = JSON.parse(draft() || 'null');
      if (draftSaved) {
        draftFields().forEach(function (el) { var k = draftKey(el); if (!(k in draftSaved)) return; if (el.type === 'checkbox') el.checked = !!draftSaved[k]; else el.value = draftSaved[k]; });
        draftNote.textContent = 'Unsent draft restored';
      }
    } catch (e) {}
    wGo(0);
  }

  /* ---------- Young people: opportunities + weekly timetable ---------- */
  var OPPS = {
    education: ['Education', 'study', 'Work towards GCSEs, Functional Skills or ASDAN awards at our Skills and Development Centre, or get help with college.'],
    independence: ['Independence', 'bedroom', 'Your own en-suite room, your own routines, and support that steps back as you grow in confidence.'],
    sports: ['Sports', 'garden', 'Try the gym, football, swimming or something new. We help you find clubs nearby.'],
    cooking: ['Cooking', 'kitchen', 'Learn to plan, shop for and cook meals, from quick breakfasts to a Sunday dinner.'],
    employment: ['Employment', 'keyworker', 'Help with CVs, interviews, volunteering and work experience.'],
    trips: ['Trips', 'bus', 'Days out around London: museums, parks and places you choose.'],
    technology: ['Technology', 'study', 'Computer skills for college, job applications and everyday life online, safely.'],
    health: ['Health', 'garden', 'Register with a GP and dentist, look after your wellbeing and get support when you need it.']
  };
  $$('[data-opp]').forEach(function (b) {
    b.addEventListener('click', function () {
      var o = OPPS[b.getAttribute('data-opp')];
      openModal(photo(o[1]) + '<div class="modal-body"><span class="kicker">Opportunities</span><h2 id="modalTitle">' + o[0] + '</h2><p class="muted">' + o[2] + '</p><p>Ask your keyworker to add it to your plan.</p></div>', o[0]);
    });
  });
  var WEEK = [
    [['9:30', 'College or Skills and Development Centre'], ['14:00', 'Keywork session'], ['18:00', 'Cooking night']],
    [['10:00', 'Functional Skills Maths'], ['15:00', 'Gym'], ['19:00', 'Free time']],
    [['9:30', 'College'], ['14:00', 'Shopping and budgeting'], ['18:30', 'House meeting']],
    [['10:00', 'ASDAN life skills'], ['14:00', 'Volunteering'], ['19:00', 'Film night']],
    [['9:30', 'College or work experience'], ['14:00', 'Travel training'], ['18:00', 'Takeaway night']],
    [['11:00', 'Laundry and room tidy'], ['13:00', 'Day trip'], ['19:00', 'Free time']],
    [['11:00', 'Family time or place of worship'], ['15:00', 'Garden or sport'], ['18:00', 'Shared meal and plan the week']]
  ];
  var wk = $('[data-week]'), wl = $('[data-weeklist]');
  function renderWeek(i) {
    $$('[data-wd]', wk).forEach(function (t) { t.setAttribute('aria-selected', String(+t.getAttribute('data-wd') === i)); });
    wl.innerHTML = WEEK[i].map(function (x) { return '<li><time>' + x[0] + '</time><span>' + esc(x[1]) + '</span></li>'; }).join('');
  }
  if (wk && wl) { $$('[data-wd]', wk).forEach(function (t) { t.addEventListener('click', function () { renderWeek(+t.getAttribute('data-wd')); }); }); renderWeek(0); }

  /* ---------- Careers (example roles until real ones are added) ---------- */
  var JOBS = [
    { title: 'Support Worker', type: 'Full time', hours: 'Days and evenings, rota', text: 'Help young people with daily living, education and goals.' },
    { title: 'Night Support Worker', type: 'Full time', hours: 'Waking nights', text: 'Keep the home safe overnight and support young people when they need it.' },
    { title: 'Keyworker', type: 'Full time', hours: 'Rota', text: 'Lead support plans for named young people using the GROW model.' },
    { title: 'Bank Support Worker', type: 'Bank', hours: 'Flexible', text: 'Cover shifts when it suits you.' }
  ];
  var jobsBox = $('[data-jobs]');
  if (jobsBox) {
    jobsBox.innerHTML = JOBS.map(function (j, i) {
      return '<article class="job" data-j="' + i + '"><div><span class="example-flag">Example listing · replace before launch</span><h3 style="margin-top:8px">' + j.title + '</h3><p class="muted">' + j.text + '</p><div class="meta"><span class="tag">' + j.type + '</span><span class="tag">' + j.hours + '</span><span class="tag">Hendon, NW4</span></div></div>' +
        '<button class="btn btn-teal btn-sm" type="button" data-applyfor="' + esc(j.title) + '">Apply</button></article>';
    }).join('');
    var rs = $('[data-role-select]');
    if (rs) JOBS.forEach(function (j) { var o = document.createElement('option'); o.textContent = j.title; rs.appendChild(o); });
    var js = $('#jobSearch'), jt = $('#jobType');
    function filterJobs() {
      var q = js.value.trim().toLowerCase(), t = jt.value, shown = 0;
      $$('.job', jobsBox).forEach(function (el) {
        var j = JOBS[+el.getAttribute('data-j')];
        var ok = (!t || j.type === t) && (!q || (j.title + ' ' + j.text + ' ' + j.hours).toLowerCase().indexOf(q) > -1);
        el.hidden = !ok; if (ok) shown++;
      });
      $('[data-jobs-empty]').hidden = shown > 0;
    }
    js.addEventListener('input', filterJobs); jt.addEventListener('change', filterJobs);
    jobsBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-applyfor]'); if (!b) return;
      if (rs) rs.value = b.getAttribute('data-applyfor');
      var n = $('#ap-name'); n.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { n.focus({ preventScroll: true }); }, 350);
    });
  }

  /* ---------- Accessibility toolbar ---------- */
  var root = document.documentElement, a11yBtn = $('#a11yBtn'), a11yPanel = $('#a11yPanel');
  var A = { size: 100, hc: false, ul: false, spaced: false, theme: '' };
  try { var saved = JSON.parse(store('lbc-a11y') || 'null'); if (saved) A = Object.assign(A, saved); } catch (e) {}
  function isDark() {
    if (A.theme) return A.theme === 'dark';
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function applyA11y() {
    root.style.fontSize = A.size === 100 ? '' : A.size + '%';
    ['hc', 'ul', 'spaced'].forEach(function (m) { root.classList.toggle(m, !!A[m]); var b = $('[data-mode="' + m + '"]'); if (b) b.setAttribute('aria-pressed', String(!!A[m])); });
    if (A.theme) root.setAttribute('data-theme', A.theme); else root.removeAttribute('data-theme');
    var tb = $('#themeToggle'); if (tb) tb.setAttribute('aria-pressed', String(isDark()));
    store('lbc-a11y', JSON.stringify(A));
  }
  function togglePanel(btn, panel, open) {
    if (open === undefined) open = panel.hidden;
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  }
  if (a11yBtn) {
    var a11yGrid = $('.a11y-grid', a11yPanel);
    if (a11yGrid) {
      var themeBtn = document.createElement('button');
      themeBtn.type = 'button'; themeBtn.className = 'a11y-btn wide'; themeBtn.id = 'themeToggle';
      themeBtn.innerHTML = '<i data-lucide="moon"></i>Dark mode';
      a11yGrid.appendChild(themeBtn);
      themeBtn.addEventListener('click', function () { A.theme = isDark() ? 'light' : 'dark'; applyA11y(); toast(isDark() ? 'Dark mode on' : 'Light mode on'); });
    }
    applyA11y();
    a11yBtn.addEventListener('click', function () { togglePanel(a11yBtn, a11yPanel); if (!chatPanel.hidden) togglePanel(chatBtn, chatPanel, false); });
    $('#fontUp').addEventListener('click', function () { A.size = Math.min(140, A.size + 10); applyA11y(); toast('Text size ' + A.size + '%'); });
    $('#fontDown').addEventListener('click', function () { A.size = Math.max(90, A.size - 10); applyA11y(); toast('Text size ' + A.size + '%'); });
    $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { var m = b.getAttribute('data-mode'); A[m] = !A[m]; applyA11y(); }); });
    $('#a11yReset').addEventListener('click', function () { A = { size: 100, hc: false, ul: false, spaced: false, theme: '' }; applyA11y(); stopReading(); toast('Settings reset'); });
    var tl = $('#translateLink');
    if (tl && !single) tl.href = 'https://translate.google.com/translate?sl=en&tl=auto&u=' + encodeURIComponent(location.href);
  }
  var readBtn = $('#readAloud');
  function stopReading() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} if (readBtn) readBtn.setAttribute('aria-pressed', 'false'); }
  if (readBtn) readBtn.addEventListener('click', function () {
    if (!('speechSynthesis' in window)) { toast('Read aloud is not supported in this browser'); return; }
    if (readBtn.getAttribute('aria-pressed') === 'true') { stopReading(); return; }
    var page = pages.filter(function (p) { return !p.hidden; })[0] || $('main');
    var text = $$('h1, h2, h3, p, li', page).filter(function (el) { return el.offsetParent !== null; }).map(function (el) { return el.textContent.trim(); }).join('. ');
    var u = new SpeechSynthesisUtterance(text.slice(0, 6000)); u.lang = 'en-GB'; u.onend = stopReading;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); readBtn.setAttribute('aria-pressed', 'true');
  });

  /* ---------- Chat helper (answers from this website only) ---------- */
  var chatBtn = $('#chatBtn'), chatPanel = $('#chatPanel'), chatLog = $('#chatLog');
  function L(page, anchor) { return single ? '#' + (anchor || page) : (page === 'home' ? 'index.html' : page + '.html') + (anchor ? '#' + anchor : ''); }
  var KB = [
    { k: ['refer', 'referral', 'placement', 'social worker'], a: function () { return 'Social workers can refer by calling ' + PHONE + ' (24 hours), emailing ' + EMAIL + ', or using our <a href="' + L('referrals', 'refer-form') + '">online referral form</a>.'; } },
    { k: ['vacanc', 'available', 'space', 'room free', 'beds'], a: function () { return 'Availability changes often, so please call ' + PHONE + ' for today’s vacancies.'; } },
    { k: ['visit', 'look round', 'tour', 'see the home'], a: function () { return 'You are welcome to visit. <a href="' + L('contact', 'visit') + '">Book a visit</a> or call ' + PHONE + '.'; } },
    { k: ['where', 'address', 'location', 'hendon', 'map'], a: function () { return 'We are at 79 Watford Way, Hendon, London NW4 4RS. <a href="' + L('contact') + '">Contact and map</a>.'; } },
    { k: ['bedroom', 'house', 'accommodation', 'en-suite', 'ensuite', 'garden'], a: function () { return 'The home has eight en-suite bedrooms, a lounge, kitchen and dining room, activity room and a gated garden. <a href="' + L('accommodation', 'house-map') + '">Explore the house</a>.'; } },
    { k: ['school', 'college', 'education', 'asdan', 'gcse', 'learn'], a: function () { return 'We have an on-site Skills and Development Centre and offer ASDAN-accredited courses. <a href="' + L('services', 'education') + '">Education support</a>.'; } },
    { k: ['job', 'career', 'work for', 'vacancy job', 'apply'], a: function () { return 'See our <a href="' + L('careers', 'vacancies') + '">careers page</a> for roles, or send us your CV.'; } },
    { k: ['family', 'parent', 'mum', 'dad', 'carer'], a: function () { return 'Families are welcome to stay involved where it is right for the young person. <a href="' + L('families') + '">Information for families</a>.'; } },
    { k: ['document', 'policy', 'statement of purpose', 'brochure', 'pdf'], a: function () { return 'We can email you our Statement of Purpose and policies. <a href="' + L('about', 'policies') + '">Request a document</a>.'; } },
    { k: ['danger', 'emergency', 'unsafe', 'hurt', 'help me', 'scared'], a: function () { return '<b>If you or someone else is in danger, call 999 now.</b> You can also call Childline free on 0800 1111, or us on ' + PHONE + ' at any time.'; } },
    { k: ['night', '24', 'staff', 'support'], a: function () { return 'Staff are on site 24 hours a day, every day, and every young person has a named keyworker.'; } },
    { k: ['contact', 'phone', 'call', 'email', 'number'], a: function () { return 'Call ' + PHONE + ' (24 hours), mobile 07760 348767 or 07723 126345, or email ' + EMAIL + '.'; } }
  ];
  var QUICK = ['How do I refer?', 'Any vacancies?', 'Book a visit', 'Where are you?', 'Jobs'];
  function say(html, who) {
    var m = document.createElement('div'); m.className = 'msg ' + (who || 'bot'); m.innerHTML = html; chatLog.appendChild(m); chatLog.scrollTop = chatLog.scrollHeight;
  }
  function answer(q) {
    var t = q.toLowerCase(), hit = null;
    for (var i = 0; i < KB.length && !hit; i++) { for (var j = 0; j < KB[i].k.length; j++) { if (t.indexOf(KB[i].k[j]) > -1) { hit = KB[i]; break; } } }
    if (/vacanc|any space|available/.test(t)) hit = KB[1];
    if (/danger|emergency|unsafe|hurt|scared/.test(t)) hit = KB[9];
    return hit ? hit.a() : 'I’m a simple helper and can only answer common questions. For anything else, call ' + PHONE + ' (24 hours) or email ' + EMAIL + '.';
  }
  if (chatBtn) {
    var started = false;
    chatBtn.addEventListener('click', function () {
      togglePanel(chatBtn, chatPanel);
      if (!a11yPanel.hidden) togglePanel(a11yBtn, a11yPanel, false);
      if (!started) {
        started = true;
        say('Hello. I can answer common questions about LBC Supported Living. What would you like to know?');
        $('#chatQuick').innerHTML = QUICK.map(function (q) { return '<button type="button">' + q + '</button>'; }).join('');
      }
      if (!chatPanel.hidden) $('#chatIn').focus();
    });
    $('#chatClose').addEventListener('click', function () { togglePanel(chatBtn, chatPanel, false); chatBtn.focus(); });
    function reply(q) {
      var t = document.createElement('div'); t.className = 'msg bot typing'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<i></i><i></i><i></i>';
      chatLog.appendChild(t); chatLog.scrollTop = chatLog.scrollHeight;
      setTimeout(function () { chatLog.removeChild(t); say(answer(q)); }, 650);
    }
    $('#chatQuick').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; say(esc(b.textContent), 'me'); reply(b.textContent); });
    $('#chatForm').addEventListener('submit', function (e) {
      e.preventDefault(); var inp = $('#chatIn'), v = inp.value.trim(); if (!v) return;
      say(esc(v), 'me'); inp.value = ''; reply(v);
    });
    chatLog.addEventListener('click', function (e) { if (e.target.closest('a') && single) togglePanel(chatBtn, chatPanel, false); });
  }

  /* ---------- Escape closes things ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) { closeModal(); return; }
    if (chatPanel && !chatPanel.hidden) { togglePanel(chatBtn, chatPanel, false); chatBtn.focus(); return; }
    if (a11yPanel && !a11yPanel.hidden) { togglePanel(a11yBtn, a11yPanel, false); a11yBtn.focus(); return; }
    closeMenu();
  });

  /* ---------- Header shadow, reading progress, back to top ---------- */
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var siteHeader = $('.site-header');
  var progEl = document.createElement('div'); progEl.className = 'read-progress'; progEl.setAttribute('aria-hidden', 'true');
  var topBtn = document.createElement('button'); topBtn.type = 'button'; topBtn.className = 'to-top'; topBtn.setAttribute('aria-label', 'Back to top'); topBtn.innerHTML = '<i data-lucide="arrow-up"></i>';
  document.body.appendChild(progEl); document.body.appendChild(topBtn);
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  var scrollQueued = false;
  function onScroll() {
    scrollQueued = false;
    var y = window.scrollY || 0, h = document.documentElement.scrollHeight - window.innerHeight;
    progEl.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (siteHeader) siteHeader.classList.toggle('scrolled', y > 8);
    topBtn.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', function () { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  var hasIO = 'IntersectionObserver' in window;
  if (hasIO && !reduceMotion) {
    var animIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, delay = parseInt(el.style.transitionDelay, 10) || 0;
        el.classList.add('in'); animIO.unobserve(el);
        // hand transitions back to the element's own hover styles once it has arrived
        setTimeout(function () { el.removeAttribute('data-anim'); el.classList.remove('in'); el.style.transitionDelay = ''; }, 700 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('main .sec-head, main .card, .svc-card, main .feature, .reveal, .story, .member, .timeline li, .steps li, .dash > div, .opp, main .dl, .job, .guide > div, .split > .ph, .day, .finder, .house-map, .gallery > div, .helplines > div, .callbox').forEach(function (el) {
      el.setAttribute('data-anim', '');
      el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) % 4) * 80 + 'ms';
      animIO.observe(el);
    });
    root.classList.add('anim');
  }

  /* ---------- Count-up numbers on the outcomes dashboard ---------- */
  $$('.dash b').forEach(function (b) {
    var m = /^(\d+)(%?)$/.exec(b.textContent.trim());
    if (!m || reduceMotion || !hasIO) return;
    var target = +m[1], suffix = m[2];
    b.textContent = '0' + suffix;
    var countIO = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      countIO.disconnect();
      var t0 = null;
      // animation frames pause in background tabs, so always land on the real figure
      setTimeout(function () { b.textContent = target + suffix; }, 1500);
      (function step(ts) {
        if (ts === undefined) return requestAnimationFrame(step);
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1300);
        b.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })();
    }, { threshold: 0.4 });
    countIO.observe(b);
  });

  /* ---------- Arrow keys move between tabs ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    list.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
      var tabs = $$('[role="tab"]', list), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus(); tabs[n].click();
    });
  });

  /* ---------- Highlight the current section in "On this page" links ---------- */
  var jumpLinks = $$('.jump a[href^="#"]');
  if (jumpLinks.length && hasIO) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        jumpLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    jumpLinks.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) spyIO.observe(s); });
  }

  /* ---------- Slider arrows ---------- */
  $$('.slider').forEach(function (sl) {
    var nav = document.createElement('div'); nav.className = 'slider-arrows';
    nav.innerHTML = '<button class="round" type="button" aria-label="Previous photo"><i data-lucide="chevron-left"></i></button><button class="round" type="button" aria-label="Next photo"><i data-lucide="chevron-right"></i></button>';
    sl.parentNode.insertBefore(nav, sl.nextSibling);
    $$('button', nav).forEach(function (b, i) {
      b.addEventListener('click', function () {
        var first = sl.firstElementChild, w = first ? first.getBoundingClientRect().width + 16 : sl.clientWidth;
        sl.scrollBy({ left: (i ? 1 : -1) * w, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- Photo lightbox (gallery and slider) ---------- */
  var lbImgs = $$('[data-gallery] img, .slider img'), lb = null;
  function lbHtml() {
    var im = lb.list[lb.i], cap = im.closest('figure') && $('figcaption', im.closest('figure'));
    return '<div class="lightbox"><figure class="ph"><img src="' + im.getAttribute('src') + '" alt="' + esc(im.alt) + '"></figure><div class="lb-bar"><div><b id="modalTitle">' + esc(im.alt) + '</b>' +
      '<div class="tiny muted">' + (cap ? esc(cap.textContent) + ' · ' : '') + (lb.i + 1) + ' of ' + lb.list.length + '</div></div>' +
      (lb.list.length > 1 ? '<div class="row"><button class="round" type="button" data-lb="-1" aria-label="Previous photo"><i data-lucide="chevron-left"></i></button><button class="round" type="button" data-lb="1" aria-label="Next photo"><i data-lucide="chevron-right"></i></button></div>' : '') + '</div></div>';
  }
  function lbMove(d) {
    lb.i = (lb.i + d + lb.list.length) % lb.list.length;
    modalContent.innerHTML = lbHtml(); icons();
    var b = $('[data-lb="' + d + '"]', modalContent); if (b) b.focus();
  }
  function openLightbox(img) {
    var list = lbImgs.filter(function (x) { return x.offsetParent !== null; });
    lb = { list: list.length ? list : [img], i: Math.max(0, list.indexOf(img)) };
    openModal(lbHtml(), 'Photo viewer');
  }
  lbImgs.forEach(function (img) {
    img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role', 'button'); img.setAttribute('aria-label', 'Enlarge photo: ' + img.alt);
    img.addEventListener('click', function () { openLightbox(img); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img); } });
  });
  modalContent.addEventListener('click', function (e) { var b = e.target.closest('[data-lb]'); if (b && lb) lbMove(+b.getAttribute('data-lb')); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden || !lb || !$('.lightbox', modalContent)) return;
    if (e.key === 'ArrowRight') lbMove(1); else if (e.key === 'ArrowLeft') lbMove(-1);
  });

  /* ---------- Quick exit on pages written for young people ---------- */
  var pageId = (pages[0] && pages[0].id) || '';
  if (!single && (pageId === 'young-people' || /^yp-/.test(pageId))) {
    var qx = document.createElement('button');
    qx.type = 'button'; qx.className = 'quick-exit'; qx.title = 'Leave this website quickly';
    qx.setAttribute('aria-label', 'Quick exit: leave this website now');
    qx.innerHTML = '<i data-lucide="log-out"></i>Quick exit';
    document.body.appendChild(qx);
    qx.addEventListener('click', function () { document.body.style.visibility = 'hidden'; location.replace('https://www.bbc.co.uk/weather'); });
  }

  if (single) route();
  icons();
})();
