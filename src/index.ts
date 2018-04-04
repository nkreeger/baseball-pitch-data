import {BSON} from 'bson';

import {downloadDate} from './download';
import {Pitch} from './pitchfx';

async function downloadTest() {
  let pitches = [] as Pitch[];
  pitches = pitches.concat(await downloadDate(new Date('2018-4-2')));
  pitches = pitches.concat(await downloadDate(new Date('2018-4-3')));

  console.log(`Found ${pitches.length} pitches`);

  const bson = new BSON();
  const serialized = bson.serialize(pitches);
  console.log(serialized.length);

  console.log(pitches[10]);
}

downloadTest();