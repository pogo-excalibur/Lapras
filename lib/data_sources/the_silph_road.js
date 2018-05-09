'use strict';

const request = require('request-promise');

class TheSilphRoad {
  constructor() {
    this.data = {};
  }

  get(user) {
    if (this.data[user.username]) {
      return Promise.resolve(this.data[user.username]);
    }

    const requestParams = {
      url: `https://sil.ph/${user.username}.json`,
      json: true,
      headers: {
        'User-Agent': 'lapras'
      }
    };

    return request.get(requestParams)
      .then(response => {
        const userData = response['data'];
        userData.team = userData.team.toLowerCase();

        this.data[user.username] = userData;
        return userData;
      })
      .catch(err => {
        if (err &&
            err.error &&
            err.error.error &&
            err.error.error == 'Card not found') {
          return;
        } else {
          throw new Error('Could not fetch data from TheSilphRoad');
        }
      });
  }
}

module.exports = TheSilphRoad;
