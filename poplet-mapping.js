module.exports = (function(){
  "use strict";
  const debug = require("debug")("poplet-mapping");
  const config = require("./config");
  const _ = require("lodash");
  const Promise = require("bluebird");
  const TdxApi = require("nqm-api-tdx");
  const fs = require("fs");

  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost,
    accessTokenTTL: config.accessTokenTTL,
  };
  var tdxApi = new TdxApi(tdxConfig);
  let CCGObj = {};
  let CCGArray = [];

  var popletMap = function(ccg_obj,ccg_array,index){
    var serviceIdArray = ccg_obj[ccg_array[index]];
    var ccg_code = ccg_array[index];
    var areaObj = {};
   
    //debug("serviceIdArray length is %d",serviceIdArray.length);

    var serviceMapPipeline = [{
      $match:{
        parentId:{
          $in:serviceIdArray
        }
      }
    }];

    var req = function(){
      return tdxApi.getAggregateDataAsync(config.serviceLSOAmap,JSON.stringify(serviceMapPipeline))
          .then((response) => {
            var ratioData = response.data;
            var ratioDataLength = ratioData.length;
            debug("retrived ratioData length is %d",ratioData.length);
            debug("this ccg code is %s",ccg_code);
            return Promise.all(_.map(ratioData,(areaId) => {
              if(!areaObj[areaId["childId"]]){
                areaObj[areaId["childId"]] = 1;
                let dataObj = {
                  parentId:ccg_code,
                  childId:areaId["childId"],
                  parentType:"CCG16CD",
                  childType: "LSOA11CD"
                };  
                var thisString = JSON.stringify(dataObj)+"\n";
                fs.appendFileSync("./jsonFiles/poplet-mapping-ccg.json",thisString,{encoding:"utf-8"});
                return(dataObj);
              }else{
                return({});
              }
            }));
            //return result;
          })
          .then((result) =>{
            let entryList = [];
            _.forEach(result,(val) => {
              if(!_.isEmpty(val)){
                entryList.push(val);
              }
            });
            return entryList;
          })
          .catch((e) => {
            debug("error CCG code is %s",ccg_code);
            debug("mapping error with poplet-mapping to ccg %s",e);
          });
    };
    req().then((result) => {
      //debug(result);
      debug("add DatasetData length is %d",result.length);
      if(index<208){
        popletMap(ccg_obj,ccg_array,index+1);
      }
      // fs.appendFile("./jsonFiles/poplet-mapping-ccg.json",thisString,{encoding:"utf-8"},(err) => {
      //   if(err){
      //     debug(err);
      //   }else if(index<208){
      //     debug("index now is %d",index);
      //     popletMap(ccg_obj,ccg_array,index+1);
      //   }
      // });
      // tdxApi.addDatasetData(config.popletMapId,result,(err,response) => {
      //   if(err){
      //     debug(err);
      //   }else{
      //     debug("index now is %d",index);
      //     popletMap(ccg_obj,ccg_array,index+1);
      //   }
      // });
    });
  };

  var dataChange = function(serviceData){
    _.forEach(serviceData,(serviceId) => {
      if(!CCGObj[serviceId["parent_id"]]){
        CCGObj[serviceId["parent_id"]]=[];
        CCGArray.push(serviceId["parent_id"]);
      }
      CCGObj[serviceId["parent_id"]].push(serviceId["child_id"]);
    });
    debug("CCGObj length is %d",Object.keys(CCGObj).length);
    popletMap(CCGObj,CCGArray,0);
  };

  tdxApi.authenticate(config.shareKeyId,config.shareKeySecret,(err,accessToken) => {
    if(err){
      debug("error authentication with tdx %s",err);
    }else{
      tdxApi.getDatasetData(config["serviceMapId"],null,null,{sort:{"parent_id":1},limit:7956},(err,serviceData) => {
        tdxApi = Promise.promisifyAll(tdxApi);
        dataChange(serviceData.data);
      });
    }
  });
}());