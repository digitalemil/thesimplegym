var express = require('express');
var router = express.Router();
var app = express();
var url = require('url');
const axios = require("axios");

let model ="";
let nlisteners = 3;

let msgs1000= new Array();
let n1000= 0;

let json = new String(process.env.APPDEF);
json = json.replace(/\'/g, '\"');
let appdef = JSON.parse(json);
let fields = new Array();
let types = new Array();

for (var i = 0; i < appdef.fields.length; i++) {
  fields[i] = appdef.fields[i].name;
  types[i] = appdef.fields[i].type;
}

var messages = new Object();
var nmessages = 0;
var messageoffset = -1;
let listener = process.env.LISTENER;
let domain = process.env.DOMAIN;


async function getDataFromListeners() {
  try {
    for (let i = 0; i < nlisteners; i++) {
      let h;
      let p= "/model";
      if (listener == "")
        h = "http://" + domain;
      else
        h = "http://" + listener + "-" + i + "." + domain;
      let result = "";
      try {
        result = await axios.post(h+p, model);
      }
      catch (err) {
        console.log("Can't get data from Listener: " + err.response.status + " from: " + h + " " + process.env.LISTENER+" "+process.env.DOMAIN);
        continue;
      }
      p= "/data";
      try {
        result = await axios.get(h+p);
      }
      catch (err) {
        console.log("Can't get data from Listener: " + err.response.status + " from: " + h + " " + process.env.LISTENER+" "+process.env.DOMAIN);
        continue;
      }
      if (result.status != 200)
        continue;
      hrdataMessageHandler(result.data);
    }
    emitData();
    setTimeout(getDataFromListeners, 500);
  }
  catch (ex) {
    console.log(ex);
    setTimeout(getDataFromListeners, 500);
  }
};
getDataFromListeners();

function hrdataMessageHandler(msgs) {
  try {
    Object.keys(msgs).forEach(user=> {
      if(messages[user]== undefined || Date.parse(messages[user].event_timestamp)< Date.parse(msgs[user].event_timestamp))
        messages[user]= msgs[user];
    })
    msgs1000[n1000]= msgs[user];
    n1000++;
    if(n1000== 1000)
        n1000= 0;    
  }
  catch (err) {
    console.log(err + " " + msgs);
  }
};

router.get(['/arch.html'], function (req, res, next) {
  res.render('architecture', { title: 'The Gym' });
});

router.get(['/listener.html'], function (req, res, next) {
  res.render('listener', { nl: nlisteners });
});

router.get(['/1000messages.html'], function (req, res, next) {
    for(let i= 0; i< msgs1000.length; i++) {
     for(let j= 0; j< fields.length; j++) {
        res.write(msgs[i][fields[j]]);
        if(j< fields.length-1)
            res.write(",");
        res.write("\n");
     }
    }
  res.statusCode= 200;
  res.end();
});

router.get(['/setlisteners'], function (req, res, next) {
  nlisteners= parseInt(req.query.nl);
  console.log("Listeners set to: "+nlisteners);
  res.render('home', { table: appdef.table, keyspace: appdef.keyspace });
});


router.get(['/version.html'], function (req, res, next) {
  res.render('version', { secret: "", version: "0.0.1" });
});

router.get(['/', '/index.html'], function (req, res, next) {
  res.render('index', { title: appdef.name, name: appdef.name });
});


router.get(['/home.html'], function (req, res, next) {
  res.render('home', { table: appdef.table, keyspace: appdef.keyspace });
});

router.get(['/map.html'], function (req, res, next) {
  res.render('map', { table: appdef.table, keyspace: appdef.keyspace, name: "" });
});

router.get(['/mapdata'], function (req, res, next) {
  let data = new Object();
  data.total = nmessages;
  data.locations = new Array();
  console.log("Data: " + JSON.stringify(data));

  let j = 0;
  let now = new Date().getTime();
  let maxoffset = 0;
  for (var key in messages) {
    let location = new Object();
    let dt = location.event_timestamp;
    let ms = new Date(dt).getTime();
    if (now > ms + 1000 * 60) {
      delete messages.key;
      continue;
    }
    let latlong = messages[key].location.split(",");
    location.latitude = latlong[0];
    location.longitude = latlong[1];
    location.n = 1;
    data.locations[j++] = location;
  }
  data.maxoffset = maxoffset;
  res.write(JSON.stringify(data));
  res.end();
});

router.get(['/data.html'], function (req, res, next) {
  let f;
  f = "<p><div>id:</div> " + "<input id='id' style='width: 80%;height: 5%;background-color: #A0A0A0';type='text' value='" + new Date().getTime() + "'></input>";
  f += "<p>";
  if (appdef.showLocation) {
    f += "<div>location:</div> " + "<input id='location' style='width: 80%;height: 5%;background-color: #A0A0A0;' type='text' value=''></input>";
    f += "<p>";
  }
  f += "<div>event_timestamp:</div> " + "<input id='timestamp' style='width: 80%;height: 5%;background-color: #A0A0A0;' type='text' value=''></input>";
  f += "<p>";
  let sf = '';
  for (let i = 0; i < fields.length; i++) {
    if (fields[i] === "id" || fields[i] === "location" || fields[i] === "event_timestamp")
      continue;

    sf += "json+= ', \"" + fields[i] + "\":\"'+document.getElementById('" + fields[i] + "').value+'\"';";
    f += "<div>" + fields[i] + ":</div> <input id='" + fields[i] + "' style='width: 80%;height: 5%;background-color: #A0A0A0;' type='text' value=''></input>";
    f += "<p>";
  }

  res.render('data', { title: appdef.name, name: appdef.name, fields: f, showLocation: appdef.showLocation, getFields: sf });
});

router.post(['/model'], function (req, res, next) {
  let m = req.body;
  m = m.replace(/\"/g, '\'');
  model = m;
  res.end();
});

router.get(['/model'], function (req, res, next) {
  res.write(model);
  console.log(model);
  res.end();
});


router.get(['/model.html', 'thegym/model/html'], function (req, res, next) {
  res.render('model', { table: appdef.table, keyspace: appdef.keyspace, name: appdef.name });
  res.end();
});

function emitData() {
  let d = sessionData();
  io.emit("session", d);
};

function sessionData() {
  let ret = "{\"session\":{\"begincomment\":null,\"dayssince01012012\":0,\"dummy\":null,\"endcomment\":null,\"ended\":null,\"groupid\":{\"id\":1,\"name\":\"Default\"},\"id\":0,\"start\":0},\"users\":[";

  let data = new Array();

  let i = 0;
  let first = true;
  let now = new Date().getTime();

  for (var key in messages) {
    try {
      let dt = messages[key].event_timestamp;
      let em = false;
      if (dt == "")
        em = true;
      dt = dt.replace('T', ' ');
      dt = new Date(dt);
      let ms = dt.getTime();
      if (now > ms + 1000 * 60 || em) {
        delete messages[key];
        continue;
      }
    }
    catch (ex) {
      console.log(ex);
    }

    let color = messages[key].color;
    let hr = messages[key].heartrate;
    let user = messages[key].user;
    let deviceid = messages[key].deviceid;
    if (!first)
      ret += ", ";
    else
      first = false;
    ret += "{\"calories\":\"\",\"color\":\"" + color + "\",\"hr\":\"" + hr + "\",\"name\":\"" + user + "\",\"recovery\":\"\",\"deviceid\":\"" + deviceid + "\"}";
  }
  ret = ret + "]}";

  return ret;
};
module.exports = router;


