module.exports = (function(){
  "use strict";
  const TdxApi = require("nqm-api-tdx");
  const _ = require("lodash");
  const myTokenID = "BJxDTAMqW";
  const myTokenSecret = "1234554321s";
  const neighbourDatasetId = "rJgEpMGno";
  const config = require("./config");
  const debug = require("debug")("neighbour-mapping");
  const fs = require("fs");
  const path = require("path");
  const Promise = require("bluebird");
  var mappingId = 0;


  var configOld = {
    commandHost: "https://cmd.nqminds.com",
    queryHost: "https://q.nqminds.com"  
  };
  var tdxConfig = {
    commandHost: config.commandHost,
    queryHost: config.queryHost
  };
  var tdxApiOld = new TdxApi(configOld);
  var tdxApiNew = new TdxApi(tdxConfig);

  Promise.promisifyAll(tdxApiNew);

  tdxApiNew.authenticate(config.shareKeyId,config.shareKeySecret,(err,accessToken) => {
    if(err){
      debug(err);
    }else{
      var pipeline = [
        {
          $match:{
            parent_type:"CTY15CD",
            child_type: "LAD15CD",
            mapping_type:"ONS-mapping"
          }
        },
        {
          $sort:{
            parent_id:1
          }
        },
        {
          $group:{
            _id:"$parent_id",
            LADcodes:{
              $push:"$child_id"
            }
          }
        }
      ];
      tdxApiNew.getAggregateData("BJxI_V4rVg",JSON.stringify(pipeline),(err,CTYObj) => {
        debug("retrive unique CTY code length is "+CTYObj.data.length);
        neighbourLSOAs(tdxApiOld,CTYObj.data,0,(err,res) => {
          if(err){
            debug("err getting neighbour data %s",JSON.stringify(err));
          }else{
            debug(res);
          }
        });
      });
    }
  });


  function neighbourLSOAs(tdxApi,CTYObj,index,cb){
    var pipeline = [
      {
        $match:{
          parent_id:{
            $in: CTYObj[index]["LADcodes"]
          }
        }
      }
    ];

    tdxApi.getAggregateData(neighbourDatasetId,JSON.stringify(pipeline),(err,neighbours) => {
      if(err){
        cb(err,null);
      }else{
        debug(CTYObj[index]["_id"]);
        var neighbourIdArray = [];
        Promise.all(_.map(neighbours.data,(neighbourObj) => {
          var neighbourId = null;
          if(neighbourIdArray.indexOf(neighbourObj["neighbour_id"]) === -1){
            neighbourIdArray.push(neighbourObj["neighbour_id"]);
            neighbourId = neighbourObj["neighbour_id"];
          }
          var eachObj = {
            mappingId:mappingId,
            parentId:CTYObj[index]["_id"],
            parentType:"CTY15CD",
            childType: neighbourObj["neighbour_type"],
            childId: neighbourId,
            mappingType:"5m-neighbour-mapping"
          };
          mappingId += 1;
          return (eachObj);
        }))
        .then((result) =>{
          _.forEach(result,(val) => {
            if(val.childId !== null){
              val = JSON.stringify(val)+"\n";
              fs.appendFileSync(getPath("neighbour.json"),val,{encoding:"utf-8"});
            }
          });
          if(index<CTYObj.length-1){
            neighbourLSOAs(tdxApi,CTYObj,index+1,cb);
          }else{
            cb(null,"TRUE");
          }
        })
        .catch((e) => {
          cb(e,null);
        });
        // _.forEach(neighbours,(neighbourId) => {
        //   var eachObj = {
        //     parentId:CTYObj.data[index]["parent_id"],
        //     parentType: CTYObj.data[index]["parent_type"],
        //     childType: neighbourId["neighbour_type"],
        //     childId: neighbourId["neighbourId"]
        //   };
        //   var thisString = JSON.stringify(eachObj)+"\n";
        //   fs.appendFileSync(getPath("neighbour.json"),thisString,{encoding:"utf-8"});
        // });
        
      }
    });
  }
  function getPath(fileName){
    return path.join(__dirname,path.join("jsonFiles",fileName));
  }

}());