(function () {
  var el = function (t) { return t && t.nodeType === 1 ? t : t && t.parentElement; };
  var inField = function (t) { var e = el(t); return !!(e && e.closest('input,textarea')); };

  document.addEventListener('contextmenu', function (e) { if (!inField(e.target)) e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { if (!inField(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });

  document.querySelectorAll('a[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var href = a.getAttribute('href');
      document.body.classList.add('leaving');
      setTimeout(function () { location.href = href; }, 230);
    });
  });
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
})();
