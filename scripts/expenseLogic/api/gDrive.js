
const rp = require('request-promise')

const fs = require('fs')
const readline = require('readline')

const {google} = require('googleapis')
const {authorize, getNewToken} = require('./gsuiteAuth.js')


const {FU, RBU} = require('../../utils')
const {readFilePromise} = FU

const expenseResp = require('../responses.js')

const path = require('path');
const credentialPath = path.join(__dirname, '..', '..', '..', 'client_secret.json');

const loadClientSecret = () => readFilePromise(credentialPath)

// async function runSample (fileName) {
//   const fileSize = fs.statSync(fileName).size;
//   const res = await drive.files.create({
//     requestBody: {
//       // a requestBody element is required if you want to use multipart
//     },
//     media: {
//       body: fs.createReadStream(fileName)
//     }
//   }, {
//     // Use the `onUploadProgress` event from Axios to track the
//     // number of bytes uploaded to this point.
//     onUploadProgress: evt => {
//       const progress = (evt.bytesRead / fileSize) * 100;
//       process.stdout.clearLine();
//       process.stdout.cursorTo(0);
//       process.stdout.write(`${Math.round(progress)}% complete`);
//     }
//   });
//   console.log(res.data);
//   return res.data;
// }

//
function authAndUploadInvoice(buffer, expenseObj) {
  return loadClientSecret()
  .then(authorize)
  .then(authCred => uploadInvoice(authCred, buffer, expenseObj))
  .catch(error => Promise.reject(`error in upload${error}`))
}

async function uploadInvoice(authCred, buffer, expenseObj) {
  const drive = google.drive({version: 'v3', authCred})
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, function(err, result) {
    if(err) console.log('err ->',err);
    else console.log('result ->',result);
  });
}

//   const dateInFileFormat = expenseObj.date.replace('/','_').replace('/','_')
//   return dbx.filesUpload({path: `/MakerDAO/doge_expense_bot/invoices/${expenseObj.team}/${expenseObj.name}_${expenseObj.catagory}_${dateInFileFormat}${expenseObj.invFileType}`, contents: buffer, autorename: true})

module.exports = {
  authAndUploadInvoice
}
