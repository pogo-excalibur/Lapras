'use strict';

const Discord = require('discord.js');

const VerificationMessage = require('./verification_message');

class Lapras {
  constructor(discordToken, options) {
    this.discordToken = discordToken;
    this.options = {
      client: new Discord.Client(),
      registrationChannelId: process.env.REGISTRATION_CHANNEL,
      verificationChannelId: process.env.VERIFICATION_CHANNEL,
      verifiedChannelId: process.env.VERIFIED_CHANNEL,
      rejectedChannelId: process.env.REJECTED_CHANNEL,
      verifiedRole: '438051384450088961',
      verifyEmoji: '439821538678669322',
      rejectEmoji: '439821552629055509',
      unsureEmoji: '441395980743737345',
      timeUntilChannelVisible: 1000
    };

    Object.assign(this.options, options);
  }

  get client() {
    return this.options.client;
  }

  login() {
    this._setup();
    return this.client.login(this.discordToken);
  }

  _setup() {
    this.client.on('ready', () => {
      return this.fetchRecentMessages();
    });

    this.client.on('guildMemberAdd', member => {
      return this.sendRegistrationMessage(member)
        .then(() => {
          return this.sendVerificationMessage(member);
        });
    });

    this.client.on('messageReactionAdd', (reaction, user) => {
      const reactionChannelIds = [
        this.options.verificationChannelId,
        this.options.verifiedChannelId,
        this.options.rejectedChannelId
      ];

      if ((!user.bot) &&
          (reaction.message.author.id == this.client.user.id) &&
          (reactionChannelIds.includes(reaction.message.channel.id))) {
        return this.handleVerificationReaction(reaction);
      }
    });

    this.client.on('guildMemberUpdate', (oldMember, newMember) => {
      return this.blockManualVerification(oldMember, newMember);
    });
  }

  fetchRecentMessages() {
    const channelIds = [
      this.options.registrationChannelId,
      this.options.verificationChannelId,
      this.options.verifiedChannelId,
      this.options.rejectedChannelId
    ];

    const fetchMessages = channelIds.map(channelId => {
      const channel = this.client.channels.get(channelId);
      return channel.messages.fetch({ limit: 100 });
    });

    return Promise.all(fetchMessages);
  }

  sendRegistrationMessage(member) {
    const registrationChannel = this.client.channels.get(
      this.options.registrationChannelId);

    return new Promise(resolve => {
      /* Wait until the user can see the channel. */
      setTimeout(() => {
        registrationChannel.send(
          `Welcome <@${member.id}>.\n\n` +
          'Please wait while we check that you\'re team Mystic.\n' +
          'This may take anywhere from a couple of minutes to a couple of ' +
          'hours, depending on how busy the mods are.\n\n' +
          'The mods can be summoned using the `@mod` tag if you have an ' +
          'urgent query or concern.'
        ).then(resolve);
      }, this.options.timeUntilChannelVisible);
    });
  }

  sendVerificationMessage(member) {
    const verificationChannel = this.client.channels.get(
      this.options.verificationChannelId);
    const verificationMessage = new VerificationMessage(member, this.options);

    return verificationMessage.build()
      .then(message => {
        return verificationChannel.send(
          message.content, message.messageOptions);
      })
      .then(message => {
        const verifyEmoji = message.channel.guild.emojis.get(
          this.options.verifyEmoji);
        const rejectEmoji = message.channel.guild.emojis.get(
          this.options.rejectEmoji);

        return Promise.resolve()
          .then(Promise.resolve(message.react(verifyEmoji)))
          .then(Promise.resolve(message.react(rejectEmoji)));
      });
  }

  handleVerificationReaction(reaction) {
    const registeringMember = VerificationMessage.parse(reaction.message);
    if (!registeringMember) return;

    const alreadyVerified = registeringMember.roles.get(
      this.options.verifiedRole);

    if ((reaction.emoji.id == this.options.verifyEmoji) &&
        (!alreadyVerified)) {
      return this.verifyMember(registeringMember)
        .then(this.moveVerificationMessageToVerified(reaction.message));
    } else if (reaction.emoji.id == this.options.rejectEmoji) {
      return this.rejectMember(registeringMember)
        .then(this.moveVerificationMessageToRejected(reaction.message));
    }
  }

  verifyMember(member) {
    const addRole = member.roles.add(
      this.options.verifiedRole, 'User has been verified');

    return Promise.resolve(addRole);
  }

  rejectMember(member) {
    const removeRole = member.roles.remove(
      this.options.verifiedRole, 'Verification unsuccessful');

    return Promise.resolve(removeRole);
  }

  moveVerificationMessageToVerified(message) {
    return Promise.resolve(message.delete())
      .then(() => {
        const verifiedChannel = this.client.channels.get(
          this.options.verifiedChannelId);

        return verifiedChannel.send('', {
          embed: message.embeds[0]
        });
      })
      .then(message => {
        const rejectEmoji = message.channel.guild.emojis.get(
          this.options.rejectEmoji);
        return message.react(rejectEmoji);
      });
  }

  moveVerificationMessageToRejected(message) {
    return Promise.resolve(message.delete())
      .then(() => {
        const rejectedChannel = this.client.channels.get(
          this.options.rejectedChannelId);

        return rejectedChannel.send('', {
          embed: message.embeds[0]
        });
      })
      .then(message => {
        const verifyEmoji = message.channel.guild.emojis.get(
          this.options.verifyEmoji);
        return message.react(verifyEmoji);
      });
  }

  blockManualVerification(oldMember, newMember) {
    const wasVerified = oldMember.roles.get(this.options.verifiedRole);
    const isVerified = newMember.roles.get(this.options.verifiedRole);

    if ((!wasVerified) && isVerified) {
      const fetchAuditLogs = newMember.guild.fetchAuditLogs({
        type: Discord.GuildAuditLogs.Actions.MEMBER_ROLE_UPDATE
      });

      return fetchAuditLogs
        .then(log => {
          const roleChanges = log.entries.filterArray(entry => {
            return (entry.target.id == newMember.id);
          });

          const mostRecentChange = roleChanges.sort((a, b) => {
            return b.createdAt - a.createdAt;
          })[0];

          let resetRole = true;
          let updater = (mostRecentChange);

          if (mostRecentChange && mostRecentChange.executor) {
            updater = mostRecentChange.executor;
          }

          if (updater &&
              (updater.bot || (updater.id == newMember.guild.owner.id))) {
            resetRole = false;
          }

          if (resetRole) {
            newMember.roles.set(oldMember.roles, 'Automated role reset');
            //console.log(oldMember.roles);
            //console.log(newMember.roles);

            if (updater) {
              return updater.send(
                'Please leave role management to me.\n' +
                'If I\'m not around then you\'re welcome to take ' +
                'over, but otherwise please verify users using the ' +
                '#verifiction channel.');
            }
          }
        });
    }
  }
}

module.exports = Lapras;
