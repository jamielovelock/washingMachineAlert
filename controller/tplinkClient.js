
const axios = require('axios');

var config = require('../config/config.json');
var credentials = require('../config/creds.json');
var oldPowerConsumption = null;
var currentPowerConsumption = null;


var inUse = false;

let consuptionHistory = [];


class tplinkClient {

    constructor() {


        axios({
            method: 'post',
            url: config.serverURL,
            data: {
                "method": config.methods.LOGIN,
                "params": {
                    "appType": config.appType,
                    "cloudUserName": credentials.tpLinkUsername,
                    "cloudPassword": credentials.tpLinkPassword,
                    "terminalUUID": credentials.tpLinkUUID
                }
            }
        }).then(function(response){
            let apiToken = (response.data.result.token);

            setInterval(function () {
                //console.log("the api token " + apiToken);

                axios({
                    method: 'post',
                    url: config.serverURL + "/?token=" + apiToken,
                    data: {
                        "method": config.methods.PASSTHROUGH,
                        "params": {
                            "deviceId": credentials.tpLinkDeviceID,
                            "requestData": {
                                "emeter": {
                                    "get_realtime": {}
                                }
                            }
                        }
                    }
                }).then(function(response){
                    let realtime_power = response.data.result.responseData.emeter.get_realtime;
                    //  console.log(realtime_power);
                    currentPowerConsumption = realtime_power.power_mw;
                    consuptionHistory.push(currentPowerConsumption);
                    if (consuptionHistory.length > 9) {
                        consuptionHistory.shift();
                    }
                    var sum = consuptionHistory.reduce((a, b) => a + b, 0);
                    var avg = (sum / consuptionHistory.length) || 0;

                    if (inUse == false){
                        console.log("In use == false - Power Consumption: " + currentPowerConsumption);
                    }
                    if (consuptionHistory.length >= 9 && avg > config.powerLevels.inUse){
                        console.log("In use == true - Avg Power = " + avg)
                        inUse = true;
                    }

                    if (inUse && consuptionHistory.length >= 9 && avg < config.powerLevels.idle){
                        //Returning to idle.
                        inUse = false;
                        //we're in a idle state after being high.
                        console.log("ALERT - WASHING HAS FINISHED")

                        var Push = require('pushover-notifications')

                        var p = new Push({
                            user: config.pushover.user,
                            token: config.pushover.token,
                        })

                        var msg = {
                            // These values correspond to the parameters detailed on https://pushover.net/api
                            // 'message' is required. All other values are optional.
                            message: "Washing machine finished"
                        }

                        p.send(msg, function (err, result) {
                            if (err) {
                                throw err
                            }

                            console.log(result)
                        })
                    }
                    oldPowerConsumption = currentPowerConsumption;
                });


            }, config.pollingRate);
        });
    }

    getStatus() {
        return {"Power Consumption": currentPowerConsumption, "Historic Power Consuption": consuptionHistory};
    }


}

module.exports = tplinkClient;