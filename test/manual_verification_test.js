'use strict';

const Utils = require('./utils');

exports['awesome'] = {
  setUp: done => {
    Utils.setUpLapras(this);
    done();
  },
  'maunal verification fails': test => {
    const registeringMember = this.guild.createMember('TestUser');
    const updatedMember = this.guild.createMember('TestUser');
    const verifiedRole = this.guild.roles.find('name', 'verified');

    this.lapras.client.trigger('guildMemberAdd', registeringMember)
      .then(() => {
        updatedMember.roles.add(verifiedRole.id);

        return this.lapras.client.trigger(
          'guildMemberUpdate', registeringMember, updatedMember);
      })
      .then(() => {
        test.equal(updatedMember.roles.get(verifiedRole.id), undefined);
        test.done();
      });
  }
};
