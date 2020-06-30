var express = require('express');
var router = express.Router();
var tplinkClient = require('../controller/tplinkClient');

var client = new tplinkClient();

router.get('/', function(req, res, next) {
  res.send(client.getStatus());
});

module.exports = router;
