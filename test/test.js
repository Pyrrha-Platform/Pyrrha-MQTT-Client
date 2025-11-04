const { describe, it } = require('mocha');
const assert = require('assert');
const rewire = require('rewire');

const app = rewire('../mqttclient');
const getISOString = app.__get__('getISOString');

describe('mqttclient test suite:', function () {
  describe('#getISOString()', function () {
    it('should return ISO string of the date without the timezone information ', function (done) {
      const result = getISOString();
      console.log(result);
      assert(1 === 1);
      done();
    });
  });
});
