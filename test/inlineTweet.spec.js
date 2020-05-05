const fs = require('fs');
const path = require('path');
const inlineTweet = require('../inlineTweet.js');

const url1 = 'https://twitter.com/code_conf/status/651724049463312384';
const url2 = 'https://twitter.com/code_conf/status/651719076025339904';

describe(`inline tweet`, () => {
  let innerinline;

  before(() => {
    inlineTweet({
      addTransform: (name, fn) => {
        innerinline = fn;
      },
    });
  });

  before(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), '.inlineTweet.json'));
    } catch (ex) {}
  });

  after(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), '.inlineTweet.json'));
    } catch (ex) {}
  });

  describe('one inline url', () => {
    it('should return html', async () => {
      expect(await innerinline(`inlineTweet:${url1}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('inlineTweet:');
    });

    it('should return inline same tweet again fast', async () => {
      expect(await innerinline(`inlineTweet:${url1}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('inlineTweet:');
    }).timeout(100);
  });

  describe('two inline urls', () => {
    it('should return html for 2 urls', async () => {
      expect(await innerinline(`inlineTweet:${url1},inlineTweet:${url2}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('inlineTweet:');
    });

    it('should inline same 2 urls again fast', async () => {
      expect(await innerinline(`inlineTweet:${url1},inlineTweet:${url2}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('inlineTweet:');
    }).timeout(100);
  });
});
