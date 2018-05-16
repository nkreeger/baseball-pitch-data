// tslint:disable-next-line:max-line-length
import {generatePitchTypeTrainingData} from './model-data';

const dataFiles = [
  '2018_pitches.json', '2017_pitches.json', '2016_pitches.json',
  '2015_pitches.json'
];

generatePitchTypeTrainingData(dataFiles, 'pitch_type_training_data.json', 1000);
generatePitchTypeTrainingData(dataFiles, 'pitch_type_test_data.json', 100);
