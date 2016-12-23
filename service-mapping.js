module.exports = (function(){
  "use strict";
  var fs = require("fs");
  const path = require("path");
  const _ = require("lodash");
  const fileName = process.argv[2];
  const filePath = path.join(__dirname,fileName);
  const config = require("./config");
  const debug = require("debug")("service-mapping");
  const TdxApi = require("nqm-api-tdx");
  const Promise = require("bluebird");
  let parentName = null ,childName = null;

  fs = Promise.promisifyAll(fs);
  //let csvData = null;

  var fileRead = function(){
    return fs.readFileAsync(filePath,{encoding:"utf-8"})
          .then((csvData) => {
            let csvDataArray = csvData.toString().split("\n");
            debug("csvData array length is %d",csvDataArray.length);
            return Promise.all(_.map(csvDataArray,(eachLine,j) => {
              let mapObj = null;
              if(j === 0){
                parentName = eachLine.split(",")[3];
                childName = eachLine.split(",")[0];
              }
              if(j > 0){
                let eachLineArray = eachLine.split(",");
                mapObj = {
                  parent_id: eachLineArray[3],
                  child_id: eachLineArray[0],
                  parent_type: "CCG16CD",
                  child_type: childName
                };
                return (mapObj);
              }
            }));
          })
          .then((result) => {
            //debug(result);
            let entryArray = [];
            _.forEach(result,(res) => {
              if(res !== undefined && res["parent_id"] !== undefined){
                entryArray.push(res);
              }
            });
            return entryArray;
          })
      .then((result) => {
        return result;
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
        debug(result[4]);
        result = result.slice(7000,7578);
        tdxApi.addDatasetData(config.serviceMapId,result,(err,response) => {
          if(err){
            debug("error add datasetdata to mapping dataset %s",JSON.stringify(err));
          }else{
            debug(response);
          }
        });
      });
    }
  });
}());