const fs = require("fs");
const stdin = process.openStdin();
const GoogleSpreadsheet = require("google-spreadsheet");
const args = require("./arguments");
const readline = require("readline");
const moment = require("moment");

const googleSheetId = args.google_spreadsheet_id;
const clientSecretFile = args.client_secret_file;
const expectedDowntime = args.expected_downtime;
const alertEmail = args.alert_email;

const mailgunApiKey = args.mailgun_api_key;
const mailgunDomain = args.mailgun_domain;
const mailgunSender = args.mailgun_sender;
const mailgun = require("mailgun-js")({
  apiKey: mailgunApiKey,
  domain: mailgunDomain
});

let lastRun = null;

if (googleSheetId && clientSecretFile) {
  const gDoc = new GoogleSpreadsheet(googleSheetId);
  const creds = JSON.parse(fs.readFileSync(clientSecretFile, "utf8"));

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", line => {
    const parts = line.trim().split(" ");
    const beginTime = parseFloat(parts[1]);
    const endTime = parseFloat(parts[2]);
    console.log("Pump ran for :" + (endTime - beginTime) + " seconds");

    gDoc.useServiceAccountAuth(creds, () => {
      gDoc.addRow(
        1,
        {
          date: new Date().toUTCString(),
          duration: endTime - beginTime
        },
        () => null
      );
    });

    if (
      lastRun != null &&
      !isExpectedDowntimeCompleted(lastRun, expectedDowntime)
    ) {
      sendAlert(lastRun, endTime - beginTime);
    }
    lastRun = new Date();
  });
}

const sendAlert = (lastRun, duration) => {
  const message =
    "Pump last run was at " +
    lastRun.toUTCString() +
    ". It just ran for " +
    duration +
    " seconds again at " +
    new Date().toUTCString() +
    ". The expected cooldown between runs is " +
    expectedDowntime +
    " seconds";
  var data = {
    from: mailgunSender,
    to: alertEmail,
    subject: "Pump alert",
    text: message
  };

  mailgun.messages().send(data, (error, body) => {
    if (error) {
      console.log("Could not send alert", error);
    } else {
      console.log("Alert sent to " + alertEmail + ". " + message);
    }
  });
};

const isExpectedDowntimeCompleted = (lastRun, expectedDowntime) => {
  const nextRunMinTime = moment(lastRun).add(expectedDowntime, "seconds");
  return moment().isAfter(nextRunMinTime);
};
