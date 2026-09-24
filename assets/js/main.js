/* Smooth Seas Sailing — site JS
   Expand/collapse all, lightbox, subtle reveal animations. */

(function () {
  'use strict';

  /* Expand all / Collapse all (trip day lists & notes) */
  document.querySelectorAll('[data-expand-all]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-expand-all'));
      if (target) target.querySelectorAll('details').forEach(function (d) { d.open = true; });
    });
  });

  document.querySelectorAll('[data-collapse-all]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-collapse-all'));
      if (target) target.querySelectorAll('details').forEach(function (d) { d.open = false; });
    });
  });

  /* Lightbox for gallery / figure images */
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<img alt="">' +
    '<div class="lb-caption"></div>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb-caption');

  function openLightbox(src, alt, caption) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  lb.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  document.querySelectorAll('.gallery img, .content-figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      var fig = img.closest('figure');
      var cap = fig ? fig.querySelector('figcaption') : null;
      openLightbox(img.dataset.full || img.src, img.alt, cap ? cap.textContent : img.alt);
    });
  });

  /* FAQ search: filter questions and highlight matched keywords */
  var searchInput = document.getElementById('faq-search');
  if (searchInput) {
    var clearBtn = document.getElementById('faq-search-clear');
    var countEl = document.getElementById('faq-search-count');
    var cols = Array.prototype.slice.call(document.querySelectorAll('.faq-col'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-col details'));

    /* Wrap each question's text in a span so highlights don't break the
       summary's flex layout */
    items.forEach(function (d) {
      var s = d.querySelector('summary');
      if (s && !s.querySelector('.q')) {
        var span = document.createElement('span');
        span.className = 'q';
        while (s.firstChild) span.appendChild(s.firstChild);
        s.appendChild(span);
      }
    });

    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function clearMarks(root) {
      root.querySelectorAll('mark.faq-hl').forEach(function (m) {
        var parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
    }

    function highlight(root, re) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var tag = node.parentNode && node.parentNode.nodeName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        re.lastIndex = 0;
        var text = node.nodeValue;
        if (!re.test(text)) return;
        re.lastIndex = 0;
        var frag = document.createDocumentFragment();
        var last = 0;
        var m;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mark = document.createElement('mark');
          mark.className = 'faq-hl';
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
          if (m.index === re.lastIndex) re.lastIndex++;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    }

    function runSearch() {
      var q = searchInput.value.trim();
      var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length >= 2; });
      clearBtn.hidden = searchInput.value.length === 0;

      items.forEach(function (d) { clearMarks(d); });

      if (!terms.length) {
        items.forEach(function (d) { d.style.display = ''; d.open = false; });
        cols.forEach(function (c) { c.classList.remove('search-empty'); });
        countEl.textContent = '';
        return;
      }

      var re = new RegExp('(' + terms.map(escapeRegExp).join('|') + ')', 'gi');
      var shown = 0;

      items.forEach(function (d) {
        var text = d.textContent.toLowerCase();
        var hit = terms.some(function (t) { return text.indexOf(t) !== -1; });
        d.style.display = hit ? '' : 'none';
        d.open = hit;
        if (hit) {
          highlight(d, re);
          shown++;
        }
      });

      cols.forEach(function (c) {
        var any = Array.prototype.some.call(c.querySelectorAll('details'), function (d) {
          return d.style.display !== 'none';
        });
        c.classList.toggle('search-empty', !any);
      });

      countEl.textContent = shown === 0
        ? 'No matches — try a different word, or browse the questions below.'
        : shown + (shown === 1 ? ' question matches' : ' questions match') + ' “' + q + '”';

      if (shown === 0) {
        items.forEach(function (d) { d.style.display = ''; d.open = false; });
        cols.forEach(function (c) { c.classList.remove('search-empty'); });
      }
    }

    var debounce;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(runSearch, 120);
    });

    clearBtn.addEventListener('click', function () {
      searchInput.value = '';
      runSearch();
      searchInput.focus();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        runSearch();
      }
    });
  }

  /* Subtle reveal-on-scroll */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
