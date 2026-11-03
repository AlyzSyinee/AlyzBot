(function () {
  var zone = document.getElementById('holdZone');
  var fill = document.getElementById('pfill');
  var pline = document.getElementById('pline');
  var pctEl = document.getElementById('percent');
  var pct = 0, upTimer = null, downTimer = null, done = false;

  function render() {
    fill.style.width = pct + '%';
    pctEl.textContent = Math.round(pct) + '%';
    if (pct > 0) {
      pline.classList.add('expand');
      pline.style.left = (50 - pct / 2) + '%';
      pline.style.width = pct + '%';
    }
  }
  function resetLine() {
    pline.classList.remove('expand');
    pline.style.left = '50%';
    pline.style.width = '2px';
  }
  function finish() {
    done = true;
    clearInterval(upTimer); upTimer = null;
    zone.classList.remove('holding');
    zone.classList.add('granted');
    setTimeout(function () { document.body.classList.add('leaving'); }, 150);
    setTimeout(function () { location.href = '/welcome.html'; }, 400);
  }
  function startHold(e) {
    if (e && e.cancelable) e.preventDefault();
    if (done || upTimer) return;
    clearInterval(downTimer); downTimer = null;
    zone.classList.add('holding');
    upTimer = setInterval(function () {
      pct = Math.min(100, pct + 1.2);
      render();
      if (pct >= 100) finish();
    }, 30);
  }
  function endHold() {
    if (done) return;
    clearInterval(upTimer); upTimer = null;
    zone.classList.remove('holding');
    if (pct < 100 && !downTimer && pct > 0) {
      downTimer = setInterval(function () {
        pct = Math.max(0, pct - 4);
        render();
        if (pct <= 0) {
          clearInterval(downTimer); downTimer = null;
          pct = 0; render(); resetLine();
        }
      }, 20);
    }
  }

  zone.addEventListener('mousedown', startHold);
  zone.addEventListener('touchstart', startHold, { passive: false });
  window.addEventListener('mouseup', endHold);
  window.addEventListener('touchend', endHold);
  window.addEventListener('touchcancel', endHold);
  window.addEventListener('blur', endHold);
  zone.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startHold(e);
  });
  zone.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') endHold();
  });
})();
