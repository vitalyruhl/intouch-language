import * as fs from 'fs';
import * as path from 'path';
const fo = require('../src/formats');
const functions = require('../src/functions');

(async function main(){
  const config = functions.getConfig();
  const baseDir = path.join(__dirname,'..','src','test','suite','testfiles');
  if(!fs.existsSync(baseDir)){
    console.error('testfiles directory not found:', baseDir);
    process.exit(1);
  }
  const entries = fs.readdirSync(baseDir).filter(f=>f.endsWith('.test.vbi'));
  let changed = 0;
  for(const testFile of entries){
    const testPath = path.join(baseDir,testFile);
    const expectedPath = path.join(baseDir,testFile.replace('.test.vbi','.tobe.vbi'));
    const input = fs.readFileSync(testPath,'utf8');
    // full pipeline (mirror formats.fixtures.test.ts)
    let stage1 = fo.forFormat(input, config);
    let stage2 = fo.formatNestings(stage1, config);
    const nEL: number = (config.allowedNumberOfEmptyLines || 1) + 1.0;
    if (config.RemoveEmptyLines) {
      let regex: RegExp;
      if (config.EmptyLinesAlsoInComment) {
        regex = new RegExp(`(?![^{]*})(^[\t]*$\r?\n){${nEL},}`, 'gm');
      } else {
        regex = new RegExp(`(^[\t]*$\r?\n){${nEL},}`, 'gm');
      }
      stage2 = stage2.replace(regex, '\r\n');
    }
    if(fs.existsSync(expectedPath)){
      const old = fs.readFileSync(expectedPath,'utf8');
      if(old !== stage2){
        fs.writeFileSync(expectedPath, stage2, 'utf8');
        console.log('Updated fixture:', path.basename(expectedPath));
        changed++;
      }
    }else{
      fs.writeFileSync(expectedPath, stage2, 'utf8');
      console.log('Created missing fixture:', path.basename(expectedPath));
      changed++;
    }
  }
  console.log(`Fixture update complete. Changed: ${changed}`);
})();
