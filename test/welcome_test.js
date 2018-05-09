'use strict';

const Utils = require('./utils');

exports['awesome'] = {
  setUp: done => {
    Utils.setUpLapras(this);
    done();
  },
  'welcome message gets sent': test => {
    const registrationChannel = this.guild.channels.find(
      'name', 'registration');
    const registeringMember = this.guild.createMember();

    this.lapras.client
      .trigger('guildMemberAdd', registeringMember)
      .then(() => {
        test.equal(registrationChannel.messages.array().length, 1);
        test.done();
      });
  }
};
