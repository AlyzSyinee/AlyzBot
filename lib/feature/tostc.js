const sharp = require('sharp');
const { getQuoted, getMedia, dl } = require('../utils');

module.exports = {
  name: 'tostc',
  async run(sock, from, msg) {
    const quoted = getQuoted(msg);
    const src = quoted && getMedia(quoted.message)?.type === 'imageMessage' ? quoted
      : getMedia(msg.message)?.type === 'imageMessage' ? msg : null;
    if (!src) return sock.sendMessage(from, { text: 'Reply foto dengan .tostc (atau kirim foto dengan caption .tostc)' }, { quoted: msg });

    const buffer = await dl(sock, src);
    const webp = await sharp(buffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toBuffer();
    await sock.sendMessage(from, { sticker: webp }, { quoted: msg });
  }
};
