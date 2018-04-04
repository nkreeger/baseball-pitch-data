import {writeFileSync} from 'fs';
import {downloadDate} from './download';

async function downloadTest() {
  const start = new Date('2017-7-1');
  const end = new Date('2017-7-31');

  const outputs = [] as string[];
  for (const d = start; d <= end; d.setDate(d.getDate() + 1)) {
    console.log(d.toLocaleDateString());
    const pitches = await downloadDate(d);
    for (let i = 0; i < pitches.length; i++) {
      outputs.push(JSON.stringify(pitches[i]));
    }
  }

  console.log(`- Found ${outputs.length} total pitches`);
  writeFileSync('july_2017_pitches.json', outputs);
  console.log('---- saved file.');
}

downloadTest();