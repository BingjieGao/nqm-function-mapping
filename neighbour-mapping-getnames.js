module.exports = (function(){
  "use strict";
  const TdxApi = require("nqm-api-tdx");
  const _ = require("lodash");
  const config = require("./config");
  const debug = require("debug")("neighbour-getnames");
  const Promise = require("bluebird");
  const fs = require("fs");
  const path = require("path");
  const boundaryId = "H1lOtScIVg";
  const oldMapId = "SkxyHi_MR";


  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost
  };

  var tdxApi = new TdxApi(tdxConfig);
  const pipeline = [
    {
      $match: {
        mappingType: "5m-neighbour-mapping"
      }
    },
    {
      $sort: {
        parentId: 1
      }
    },
    {
      $limit: 3000
    }
  ];

  tdxApi.authenticate(config.shareKeyId,config.shareKeySecret,(err, accessToken)=>{
    if(err){
      debug("tdx authenticate error %s",err);
    } else {
      tdxApi.getAggregateData(boundaryId,JSON.stringify(pipeline),(err, response) => {
        if (err){
          debug(err);
        } else {
          getNames(response.data,0);
        }
      });
    }
  });

  function getNames(dataArray, index){
    tdxApi.getDatasetData(oldMapId,{"child_id":dataArray[index]["childId"]}, null, {limit:1}, (err,childObj) => {
      if (err){
        debug(err);
      } else {
        tdxApi.getDatasetData(oldMapId,{"parent_id":dataArray[index]["parentId"]}, null, {limit:1},(err, parentObj) => {
          if (err){
            debug(err);
          } else {
            var thisObj = {
              parentType: dataArray[index]["parentType"],
              parentId: dataArray[index]["parentId"],
              parentName: parentObj.data[0]["parent_name"],
              childType: dataArray[index]["childType"],
              childId: dataArray[index]["childId"],
              childName: childObj.data[0]["child_name"]
            };
            var thisString = JSON.stringify(thisObj)+"\n";
            fs.appendFile(getPath("5m-neighbour-names.json"),thisString,{encoding:"utf-8"}, (err) => {
              if (err){
                debug(err);
              } else {
                if (index+1 < dataArray.length-1){
                  getNames(dataArray, index+1);
                }
              }
            });
          }
        });
      }
    });
  }

  function getPath(fileName){
    return path.join(__dirname,path.join("jsonFiles",fileName));
  }

}());