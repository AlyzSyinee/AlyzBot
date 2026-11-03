const { getQuoted, getMedia, dl } = require('../utils');

module.exports = {
  name: 'rvo',
  async run(sock, from, msg) {
    const quoted = getQuoted(msg);
    if (!quoted) return sock.sendMessage(from, { text: 'Reply foto/video sekali lihat dengan .rvo' }, { quoted: msg });

    const media = getMedia(quoted.message);
    if (!media || !['imageMessage', 'videoMessage', 'audioMessage'].includes(media.type)) {
      return sock.sendMessage(from, { text: 'Pesan yang di-reply bukan foto/video sekali lihat.' }, { quoted: msg });
    }

    const buffer = await dl(sock, quoted);
    const caption = media.content.caption || '';
    if (media.type === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption }, { quoted: msg });
    else if (media.type === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption }, { quoted: msg });
    else await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4' }, { quoted: msg });
  }
};
