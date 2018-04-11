import {readFileSync, writeFileSync} from 'fs';

import {Pitch, convertCsvToPitch} from './pitchfx';

type PitchBuckets = {
  [key: number]: string[]
};

type SamplePitches = {
  [key: number]: Pitch
};

class MinMax {
  min: number;
  max: number;

  constructor() {
    this.min = undefined;
    this.max = undefined;
  }
}

class Fields {
  vx0 = new MinMax();
  vy0 = new MinMax();
  vz0 = new MinMax();
  ax = new MinMax();
  ay = new MinMax();
  az = new MinMax();
}

function assignMinMax(value: number, minMax: MinMax) {
  if (minMax.max === undefined || value > minMax.max) {
    minMax.max = value;
  }
  if (minMax.min === undefined || value < minMax.min) {
    minMax.min = value;
  }
}

function createTrainingData(
    filename: string, trainBucket: PitchBuckets, testBucket: PitchBuckets,
    sample: SamplePitches, fields: Fields) {
  const content = readFileSync(filename, 'utf-8').split('\n');
  for (let i = 1; i < content.length - 1; i++) {
    const pitch = convertCsvToPitch(content[i]);
    if (pitch.type_confidence >= 0.9 && pitch.type_confidence <= 1.0 &&
        !isNaN(pitch.pitch_code)) {
      assignMinMax(pitch.vx0, fields.vx0);
      assignMinMax(pitch.vy0, fields.vy0);
      assignMinMax(pitch.vz0, fields.vz0);
      assignMinMax(pitch.ax, fields.ax);
      assignMinMax(pitch.ay, fields.ay);
      assignMinMax(pitch.az, fields.az);

      if (trainBucket[pitch.pitch_code] === undefined) {
        trainBucket[pitch.pitch_code] = [];
      }
      if (trainBucket[pitch.pitch_code].length < 1000) {
        trainBucket[pitch.pitch_code].push(content[i]);
      }

      if (testBucket[pitch.pitch_code] === undefined) {
        testBucket[pitch.pitch_code] = [];
      }
      if (testBucket[pitch.pitch_code].length < 100) {
        testBucket[pitch.pitch_code].push(content[i]);
      }

      if (samplePitches[pitch.pitch_code] === undefined) {
        samplePitches[pitch.pitch_code] = pitch;
      }
    }
  }
}

const trainBucket = {} as PitchBuckets;
const testBucket = {} as PitchBuckets;
const samplePitches = {} as SamplePitches;
const fields = new Fields();
createTrainingData(
    '2015_pitches.csv', trainBucket, testBucket, samplePitches, fields);
createTrainingData(
    '2016_pitches.csv', trainBucket, testBucket, samplePitches, fields);
createTrainingData(
    '2017_pitches.csv', trainBucket, testBucket, samplePitches, fields);
createTrainingData(
    '2014_pitches.csv', trainBucket, testBucket, samplePitches, fields);

let keys = Object.keys(trainBucket);

let output = '';
for (let i = 0; i < keys.length; i++) {
  const pitches = trainBucket[parseInt(keys[i], 10)];
  console.log(i + ': ' + pitches.length);
  for (let j = 0; j < pitches.length; j++) {
    output += pitches[j] + '\n';
  }
}
writeFileSync('training_data.csv', output);

keys = Object.keys(testBucket);
console.log(Object.keys(testBucket));
output = '';
for (let i = 0; i < keys.length; i++) {
  const pitches = testBucket[parseInt(keys[i], 10)];
  console.log(i + ': ' + pitches.length);
  for (let j = 0; j < pitches.length; j++) {
    output += pitches[j] + '\n';
  }
}
writeFileSync('test_data.csv', output);

keys = Object.keys(samplePitches);
console.log('samplePitches: ', keys);
output = '';
for (let i = 0; i < keys.length; i++) {
  const pitch = samplePitches[parseInt(keys[i], 10)];
  output += '[' + pitch.vx0 + ',' + pitch.vy0 + ',' + pitch.vz0 + ',' +
      pitch.ax + ',' + pitch.ay + ',' + pitch.az + ',' + pitch.px + ',' +
      pitch.pz + '],\n';
}
writeFileSync('sample.csv', output);

// Print out fields
console.log(`VX0_MIN = ${fields.vx0.min}`);
console.log(`VX0_MAX = ${fields.vx0.max}`);
console.log(`VY0_MIN = ${fields.vy0.min}`);
console.log(`VY0_MAX = ${fields.vy0.max}`);
console.log(`VZ0_MIN = ${fields.vz0.min}`);
console.log(`VZ0_MAX = ${fields.vz0.max}`);
console.log(`AX_MIN = ${fields.ax.min}`);
console.log(`AX_MAX = ${fields.ax.max}`);
console.log(`AY_MIN = ${fields.ay.min}`);
console.log(`AY_MAX = ${fields.ay.max}`);
console.log(`AZ_MIN = ${fields.az.min}`);
console.log(`AZ_MAX = ${fields.az.max}`);

console.log('done');
