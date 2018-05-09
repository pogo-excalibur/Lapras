'use strict';

const fs = require('fs');
const moment = require('moment');

const defaultDataPath = './data/scan_data.json';

const teamIds = {
  1: 'mystic',
  2: 'valor',
  3: 'instinct',
};

class ScanData {
  constructor(dataPath = defaultDataPath) {
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    this.data = JSON.parse(jsonData);

    Object.keys(this.data).forEach(username => {
      const userData = this.data[username];
      userData.lastSeen = moment(userData.lastSeen);
      userData.team = teamIds[userData.team];
    });
  }

  get(user) {
    return this.data[user.username];
  }
}

module.exports = ScanData;
