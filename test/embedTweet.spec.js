const fs = require('fs');
const path = require('path');
const embedTweet = require('../.eleventy.js');

const url1 = 'https://twitter.com/code_conf/status/651724049463312384';
const url2 = 'https://twitter.com/code_conf/status/651719076025339904';

describe(`embed tweet`, () => {
  let innerEmbed;

  before(() => {
    embedTweet({
      addTransform: (name, fn) => {
        innerEmbed = fn;
      },
    });
  });

  before(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), '.embedTweet.json'));
    } catch (ex) {}
  });

  after(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), '.embedTweet.json'));
    } catch (ex) {}
  });

  describe('one embed url', () => {
    it('should return html', async () => {
      expect(await innerEmbed(`embedTweet:${url1}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('embedTweet:');
    });

    it('should return embed same tweet again fast', async () => {
      expect(await innerEmbed(`embedTweet:${url1}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('embedTweet:');
    }).timeout(100);
  });

  describe('two embed urls', () => {
    it('should return html for 2 urls', async () => {
      expect(await innerEmbed(`embedTweet:${url1},embedTweet:${url2}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('embedTweet:');
    });

    it('should embed same 2 urls again fast', async () => {
      expect(await innerEmbed(`embedTweet:${url1},embedTweet:${url2}`, 'test.html'))
        .to.be.a('string')
        .to.not.include('embedTweet:');
    }).timeout(100);
  });
});
