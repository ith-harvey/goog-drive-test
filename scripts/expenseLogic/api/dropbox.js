require('dotenv').config()
require('isomorphic-fetch'); // or another library of choice.
const fs = require('fs');
const http = require('http');

const Dropbox = require('dropbox').Dropbox;
const request = require('request');
const dbx = new Dropbox({ accessToken: process.env.DROP_BOX_SECRET });

function downloadInvoice(downloadUrl, token, botId) {
  const options = {
    method: 'GET',
    url: downloadUrl,
    headers:{
        Cookie: `rc_uid=${botId}; rc_token=${token};`
    },
    encoding: null
  }
  return new Promise( (resolve, reject) => {
    request(options, function (error, response, body) {
      error ? reject(`\`@doge\` is having trouble downloading the expense you uploaded:${error}`) : ''

      const buffer = Buffer.from(body, 'utf8');
      resolve(buffer)
    });
  })
}

function uploadInvoice(buffer, expenseObj) {
  const dateInFileFormat = expenseObj.date.replace('/','_').replace('/','_')
  // let updateObj = {tag: }
  return dbx.filesUpload({path: `/MakerDAO/doge_expense_bot/invoices/${expenseObj.team}/${expenseObj.name}_${expenseObj.catagory}_${dateInFileFormat}${expenseObj.invFileType}`, contents: buffer, autorename: true})
}

module.exports = {uploadInvoice, downloadInvoice}
