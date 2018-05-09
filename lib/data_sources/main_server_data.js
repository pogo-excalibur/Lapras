'use strict';

const fs = require('fs');
const moment = require('moment');

const defaultDataPath = './data/main_server_data.json';

class MainServerData {
  constructor(dataPath = defaultDataPath) {
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    this.data = JSON.parse(jsonData);
    console.log(dataPath);

    Object.keys(this.data).forEach(userId => {
      const userData = this.data[userId];
      userData.joinedAt = moment(userData.joinedAt);
      if (userData.team == '') {
        delete userData.team;
      }
    });
  }

  get(user) {
    return this.data[user.id];
  }
}

module.exports = MainServerData;
