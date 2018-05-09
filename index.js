'use strict';

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection at: Promise ', p, ' reason: ', reason);
});

require('dotenv').config();

const moment = require('moment-timezone');
moment.tz.setDefault('Europe/London');

const Lapras = require('./lib/lapras');

const discordToken = process.env.DISCORD_TOKEN;

const lapras = new Lapras(discordToken);
lapras
  .login()
  .catch(console.error);
