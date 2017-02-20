module.exports = (function(){
  "use strict";
  var TdxApi = require("nqm-api-tdx");
  const _ = require("lodash");
  const fs = require("fs");
  const path = require("path");
  const config = require("./config.json");
  const debug = require("debug")("addDatasetData");

  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost
  };
  var tdxApi = new TdxApi(tdxConfig);

  tdxApi.getDatasetData("SylOOZvVQl",null,null,{limit:7578},(err,targetData) => {
    if (err){
      debug(err);
    } else {
      _.forEach(targetData.data,(data) => {
        var thisObj = {};
        thisObj["parentType"] = data["parent_type"];
        thisObj["parentId"] = data["parent_id"];
        thisObj["childType"] = data["child_type"];
        thisObj["childId"] = data["child_id"];
        thisObj["mappingType"] = "service-mapping";
        thisObj["parentName"] = "";
        thisObj["childName"] = "";

        var thisString = JSON.stringify(thisObj)+"\n";
        fs.appendFileSync(getPath("mapping3.json"),thisString,{encoding:"utf-8"});
      });

      debug("data saved");
    }
  });

  function getPath(fileName){
    return path.join(__dirname,path.join("jsonFiles",fileName));
  }

}());