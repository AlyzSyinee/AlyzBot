const { jidNum, sleep, isOwner, OWNER_NUMBER, requireGroupStaff } = require('../utils');

module.exports = {
  name: 'alyzkudet',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx, { needBotAdmin: true }))) return;

    if ((args[0] || '').toLowerCase() !== 'ya') {
      return sock.sendMessage(from, {
        text: 'Perintah ini mengeluarkan SEMUA member non-admin dari grup.\nKetik *.alyzkudet ya* untuk konfirmasi.'
      }, { quoted: msg });
    }

    const meta = await sock.groupMetadata(from);
    const botNum = jidNum(sock.user.id);
    const targets = meta.participants.filter((p) => {
      const n = jidNum(p.id);
      return !p.admin && n !== botNum && n !== ctx.senderNum && n !== OWNER_NUMBER;
    });

    await sock.sendMessage(from, { text: 'Mengeluarkan ' + targets.length + ' member...' }, { quoted: msg });
    let done = 0;
    for (const p of targets) {
      try {
        await sock.groupParticipantsUpdate(from, [p.id], 'remove');
        done++;
      } catch (e) {
        console.log('[alyzkudet]', e.message);
      }
      await sleep(1000);
    }
    await sock.sendMessage(from, { text: 'Selesai. Berhasil dikeluarkan: ' + done + '/' + targets.length }, { quoted: msg });
  }
};
