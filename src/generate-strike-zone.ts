// tslint:disable-next-line:max-line-length
import {generateStrikeZonePitchTrainingData} from './model-data';

const dataFiles = [
  '2018_pitches.json', '2017_pitches.json', '2016_pitches.json',
  '2015_pitches.json'
];

generateStrikeZonePitchTrainingData(
    dataFiles, 'strike_zone_training_data.json', 1000);

// TODO - sample from another source.
generateStrikeZonePitchTrainingData(
    dataFiles, 'strike_zone_test_data.json', 100);
