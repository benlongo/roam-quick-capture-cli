#!/bin/sh
":" //# comment; exec /usr/bin/env node --unhandled-rejections=strict "$0" "$@"

require("dotenv").config();

const puppeteer = require("puppeteer");
const devices = require('puppeteer/DeviceDescriptors');
const fs = require("fs");

const { on } = require('events');


const main = async function () {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.emulate(devices['iPhone X']);

    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Page.enable');

    await page.goto("https://roamresearch.com/#/signin");

    await page.focus('[name="email"]');
    await page.keyboard.type(process.env.ROAM_EMAIL);

    await page.focus('[name="password"]');
    await page.keyboard.type(process.env.ROAM_PASSWORD);

    await page.$eval(".bp3-button", el => el.click());

    await page.waitForSelector("#block-input-quick-capture-window-qcapture")

    await page.focus('#block-input-quick-capture-window-qcapture')

    const input = fs.readFileSync(0, "utf-8");
    await page.keyboard.type(input);

    await page.$eval(".bp3-intent-primary", el => el.click());

    var sent = false
    for await (const event of on(cdp, 'Network.webSocketFrameReceived')) {
        const payload = JSON.parse(event[0].response.payloadData)
        if (payload.d.b.d['qc-string'] == input) {
            console.log("Quick capture sent.")
            sent = true;
            continue;
        }
        if (sent && payload.d.b.s == 'ok') {
            console.log("Confirmed.")
            break;
        }
    }

    await browser.close();
};

main();

