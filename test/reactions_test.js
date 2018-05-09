'use strict';

const Utils = require('./utils');
const { TestUser, TestReactionStore, TestReaction, TestEmoji } = require('./mocks');

exports['awesome'] = {
  setUp: done => {
    Utils.setUpLapras(this);
    done();
  },
  'create reaction': test => {
    const user = new TestUser();
    const emoji = new TestEmoji(null, ':test:');
    const reaction = new TestReaction(user, emoji);

    test.equal(reaction.emoji, emoji);
    test.equal(reaction.users.get(user.id), user);
    test.equal(reaction.count, 1);
    test.done();
  },
  'store distinct reactions from one user': test => {
    const user = new TestUser();
    const firstEmoji = new TestEmoji(null, ':test_1:');
    const secondEmoji = new TestEmoji(null, ':test_2:');
    const firstReaction = new TestReaction(user, firstEmoji);
    const secondReaction = new TestReaction(user, secondEmoji);

    const reactionStore = new TestReactionStore();
    reactionStore.set(firstReaction.id, firstReaction);
    reactionStore.set(secondReaction.id, secondReaction);

    test.equal(reactionStore.array().length, 2);
    test.done();
  },
  'store distinct reactions from two users': test => {
    const firstUser = new TestUser();
    const secondUser = new TestUser();
    const firstEmoji = new TestEmoji(null, ':test_1:');
    const secondEmoji = new TestEmoji(null, ':test_2:');
    const firstReaction = new TestReaction(firstUser, firstEmoji);
    const secondReaction = new TestReaction(secondUser, secondEmoji);

    const reactionStore = new TestReactionStore();
    reactionStore.set(firstReaction.id, firstReaction);
    reactionStore.set(secondReaction.id, secondReaction);

    test.equal(reactionStore.array().length, 2);
    test.done();
  },
  'combine repeat reactions': test => {
    const emojis = [
      new TestEmoji(null, ':test_1:'),
      new TestEmoji(null, ':test_2:'),
      new TestEmoji(null, ':test_3:')
    ];
    const reactionStore = new TestReactionStore();

    function addReaction(emoji) {
      const user = new TestUser();
      const reaction = new TestReaction(user, emoji);
      reactionStore.set(reaction.id, reaction);
    }

    emojis.forEach(emoji => {
      addReaction(emoji);
    });

    for (let i = 0; i < 20; ++i) {
      const randomEmoji = emojis[Math.floor((Math.random() * 2))];
      addReaction(randomEmoji);
    }

    test.equal(reactionStore.array().length, emojis.length);
    test.done();
  }
};
