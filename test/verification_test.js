'use strict';

const Utils = require('./utils');
const { TestReaction } = require('./mocks');

exports['awesome'] = {
  setUp: done => {
    Utils.setUpLapras(this);
    done();
  },
  'verification message gets sent': test => {
    const registeringMember = this.guild.createMember('TestUser');

    this.lapras.client
      .trigger('guildMemberAdd', registeringMember)
      .then(() => {
        const verificationChannel = this.guild.channels.find(
          'name', 'verification');
        const verificationMessage = verificationChannel.messages.array()[0];
        test.ok(verificationMessage);
        test.equal(verificationMessage.reactions.array().length, 2);
        test.done();
      });
  },
  'verify button works': test => {
    const registeringMember = this.guild.createMember('TestUser');

    this.lapras.client
      .trigger('guildMemberAdd', registeringMember)
      .then(() => {
        const verificationChannel = this.guild.channels.find(
          'name', 'verification');
        const verificationMessage = verificationChannel.messages.array()[0];
        const verifyingMember = this.guild.createMember();
        const verifyEmoji = this.guild.emojis.get(
          this.lapras.options.verifyEmoji);
        const reaction = new TestReaction(
          verifyingMember, verifyEmoji, verificationMessage);
        this.lapras.client.trigger(
          'messageReactionAdd', reaction, verifyingMember);
      })
      .then(() => {
        const verifiedRole = this.guild.roles.find('name', 'verified');
        test.ok(registeringMember.roles.get(verifiedRole.id));

        const verifiedChannel = this.guild.channels.find(
          'name', 'verified');
        test.equal(verifiedChannel.messages.array().length, 1);

        test.done();
      });
  },
  'reject button works': test => {
    const registeringMember = this.guild.createMember('TestUser');
    this.lapras.client.createDMChannel(registeringMember.user);

    this.lapras.client
      .trigger('guildMemberAdd', registeringMember)
      .then(() => {
        const verificationChannel = this.guild.channels.find(
          'name', 'verification');
        const verificationMessage = verificationChannel.messages.array()[0];
        const verifyingMember = this.guild.createMember();
        const rejectEmoji = this.guild.emojis.get(
          this.lapras.options.rejectEmoji);
        const reaction = new TestReaction(
          verifyingMember, rejectEmoji, verificationMessage);
        this.lapras.client.trigger(
          'messageReactionAdd', reaction, verifyingMember);
      })
      .then(() => {
        const verifiedRole = this.guild.roles.find('name', 'verified');
        test.equal(registeringMember.roles.get(verifiedRole.id), undefined);

        const usersDMChannel = registeringMember.user.dmChannel;
        test.equal(usersDMChannel.messages.array().length, 1);

        const rejectedChannel = this.guild.channels.find(
          'name', 'rejected');
        test.equal(rejectedChannel.messages.array().length, 1);

        test.done();
      });
  }
};
