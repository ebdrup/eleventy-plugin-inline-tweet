# eleventy-plugin-embed-tweet

This plugin will transform a text like:

```
embedTweet:https://twitter.com/code_conf/status/651724049463312384
```

Into the inlined HTML of the embedded tweet, with styles inlined and smaller images also inlined. Only large images will not be embedded.

You can see it in use at the bottom of my Danish page about my speaking engagements at [itforedrag.dk](https://www.itforedrag.dk/)

## Why

Why would you want to inline the html of the tweet, instead of just using the embed functionality on twitter?
Well by inlining the html of the tweet:

1. You are removing external dependency on the twitter javascript. Using an external JavaScript both slows your page down and has security implications.
2. It becomes possible to implement an effective lazyload of images
3. You eliminate the page jumping up and down during hot reload development cycles, where the twitter javascript otherwise would be fetching the embedded tweet again and again as you hot reload the page ever time you make a change.

## Disadvantages

There are some disadvantages to embeddint the html of tweets

1. The like counter does not update automatically anymore. You will need to delete the cache at `./embedTweet.json` and rebuild the page to get updated counters.
2. If twitter changes the layout of embedded tweets to some kind of better version, you will still be on the version from when you embedded the tweet.

## Installation

Available on [npm](https://www.npmjs.com/package/eleventy-plugin-embed-tweet).

```
npm install eleventy-plugin-embed-tweet
```

Open up your Eleventy config file (probably `.eleventy.js`) and use `addPlugin`:

```
const embedTweetPlugin = require("eleventy-plugin-embed-tweet");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(inclusiveLangPlugin);
};
```

Read more about [Eleventy plugins.](https://www.11ty.io/docs/plugins/)
