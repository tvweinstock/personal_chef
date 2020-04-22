const { google } = require('googleapis');
const sheets = google.sheets('v4');
const twilio = require('twilio');

const runningAsScript = !module.parent;

if (runningAsScript) {
  notify();
}

async function notify() {
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const googleServiceAccountPrivateKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, 'base64').toString();

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: googleServiceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const spreadsheetResult = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Today!B2:C2',
    fields: 'values',
  });

  const [lunch, dinner] = spreadsheetResult.data.values[0];

  const messageResult = await twilioClient.messages.create({
    body: `On the menu today, we have ${lunch} for lunch and ${dinner} for dinner tonight!!`,
    from: process.env.TWILIO_PHONE_NUMBER_SOURCE,
    to: process.env.TWILIO_PHONE_NUMBER_DESTINATION,
  });
}
module.exports = async function (req, res) {
  try {
    await notify();
    res.status(200).send('ok');
  } catch (err) {
    console.log(err);
    res.status(500).send('ko', err.message);
  }
};
