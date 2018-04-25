// tslint:disable-next-line:max-line-length
import {generatePitchTypeTrainingData, generateStrikeZonePitchTrainingData} from './model-data';

const dataFiles = [
  '2017_pitches.json', '2016_pitches.json', '2015_pitches.json',
  '2014_pitches.json'
];

generatePitchTypeTrainingData(dataFiles, 'pitch_type_training_data.json', 1000);
generatePitchTypeTrainingData(dataFiles, 'pitch_type_test_data.json', 100);

generateStrikeZonePitchTrainingData(
    dataFiles, 'strike_zone_training_data.json', 1000);
generateStrikeZonePitchTrainingData(
    dataFiles, 'strike_zone_test_data.json', 100);
