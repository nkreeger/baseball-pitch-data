import * as rp from 'request-promise-native';
import {isArray} from 'util';
import {toJson} from 'xml2json';

const BASE_URL = 'http://gd2.mlb.com/components/game/mlb/';
const REGEX = /\Sgid_\d+_\d+_\d+_\w+\//g;
const INNINGS_FILE_PATH = 'inning/inning_all.xml'

type Game = {
  atBat: string,
  inning: Inning | Inning[]
}

type Inning = {
  num: string,
  away_team: string,
  home_team: string,
  next: string,
  top: InningHalf,
  bottom: InningHalf
}

type InningHalf = {
  atbat: AtBat | AtBat[]
}

type AtBat = {
  num: string,
  b: string,
  s: string,
  o: string,
  start_tfs: string,
  start_tfs_zulu: string,
  end_tfs_zulu: string,
  batter: string,
  stand: string,
  b_height: string,
  pitcher: string,
  p_throws: string,
  des: string
  event_num: string,
  event: string,
  play_guid: string,
  pitch: Pitch|Pitch[]
}

type Pitch = {
  des: string,
  id: string,
  type: string,
  code: string,
  tfs: string,
  tfs_zulu: string,
  x: string,
  y: string,
  event_num: string,
  sv_id: string,
  play_guid: string,
  start_speed: string,
  end_speed: string,
  sz_top: string,
  sz_bot: string,
  pfx_x: string,
  pfx_z: string,
  px: string,
  pz: string,
  x0: string,
  y0: string,
  z0: string,
  vx0: string,
  vy0: string,
  vz0: string,
  ax: string,
  ay: string,
  az: string,
  break_y: string,
  break_angle: string,
  break_length: string,
  pitch_type: string,
  type_confidence: string,
  zone: string,
  nasty: string,
  spin_dir: string,
  spin_rate: string,
}

type GameJson = {
  game: Game
}

function getGamesList(content: string): string[] {
  return content.match(REGEX);
}

function handleAtBat(atbat: AtBat): string[] {
  let pitches = [] as string[];
  if (isArray(atbat.pitch)) {
    atbat.pitch.forEach((pitch) => { pitches.push(pitch.pitch_type); });
  } else {
    console.log('atbat.pitch', atbat.pitch);
    pitches.push(atbat.pitch.pitch_type);
  }
  return pitches;
}

function handleInningHalf(half: InningHalf): string[] {
  if (isArray(half.atbat)) {
  } else {
  }
}

function handleInning(inning: Inning): string[] {
  let pitches = [] as string[];
  if (inning.top !== undefined) {
    pitches.push(handleAtBat(inning.top));
    // inning.top.atbat
  }
  if (inning.bottom !== undefined) {
  }
}

function extractPitches(json: GameJson): Pitch[] {
  let pitches = [] as Pitch[];
  const game = json.game;
  if (isArray(game.inning)) {
    game.inning.forEach((inning) => { handleInning(inning); });
  } else {
    handleInning(game.inning);
  }
  return pitches;
  // console.log(json.game.inning[0].top.atbat[0].pitch[0].pitch_type);
}

export async function loadTest() {
  const test = 'year_2018/month_04/day_02';
  const path = BASE_URL + test;

  let games: string[] = [];
  await rp.get(path, {}, (error, response, body) => {
    if (error) {
      throw new Error(`Error: ${error}`);
    }
    games = getGamesList(body);
  });

  games.forEach(async(game) => {
    const inningsPath = path + games[0] + INNINGS_FILE_PATH;
    await
        rp.get(inningsPath, {}, (error, res, body) => {
            if (error) {
              throw new Error(`Error: ${error}`);
            }
            const json = toJson(body, {object: true});
            const pitches = extractPitches(json as GameJson);
            console.log('pitches', pitches);
            // handleGame(json as GameJson);

          }).catch(() => {});
  });
}