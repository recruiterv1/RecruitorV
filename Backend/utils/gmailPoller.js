const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

async function fetchGmailReplies() {
  const user = process.env.GMAIL_REPLY_USER || 'recruiterv.replies@gmail.com';
  const pass = process.env.GMAIL_REPLY_PASS;

  if (!pass) throw new Error('GMAIL_REPLY_PASS not configured');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  const results = [];

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      console.log(`gmailPoller: ${uids.length} unseen message(s)`);

      if (uids.length > 0) {
        const processedUids = [];

        // Collect all messages first, mark seen after — flagging inside fetch loop deadlocks IMAP
        for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
          try {
            const parsed = await simpleParser(msg.source);
            const toList = [...(parsed.to?.value || []), ...(parsed.cc?.value || [])];

            for (const addr of toList) {
              const m = (addr.address || '').match(/^recruiterv\.replies\+([^@+]+)@gmail\.com$/i);
              if (m) {
                console.log(`gmailPoller: reply from ${parsed.from?.text} → recruiterId ${m[1]}`);
                results.push({
                  recruiterId: m[1],
                  from: parsed.from?.value?.[0]?.address || '',
                  fromName: parsed.from?.value?.[0]?.name || '',
                  subject: parsed.subject || '(no subject)',
                  body: parsed.html || (parsed.text
                    ? `<pre style="font-family:inherit;white-space:pre-wrap">${parsed.text}</pre>`
                    : '(empty)'),
                  messageId: parsed.messageId || `gmail-uid-${msg.uid}`,
                });
                break;
              }
            }
          } catch (e) {
            console.error('gmailPoller: parse error uid', msg.uid, e.message);
          }
          processedUids.push(msg.uid);
        }

        // Mark all processed messages as seen after fetch loop completes
        if (processedUids.length > 0) {
          await client.messageFlagsAdd(processedUids, ['\\Seen'], { uid: true });
          console.log(`gmailPoller: marked ${processedUids.length} message(s) as seen`);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return results;
}

module.exports = { fetchGmailReplies };
