const { OWNER_NUMBER } = require('../utils');

module.exports = {
  name: 'owner',
  async run(sock, from, msg) {
    await sock.sendMessage(from, { text: 'OWNER : ' + OWNER_NUMBER + ' - DEVELOPER BOT ALYZ' }, { quoted: msg });
  }
};
