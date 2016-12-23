module.exports = (function(){
  "use strict";
  const TdxApi = require("nqm-api-tdx");
  const _ = require("lodash");
  const config = require("./config");
  const debug = require("debug")("neighbour-subtract");
  const Promise = require("bluebird");
  const fs = require("fs");
  const path = require("path");


  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost
  };

  var tdxApi = new TdxApi(tdxConfig);

  tdxApi.authenticate(config.shareKeyId,config.shareKeySecret,(err,accessToken)=>{
    if(err){
      debug("tdx authenticate error %s",err);
    }else{
      var pipeline = [
        {
          $group:{
            _id:"$parentId",
            LSOA:{
              $push:"$childId"
            }
          }
        },
        {
          $sort:{
            _id:1
          }
        }
      ];
      var pipelineIncludes = [
        {
          $match:{
            parent_type:"CTY15CD",
            child_type:"LSOA11CD",
            mapping_type:"ONS-mapping"
          }
        },
        {
          $group:{
            _id:"$parent_id",
            LSOA:{
              $push:"$child_id"
            }
          }
        },
        {
          $sort:{
            _id:1
          }
        }
      ];
      tdxApi.getAggregateData("r1elnlfuEg",JSON.stringify(pipeline),(err,groupData) => {
        tdxApi.getAggregateData("BJxI_V4rVg",JSON.stringify(pipelineIncludes),(err,includeData) => {
          //debug(includeData);
          Promise.all(_.map(groupData.data,(groupVal,i) => {
            debug(groupVal.LSOA.length);
            var childArray = [].concat(groupVal.LSOA);
            _.forEach(includeData.data[i].LSOA,(lsoaCode) => {
              childArray = _.without(childArray,lsoaCode);
            });
            debug(childArray.length);
            debug(groupVal.LSOA.length);
            var eachObj = {
              parentId:groupVal._id,
              childArray:childArray
            };
            return (eachObj);
          }))
          .then((result) => {
            _.forEach(result,(val) => {
              _.forEach(val.childArray,(lsoa) => {
                var thisObj = {
                  parentId:val.parentId,
                  childId:lsoa,
                  parentType:"CTY15CD",
                  childType:"LSOA11CD",
                  mappingType:"5m-neighbour-mapping"
                };
                var thisString = JSON.stringify(thisObj)+"\n"; 
                fs.appendFileSync(getPath("5m-neighbour.json"),thisString,{encoding:"utf-8"});
              });
            });
          })
          .catch((e) => {
            debug(e);
          });
        });
      });
    }
  });

  function getPath(fileName){
    return path.join(__dirname,path.join("jsonFiles",fileName));
  }

}());