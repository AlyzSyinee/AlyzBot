(function () {
  var input = document.getElementById('number');
  var btn = document.getElementById('gen');
  var box = document.getElementById('pairCode');
  var state = document.getElementById('state');
  var LABEL = 'GENERATE CODE';
  var busy = false, cdTimer = null, pollTimer = null;

  function normalize(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.indexOf('0') === 0) d = '62' + d.slice(1);
    else if (d.indexOf('62') !== 0) d = '62' + d.replace(/^6?/, '');
    return d;
  }
  input.addEventListener('input', function () { input.value = normalize(input.value); });

  function setState(text, ok) {
    state.textContent = text || '';
    state.className = 'state' + (ok ? ' ok' : '');
  }
  function showCode(code) {
    box.innerHTML = '';
    code.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.animationDelay = (i * 55) + 'ms';
      box.appendChild(s);
    });
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
  }
  function startCooldown(sec) {
    clearInterval(cdTimer);
    var left = sec;
    btn.disabled = true;
    btn.textContent = 'Cooldown ' + left + 's - anti limit';
    cdTimer = setInterval(function () {
      left--;
      if (left <= 0) {
        clearInterval(cdTimer);
        btn.disabled = false; btn.textContent = LABEL;
      } else {
        btn.textContent = 'Cooldown ' + left + 's - anti limit';
      }
    }, 1000);
  }
  function startPolling(number) {
    clearInterval(pollTimer);
    var tries = 0;
    pollTimer = setInterval(function () {
      tries++;
      fetch('/api/status?number=' + encodeURIComponent(number))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.connected) {
            clearInterval(pollTimer);
            setState('CONNECTED', true);
          }
        }).catch(function () {});
      if (tries > 200) clearInterval(pollTimer);
    }, 3000);
  }

  btn.addEventListener('click', function () {
    if (busy || btn.disabled) return;
    var number = normalize(input.value);
    if (number.length < 10 || number.length > 15) {
      setState('Nomor tidak valid. Contoh: 6283xxxxxxxxx');
      return;
    }
    busy = true; btn.disabled = true; btn.textContent = 'MEMPROSES...';
    setState('Meminta kode ke WhatsApp...');
    box.classList.remove('show');

    fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: number })
    })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        busy = false;
        var j = res.j;
        if (res.status === 429) {
          setState('Terlalu cepat. Tunggu cooldown.');
          startCooldown(j.retryAfter || 30);
        } else if (j.code) {
          showCode(j.code);
          setState('Masukkan kode di WhatsApp. Menunggu koneksi...');
          startCooldown(30);
          startPolling(number);
        } else if (j.connected) {
          btn.disabled = false; btn.textContent = LABEL;
          setState('CONNECTED', true);
        } else {
          btn.disabled = false; btn.textContent = LABEL;
          setState(j.message || j.error || 'Gagal membuat kode.');
        }
      })
      .catch(function () {
        busy = false; btn.disabled = false; btn.textContent = LABEL;
        setState('Tidak bisa terhubung ke server.');
      });
  });
})();
