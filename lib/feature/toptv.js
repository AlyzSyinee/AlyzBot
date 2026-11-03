const { getQuoted, getMedia, dl } = require('../utils');

module.exports = {
  name: 'toptv',
  async run(sock, from, msg) {
    const quoted = getQuoted(msg);
    const src = quoted && getMedia(quoted.message)?.type === 'videoMessage' ? quoted
      : getMedia(msg.message)?.type === 'videoMessage' ? msg : null;
    if (!src) return sock.sendMessage(from, { text: 'Reply video dengan .toptv (atau kirim video dengan caption .toptv)' }, { quoted: msg });

    const buffer = await dl(sock, src);
    await sock.sendMessage(from, { video: buffer, ptv: true }, { quoted: msg });
  }
};
