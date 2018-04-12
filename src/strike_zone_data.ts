import {readFileSync, writeFileSync} from 'fs';

// tslint:disable-next-line:max-line-length
import {assignMinMax, convertCsvToPitch, convertSZData, MinMax, Pitch} from './pitchfx';

const MAX_TRAIN_SIZE = 10000;
// const MAX_TEST_SIZE = 100;

class Fields {
  px = new MinMax();
  pz = new MinMax();
  szTop = new MinMax();
  szBottom = new MinMax();
  szHeight = new MinMax();
}

function csvItem(pitch: Pitch, isStrike: boolean): string {
  const szData = convertSZData(pitch, isStrike);
  const jsonStr = JSON.stringify(Object.values(szData));
  return jsonStr.substring(1, jsonStr.length - 1) + '\n';
}

function handleMinMax(pitch: Pitch, fields: Fields) {
  assignMinMax(pitch.px, fields.px);
  assignMinMax(pitch.pz, fields.pz);
  assignMinMax(pitch.sz_top, fields.szTop);
  assignMinMax(pitch.sz_bot, fields.szBottom);

  const height = pitch.sz_top - pitch.sz_bot;
  assignMinMax(height, fields.szHeight);
}

const SZ_TOP_RANGE = 5.0;
const SZ_BOT_RANGE = 1.0;

function checkRange(pitch: Pitch): boolean {
  const top = pitch.sz_top;
  const bot = pitch.sz_bot;
  const delta = top - bot;
  return top < SZ_TOP_RANGE && top > SZ_BOT_RANGE && bot > SZ_BOT_RANGE &&
      bot < SZ_TOP_RANGE && delta < 5;
}

let items = 0;
let totalHeight = 0;
function createTrainingData(
    filename: string, maxSize: number, fields: Fields): string {
  let output = '';
  let balls = 0;
  let strikes = 0;
  const content = readFileSync(filename, 'utf-8').split('\n');
  for (let i = 1; i < content.length - 1; i++) {
    const pitch = convertCsvToPitch(content[i]);

    if (checkRange(pitch)) {
      let type = pitch.type;
      const zoneHeight = pitch.sz_top - pitch.sz_bot;
      totalHeight += zoneHeight;
      items++;

      if (type !== undefined && zoneHeight < 5) {
        type = pitch.type.toUpperCase();
        if (type === 'S' && strikes < maxSize) {
          // Verify called strike
          const code = pitch.code;
          if (code !== undefined && code.toUpperCase() === 'C') {
            output += csvItem(pitch, true);
            handleMinMax(pitch, fields);
            strikes++;
          }
        } else if (type === 'B' && balls < maxSize) {
          output += csvItem(pitch, false);
          handleMinMax(pitch, fields);
          balls++;
        }
      }
    }
  }
  return output;
}

const fields = new Fields();
const output = createTrainingData('2017_pitches.csv', MAX_TRAIN_SIZE, fields);

console.log('items: ' + items);
console.log('height avg: ' + totalHeight / items);

writeFileSync('sz_training_data.csv', output);
// writeFileSync('sz_training_data.csv', bucketContent(test));

// Print min/max fields
console.log(`PX_MIN = ${fields.px.min}`);
console.log(`PX_MAX = ${fields.px.max}`);
console.log(`PZ_MIN = ${fields.pz.min}`);
console.log(`PZ_MAX = ${fields.pz.max}`);
console.log(`SZ_TOP_MIN = ${fields.szTop.min}`);
console.log(`SZ_TOP_MAX = ${fields.szTop.max}`);
console.log(`SZ_BOT_MIN = ${fields.szBottom.min}`);
console.log(`SZ_BOT_MAX = ${fields.szBottom.max}`);
console.log(`SZ_HEIGHT_MIN = ${fields.szHeight.min}`);
console.log(`SZ_HEIGHT_MAX = ${fields.szHeight.max}`);