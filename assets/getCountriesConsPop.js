import populationPerCapConversion from './populationPerCapConversion.js';

export default function getCountriesConsPop(){
  
    let nrows = document.querySelector("#API_table_consumption > tbody").childElementCount;
    //console.log("nrows:",nrows);

    let countries = [];
    let selector = "";
    let selectors = [];
    for(let i = 1; i < nrows; i++){
      selector = "#c_row" + (i);
      console.log(selector);
      let elem = document.querySelector(selector);
      countries.push(elem.value);
      selectors.push(selector);
    }
    //console.log(countries);
    let year = document.querySelector("#pop_year").value;
    console.log(year)
    let pop = 0;
    let poparray = [];
    for(let i = 0; i < countries.length; i++){
      pop = populationPerCapConversion(countries[i],year);
      //console.log("pop:",countries[i],pop);
      poparray.push(pop);
    }

    let returnvar = {countries,selectors,poparray}

    return returnvar;
}