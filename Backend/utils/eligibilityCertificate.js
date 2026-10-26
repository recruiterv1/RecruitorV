const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// The real wordmark, bundled with the function so the certificate never depends
// on a network fetch at issue time.
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'recruiterv-logo.png');

// The certificate issued to anyone who reaches Certified (80–100) on the
// eligibility assessment. Generated server-side so it can be emailed the moment
// the result lands, and re-downloaded from the dashboard later.

const INK = '#0F1D3C';
const ORANGE = '#F47B20';
const GOLD = '#C9A227';
const MUTED = '#64748B';
const LINE = '#E2E8F0';

const ROLE_TITLE = {
  Recruiter: 'Certified Recruiter',
  Coach: 'Certified Recruitment Coach',
  Expert: 'Certified Industry Expert',
};

// RV-2026-A1B2C3 — short enough to read out, unique enough to look up.
const makeCertificateId = (issuedAt = new Date()) => {
  const rnd = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `RV-${issuedAt.getFullYear()}-${rnd}`;
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric',
});


// The certified seal — drawn as vectors so it stays sharp at any zoom and
// there is no image asset to ship alongside the code.
const drawSeal = (doc, cx, cy, r) => {
  // Ribbon tails behind the disc
  doc.save();
  doc.fillColor(ORANGE).opacity(0.9);
  doc.moveTo(cx - r * 0.52, cy + r * 0.5).lineTo(cx - r * 0.18, cy + r * 0.5)
     .lineTo(cx - r * 0.26, cy + r * 1.5).lineTo(cx - r * 0.62, cy + r * 1.16).closePath().fill();
  doc.moveTo(cx + r * 0.52, cy + r * 0.5).lineTo(cx + r * 0.18, cy + r * 0.5)
     .lineTo(cx + r * 0.26, cy + r * 1.5).lineTo(cx + r * 0.62, cy + r * 1.16).closePath().fill();
  doc.restore();

  // Scalloped edge — a ring of small circles reading as a rosette
  const points = 24;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    doc.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.13).fill(GOLD);
  }

  doc.circle(cx, cy, r).fill(GOLD);
  doc.circle(cx, cy, r * 0.88).fill('#FFFFFF');
  doc.circle(cx, cy, r * 0.80).fill(INK);
  doc.circle(cx, cy, r * 0.72).lineWidth(0.8).strokeColor(GOLD).stroke();

  // Tick, sitting in the upper half so the wording below has room
  doc.save();
  doc.lineWidth(r * 0.12).strokeColor(GOLD).lineCap('round').lineJoin('round');
  doc.moveTo(cx - r * 0.26, cy - r * 0.16)
     .lineTo(cx - r * 0.06, cy + r * 0.06)
     .lineTo(cx + r * 0.28, cy - r * 0.40).stroke();
  doc.restore();

  // Kept well inside the disc: the wording is sized against the radius and the
  // baselines sit above the inner edge at r * 0.72.
  doc.font('Helvetica-Bold').fontSize(r * 0.155).fillColor('#FFFFFF')
     .text('CERTIFIED', cx - r * 0.72, cy + r * 0.15, { width: r * 1.44, align: 'center', characterSpacing: 0.6 });
  doc.font('Helvetica').fontSize(r * 0.10).fillColor(GOLD)
     .text('RECRUITERV', cx - r * 0.72, cy + r * 0.36, { width: r * 1.44, align: 'center', characterSpacing: 1 });
};


// A handwritten "RK Rawat" drawn as bezier strokes. Vector rather than a
// scanned image so it stays crisp and there is no asset to ship — swap this for
// a real scan later if one is preferred.
const drawSignature = (doc, x, y, scale = 1) => {
  const S = (n) => n * scale;
  doc.save();
  doc.strokeColor(INK).lineWidth(S(1.7)).lineCap('round').lineJoin('round');

  // R
  doc.moveTo(x, y).bezierCurveTo(x + S(1), y - S(20), x + S(3), y - S(26), x + S(5), y - S(26));
  doc.bezierCurveTo(x + S(15), y - S(26), x + S(16), y - S(13), x + S(5), y - S(12));
  doc.bezierCurveTo(x + S(12), y - S(11), x + S(15), y - S(4), x + S(21), y + S(1));
  doc.stroke();

  // K
  doc.moveTo(x + S(26), y - S(25)).lineTo(x + S(25), y + S(1)).stroke();
  doc.moveTo(x + S(38), y - S(21)).bezierCurveTo(x + S(31), y - S(15), x + S(27), y - S(12), x + S(25), y - S(11));
  doc.bezierCurveTo(x + S(30), y - S(9), x + S(35), y - S(3), x + S(40), y + S(2));
  doc.stroke();

  // Flourish into the surname
  doc.moveTo(x + S(40), y + S(2)).bezierCurveTo(x + S(46), y + S(4), x + S(50), y - S(2), x + S(54), y - S(8)).stroke();

  // R
  doc.moveTo(x + S(56), y + S(1)).bezierCurveTo(x + S(57), y - S(14), x + S(58), y - S(22), x + S(60), y - S(22));
  doc.bezierCurveTo(x + S(69), y - S(22), x + S(69), y - S(11), x + S(59), y - S(10));
  doc.bezierCurveTo(x + S(65), y - S(9), x + S(68), y - S(4), x + S(72), y + S(1));
  doc.stroke();

  // a w a t, as one running stroke
  doc.moveTo(x + S(80), y - S(8)).bezierCurveTo(x + S(74), y - S(11), x + S(72), y - S(2), x + S(78), y - S(1));
  doc.bezierCurveTo(x + S(82), y - S(1), x + S(83), y - S(6), x + S(82), y - S(9));
  doc.bezierCurveTo(x + S(82), y - S(3), x + S(83), y + S(1), x + S(87), y + S(1));
  doc.stroke();

  doc.moveTo(x + S(89), y - S(9)).bezierCurveTo(x + S(90), y - S(3), x + S(92), y + S(1), x + S(94), y - S(5));
  doc.bezierCurveTo(x + S(96), y + S(1), x + S(98), y - S(3), x + S(99), y - S(9)).stroke();

  doc.moveTo(x + S(106), y - S(8)).bezierCurveTo(x + S(100), y - S(11), x + S(98), y - S(2), x + S(104), y - S(1));
  doc.bezierCurveTo(x + S(108), y - S(1), x + S(109), y - S(6), x + S(108), y - S(9));
  doc.bezierCurveTo(x + S(108), y - S(3), x + S(109), y + S(1), x + S(113), y + S(1));
  doc.stroke();

  doc.moveTo(x + S(116), y - S(16)).lineTo(x + S(115), y - S(2));
  doc.bezierCurveTo(x + S(115), y + S(1), x + S(118), y + S(1), x + S(121), y - S(2)).stroke();
  doc.moveTo(x + S(111), y - S(11)).lineTo(x + S(121), y - S(12)).stroke();

  // Underline flourish
  doc.moveTo(x + S(2), y + S(7))
     .bezierCurveTo(x + S(40), y + S(13), x + S(85), y + S(11), x + S(124), y + S(4))
     .lineWidth(S(1.1)).stroke();

  doc.restore();
};

// Returns a Buffer of the finished PDF.
const buildCertificatePDF = ({ name, role, skillCategory, percent, certificateId, issuedAt }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;    // 842
    const H = doc.page.height;   // 595

    // Ground and border
    doc.rect(0, 0, W, H).fill('#FFFFFF');
    doc.rect(0, 0, W, 10).fill(ORANGE);
    doc.rect(0, H - 10, W, 10).fill(INK);
    doc.lineWidth(1.5).strokeColor(LINE).rect(28, 26, W - 56, H - 56).stroke();
    doc.lineWidth(0.5).strokeColor(GOLD).rect(34, 32, W - 68, H - 68).stroke();

    // Wordmark — the real logo, with a drawn fallback if the file is missing
    let logoDrawn = false;
    try {
      if (fs.existsSync(LOGO_PATH)) {
        const lw = 150;                       // 654x236 source, keeps its ratio
        doc.image(LOGO_PATH, (W - lw) / 2, 58, { width: lw });
        logoDrawn = true;
      }
    } catch (e) {
      console.error('certificate logo skipped:', e.message);
    }
    if (!logoDrawn) {
      doc.font('Helvetica-Bold').fontSize(20).fillColor(INK)
        .text('Recruiter', 0, 62, { align: 'center', continued: true })
        .fillColor(ORANGE).text('V');
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('UNLOCKING VALUE FOR EVERY RECRUITER', 0, 86, { align: 'center', characterSpacing: 2 });
    }

    // Title
    doc.font('Helvetica').fontSize(11).fillColor(GOLD)
      .text('CERTIFICATE OF ELIGIBILITY', 0, 124, { align: 'center', characterSpacing: 4 });

    doc.moveTo(W / 2 - 60, 146).lineTo(W / 2 + 60, 146).lineWidth(1).strokeColor(GOLD).stroke();

    doc.font('Helvetica').fontSize(11).fillColor(MUTED)
      .text('This is to certify that', 0, 166, { align: 'center' });

    // Recipient
    doc.font('Helvetica-Bold').fontSize(34).fillColor(INK)
      .text(name || '—', 0, 190, { align: 'center' });

    doc.moveTo(W / 2 - 170, 236).lineTo(W / 2 + 170, 236).lineWidth(0.8).strokeColor(LINE).stroke();

    // What they are certified as
    doc.font('Helvetica').fontSize(11).fillColor(MUTED)
      .text('has successfully cleared the RecruiterV eligibility assessment and is recognised as a', 0, 250, { align: 'center' });

    doc.font('Helvetica-Bold').fontSize(19).fillColor(ORANGE)
      .text(ROLE_TITLE[role] || `Certified ${role}`, 0, 274, { align: 'center' });

    if (skillCategory) {
      doc.font('Helvetica').fontSize(11).fillColor(MUTED)
        .text('in the field of', 0, 304, { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(14).fillColor(INK)
        .text(skillCategory, 0, 322, { align: 'center' });
    }

    // Score / date / id
    // The score is deliberately not printed — the certificate states the
    // standing, not the mark.
    const boxY = skillCategory ? 356 : 336;
    const boxW = 200, gap = 24;
    const totalW = boxW * 2 + gap;
    let x = (W - totalW) / 2;
    const cells = [
      ['DATE OF ISSUE', fmtDate(issuedAt)],
      ['CERTIFICATE ID', certificateId],
    ];
    cells.forEach(([label, value]) => {
      doc.roundedRect(x, boxY, boxW, 58, 6).lineWidth(0.8).strokeColor(LINE).stroke();
      doc.font('Helvetica').fontSize(7).fillColor(MUTED)
        .text(label, x, boxY + 13, { width: boxW, align: 'center', characterSpacing: 1.2 });
      doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
        .text(value, x, boxY + 30, { width: boxW, align: 'center' });
      x += boxW + gap;
    });

    // Seal, lower-left inside the border, balancing the signature block
    drawSeal(doc, 150, H - 182, 52);

    // Signature block
    const sigY = boxY + 100;
    drawSignature(doc, W / 2 - 62, sigY - 8, 1);
    doc.moveTo(W / 2 - 90, sigY + 6).lineTo(W / 2 + 90, sigY + 6).lineWidth(0.8).strokeColor(INK).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
      .text('R. K. Rawat', 0, sigY + 14, { align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('Founder, RecruiterV', 0, sigY + 27, { align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
      .text('A product of Changeleaders Consulting Private Limited', 0, sigY + 39, { align: 'center' });

    doc.font('Helvetica').fontSize(7).fillColor(MUTED)
      .text(`Verify this certificate at recruiterv.com  ·  ID ${certificateId}`, 0, H - 44, { align: 'center' });

    doc.end();
  });

// Build the certificate, email it, and hand back what was issued.
const issueCertificate = async ({ attemptId, name, email, role, skillCategory, percent, issuedAt }) => {
  const certificateId = makeCertificateId(issuedAt);
  const pdf = await buildCertificatePDF({ name, role, skillCategory, percent, certificateId, issuedAt });

  // Keep the PDF so the dashboard can serve it again without regenerating.
  let url = '';
  try {
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const bucket = require('./localBucket').bucket();
    const token = uuidv4();
    const path = `eligibility-certificates/${certificateId}.pdf`;
    await bucket.file(path).save(pdf, {
      contentType: 'application/pdf', resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    url = `${bucket.base}/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  } catch (e) {
    console.error('certificate upload failed:', e.message);
  }

  let emailed = false;
  try {
    const { sendEmailFull, renderEmail } = require('./email');
    // Editable in the designer now; the wording below is what sends until
    // someone writes a template, so listing it there changes nothing.
    const _fbSubject = `You're Certified — your RecruiterV certificate (${certificateId})`;
    const _fbHtml = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#334155;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#0F1D3C;margin:0 0 4px">Congratulations, ${name || 'there'}.</h2>
          <p style="margin:0 0 18px;color:#64748B">You scored <strong style="color:#0F1D3C">${percent}%</strong> and are now a
            <strong style="color:#F47B20">${ROLE_TITLE[role] || role}</strong>${skillCategory ? ` in ${skillCategory}` : ''}.</p>
          <div style="background:#F7F9FA;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin:0 0 18px">
            <p style="margin:0 0 8px"><strong>What this means</strong></p>
            <p style="margin:0;color:#64748B">Full access to the platform. Requisitions are assigned immediately and the
              standard revenue share applies from day one.</p>
          </div>
          <p style="margin:0 0 6px">Your certificate is attached, and you can download it any time from your dashboard.</p>
          <p style="margin:0 0 18px;color:#94A3B8;font-size:13px">Certificate ID: ${certificateId}</p>
          <a href="https://www.recruiterv.com/reg?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}"
             style="display:inline-block;background:#F47B20;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">
            Complete your registration
          </a>
          <p style="margin:24px 0 0;color:#94A3B8;font-size:12px">RecruiterV — a product of Changeleaders Consulting Private Limited</p>
        </div>`;

    const _r = await renderEmail('certificateIssued', {
      userName: name || 'there',
      certificateId,
      tier: ROLE_TITLE[role] || role,
      percent: String(percent),
      certificateUrl: url || 'https://www.recruiterv.com',
    }, { subject: _fbSubject, htmlContent: _fbHtml });

    await sendEmailFull({
      to: email,
      subject: _r.subject,
      htmlContent: _r.htmlContent,
      // The PDF goes out either way — a reworded template must not cost the
      // recipient the certificate itself.
      attachment: [{ name: `RecruiterV_Certificate_${certificateId}.pdf`, content: pdf.toString('base64') }],
    });
    emailed = true;
  } catch (e) {
    console.error('certificate email failed:', e.message);
  }

  return { certificateId, url, emailed, attemptId };
};

module.exports = { issueCertificate, buildCertificatePDF, makeCertificateId };
