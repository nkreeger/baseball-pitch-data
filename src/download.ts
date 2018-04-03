import * as rp from 'request-promise-native';
import {toJson} from 'xml2json';

import {BASE_URL, GameJson, getGamePitches, INNINGS_FILE_PATH, Pitch} from './pitchfx';

const REGEX = /\Sgid_\d+_\d+_\d+_\w+\//g;

function getTwoDigit(num: number): string {
  if (num < 10) {
    return '0' + num;
  }
  return num.toString();
}

async function getDateGamePaths(path: string): Promise<string[]> {
  let games = [] as string[];
  await rp
      .get(
          path, {},
          (error, response, body) => {
            if (error) {
              throw new Error(error);
            }
            games = body.match(REGEX);
          })
      .catch(() => {});
  return games;
}

async function getGameJson(path: string): Promise<GameJson> {
  let gameJson = null as GameJson;
  await rp
      .get(
          path + INNINGS_FILE_PATH, {},
          (error, response, body) => {
            if (error) {
              throw new Error(error);
            }
            gameJson = toJson(body, {object: true}) as GameJson;
          })
      .catch(() => {});
  return gameJson;
}

export async function downloadDate(date: Date): Promise<Pitch[]> {
  const subpath = `year_${date.getFullYear()}/month_${
      getTwoDigit(date.getMonth() + 1)}/day_${getTwoDigit(date.getDate())}`;
  const datePath = BASE_URL + subpath;

  const gamePaths = await getDateGamePaths(datePath);

  let pitches = [] as Pitch[];
  console.log(`  * Found ${gamePaths.length} Games...`);
  for (let i = 0; i < gamePaths.length; i++) {
    const gameJson = await getGameJson(datePath + gamePaths[i]);
    pitches = pitches.concat(getGamePitches(gameJson));
  }
  console.log(`  * Found ${pitches.length} pitches`);
  return pitches;
}