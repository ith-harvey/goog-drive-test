const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')

const path = require('path');
const credentialPath = path.join(__dirname, '..', '..', 'client_secret.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'credentials.json';



// need function that checks if auth is fresh
// if not fresh it runs the process and gets fresh authtoken
function postExpense(auth, expenseObj, msg) {
  const sheets = google.sheets({version: 'v4', auth})
  sheets.spreadsheets.values.append({
    spreadsheetId: '11tC3V-TV3VLinv3P9bWaeNHxy4wR4H10PtHROfcFwi4',
    range: 'Sheet1!C4:I',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[expenseObj.date, expenseObj.name, expenseObj.office, expenseObj.team, expenseObj.catagory, expenseObj.description, expenseObj.amount]]
    }
    }, (err, response) => {
    if (err) {
      console.error('sheets error ->', err);
      msg.reply(`error posting to google sheet: ${err}`)
    }

    console.log('successfully posted to sheets!');
    msg.reply(':ballot_box_with_check: successfully sent expense to master google sheet')
  });
}

function authAndPostExpense(expenseObj, msg) {
  fs.readFile(credentialPath, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), postExpense, expenseObj, msg)
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, expenseObj, msg) {
  const {client_secret, client_id, redirect_uris} = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback, expenseObj, msg)
    oAuth2Client.setCredentials(JSON.parse(token))

    callback(oAuth2Client, expenseObj, msg)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback, expenseObj, msg) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client, expenseObj, msg)
    })
  })
}




module.exports = {
  authAndPostExpense
}
