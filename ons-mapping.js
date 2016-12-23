module.exports = (function(){
  "use strict";
  var fs = require("fs");
  const path = require("path");
  const _ = require("lodash");
  const debug = require("debug")("ons-mapping");
  const TdxApi = require("nqm-api-tdx");
  const Promise = require("bluebird");
  const config = require("./config");
  const fileName = process.argv[2];
  const filePath = path.join(__dirname,fileName);
  let parentName = null ,childName = null;

  fs = Promise.promisifyAll(fs);

  var fileRead = function(){
    return fs.readFileAsync(filePath,{encoding:"utf-8"})
      .then((csvData) => {
        let csvDataArray = csvData.toString().split("\n");
        return Promise.all(_.map(csvDataArray,(eachLine,j) => {
          let mapObj = null;
          if(j === 0){
            parentName = removeString(eachLine.split(",")[2]);
            childName = removeString(eachLine.split(",")[0]);
          }
          if(j > 0){
            let eachLineArray = eachLine.split(",");
            mapObj = {
              parent_id: eachLineArray[2]?removeString(eachLineArray[2]):eachLineArray[2],
              child_id: eachLineArray[0]?removeString(eachLineArray[0]):eachLineArray[0],
              parent_type: parentName,
              child_type: childName
            };
            return (mapObj);
          }
        }));
      })
      .then((result) => {
        let entryArray = [];
        debug(result[2]);
        _.forEach(result,(res) => {
          if(res !== undefined && res["parent_id"] !== undefined){
            entryArray.push(res);
          }
        });
        return entryArray;
      })
      .catch((e) => {
        debug("err readfile");
      });
  };

  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost
  };
  var tdxApi = new TdxApi(tdxConfig);

  tdxApi.authenticate(config.shareKeyId,config.shareKeySecret,(err,accessToken) => {
    if(err)
      debug("tdx authentication error %s",err);
    else{
      fileRead().then((result) => {
        debug("result length is %d",result.length);
        result = result.slice(30000,32844);
        tdxApi.addDatasetData("HkezkASNQx",result,(err,response) => {
          if(err){
            debug("error add datasetdata to mapping dataset %s",JSON.stringify(err));
          }else{
            debug(response);
          }
        });
      });
    }
  });
  function removeString(string){
    string = string.replace(/\"/gm,"");
    string = string.replace(/\'/gm,"");
    string = string.replace(/\\/gm,"");
    return string;
  }

}());