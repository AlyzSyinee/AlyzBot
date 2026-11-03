const sharp = require('sharp');
const { getQuoted, getMedia, dl } = require('../utils');

module.exports = {
  name: 'toimg',
  async run(sock, from, msg) {
    const quoted = getQuoted(msg);
    if (!quoted || getMedia(quoted.message)?.type !== 'stickerMessage') {
      return sock.sendMessage(from, { text: 'Reply stiker dengan .toimg' }, { quoted: msg });
    }
    const buffer = await dl(sock, quoted);
    const png = await sharp(buffer).png().toBuffer();
    await sock.sendMessage(from, { image: png, caption: 'Berhasil diubah ke foto.' }, { quoted: msg });
  }
};
