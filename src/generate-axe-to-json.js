/* generate-aria-spec-code.js */
/* aria-to-code generator version 1.1 */


import fs    from 'fs';
import os    from 'os';
import path  from 'path';
import util  from 'util';
import fetch from 'node-fetch';
import HTMLParser from 'node-html-parser';

const axeVersion = '4.1.1';

const axeJSONFilename  = path.join('releases', `gen-axe-${axeVersion}.json`);

let axeURL = `https://dequeuniversity.com/rules/axe/html/4.11`;

function cleanAndNormalizeString(inputString) {
  // 1. Remove control characters
  let noControlChars = inputString.replace(/[\x00-\x1F\x7F]/g, '');

  // 2. Normalize spacing (replace multiple spaces with single, then trim)
  let cleanedAndNormalized = noControlChars.replace(/\s+/g, ' ').trim();

  return cleanedAndNormalized;
}

function getAxeInformation(dom) {
  const axeInfo = {};

  axeInfo.version = axeVersion;
  axeInfo.ruleCount = 0;
  axeInfo.rules = {};

  const rules = Array.from(dom.querySelectorAll('table tbody td:first-child a'));
  const descriptions = Array.from(dom.querySelectorAll('table tbody td:nth-child(2)'));
  const impacts = Array.from(dom.querySelectorAll('table tbody td:nth-child(3)'));

  console.log(`[       rules]: ${rules.length}`);
  console.log(`[descriptions]: ${descriptions.length}`);

  let bestPractice = false;
  let experimental = false;
  let deprecated = false;

  rules.forEach( (rule) => {
    console.log(`${rule.textContent}`);
    const ruleId = rule.textContent.trim();

    if(!bestPractice) {
      bestPractice = ruleId === 'accesskeys';
    }

    if(!experimental) {
      experimental = ruleId === 'accesskeys';
      if (experimental) {
        bestPractice = false;
      }
    }

    if(!deprecated) {
      deprecated = ruleId === 'aria-roledescription';
      if (deprecated) {
        experimental = false;
      }
    }

    if (!deprecated) {
      axeInfo.rules[ruleId] = {}
      axeInfo.rules[ruleId].url = rule.getAttribute('href');
      axeInfo.rules[ruleId].description = cleanAndNormalizeString(descriptions[axeInfo.ruleCount].textContent);
      axeInfo.rules[ruleId].impact = cleanAndNormalizeString(impacts[axeInfo.ruleCount].textContent);
      axeInfo.rules[ruleId].bestPractice = bestPractice;
      axeInfo.rules[ruleId].experimental = experimental;
      axeInfo.ruleCount += 1;
    }

  });

  return axeInfo
}

function outputAsJSON(filename, info) {

  fs.writeFile(filename, JSON.stringify(info, null, 4), err => {
    if (err) {
      console.error(err)
      return
    }
    //file written successfully
  })

  return info;
}

fetch(axeURL)
  .then(data => data.text())
  .then(html => HTMLParser.parse(html))
  .then(dom => getAxeInformation(dom))
  .then(axeInfo => outputAsJSON(axeJSONFilename, axeInfo))

