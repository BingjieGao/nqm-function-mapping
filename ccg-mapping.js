module.exports = (function(){
  "use strict";
  const fs = require("fs");
  const path = require("path");
  const _ = require("lodash");
  const fileName = process.argv[2];
  const filePath = path.join(__dirname,fileName);
  const debug = require("debug")("ccg-mapping");
  let ccgObj = {};

  fs.readFile(filePath,{encoding:"utf-8"},(err,csvData) => {
    let csvDataArray = csvData.toString().split("\n");
    _.forEach(csvDataArray,(eachLine,j) => {
      let eachLineArray = eachLine.split(",");

      if(j>0 && !ccgObj[removeString(eachLineArray[3])] && eachLineArray[3]!== undefined){
        let thisObj = {};
        ccgObj[removeString(eachLineArray[3])] = removeString(eachLineArray[2]);
        let thisString = '"'+removeString(eachLineArray[3])+'":"'+removeString(eachLineArray[2])+'",';
        fs.appendFileSync("./rawFiles/ccg.json",thisString,{encoding:"utf-8"});
      }
    });
  });


  function removeString(string){
    debug(string);
    string = string.replace(/\"/gm,"");
    string = string.replace(/\'/gm,"");
    string = string.replace(/\\/gm,"");
    return string;
  }
}());