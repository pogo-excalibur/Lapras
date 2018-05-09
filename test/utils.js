'use strict';

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection at: Promise ', p, ' reason: ', reason);
});

const moment = require('moment-timezone');
moment.tz.setDefault('Europe/London');

const Lapras = require('../lib/lapras');

const { TestClient, TestGuild } = require('./mocks');

function setUpLapras(testCase) {
  const lapras = new Lapras('', {
    client: new TestClient(),
    timeUntilChannelVisible: 0
  });
  const guild = new TestGuild(lapras.client, 'TestGuild');

  setUpChannels(guild, lapras.options);
  setUpRoles(guild, lapras.options);
  setUpEmojis(guild, lapras.options);
  lapras._setup();

  testCase.lapras = lapras;
  testCase.guild = guild;
}

function setUpChannels(guild, options) {
  const channelNames = [
    'registration',
    'verification',
    'verified',
    'rejected'
  ];

  channelNames.forEach(channelName => {
    const channel = guild.createChannel(channelName);
    options[`${channelName}ChannelId`] = channel.id;
  });
}

function setUpRoles(guild, options) {
  const roleNames = [
    'verified'
  ];

  roleNames.forEach(roleName => {
    const role = guild.createRole(roleName);
    options[`${roleName}Role`] = role.id;
  });
}

function setUpEmojis(guild, options) {
  const emojiNames = [
    'verify',
    'reject',
    'unsure'
  ];

  emojiNames.forEach(emojiName => {
    const emoji = guild.createEmoji(emojiName);
    options[`${emojiName}Emoji`] = emoji.id;
  });
}

module.exports = {
  setUpLapras: setUpLapras
};
