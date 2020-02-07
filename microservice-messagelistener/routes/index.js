let express = require('express');
let router = express.Router();
const axios = require("axios");

let msgs= new Object();

let laststatus= "";
let lastmsg= "";
let lastmodel= ""
let evaluatedmessages= new Object();

let jsonappdef= new String(process.env.APPDEF);
jsonappdef= jsonappdef.replace(/\'/g, '\"');

let appdef= JSON.parse(jsonappdef);
let fields= new Array(); 
let types= new Array();

for(let i= 0; i< appdef.fields.length; i++) {
  fields[i] = appdef.fields[i].name;
  types[i] = appdef.fields[i].type;
}

async function addEvaluatedMessage(msg) {
  try {
    let json= JSON.parse(msg);
    if(msgs[json.user]==undefined ||  Date.parse(json.event_timestamp)> Date.parse(msgs[json.user].event_timestamp)) {
        msgs[json.user]= json;
        io.emit("logs", msgs);
    }
  }
  catch(e)  {
    console.log(e);
    console.log(msg);
  }
  //console.log(msgs);
}

async function validate(msg) {
  let result= "";
  try {
    result= await axios.post(process.env.MESSAGE_VALIDATOR, msg);
  }
  catch(err) {
    console.log("Message validation failed: "+err.response.status+ " "+msg+" "+process.env.MESSAGE_VALIDATOR);   
    return false;
  }
  if(result.status!= 200)
    return false;
  //console.log("Message validated. "+result.status);
  return true;
};

async function transform(msg) {
  let result= "";
  try {
    result= await axios.post(process.env.MESSAGE_TRANSFORMER, msg);
  }
  catch(err) {
    console.log("Message transformation failed: "+err.response.status+ " "+msg+" "+process.env.MESSAGE_TRANSFOMER);   
    return undefined;
  }
  if(result.status!= 200)
    return undefined;
  return JSON.stringify(result.data);
}

async function evaluateMessageWithModel(msg, model) {
  if(model== undefined || model=="")
    return msg;
   // console.log("Evaluating msg with model");
    let jsonmsg= JSON.parse(msg);
    jsonmsg.model= model;
    let result= "";
    try {
      result= await axios.post(process.env.PMML_EVALUATOR, jsonmsg);
    }
    catch(err) {
      console.log(err);
      console.log("PMML evaluation failed: "+err.response.status+ " "+msg+" "+process.env.PMML_EVALUATOR);   
      return undefined;
    }
    if(result.status!= 200)
      return undefined;

    let color= "-1"; 
    color= result.data;
     if(color=="-1")
       color="0x80FFFFFF";    
     if(color=="1")
       color="0x80FF0000";
     if(color=="0")
       color="0x8000FF00";
     jsonmsg.color= color;
    
    delete jsonmsg.model;
    return JSON.stringify(jsonmsg);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: "Message Listener", status: laststatus });
});

/* Post model */
router.post('/model', async function(req, res, next) {
  lastmodel= req.body;
  res.statusCode= 200;
  res.write("OK");
  res.end();
});

async function handleMessage(msg) {
  let m= await transform(msg);
  
  if(!await validate(m)) {
    console.log("Can't validate msg: "+ msg);
    laststatus= 400;
  }
  else {
   // console.log("Received msg: "+msg);
    laststatus= 200;
  }

  if(laststatus== 200) {
    return await evaluateMessageWithModel(m, lastmodel);
  }
  return undefined;
};

/* Post data to transform, validate & evaluate */
router.post('/', async function(req, res, next) {
  lastmsg= req.body;
  laststatus= 200;
  try {
    let m= await handleMessage(lastmsg);
    if(m!= undefined) {
      await addEvaluatedMessage(m);
    }
    else {
        console.log("Message damaged: "+ lastmsg);
    } 
  }
  catch(ex) {
    laststatus= 500;
  }

  res.statusCode= laststatus;
  res.end();
});

router.get('/data', function(req, res, next) {
  res.write(JSON.stringify(msgs))
  res.end();
});

module.exports = router;

