/* ===== Change Leaders — interactions ===== */
(function () {
  'use strict';
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) burger.addEventListener('click', function () { menu.classList.toggle('open'); });

  function isMobile() { return window.matchMedia('(max-width:860px)').matches; }
  document.querySelectorAll('.menu > li.has-drop > a, .dropdown li.has-sub > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!isMobile()) return;
      var parent = link.parentElement;
      if (parent.querySelector('.dropdown, .submenu')) { e.preventDefault(); parent.classList.toggle('open'); }
    });
  });
  if (menu) menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      var li = a.parentElement;
      var opensChild = li.querySelector('.dropdown, .submenu') && isMobile();
      if (!opensChild) { menu.classList.remove('open'); document.querySelectorAll('.menu li.open').forEach(function (el) { el.classList.remove('open'); }); }
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) { setTimeout(function () { entry.target.classList.add('in'); }, (i % 4) * 80); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.floor(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step); else el.textContent = formatNum(target) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else { counters.forEach(runCounter); }

  var header = document.querySelector('.header');
  window.addEventListener('scroll', function () {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 8 ? '0 6px 26px rgba(10,31,68,.14)' : '0 2px 18px rgba(10,31,68,.08)';
  });

  /* Live openings from RecruiterV (public endpoint, CORS-enabled) */
  var jobsEl = document.getElementById('liveJobs');
  if (jobsEl) {
    var APPLY = jobsEl.getAttribute('data-apply') || 'https://www.recruiterv.com/apply';
    var LIMIT = parseInt(jobsEl.getAttribute('data-limit'), 10) || 6;
    var PIN = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
    var BAG = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    var esc = function (s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; };
    var loc = function (p) { var l = p.location; if (Array.isArray(l)) l = l.filter(Boolean).join(', '); return l || 'India'; };
    var card = function (p) {
      return '<a class="card job-card reveal in" href="' + APPLY + '">' +
        '<div class="jc-top"><span class="tag">' + esc(p.skill_category || 'Role') + '</span></div>' +
        '<h3>' + esc(p.position || 'Open Position') + '</h3>' +
        (p.client ? '<div class="jc-client">' + esc(p.client) + '</div>' : '') +
        '<div class="jc-meta"><span>' + PIN + esc(loc(p)) + '</span>' +
        (p.experience ? '<span>' + BAG + esc(p.experience) + '</span>' : '') + '</div>' +
        '<span class="more">Apply on RecruiterV →</span></a>';
    };
    var fallback = function () {
      jobsEl.innerHTML = '<div class="jobs-state" style="grid-column:1/-1;text-align:center">' +
        '<p style="color:var(--muted)">We couldn’t load live openings right now.</p>' +
        '<a href="' + APPLY + '" class="btn btn-primary">Browse all openings on RecruiterV →</a></div>';
    };
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
    fetch('https://www.recruiterv.com/api/direct-apply/positions', { mode: 'cors', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        clearTimeout(timer);
        var list = (d && d.positions) || [];
        for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; }
        list = list.slice(0, LIMIT);
        if (!list.length) { fallback(); return; }
        jobsEl.innerHTML = list.map(card).join('');
      })
      .catch(function () { clearTimeout(timer); fallback(); });
  }

  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) { alert('Please enter your name, a valid email, and a message.'); return; }
      document.getElementById('formSuccess').style.display = 'block';
      form.reset();
      document.getElementById('formSuccess').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
