const fs = require('fs');
const path = require('path');

// Satu-satunya fitur yang memakai media/QR.jpg (file lokal)
const QR_PATH = path.join(__dirname, '..', '..', 'media', 'QR.jpg');

module.exports = {
  name: 'order',
  async run(sock, from, msg) {
    if (!fs.existsSync(QR_PATH)) {
      return sock.sendMessage(from, { text: 'Error: file media/QR.jpg tidak ditemukan di server.' }, { quoted: msg });
    }
    await sock.sendMessage(from, {
      image: fs.readFileSync(QR_PATH),
      caption: 'ORDER BOT WA MURAH BY ALYZ'
    }, { quoted: msg });
  }
};
