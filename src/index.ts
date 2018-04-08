import {writeFileSync} from 'fs';
import {downloadDate} from './download';

type PitchTypes = {
  [key: string]: number
};

async function downloadPitches(start: Date, end: Date, filename: string) {
  const pitchTypes = {} as PitchTypes;

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
      }
      const jsonStr = JSON.stringify(Object.values(pitch));
      output += jsonStr.substring(1, jsonStr.length - 1) + '\n';

      if (pitchTypes[pitch.pitch_type] === undefined) {
        pitchTypes[pitch.pitch_type] = 1;
      } else {
        pitchTypes[pitch.pitch_type]++;
      }
    }
  }

  console.log(`- Found ${count} total pitches`);
  console.log('- Pitch Types: ', Object.keys(pitchTypes).length);
  console.log(pitchTypes);

  writeFileSync(filename, output);
  console.log('---- saved file: ', filename);
}

downloadPitches(
    new Date('2014-3-31'), new Date('2014-10-29'), '2014_pitches.csv');
downloadPitches(
    new Date('2015-4-5'), new Date('2015-11-1'), '2015_pitches.csv');
downloadPitches(
    new Date('2016-4-3'), new Date('2016-11-2'), '2016_pitches.csv');
downloadPitches(
    new Date('2017-4-2'), new Date('2017-11-1'), '2017_pitches.csv');
// downloadPitches(
//     new Date('2017-7-1'), new Date('2017-7-31'), 'july_2017_pitches.csv');
