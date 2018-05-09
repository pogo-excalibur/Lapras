'use strict';

const Discord = require('discord.js');
const moment = require('moment');

const MainServerData = require('./data_sources/main_server_data');
const ScanData = require('./data_sources/scan_data');
const TheSilphRoad = require('./data_sources/the_silph_road');

const mainServerData = new MainServerData();
const scanData = new ScanData();
const theSilphRoad = new TheSilphRoad();

class VerificationMessage {
  constructor(member, options) {
    this.member = member;
    this.options = options;
    this.availableEmojis = this.member.guild.emojis;
  }

  build() {
    this.content = '';
    this.messageOptions = {};

    const embed = new Discord.MessageEmbed();
    embed.setTitle('Verification Request');
    embed.setDescription(`**User:** ${this.member.user.username}`);
    embed.setThumbnail(this.member.user.displayAvatarURL());
    embed.setColor('#0000FF');
    embed.setTimestamp(this.member.joinedAt);
    this.messageOptions.embed = embed;

    const accountCreationDate = moment(this.member.user.createdAt);
    const accountAge = moment.duration(moment().diff(accountCreationDate));
    const accountAgeDays = accountAge.asDays();
    const accountAgeText = `${accountAge.humanize()} ` +
                           `(since ${accountCreationDate.format('DD/MM/YY')})`;
    this.addCheck('Account Age',
      accountAgeText, accountAgeDays > 7, accountAgeDays < 1);

    return Promise.resolve()
      .then(() => { return this.handleMainServerData() })
      .then(() => { return this.handleScanData() })
      .then(() => { return this.handleTheSilphRoad() })
      .then(() => {
        return this;
      });
  }

  addCheck(name, value, checkPassed, hardCheck) {
    this.messageOptions.embed.description +=
      `\n**${name}:** ${value} ${this.checkEmoji(checkPassed, hardCheck)}`;
  }

  checkEmoji(checkPassed, hardCheck = true) {
    let emoji;
    if (checkPassed) {
      emoji = this.availableEmojis.get(this.options.verifyEmoji);
    } else if (hardCheck) {
      emoji = this.availableEmojis.get(this.options.rejectEmoji);
    } else {
      emoji = this.availableEmojis.get(this.options.unsureEmoji);
    }
    return `<:${emoji.name}:${emoji.id}>`;
  }

  handleMainServerData() {
    const data = mainServerData.get(this.member.user);
    this.addCheck('On Main Server', (data ? 'Yes' : 'No'), data);

    if (!data) return;

    if (data.team) {
      const team = data.team.charAt(0).toUpperCase() + data.team.slice(1);
      this.addCheck('Main Server Team', team, data.team == 'mystic');
    }
    
    if (data.joinedAt) {
      const duration = moment.duration(moment().diff(data.joinedAt));
      const durationDays = duration.asDays();
      const durationText = `${duration.humanize()} ` +
                           `(since ${data.joinedAt.format('DD/MM/YY')})`;
      this.addCheck('On Main Server For',
        durationText, durationDays > 30, durationDays < 7);
    }
  }

  handleScanData() {
    const data = scanData.get(this.member.user);
    this.addCheck('Seen By Scanner', (data ? 'Yes' : 'No'), data, false);

    if (!data) return;

    if (data.team) {
      const team = data.team.charAt(0).toUpperCase() + data.team.slice(1);
      this.addCheck('Team From Scanner', team, data.team == 'mystic');
    }
  }

  handleTheSilphRoad() {
    return theSilphRoad.get(this.member.user)
      .then(data => {
        this.addCheck('TSR Profile', (data ? 'Yes' : 'No'), data, false);

        if (!data) return;

        if (data.team) {
          const team = data.team.charAt(0).toUpperCase() + data.team.slice(1);
          this.addCheck('TSR Team', team, data.team == 'mystic');
        }
      })
      .catch(console.error);
  }
}

VerificationMessage.parse = message => {
  const description = message.embeds[0].description + '\n';
  const username = description.match(/\*\*User:\*\* ([^\n]+)/)[1];
  const member = message.channel.guild.members.find(member => {
    return member.user.username == username;
  });
  return member;
};

module.exports = VerificationMessage;
