import csv from 'csv-to-json';

const obj = { filename: './data/testers.csv' };

function writeJSON(err, json) {
  console.log(json);
};

csv.parse(obj, writeJSON);
