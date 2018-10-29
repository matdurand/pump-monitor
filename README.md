# Pump Monitor

The goal of this project is to create submersible pump monitor using a raspberry pi. The monitor will gather stats on runs and will send email alert if the pump runs too frequently, indicating a possible issue.

This is a small node program to gather data from the output of `Auditok`, a python program to tokenize audio. The goal is to run `Auditok` and `pump-monitor` on a raspberry pi and pipe `Auditok` into `pump-monitor`. `Auditok` is used to detect pump runs and `pump-monitor` is used to record the runs, and send alert by email if the runs are to close to each other.

## Installation

First you will need to register for a free mailgun sandbox account. [https://signup.mailgun.com/new/signup]

The you will also need to create an application in the google developer console, and create a service account with access to your google drive. [https://console.developers.google.com]

- Install raspbian on your pi
- Follow the installation instruction of `auditok` [https://github.com/amsehili/auditok#installation]
- Install `nodejs` on your raspberry pi.
- Clone this repository
- Go into the cloned folder, and run `npm install`
- You will need to following arguments to run auditok:
  - `-e` the energy level needed to record a pump run. Something in the line of `44` or `45` should work
  - `-n` the minimum number of second a pump run last. The goal is to have a large enough value to avoid false positive, when someone or something is making noise near the microphone
  - `-m` the maximum number of second a pump run last. The goal is to have a value that cover normal use cases. If a run last more that the value of `-m`, it will count as 2 runs and the second one will trigger an alert
  - `-s` the number of second of silence needed to stop a detection. Something in the line of `-s 0.1` should be fine
  - `-I` the usb device index for the microphone, depending on your setup. You can try 0, 1, 2 ... until it works
  - `-r` use `44100`
  - `-c` channel, use `1`
  - `-F` sound buffer size, `4096` should be enough, but you can make it bigger if you have an error about overflow
- You will need to following arguments to run pump-monitor:
  - `-gsid` the id of the googlesheet used to record the pump runs. your sheet should have one tab, with 2 columns, `date` and `duration`
  - `-secret` the path to the secret file generated by a service account in google developer console. create a service account with drive access, then export the json of the account. the open the json, add share your google sheet with the email written in the `client_email` field
  - `-edt` the correct minimum number of second expected between pump runs. if the pump runs another time before the minimum number of second has elapsed, an alarm will be triggered.
  - `-ae` the email to use for alerts. if you are using a sanbox account in mailgun, you need to add the email address to the authorized recipients list
  - `-mgk` the api key of your sandbox domain in mailgun
  - `-md` the sandbox email domain name
  - `-ms` the email sender of the alert. you can use the postmaster account defined by default in your mailgun sandbox account

Don't forget to copy your `client-secret.json` file to the raspberry and reference the right path in your command below.
Once you have all this, you just need to run the commands and pipe them into each other:

```
auditok -e 44 -n 15 -m 40 -s 0.1 -A 2 -r 44100 -c 1 -F 4096 | node index.js -gsid xxx -secret client-secret.json -edt 60 -ae xxx@xxx.com -mgk xxx -md xxx -ms xxx
```

To make this easier to run in raspbian, I recommend you use a systemd service. To do so, create a new file (using sudo because you need to be root): `/etc/systemd/system/pumpmonitor.service`. The file content should be as follow:

```
[Unit]
Description=PumpMonitor
After=network.target

[Service]
ExecStart=/home/pi/auditok.sh
WorkingDirectory=/home/pi
StandardOutput=inherit
StandardError=inherit
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

Then create the `auditok.sh` file in `/home/pi` with the command above. You may have an issue where auditok outputs warning stuff in the console. This is bad before `pump-monitor` will try to parse the errors. To avoid this, you can redirect auditok error to dev/null by adding `2>/dev/null` at the end of auditok command, but before the pipe.

You also need to add `export PYTHONUNBUFFERED=1` to your .sh file, because by default python will buffer the console output, which we don't want.

You auditok.sh file should look like this:

```bash
#!/bin/sh
export PYTHONUNBUFFERED=1
/usr/local/bin/auditok -e 44 -n 15 -m 40 -s 0.1 -A 2 -r 44100 -c 1 -F 4096 2>/dev/null | node /home/pi/pump-monitor/index.js -gsid xxx -secret client-secret.json -edt 10 -ae xxx@xxx.com -mgk xxx -md xxx -ms xxx
```
