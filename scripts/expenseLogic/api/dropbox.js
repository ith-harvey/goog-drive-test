// require('dotenv').config()
// require('isomorphic-fetch')
//
// const fs = require('fs')
// const http = require('http')
//
// const Dropbox = require('dropbox').Dropbox
// const request = require('request')
// const dbx = new Dropbox({ accessToken: process.env.DROP_BOX_SECRET })
//
// function uploadInvoice(buffer, expenseObj) {
//   const dateInFileFormat = expenseObj.date.replace('/','_').replace('/','_')
//   return dbx.filesUpload({path: `/MakerDAO/doge_expense_bot/invoices/${expenseObj.team}/${expenseObj.name}_${expenseObj.catagory}_${dateInFileFormat}${expenseObj.invFileType}`, contents: buffer, autorename: true})
// }
//
// module.exports = {uploadInvoice, downloadInvoice}
