// Minimal statische Farbpalette (ausreichend für aktuelles Theme).
// Reihenfolge von hell -> dunkel (ähnlich GitHub Primer).
/** @type {Record<string,string[]>} */
const base = {
  gray:   ['#fafbfc','#f6f8fa','#e1e4e8','#d1d5da','#959da5','#6a737d','#586069','#444d56','#2f363d','#24292e'],
  blue:   ['#f1f8ff','#dbedff','#c8e1ff','#79b8ff','#2188ff','#0366d6','#005cc5','#044289','#032f62','#05264c'],
  green:  ['#f0fff4','#dcffe4','#bef5cb','#85e89d','#34d058','#28a745','#22863a','#176f2c','#165c26','#144620'],
  purple: ['#f5f0ff','#e6dcfd','#d1bcf9','#b392f0','#8a63d2','#6f42c1','#5a32a3','#4c2889','#3a1d6e','#29134e'],
  red:    ['#ffeef0','#ffdce0','#fdaeb7','#f97583','#ea4a5a','#d73a49','#cb2431','#b31d28','#9e1c23','#86181d'],
  orange: ['#fff8f2','#ffebda','#ffd1ac','#ffab70','#fb8532','#f66a0a','#e36209','#d15704','#c24e00','#a04100'],
  black:  ['#1b1f23'],
  white:  ['#ffffff']
};

function makeDark() {
  /** @type {Record<string,string[]>} */
  const dark = {};
  Object.entries(base).forEach(([name, arr]) => {
    if (name === 'black') {
      dark.white = arr;
    } else if (name === 'white') {
      dark.black = arr;
    } else {
      dark[name] = [...arr].reverse();
    }
  });
  return dark;
}

/**
 * @param {string} style
 * @returns {Record<string,string[]>}
 */
function getColors(style) {
  return style === 'dark' ? makeDark() : base;
}

module.exports = { getColors };
