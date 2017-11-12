import Prompt from 'prompt-checkbox';
import Table from 'cli-table'; 
import mysql from 'mysql';
import 'console.table';

var availableTesters = []; //[{testerId, firstName, lastName, lastLogin}]
var availableDevices = []; // [{deviceId, description}]
var availableCountries = []; //[countries]
var deviceIDs = [];

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "test_match"
});

const promptCountry = new Prompt ({
  message: "Please choose a country or countries (For all countries select 'ALL'):",
  name: "country",
  choices: {
    ALL: availableCountries 
  }
});

const promptDevice = new Prompt ({
  type: "checkbox",
  message: "Choose the device(s) you would like to test:",
  name: "devices",
  choices: {
    ALL: availableDevices
  }
});

on();

async function on() {
  await setAvailableCountriesAndTesters();
  await setAvailableDevices();
  promptUser();
}

function promptUser() {
  promptCountry.run()
    .then(countryAnswer => {
      promptDevice.run()
        .then(deviceAnswer => {
          searchForTesters(countryAnswer, deviceAnswer);
        })
        .catch(err => {
          console.log(err);
        })
    })
    .catch(err => {
      console.log(err);
    })
}

async function searchForTesters(countries, devices) {
  let filteredTesters;

  if (devices[0] !== "ALL" && countries[0] !== "ALL") {
    //filter testers by country
    filteredTesters = filterTestersByCountry(countries, availableTesters);
    //get filtered list of tests available devices
    const testersDevices = await getTestersDevices(filteredTesters);
    //filter out testers that do not have device
    filteredTesters = filterTestersByDevices(devices, testersDevices, filteredTesters);
  }
  else if (devices[0] !== "ALL" && countries[0] === "ALL") {
    filteredTesters = availableTesters;
    const testersDevices = await getTestersDevices(filteredTesters);
    filteredTesters = filterTestersByDevices(devices, testersDevices, filteredTesters);
  }
  else if (countries[0] !== "ALL" && devices[0] === "ALL") {
    filteredTesters = filterTestersByCountry(countries, availableTesters);
  }
  else filteredTesters = availableTesters

  // sortAndPrintTesters(searchForBugs(filteredTesters, deviceIDs));
  console.table(await searchForBugs(filteredTesters, deviceIDs));

  // console.table(filteredTesters);
  process.exit();
}

function searchForBugs(testers, devices) {
  let testerIDS = [];

  testers.forEach((tester, i) => {
    testerIDS.push(tester.testerId);
  });

  return new Promise ( (resolve, reject) => {
    connection.query('SELECT * from bugs WHERE testerId IN (' + testerIDS.join() + ') AND WHERE deviceId IN (' + devices.join() + ')', (err, rows) => {
      if (err) throw err;
      resolve(rows);
    });

  });
}

function filterTestersByDevices(devices, testersDevices, testers) {
  let testersIDs = [];
  let filteredTesters = [];

  //set device Ids by looking them up in availableDevices
  devices.forEach(device => {
    availableDevices.forEach(aDevice => {
      if (device === aDevice.name) {
        deviceIDs.push(aDevice.deviceId);
      }
    });
  });

  //get ids of only testers that have these devices
  testersDevices.forEach(testerDevice => {
    deviceIDs.forEach(deviceID => {
      if (deviceID === testerDevice.deviceId && !testersIDs.includes(testerDevice.testerId)) {
        testersIDs.push(testerDevice.testerId);
      }
    });
  });

  //create array of filtered testers
  testersIDs.forEach(id => {
    availableTesters.forEach(tester => {
      if (id == tester.testerId) {
        filteredTesters.push(tester);
      }
    });
  });

  return filteredTesters;
}

function filterTestersByCountry(countries, testers) {
  let filteredTesters =[];

  countries.forEach( country => {
    testers.forEach(tester => {
      if (tester.country === country && !filteredTesters.includes(tester)) {
        filteredTesters.push(tester);
      }
    })
  })
  return filteredTesters;
}

function getTestersDevices(testers) {
  let testerIDS = [];

  testers.forEach((tester, i) => {
    testerIDS.push(tester.testerId);
  });

  return new Promise ( (resolve, reject) => {
    connection.query('SELECT * from tester_device WHERE testerId IN (' + testerIDS.join() + ')', (err, rows) => {
      if (err) throw err;
      resolve(rows);
    });

  });
}

function setAvailableCountriesAndTesters() {
  //sets available countries and testers
  return new Promise ( (resolve, reject) => {
    connection.query('SELECT * from testers', (err,rows) => {
      if (err) throw err;

      resolve(rows.forEach(tester => {
        availableTesters.push(tester);

        if (!availableCountries.includes(tester.country)) {
          availableCountries.push(tester.country);
        }
      }));
    });
  });
}

function setAvailableDevices() {
  return new Promise ( (resolve, reject) => {
    connection.query('SELECT * from devices', (err,rows) => {
      if (err) throw err;

      resolve(rows.forEach( device => {
        availableDevices.push( {deviceId: device.deviceId, name: device.description});
      }));
    });
  });
}
