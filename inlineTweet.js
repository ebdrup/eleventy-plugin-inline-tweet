const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch');
const puppeteer = require('puppeteer');
const juice = require('juice');

function checkStatus(res) {
  if (res.ok) {
    // res.status >= 200 && res.status < 300
    return res;
  } else {
    throw new Error(res.statusText);
  }
}

const cssCache = {};

const URL_REGEXP = /inlineTweet:https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

module.exports = async function inlineTweet(eleventyConfig, options) {
  options = Object.assign({ forceReload: false, skipWritingFiles: false }, options);
  eleventyConfig.addTransform('inlineTweet', async (pageHtml, outputPath) => {
    if (!outputPath.endsWith('.html')) {
      return pageHtml;
    }
    const urls = [...pageHtml.matchAll(URL_REGEXP)]
      .map(match => match.splice(0, 1))
      .map(matches => matches.pop().replace('inlineTweet:', ''));
    if (urls.lenght === 0) {
      return pageHtml;
    }
    for (const url of urls) {
      pageHtml = pageHtml.replace(`inlineTweet:${url}`, await getinlinededTweet(url, options));
    }
    return pageHtml;
  });
};

async function getinlinededTweet(url, { forceReload, skipWritingFiles }) {
  const file = path.join(process.cwd(), '.inlineTweet.json');
  let tweetCache = {};
  try {
    tweetCache = require(file);
  } catch (ex) {}
  if (tweetCache[url] && !forceReload) {
    return tweetCache[url];
  }

  const { html } = await checkStatus(
    await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`),
  ).json();

  const browser = await puppeteer.launch();
  const shadowPage = await getPageForHtml({
    browser,
    html,
    opts: { waitUntil: 'networkidle0' },
  });

  const content = await shadowPage.evaluate(() => {
    const cssTagContent = [];
    const shadow = document.body.childNodes['0'].shadowRoot;
    subtreeSet(document.body).forEach(e => {
      if (['style'].includes((e.tagName || '').toLowerCase())) {
        cssTagContent.push(e.textContent || e.innerHTML || e.innerText);
      }
    });
    removeStylesAndScripts(document.body);
    subtreeSet(document.body).forEach(e => {
      Array.from(e.attributes).forEach(({ nodeName, nodeValue }) => {
        if (/^(data-.*|id)$/.test(nodeName) && nodeValue) {
          e.setAttribute(nodeName, '');
        }
      });
    });
    const html = shadow.innerHTML
      .replace(/ (id|class|style|data-[^=]*)=""/gm, '')
      .replace(/(\s*\n\s*)+/gm, '\n');
    return { html, cssTagContent };
  });
  const cssImport = content.cssTagContent.find(css => css.includes('@import'));
  const cssUrl = (/url\("([^"]*)"\)/.exec(cssImport) || [])[1];
  const css = cssCache[cssUrl] || (await checkStatus(await fetch(cssUrl)).text());
  cssCache[cssUrl] = css;

  const styledHtml = (
    await promisify(juice.juiceResources)(juice.inlineContent(content.html, css), {})
  ).replace(/\bclass="[^"]+"/g, '');

  await browser.close();

  tweetCache[url] = styledHtml;
  if (!skipWritingFiles) {
    await promisify(fs.writeFile)(file, JSON.stringify(tweetCache, null, '  '), 'utf-8');
  }

  return styledHtml;
}

async function getPageForHtml({ browser, html, opts }) {
  const tmp = require('tmp');
  const { name: tmpFile } = tmp.fileSync({ postfix: '.html' });
  await promisify(fs.writeFile)(tmpFile, `<html><body>${html}</body></html>`, 'utf-8');
  const page = await browser.newPage();
  await page.goto(`file://${tmpFile}`, opts);
  await page.addScriptTag({
    content: subtreeSet.toString(),
  });
  await page.addScriptTag({
    content: removeStylesAndScripts.toString(),
  });
  return page;
}

function removeStylesAndScripts(node) {
  subtreeSet(node).forEach(e => {
    if (['style', 'script'].includes((e.tagName || '').toLowerCase())) {
      (e.parentNode || e.host).removeChild(e);
    }
  });
}

function subtreeSet(root, theset) {
  if (!theset) theset = new Set();
  if (!root || theset.has(root)) return theset;
  theset.add(root);
  if (root.shadowRoot) {
    Array.from(root.shadowRoot.children).forEach(child => subtreeSet(child, theset));
  } else {
    if (root && root.getElementsByTagName)
      for (const child of root.getElementsByTagName('*')) subtreeSet(child, theset);
  }
  return theset;
}
