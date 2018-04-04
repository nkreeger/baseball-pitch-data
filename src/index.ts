import {writeFileSync} from 'fs';
import {downloadDate} from './download';

async function downloadTest() {
  const start = new Date('2017-7-1');
  const end = new Date('2017-7-31');

  let count = 0;
  let output = '';
  for (const d = start; d <= end; d.setDate(d.getDate() + 1)) {
    console.log(d.toLocaleDateString());
    const pitches = await downloadDate(d);
    count += pitches.length;

    for (let i = 0; i < pitches.length; i++) {
      const pitch = pitches[i];
      // Always push keys first.
      if (output.length === 0) {
        output += Object.keys(pitch) + '\n';
        console.log(`Number of cols: ${Object.keys(pitch).length}`);
      }
      const jsonStr = JSON.stringify(Object.values(pitch));
      output += jsonStr.substring(1, jsonStr.length - 1) + '\n';
    }
  }

  console.log(`- Found ${count} total pitches`);
  writeFileSync('july_2017_pitches.csv', output);
  console.log('---- saved file.');
}

downloadTest();