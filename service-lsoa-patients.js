module.exports = (function(){
  "use strict";
  const fs = require("fs");
  const path = require("path");
  const fileName = process.argv[2];
  const filePath = path.join(__dirname,fileName);
  const _ = require("lodash");
  const debug = require("debug")("patients-mapping");

  fs.readFile(filePath,(err,csvData) => {
    var csvDataArray = csvData.toString().split("\n");
    _.forEach(csvDataArray,(csvLine,i) => {
      if(i>0 && i%2 === 1){
        var csvLineArray = csvLine.toString().split(",");
        var cellIndex = null;
        _.forEach(csvLineArray,(csvCell,j) => {
          if(csvCell === "LSOA_CODE"){
            cellIndex = j;
          }else if(j >= cellIndex && cellIndex !== null && csvCell.length>0 && csvCell !== undefined && csvCell.indexOf("E")!== -1){
            var serviceObj = {
              parentId:csvLineArray[0],
              parentType:"PRACTICE_CODE",
              childId:csvCell,
              childType:"LSOA11CD"
            };
            var thisString = JSON.stringify(serviceObj)+"\n";
            fs.appendFileSync("./jsonFiles/poplet-mapping.json",thisString,{enconding:"utf-8"});
          }
        });
      }
    });
  });
  debug("saved");
}());