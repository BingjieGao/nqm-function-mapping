module.exports = (function(){
  "use strict";
  const path = require("path");
  const log = require("debug");
  const debug = require("debug")("poplet-mapping");
  const config = require("./config");
  const _ = require("lodash");
  const Promise = require("bluebird");
  const TdxApi = require("nqm-api-tdx");
  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost,
    accessTokenTTL: config.accessTokenTTL,
  };
  var tdxApi = new TdxApi(tdxConfig);
  let CCGObj = {};
  let CCGArray = [];
  var areaObj = {};

  var popletMap = function(ccg_obj,ccg_array,index){
    var serviceIdArray = ccg_obj[ccg_array[index]];
    var ccg_code = ccg_array[index];
    debug("serviceIdArray length is %d",serviceIdArray.length);
    var serviceFilterArray = [];
    _.forEach(serviceIdArray,(serviceId) => {
      var fieldExist = '{"ratio.'+serviceId+'":{"$exists":true}}';
      fieldExist = JSON.parse(fieldExist);
      serviceFilterArray.push(fieldExist);
    });
    let serviceFilter = {
      "$or":serviceFilterArray
    };
    var req = function(){
      return tdxApi.getDatasetDataAsync(config.ratioId,serviceFilter,null,{limit:20000})
          .then((response) => {
            var ratioData = response.data;
            debug("retrived ratioData length is %d",ratioData.length);
            return Promise.all(_.map(ratioData,(areaId) => {
              if(!areaObj[areaId["area_id"]]){
                areaObj[areaId["area_id"]] = 1;
                let dataObj = {
                  parent_id:ccg_code,
                  child_id:areaId["area_id"],
                  parent_type:"CCG16CD",
                  child_type: "LSOA11CD"
                };  
                return(dataObj);
              }else{
                return({});
              }
            }));
            //return result;
          })
          .then((result) =>{
            //debug(result);
            let entryList = [];
            _.forEach(result,(val) => {
              if(!_.isEmpty(val)){
                entryList.push(val);
              }
            });
            return entryList;
          })
          .catch((e) => {
            debug("mapping error with poplet-mapping to ccg %s",e);
          });
    };
    req().then((result) => {
      debug(result);
      debug("add DatasetData length is %d",result.length);
      tdxApi.addDatasetData(config.popletMapId,result,(err,response) => {
        if(err){
          debug(err);
        }else{
          debug("index now is %d",index);
          popletMap(ccg_obj,ccg_array,index+1);
        }
      });
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
    //popletMap(CCGObj,CCGArray,0);
  };

  tdxApi.authenticate(config.shareKeyId,config.shareKeySecret,(err,accessToken) => {
    if(err){
      debug("error suthentication with tdx %s",err);
    }else{
      tdxApi.getDatasetData(config["serviceMapId"],null,null,{limit:7956},(err,serviceData) => {
        tdxApi = Promise.promisifyAll(tdxApi);
        dataChange(serviceData.data);
      });
    }
  });
}());