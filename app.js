const express = require('express');
const bodyParser = require('body-parser');
const request = require("request");
var moment = require('moment');
const port = process.env.PORT || 3000;
const driver = require('bigchaindb-driver');
const conn = require('./dbconfig/config');
const mongoose = require('mongoose');




const claimSchema = new mongoose.Schema({
    txnid : String,
    hospital : [{
      patient_id: String,
      adress_1: String,
      ssn: String,
      doctor: String,
      insured_name: String,
      adress2: String,
      death_date: String,
      doctor_number: String,
      birth_date: String,
      state: String,
      death_time: String,
      death_approval:String ,
      zipcode: String,
      cause: String,
      death_time_approval: String

    }],
    beneficiary: [{

    }],
    funeral: [{

    }],
    home: [{

    }]
});

const claimModel = mongoose.model('claimModel', claimSchema);

mongoose.connect('mongodb://kk1:1234@ds239368.mlab.com:39368/claim');
mongoose.connection.on('error', function (err) {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();

});



var app = express();
moment().format();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



app.get('/',(req,res) => {
  res.render('home')
});
app.get('/insurance',(req,res) => {
  res.render('insurance')
});
app.get('/funeral',(req,res) => {
  res.render('funeralHD')
});
app.get('/Benificiary',(req,res) => {
  res.render('Beneficiary')
});
app.get('/Health',(req,res) => {
  res.render('HealthDep')
});
app.get('/hospital',(req,res) => {
  res.render('hospital');
});

app.post('/transaction',(req,res) => {

  const namekey = new driver.Ed25519Keypair();

  console.log(namekey);

  let patient_id = req.body.patientid;

  const patientData = {
    patient_id :{
      'patient_id': req.body.patientid,
      'adress_1': req.body.adress1,
      'ssn': req.body.ssn,
      'doctor': req.body.doctor,
      'insured_name': req.body.insuredName,
      'adress2': req.body.adress2,
      'death_date': req.body.deathdate,
      'doctor_number': req.body.doctornumber,
      'birth_date': req.body.birthdate,
      'state': req.body.state,
      'death_time': req.body.deathtime,
      'death_approval': req.body.deathapproval,
      'zipcode': req.body.zipcode,
      'cause': req.body.cause,
      'death_time_approval': req.body.deathtimeapproval
    }
  };
  const metaData = {'hospital_name': 'ABCD Hospital'};

  const txCreatePatientData = driver.Transaction.makeCreateTransaction(
    patientData,
    metaData,
    [driver.Transaction.makeOutput(
       driver.Transaction.makeEd25519Condition(namekey.publicKey))
    ],
    namekey.publicKey

  );

  const txCreatePatientDataSigned = driver.Transaction.signTransaction(txCreatePatientData, namekey.privateKey);



  conn.postTransaction(txCreatePatientDataSigned)
        // Check status of transaction every 0.5 seconds until fulfilled
        .then(() => conn.pollStatusAndFetchTransaction(txCreatePatientDataSigned.id))
        .then(retrievedTx => console.log('Transaction', retrievedTx , 'successfully posted.'))
        // Check status after transaction has completed (result: { 'status': 'valid' })
        // If you check the status of a transaction to fast without polling,
        // It returns that the transaction is waiting in the 'backlog'
        .then(() => conn.getStatus(txCreatePatientDataSigned.id))
        .then(status => console.log('Retrieved status method 2: ', status))
        .then(() => dbInsert(txCreatePatientDataSigned))
        .then( () => res.send(txCreatePatientDataSigned));





});

let dbInsert = (txCreatePatientDataSigned) => {
  console.log('inside fb insert');
  console.log(txCreatePatientDataSigned.asset.data.patient_id.patient_id);
  var txn = new claimModel({
    hospital : [{
      patient_id: txCreatePatientDataSigned.asset.data.patient_id.patient_id,
      adress_1: txCreatePatientDataSigned.asset.data.patient_id.adress_1,
      ssn: txCreatePatientDataSigned.asset.data.patient_id.ssn,
      doctor: txCreatePatientDataSigned.asset.data.patient_id.doctor,
      insured_name: txCreatePatientDataSigned.asset.data.patient_id.insured_name,
      adress2: txCreatePatientDataSigned.asset.data.patient_id.adress2,
      death_date: txCreatePatientDataSigned.asset.data.patient_id.death_date,
      doctor_number: txCreatePatientDataSigned.asset.data.patient_id.doctor_number,
      birth_date: txCreatePatientDataSigned.asset.data.patient_id.birth_date,
      state: txCreatePatientDataSigned.asset.data.patient_id.state,
      death_time: txCreatePatientDataSigned.asset.data.patient_id.death_time,
      death_approval: txCreatePatientDataSigned.asset.data.patient_id.death_approval,
      zipcode: txCreatePatientDataSigned.asset.data.patient_id.zipcode,
      cause: txCreatePatientDataSigned.asset.data.patient_id.cause,
      death_time_approval: txCreatePatientDataSigned.asset.data.patient_id.death_time_approval
    }]
  });

  console.log('hello');
  txn.save().then(function (doc) {

            console.log('MongoDB Values');
            console.log('----------------------------------------');
           console.log(doc);
       }, function (e) {
           console.log(e)
       });
}

app.listen(port);
