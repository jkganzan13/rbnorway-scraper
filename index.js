const fs = require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');
const characters = require('./characters');

const getOptions = name => ({
  uri: `http://rbnorway.org/${name}-t7-frames/`,
  transform: body => cheerio.load(body),
});

const scrapeByName = name =>
  rp(getOptions(name))
    .then($ => {
      const table = $('table').first();
      const tbody = table.find('tbody');
      const rows = tbody.children('tr:not(:first-child)');
      const moves = rows.map((i, el) => {
        const td = $(el).children('td');
        return {
          notation: td.eq(0).text(),
          hit_level: td.eq(1).text(),
          damage: td.eq(2).text(),
          speed: td.eq(3).text(),
          on_block: td.eq(4).text(),
          on_hit: td.eq(5).text(),
          on_ch: td.eq(6).text(),
          notes: td.eq(7).text(),
        };
      });
      return moves.get();
    });

const writeToJson = results => {
  const json = results.reduce((acc, char) => {
    acc[char.key] = char;
    return acc;
  }, {});
  return new Promise((res, rej) => {
      fs.writeFile('data.json', JSON.stringify(json, null, 2), 'utf8', (err) => {
        if (err) rej(err);
        console.log('Results written to data.json');
        res();
      });
  });
}
  

const webscraper = () => {
  console.log('Scraping RBNorway');
  const promises = characters.map(c =>
    scrapeByName(c.key)
    .then(data => Object.assign({}, c, { data })));
  return Promise.all(promises)
    .then(writeToJson)
    .catch(e => console.log(e))
};

webscraper();