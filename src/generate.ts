// tslint:disable-next-line:max-line-length
import {generateStrikeZonePitchTrainingData} from './model-data';

// TODO(kreeger): add more if needed.
const dataFiles = ['2017_pitches.json', '2016_pitches.json'];

// generatePitchTypeTrainingData(dataFiles, 'pitch_type_training_data.json',
// 1000);
// generatePitchTypeTrainingData(
//     ['2016_pitches.json'], 'pitch_type_training_data.json', 100);

generateStrikeZonePitchTrainingData(
    dataFiles, 'strike_zone_training_data.csv', 100);

// generateStrikeZonePitchTrainingData(
//     dataFiles, 'strike_zone_training_data.json', 2000);
// generateStrikeZonePitchTrainingData(
//     ['2016_pitches.json'], 'strike_zone_test_data.json', 100);