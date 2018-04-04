import {BSON} from 'bson';
import {writeFileSync} from 'fs';

import {downloadDate} from './download';
import {Pitch} from './pitchfx';

async function downloadTest() {
  let pitches = [] as Pitch[];

  //   var now = new Date();
  // var daysOfYear = [];
  // for (var d = new Date(2012, 0, 1); d <= now; d.setDate(d.getDate() + 1)) {
  //     daysOfYear.push(new Date(d));
  // }

  const start = new Date('2017-7-1');
  const end = new Date('2017-7-31');
  for (const d = start; d <= end; d.setDate(d.getDate() + 1)) {
    console.log(d.toLocaleDateString());
    pitches = pitches.concat(await downloadDate(d));
  }

  console.log(`- Found ${pitches.length} pitches`);

  const bson = new BSON();
  const serialized = bson.serialize(pitches);
  console.log(serialized.length);

  writeFileSync('test.bson', serialized);
  console.log('---- done');
}

downloadTest();