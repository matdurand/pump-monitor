const ArgumentParser = require("argparse").ArgumentParser;
const parser = new ArgumentParser({
  version: "1.0.0",
  addHelp: true,
  description: "Pump monitor reporter"
});
parser.addArgument(["-gsid", "--google-spreadsheet-id"], {
  help: "The ID of the spreadsheet to store the stats",
  required: true
});
parser.addArgument(["-secret", "--client-secret-file"], {
  help: "The file containing the google service account",
  required: true
});
parser.addArgument(["-edt", "--expected-downtime"], {
  help:
    "The minimum number of second expected between pump runs. " +
    "If it ran a second time before the delay is expired, an alert is sent.",
  required: true
});
parser.addArgument(["-ae", "--alert-email"], {
  help: "The email address where to send alerts",
  required: true
});
parser.addArgument(["-mgk", "--mailgun-api-key"], {
  help: "The api key used to communicate with mailgun",
  required: true
});
parser.addArgument(["-md", "--mailgun-domain"], {
  help: "The domain used to send email from using mailgun",
  required: true
});
parser.addArgument(["-ms", "--mailgun-sender"], {
  help: "The email used as FROM when sending the alert using mailgun",
  required: true
});

const args = parser.parseArgs();

module.exports = args;
