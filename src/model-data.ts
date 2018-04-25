import {Pitch, PitchKeys} from 'baseball-pitchfx-types';
import {createWriteStream, readFileSync} from 'fs';

// tslint:disable-next-line:max-line-length
import {assignMinMax, getDatePitches, MinMax} from './pitchfx';

const SZ_TOP_RANGE = 5.0;
const SZ_BOT_RANGE = 1.0;

type StringKeyNumValue = {
  [key: string]: number
};

type NumKeyPitchArrayValue = {
  [key: number]: Pitch[]
};

type StringKeyMinMaxValue = {
  [key: string]: MinMax
};

// CSV generation:
// output += jsonStr.substring(1, jsonStr.length - 1) + '\n';

// Saves cleaned up pitch data as JSON in a given filename:
export async function downloadPitchData(
    start: Date, end: Date, filename: string) {
  const pitchTypes = {} as StringKeyNumValue;

  const writeStream = createWriteStream(filename);
  let count = 0;
  for (const d = start; d <= end; d.setDate(d.getDate() + 1)) {
    console.log(`  * Processing: ${d.toLocaleDateString()}`);
    const pitches = await getDatePitches(d);
    count += pitches.length;

    for (let i = 0; i < pitches.length; i++) {
      const pitch = pitches[i];
      writeStream.write(JSON.stringify(pitch) + '\n');

      if (pitchTypes[pitch.pitch_type] === undefined) {
        pitchTypes[pitch.pitch_type] = 1;
      } else {
        pitchTypes[pitch.pitch_type]++;
      }
    }
  }

  writeStream.close();
  console.log(`  ** Found ${count} total pitches: ${filename}`);
  console.log('  ** Pitch Types: ', Object.keys(pitchTypes).length);
  console.log(pitchTypes);
}

// Loads JSON pitch data from the passed in filenames and outputs a test file
// and min/max fields for pitch type training data.
export function generatePitchTypeTrainingData(
    filenames: string[], outFilename: string, maxSize: number) {
  const pitchesByType = {} as NumKeyPitchArrayValue;

  const fields = {} as StringKeyMinMaxValue;
  const keys =
      ['vx0', 'vy0', 'vz0', 'ax', 'ay', 'az', 'start_speed'] as PitchKeys[];

  for (let i = 0; i < filenames.length; i++) {
    filterPitchTypeTrainingData(
        filenames[i], fields, keys, pitchesByType, maxSize);
  }
  savePitchTrainingData(outFilename, pitchesByType, fields);
}

// Loads JSON pitch data from the passed in filenames and outputs a test file
// and min/max fields for strike zone pitch training data.
export function generateStrikeZonePitchTrainingData(
    filenames: string[], outFilename: string, maxSize: number, asJson = true) {
  const pitchesByType = {} as NumKeyPitchArrayValue;

  const fields = {} as StringKeyMinMaxValue;
  const keys = ['px', 'pz', 'sz_top', 'sz_bot'] as PitchKeys[];

  for (let i = 0; i < filenames.length; i++) {
    filterStrikeZonePitchTrainingData(
        filenames[i], fields, keys, pitchesByType, maxSize);
  }
  savePitchTrainingData(outFilename, pitchesByType, fields, asJson);
}

function savePitchTrainingData(
    filename: string, pitchesByType: NumKeyPitchArrayValue,
    fields: StringKeyMinMaxValue, asJson = true) {
  const writeStream = createWriteStream(filename);
  let keys = Object.keys(pitchesByType);
  for (let i = 0; i < keys.length; i++) {
    const key = parseInt(keys[i], 10);
    const pitches = pitchesByType[key];
    console.log(`  * Pitch type: ${key} has ${pitches.length} pitches`);
    for (let j = 0; j < pitches.length; j++) {
      writeStream.write(JSON.stringify(pitches[j]) + '\n');
    }
  }

  // Output the min/max values:
  console.log(' --- min/max field values: ---');
  keys = Object.keys(fields);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    const minMax = fields[key];
    key = key.toUpperCase();
    console.log(`const ${key}_MIN = ${minMax.min};`);
    console.log(`const ${key}_MAX = ${minMax.max};`);
  }
}

function filterPitchTypeTrainingData(
    filename: string, fields: StringKeyMinMaxValue, keys: PitchKeys[],
    pitches: NumKeyPitchArrayValue, maxSize: number) {
  const content = readFileSync(filename, 'utf-8').split('\n');

  for (let i = 0; i < content.length; i++) {
    if (content[i].length > 0) {
      const pitch = JSON.parse(content[i]) as Pitch;
      if (isValidPitchTypeData(pitch)) {
        assignFieldsMinMax(pitch, keys, fields);

        if (pitches[pitch.pitch_code] === undefined) {
          pitches[pitch.pitch_code] = [];
        }
        if (pitches[pitch.pitch_code].length < maxSize) {
          pitches[pitch.pitch_code].push(pitch);
        }
      }
    }
  }
}

function filterStrikeZonePitchTrainingData(
    filename: string, fields: StringKeyMinMaxValue, keys: PitchKeys[],
    pitches: NumKeyPitchArrayValue, maxSize: number) {
  const content = readFileSync(filename, 'utf-8').split('\n');

  if (pitches[0] === undefined) {
    pitches[0] = [];
  }
  if (pitches[1] === undefined) {
    pitches[1] = [];
  }

  for (let i = 0; i < content.length; i++) {
    if (content[i].length > 0) {
      const pitch = JSON.parse(content[i]) as Pitch;
      if (isValidStrikeZonePitchData(pitch)) {
        if (pitch.type.toUpperCase() === 'S') {
          if (pitch.code !== undefined && pitch.code.toUpperCase() === 'C' &&
              pitches[0].length < maxSize) {
            assignFieldsMinMax(pitch, keys, fields);
            pitches[0].push(pitch);
          }
        } else if (
            pitch.type.toUpperCase() === 'B' && pitches[1].length < maxSize) {
          assignFieldsMinMax(pitch, keys, fields);
          pitches[1].push(pitch);
        }
      }
    }
  }
}

function assignFieldsMinMax(
    pitch: Pitch, keys: PitchKeys[], fields: StringKeyMinMaxValue) {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (fields[key] === undefined) {
      fields[key] = new MinMax();
    }
    assignMinMax(pitch[key] as number, fields[key]);
  }
}

export function isClassifiedPitchType(pitch: Pitch): boolean {
  return pitch.pitch_code < 7 && pitch.pitch_code > -1;
}

export function isValidPitchTypeData(pitch: Pitch): boolean {
  return pitch.type_confidence >= .95 && pitch.type_confidence <= 1.0 &&
      !isNaN(pitch.pitch_code) && isClassifiedPitchType(pitch);
}

export function isValidStrikeZonePitchData(pitch: Pitch): boolean {
  const top = pitch.sz_top;
  const bot = pitch.sz_bot;
  const delta = top - bot;
  if (top < SZ_TOP_RANGE && top > SZ_BOT_RANGE && bot > SZ_BOT_RANGE &&
      bot < SZ_TOP_RANGE && delta < 5) {
    const type = pitch.type;
    const zoneHeight = pitch.sz_top - pitch.sz_bot;
    if (type !== undefined && zoneHeight < 5) {
      return true;
    }
  }
  return false;
}
