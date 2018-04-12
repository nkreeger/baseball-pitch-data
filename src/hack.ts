import {readFileSync} from 'fs';
import {convertCsvToPitch, Pitch} from './pitchfx';

type SamplePitches = {
  [key: number]: Pitch
};

const pitches = {} as SamplePitches;
const content = readFileSync('test_data.csv', 'utf-8').split('\n');
for (let i = 1; i < content.length - 1; i++) {
  const pitch = convertCsvToPitch(content[i]);
  console.log(pitch.pitch_code);
  if (pitches[pitch.pitch_code] === undefined) {
    pitches[pitch.pitch_code] = pitch;
  }
}

// console.log('pitches', pitches);
const vx0 = [];
const vy0 = [];
const vz0 = [];
const ax = [];
const ay = [];
const az = [];
const startSpeed = [];
const isLeft = [];

const keys = Object.keys(pitches);
console.log(keys);
for (let i = 0; i < keys.length; i++) {
  const pitch = pitches[parseInt(keys[i], 10)];
  vx0.push(pitch.vx0);
  vy0.push(pitch.vy0);
  vz0.push(pitch.vz0);
  ax.push(pitch.ax);
  ay.push(pitch.ay);
  az.push(pitch.az);
  startSpeed.push(pitch.start_speed);
  isLeft.push(pitch.is_left_handed);
}

console.log(`vx0 = [${vx0}]`);
console.log(`vy0 = [${vy0}]`);
console.log(`vz0 = [${vz0}]`);
console.log(`ax = [${ax}]`);
console.log(`ay = [${ay}]`);
console.log(`az = [${az}]`);
console.log(`start_speed = [${startSpeed}]`);
console.log(`is_left = [${isLeft}]`);
