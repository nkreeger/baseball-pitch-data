// tslint:disable-next-line:max-line-length
import {generatePitchTypeTrainingData, generateStrikeZonePitchTrainingData} from './data';

// TODO(kreeger): add more if needed.
const dataFiles = ['2017_pitches.json', '2016_pitches.json'];
generatePitchTypeTrainingData(dataFiles, 'test.json', 100);
generateStrikeZonePitchTrainingData(dataFiles, 'test2.json', 100);