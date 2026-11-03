const axios = require('axios');

const API = 'https://api.ryzendesu.vip/api';

// ambil nilai pertama yang berupa string dari beberapa kemungkinan path
function pick(obj, paths) {
  for (const p of paths) {
    const v = p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);
    if (typeof v === 'string' && v) return v;
  }
  return null;
}

module.exports = {
  name: 'alyzmusik',
  async run(sock, from, msg, args, q) {
    if (!q) return sock.sendMessage(from, { text: 'Format: .alyzmusik <nama lagu>' }, { quoted: msg });
    await sock.sendMessage(from, { text: 'Mencari lagu: ' + q + ' ...' }, { quoted: msg });

    const s = await axios.get(API + '/search/yt', { params: { query: q }, timeout: 30000 });
    const d = s.data;
    const list = Array.isArray(d) ? d : (d.videos || d.result || d.data || []);
    const first = Array.isArray(list) ? list[0] : null;
    if (!first) return sock.sendMessage(from, { text: 'Lagu tidak ditemukan.' }, { quoted: msg });

    const url = first.url || first.link;
    const title = first.title || q;

    const r = await axios.get(API + '/downloader/ytmp3', { params: { url }, timeout: 120000 });
    const dlUrl = pick(r.data, [
      'url', 'download', 'link', 'result.url', 'result.download',
      'data.url', 'data.download', 'result.link', 'data.link'
    ]);
    if (!dlUrl) return sock.sendMessage(from, { text: 'Gagal mengambil link audio dari API.' }, { quoted: msg });

    const audio = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 180000 });
    await sock.sendMessage(from, {
      audio: Buffer.from(audio.data),
      mimetype: 'audio/mpeg',
      fileName: title + '.mp3'
    }, { quoted: msg });
  }
};
