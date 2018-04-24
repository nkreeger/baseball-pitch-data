// tslint:disable-next-line:max-line-length
import {AtBat, GameJson, Inning, InningHalf, Pitch, PitchJson, pitchTypeToInt, SZData} from 'baseball-pitchfx-types';
import {SortedArray} from 'containers.js';
import * as rp from 'request-promise-native';
import {toJson} from 'xml2json';

const BASE_URL = 'http://gd2.mlb.com/components/game/mlb/';
const INNINGS_FILE_PATH = 'inning/inning_all.xml';
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
            if (!error) {
              const matches = body.match(REGEX);
              if (matches !== null) {
                games = matches;
              }
            }
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
            if (!error) {
              gameJson = toJson(body, {object: true}) as GameJson;
            }
          })
      .catch(() => {});
  return gameJson;
}

export async function getDatePitches(date: Date): Promise<Pitch[]> {
  const subpath = `year_${date.getFullYear()}/month_${
      getTwoDigit(date.getMonth() + 1)}/day_${getTwoDigit(date.getDate())}`;
  const datePath = BASE_URL + subpath;

  const gamePaths = await getDateGamePaths(datePath);

  const pitches = new SortedArray<Pitch>((a, b) => {
    const aDate = new Date(a.tfs_zulu).getTime();
    const bDate = new Date(b.tfs_zulu).getTime();
    if (aDate === bDate) {
      return 0;
    }
    return aDate > bDate ? 1 : -1;
  });
  for (let i = 0; i < gamePaths.length; i++) {
    const gameJson = await getGameJson(datePath + gamePaths[i]);
    pitches.insertValues(getGamePitches(gameJson));
  }
  return pitches.values();
}

export class MinMax {
  min: number;
  max: number;

  constructor() {
    this.min = undefined;
    this.max = undefined;
  }
}

export function assignMinMax(value: number, minMax: MinMax) {
  if (minMax.max === undefined || value > minMax.max) {
    minMax.max = value;
  }
  if (minMax.min === undefined || value < minMax.min) {
    minMax.min = value;
  }
}

// tslint:disable-next-line:no-any
function isArray(thing: any): boolean {
  return thing !== undefined && thing !== null && Array.isArray(thing);
}

function toInt(str: string): number {
  return parseInt(str, 10);
}

function safeStr(str: string): string {
  return str.replace(/['"]+/g, '');
}

function convertPitchJson(
    json: PitchJson, isLeftyPitcher: boolean, isLeftyBatter: boolean): Pitch {
  // Sanity check some values
  if (json.start_speed === undefined || json.vx0 === undefined ||
      json.x0 === undefined) {
    return null;
  }

  // Ignore some pitch types
  let pitchType = json.pitch_type;
  // Pitchout:
  if (pitchType === 'FO' || pitchType === 'PO') {
    pitchType = 'PO';
  }
  // // Unidentified:
  // if (pitchType === 'UN' || pitchType === 'XX' || pitchType === 'AB' ||
  //     pitchType === 'SC' || pitchType === 'IN' || pitchType === 'FA') {
  //   return null;
  // }

  // Some pitch types are actually the same. Collapse as needed
  if (pitchType === 'SI') {
    pitchType = 'FS';
  }
  if (pitchType === 'CU') {
    pitchType = 'CB';
  }

  return {
    des: json.des,
    id: toInt(json.id),
    type: json.type,
    code: json.code,
    tfs_zulu: json.tfs_zulu,
    x: parseFloat(json.x),
    y: parseFloat(json.y),
    start_speed: parseFloat(json.start_speed),
    end_speed: parseFloat(json.end_speed),
    sz_top: parseFloat(json.sz_top),
    sz_bot: parseFloat(json.sz_bot),
    pfx_x: parseFloat(json.pfx_x),
    pfx_z: parseFloat(json.pfx_z),
    px: parseFloat(json.px),
    pz: parseFloat(json.pz),
    x0: parseFloat(json.x0),
    y0: parseFloat(json.y0),
    z0: parseFloat(json.z0),
    vx0: parseFloat(json.vx0),
    vy0: parseFloat(json.vy0),
    vz0: parseFloat(json.vz0),
    ax: parseFloat(json.ax),
    ay: parseFloat(json.ay),
    az: parseFloat(json.az),
    break_y: parseFloat(json.break_y),
    break_angle: parseFloat(json.break_angle),
    break_length: parseFloat(json.break_length),
    pitch_type: pitchType,
    pitch_code: pitchTypeToInt(pitchType),
    type_confidence: parseFloat(json.type_confidence),
    zone: parseFloat(json.zone),
    nasty: parseFloat(json.nasty),
    spin_dir: parseFloat(json.spin_dir),
    spin_rate: parseFloat(json.spin_rate),
    left_handed_pitcher: isLeftyPitcher ? 1 : 0,
    left_handed_batter: isLeftyBatter ? 1 : 0
  };
}

function convertPitchJsonArray(
    json: PitchJson[], isLeftyPitcher: boolean,
    isLeftyBatter: boolean): Pitch[] {
  const pitches = [] as Pitch[];
  for (let i = 0; i < json.length; i++) {
    const pitch = convertPitchJson(json[i], isLeftyPitcher, isLeftyBatter);
    if (pitch !== null) {
      pitches.push(pitch);
    }
  }
  return pitches;
}

function findAtBatPitches(atBat: AtBat): Pitch[] {
  if (atBat !== undefined) {
    const isLeftyPitcher = atBat.p_throws.toUpperCase() === 'L';
    const isLeftyBatter = atBat.stand.toUpperCase() === 'L';
    if (isArray(atBat.pitch)) {
      return convertPitchJsonArray(
          atBat.pitch as PitchJson[], isLeftyPitcher, isLeftyBatter);
    } else if (atBat.pitch !== undefined) {
      const pitch = convertPitchJson(
          atBat.pitch as PitchJson, isLeftyPitcher, isLeftyBatter);
      return pitch !== null ? [pitch] : [];
    }
  }
  return [] as Pitch[];
}

function findHalfInningPitches(halfInning: InningHalf): Pitch[] {
  let pitches = [] as Pitch[];
  if (halfInning !== undefined) {
    if (isArray(halfInning.atbat)) {
      (halfInning.atbat as AtBat[]).forEach((atbat) => {
        pitches = pitches.concat(findAtBatPitches(atbat));
      });
    } else {
      pitches = findAtBatPitches(halfInning.atbat as AtBat);
    }
  }
  return pitches;
}

function findInningsPitches(inning: Inning[]|Inning): Pitch[] {
  let pitches = [] as Pitch[];
  // Annoyingly, MLB data is stored as an object if the element has one item,
  // if it has more than one item it is an array.
  if (isArray(inning)) {
    (inning as Inning[]).forEach((curInning) => {
      pitches = pitches.concat(findHalfInningPitches(curInning.top));
      pitches = pitches.concat(findHalfInningPitches(curInning.bottom));
    });
  } else {
    pitches = pitches.concat(findHalfInningPitches((inning as Inning).top));
    pitches = pitches.concat(findHalfInningPitches((inning as Inning).bottom));
  }
  return pitches;
}

export function convertCsvToPitch(row: string): Pitch {
  const v = row.split(',');
  let i = 0;
  return {
    des: safeStr(v[i++]),
    id: toInt(v[i++]),
    type: safeStr(v[i++]),
    code: safeStr(v[i++]),
    tfs_zulu: safeStr(v[i++]),
    x: parseFloat(v[i++]),
    y: parseFloat(v[i++]),
    start_speed: parseFloat(v[i++]),
    end_speed: parseFloat(v[i++]),
    sz_top: parseFloat(v[i++]),
    sz_bot: parseFloat(v[i++]),
    pfx_x: parseFloat(v[i++]),
    pfx_z: parseFloat(v[i++]),
    px: parseFloat(v[i++]),
    pz: parseFloat(v[i++]),
    x0: parseFloat(v[i++]),
    y0: parseFloat(v[i++]),
    z0: parseFloat(v[i++]),
    vx0: parseFloat(v[i++]),
    vy0: parseFloat(v[i++]),
    vz0: parseFloat(v[i++]),
    ax: parseFloat(v[i++]),
    ay: parseFloat(v[i++]),
    az: parseFloat(v[i++]),
    break_y: parseFloat(v[i++]),
    break_angle: parseFloat(v[i++]),
    break_length: parseFloat(v[i++]),
    pitch_type: safeStr(v[i++]),
    pitch_code: toInt(v[i++]),
    type_confidence: parseFloat(v[i++]),
    zone: parseFloat(v[i++]),
    nasty: parseFloat(v[i++]),
    spin_dir: parseFloat(v[i++]),
    spin_rate: parseFloat(v[i++]),
    left_handed_pitcher: toInt(v[i++]),
    left_handed_batter: toInt(v[i++])
  };
}

export function convertSZData(pitch: Pitch, isStrike: boolean): SZData {
  return {
    px: pitch.px,
    pz: pitch.pz,
    sz_top: pitch.sz_top,
    sz_bot: pitch.sz_bot,
    label: isStrike ? 0 : 1
  };
}

export function getGamePitches(gameJson: GameJson): Pitch[] {
  let pitches = [] as Pitch[];
  if (gameJson.game !== undefined && gameJson.game.inning !== undefined) {
    pitches = findInningsPitches(gameJson.game.inning);
  }
  return pitches;
}
