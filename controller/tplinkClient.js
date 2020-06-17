const axios = require('axios');
let credentials = require('../config/creds.json');
let config = require('../config/config.json');

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
    let oldPowerConsumption = null;

    setInterval(function(){
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
            let currentPowerConsumption = realtime_power.power_mw;

            //console.log("Current Power Consumption: " + currentPowerConsumption);
            if (oldPowerConsumption != null && oldPowerConsumption > config.powerLevels.idle && currentPowerConsumption <= config.powerLevels.inUse){
                //we're in a idle state after being high.
                console.log("ALERT - WASHING HAS FINISHED")
            }
            console.log("States: " + JSON.stringify({"old" : oldPowerConsumption, "new": currentPowerConsumption}));
            oldPowerConsumption = currentPowerConsumption;
        });


    }, config.pollingRate);
});