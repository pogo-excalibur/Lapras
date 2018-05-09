'use strict';

const Discord = require('discord.js');

class TestClient {
  constructor() {
    this.user = new TestMember();
    this.guilds = new Discord.Collection();
    this.channels = new Discord.Collection();
    this.dmChannels = new Discord.Collection();
    this.users = new Discord.Collection();
    this.eventHandlers = {};
  }

  createDMChannel(user) {
    const channel = new TestDMChannel(this, user);
    user.dmChannel = channel;
    this.dmChannels.set(channel.id, channel);
    return channel;
  }

  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    this.eventHandlers[event].push((...args) => {
      return Promise.resolve(callback(...args));
    });
  }

  trigger(event, ...args) {
    if (!this.eventHandlers[event]) return;
    const callbacksComplete = this.eventHandlers[event].map(callback => {
      return callback(...args);
    });
    return Promise.all(callbacksComplete);
  }
}

class TestGuild {
  constructor(client, name) {
    this.id = (new Snowflake).id;
    this.client = client;
    this.name = name;
    this.channels = new Discord.Collection();
    this.members = new Discord.Collection();
    this.roles = new Discord.Collection();
    this.emojis = new Discord.Collection();
    this.auditLog = new TestAuditLog(this);
    this.client.guilds.set(this.id, this);
  }

  createChannel(name) {
    const channel = new TestChannel(this, name);
    this.channels.set(channel.id, channel);
    this.client.channels.set(channel.id, channel);
    return channel;
  }

  createMember(name) {
    const member = new TestMember(this, name);
    this.members.set(member.id, member);
    this.client.users.set(member.user.id, member.user);
    return member;
  }

  createRole(name) {
    const role = new TestRole(this, name);
    this.roles.set(role.id, role);
    return role;
  }

  createEmoji(name) {
    const emoji = new TestEmoji(this, name);
    this.emojis.set(emoji.id, emoji);
    return emoji;
  }

  fetchAuditLogs() {
    return Promise.resolve(this.auditLog);
  }
}

class TestChannel {
  constructor(guild, name) {
    this.id = (new Snowflake).id;
    this.guild = guild;
    this.name = name;
    this.messages = new Discord.Collection();
  }

  send(message, options) {
    return new Promise(resolve => {
      const wrappedMessage = new TestMessage(
        this.guild.client.user, this, message, options);
      this.messages.set(wrappedMessage.id, wrappedMessage);
      resolve(wrappedMessage);
    });
  }
}

class TestDMChannel {
  constructor(client, user) {
    this.id = (new Snowflake).id;
    this.client = client;
    this.user = user;
    this.messages = new Discord.Collection();
  }

  send(message, options) {
    return new Promise(resolve => {
      const wrappedMessage = new TestMessage(
        this.client.user, this, message, options);
      this.messages.set(wrappedMessage.id, wrappedMessage);
      resolve(wrappedMessage);
    });
  }
}

class TestMessage {
  constructor(author, channel, message, options) {
    this.id = (new Snowflake).id;
    this.author = author;
    this.channel = channel;

    if (typeof(message) === 'string' || message instanceof String) {
      this.content = message;
    } else {
      this.content = message.content;
    }

    this.embeds = [];
    if (options && options.embed) {
      this.embeds.push(options.embed);
    }

    const hasContent = this.content && (this.content != '');
    const hasEmbeds = this.embeds && (this.embeds.length > 0);

    if ((!hasContent) && (!hasEmbeds)) {
      throw new Error('Cannot send an empty message');
    }

    this.reactions = new TestReactionStore();
  }

  react(emoji) {
    const reaction = new TestReaction(this.author, emoji, this);
    this.reactions.set(reaction.id, reaction);
  }

  delete() {
    this.channel.messages.delete(this.id);
  }
}

class TestMember {
  constructor(guild, name) {
    this.guild = guild;
    this.user = new TestUser(name);
    this.roles = new TestMemberRoleStore(this);
  }

  get id() {
    return this.user.id;
  }

  send(...args) {
    return this.user.send(...args);
  }

  kick() {
    this.guild.members.delete(this.id);
    this.guild.client.users.delete(this.id);
    this.guild = undefined;
    this.roles = undefined;
  }
}

class TestUser {
  constructor(name) {
    this.id = (new Snowflake).id;
    this.username = name;
    this.dmChannel = new TestDMChannel(undefined, this);
    this.createdAt = new Date();
  }

  send(...args) {
    return this.dmChannel.send(...args);
  }

  displayAvatarURL() {
    return `https://127.0.0.1/discord/avatars/${this.id}`;
  }
}

class TestReaction {
  constructor(user, emoji, message) {
    this.id = (new Snowflake).id;
    this.emoji = emoji;
    this.message = message;
    this.count = 1;
    this.users = new Discord.Collection();
    this.users.set(user.id, user);
  }

  combine(reaction) {
    this.users = this.users.concat(reaction.users);
    this.count += reaction.count;
  }
}

class TestReactionStore extends Discord.Collection {
  constructor(iterable) {
    super(iterable);
  }

  set(key, value) {
    const emojiAlreadyAdded = this.find(reaction => {
      return reaction.emoji.id == value.emoji.id;
    });
    if (emojiAlreadyAdded) {
      emojiAlreadyAdded.combine(value);
      return;
    }
    super.set(key, value);
  }
}

class TestRole {
  constructor(guild, name) {
    this.id = (new Snowflake()).id;
    this.guild = guild;
    this.name = name;
  }
}

class TestMemberRoleStore extends Discord.Collection {
  constructor(member) {
    super();
    this.member = member;
  }

  add(roleId) {
    const role = this.member.guild.roles.get(roleId);
    super.set(role.id, role);
  }

  remove(roleId) {
    this.delete(roleId);
  }

  set(roles) {
    this.array().forEach(role => {
      this.delete(role.id);
    });

    if (!roles) return;
    roles.forEach(role => {
      this.add(role.id);
    });
  }
}

class TestEmoji {
  constructor(guild, name) {
    this.id = (new Snowflake()).id;
    this.guild = guild;
    this.name = name;
  }
}

class TestAuditLog {
  constructor(guild) {
    this.id = (new Snowflake()).id;
    this.guild = guild;
    this.entries = new Discord.Collection();
  }
}

class TestAuditLogEntry {
  constructor(guild) {
    this.id = (new Snowflake()).id;
    this.guild = guild;
  }
}

class Snowflake {
  constructor() {
    this.id = Snowflake.nextId.toString();
    Snowflake.nextId++;
  }
}

Snowflake.nextId = 0;

module.exports = {
  TestClient: TestClient,
  TestGuild: TestGuild,
  TestChannel: TestChannel,
  TestDMChannel: TestDMChannel,
  TestMember: TestMember,
  TestUser: TestUser,
  TestReaction: TestReaction,
  TestReactionStore: TestReactionStore,
  TestRole: TestRole,
  TestMemberRoleStore: TestMemberRoleStore,
  TestEmoji: TestEmoji,
  TestAuditLog: TestAuditLog,
  TestAuditLogEntry: TestAuditLogEntry,
  Snowflake: Snowflake
};
