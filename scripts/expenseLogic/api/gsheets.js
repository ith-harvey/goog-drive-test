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

const greaterThanExpenseLimit = (numToCompare, expenseLim, team) => {
  if (numToCompare > expenseLim) {
    return Promise.reject(expenseResp.failTeamExpenseLimitHit(team))
  }
  return Promise.resolve()
}

function authAndGetActiveEmploy(msg) {
  return loadClientSecret()
  .then(authorize)
  .then(getActiveEmployees)
  .then(response => {
    let activEmployeeObj = {}
    let username = `@${msg.message.user.name}`

    // build activEmployeeObj
    response.values.forEach( row => {
      if (!row[3]) return // removes all people who havent setup rocket.chat
      activEmployeeObj[row[3]] = row[0]
    })

    if (activEmployeeObj[username] === undefined) {
      return {outcome: false, explain: expenseResp.notMkrEmp()}

    } else if ((activEmployeeObj[username] === 'yes')
    || (activEmployeeObj[username].slice(0,5) === 'until')) {
      return {outcome:true, explain: expenseResp.activMkrEmp()}

    } else {
      return {outcome: false, explain: expenseResp.notMkrEmp()}
    }
  }).catch(err => {
    console.log('promise err!', err);
    return {outcome: false, explain: err}
  })
}

function authAndPostExpense(expenseObj) {
  return loadClientSecret()
  .then(authorize)
  .then(authCred => postExpense(authCred, expenseObj))
  .catch(error => Promise.reject(expenseResp.failPostToGoogSheet(error)))
}

function authAndCheckTeamLimit(expenseObj) {
  return loadClientSecret()
  .then(authorize)
  .then(authCred => getTeamMonthlyExpenseTotal(authCred))
  .then(response => {

    // newTeamExpenseSum = adds currentTeamExpenseSum with users new expense
    let newTeamExpenseSum = response.values.filter(TeamExpenseTot => TeamExpenseTot[0] === expenseObj.team)[0][1].slice(1)

    newTeamExpenseSum = parseFloat(newTeamExpenseSum.replace(',',''))

    newTeamExpenseSum = newTeamExpenseSum + Number(expenseObj.amount)

    if (expenseObj.team === 'executive') {
      return greaterThanExpenseLimit(newTeamExpenseSum, 25000, expenseObj.team)
    } else {
      return greaterThanExpenseLimit(newTeamExpenseSum, 10000, expenseObj.team)
    }
  })
}

function authAndGetEthAddr(expenseObj) {
  return loadClientSecret()
  .then(authorize)
  .then(authCred => getEthAddress(authCred))
  .then(response => {
    let ethAddrObj = {}
    let username = `@${expenseObj.name}`
    // build ethAddrObj
    response.values.forEach(row => {
      if (!row[0]) return // removes all people who havent setup rocket.chat
      ethAddrObj[row[0]] = row[1]
    })

    if (ethAddrObj[username] === undefined) {
      return Promise.reject(expenseResp.failEthAddrRetreive(error))
    } else if (ethAddrObj[username]) {
      return Promise.resolve(ethAddrObj[username])
    } else {
      return Promise.reject(expenseResp.failEthAddrRetreive(error))
    }
  })
}

function postExpense(auth, expenseObj) {
  const sheets = google.sheets({version: 'v4', auth})
  const todaysDateInUTC = FU.getTodaysDateInUTC()
  expenseObj.amount = `$${expenseObj.amount}`
  return sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOG_EXPENSE_SHEET_ID,
    range: 'Sheet1!A3:N',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[todaysDateInUTC, expenseObj.date, '', expenseObj.name, expenseObj.office, expenseObj.team, expenseObj.catagory, expenseObj.description, '', expenseObj.amount, expenseObj.invoiceURL, expenseObj.userEthAddr, '', 'DAI']]
    }
  })
}

function getTeamMonthlyExpenseTotal(auth) {
  const sheets = google.sheets({version: 'v4', auth})
  return new Promise( (resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOG_EXPENSE_SHEET_ID,
      range: 'Sheet1!P2:Q10',
      }, (err, response) => {
      if (err) {
        console.error('sheets error ->', err);
        reject(err)
      }
      resolve(response.data)
    });
  })
}

function getEthAddress(auth) {
  const sheets = google.sheets({version: 'v4', auth})
  return new Promise( (resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOG_ADDR_SHEET_ID,
      range: 'Sheet1!B2:C',
      }, (err, response) => {
      if (err) {
        console.error('sheets error ->', err);
        reject(err)
      }
      resolve(response.data)
    });
  })
}

function getActiveEmployees(auth) {
  const sheets = google.sheets({version: 'v4', auth})
  return new Promise( (resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOG_EMPLOY_SHEET_ID,
      range: 'A12:D81',
      }, (err, response) => {
      if (err) {
        console.error('sheets error ->', err);
        reject(err)
      }
      resolve(response.data)
    });
  })
}





module.exports = {
  authAndPostExpense,
  authAndGetActiveEmploy,
  authAndGetEthAddr,
  authAndCheckTeamLimit
}
