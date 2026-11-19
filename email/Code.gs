/* ============================================================
   Emails a photo from the gallery to a visitor.
   Paste this whole file into a Google Apps Script project owned by the exhibit Gmail
   account, then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
   Setup steps are in README.md under "Email a photo".

   Nothing is stored: each address is used once to send that photo, then forgotten.
   Gmail allows about 100 of these emails a day on a regular account.
   ============================================================ */

// Must match EMAIL_KEY in gallery.html. Stops random visitors to this address from using it.
const EMAIL_KEY = "1Lfv3rP-ozw2W8psVdLVJoOJ";

// What the email says. Change these freely.
const SENDER_NAME = "DES 225 Silhouette Installation";
const SUBJECT = "Your silhouette photo";
const MESSAGE = "Thanks for playing! Here's your photo from the silhouette installation.";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.key !== EMAIL_KEY) return reply({ ok: false, error: "Not allowed." });

    const to = String(data.email || "").trim();
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to)) return reply({ ok: false, error: "That email address doesn't look right." });

    const bytes = Utilities.base64Decode(String(data.photo || ""));
    if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) return reply({ ok: false, error: "The photo is missing or too large." });
    if (MailApp.getRemainingDailyQuota() < 1) return reply({ ok: false, error: "Today's email limit is used up. Try again tomorrow." });

    const name = String(data.filename || "silhouette-photo.jpg").replace(/[^\w.-]/g, "_");
    const photo = Utilities.newBlob(bytes, "image/jpeg", name);

    MailApp.sendEmail({
      to: to,
      subject: SUBJECT,
      name: SENDER_NAME,
      body: MESSAGE,
      htmlBody: `<p>${MESSAGE}</p><p><img src="cid:photo" alt="Your silhouette photo" style="max-width:100%"></p>`,
      inlineImages: { photo: photo },
      attachments: [photo],
    });
    return reply({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return reply({ ok: false, error: "Couldn't send: " + err });
  }
}

// Opening the web app address in a browser shows this, so you can check the deployment works
function doGet() {
  return reply({ ok: true, ready: true, emailsLeftToday: MailApp.getRemainingDailyQuota() });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
