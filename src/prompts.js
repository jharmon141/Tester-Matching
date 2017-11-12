import Prompt from 'prompt-checkbox';

export default class __Prompts {
  constructor(props) {
    super(props);

    this.promptCountry = new Prompt ({
      message: "Please choose a country or countries (For all countries select 'ALL'):",
      name: "country",
      choices: {
        ALL: availableCountries 
      }
    });

    this.promptDevice = new Prompt ({
      type: "checkbox",
      message: "Choose the device(s) you would like to test:",
      name: "devices",
      choices: {
        ALL: availableDevices
      }
    });
  }
}
