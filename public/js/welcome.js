(function () {
  var img = document.getElementById('cover');
  var input = document.getElementById('coverInput');
  var FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320"><rect width="100%" height="100%" fill="#0a0a0a"/></svg>'
  );
  // hanya preview di web, tidak mempengaruhi menu bot
  input.addEventListener('change', function () {
    var v = input.value.trim();
    if (/^https?:\/\//i.test(v)) img.src = v;
  });
  img.addEventListener('error', function () {
    if (img.src !== FALLBACK) img.src = FALLBACK;
  });
})();
