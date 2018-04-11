import {readFileSync, writeFileSync} from 'fs';

import {Pitch, convertCsvToPitch} from './pitchfx';

type PitchBuckets = {
  [key: number]: string[]
};

type SamplePitches = {
  [key: number]: Pitch
};

function createTrainingData(
    filename: string, trainBucket: PitchBuckets, testBucket: PitchBuckets,
    sample: SamplePitches) {
  let content = readFileSync(filename, 'utf-8').split('\n');
  for (let i = 1; i < content.length - 1; i++) {
    const pitch = convertCsvToPitch(content[i]);
    if (pitch.type_confidence >= 0.9 && pitch.type_confidence <= 1.0 &&
        !isNaN(pitch.pitch_code)) {
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
createTrainingData('2015_pitches.csv', trainBucket, testBucket, samplePitches);
createTrainingData('2016_pitches.csv', trainBucket, testBucket, samplePitches);
createTrainingData('2017_pitches.csv', trainBucket, testBucket, samplePitches);
createTrainingData('2014_pitches.csv', trainBucket, testBucket, samplePitches);

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
console.log('done');
