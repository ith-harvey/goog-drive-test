
const path = require("path");
const childProcess = require('child_process')
const {FU, RBU} = require('./utils')

const {Gsheets, Dropbox} = require('./expenseLogic/api')

// functional Utilities
const {spaceSplit, prop, equalModifier, newLineSplit, modObjKickBack, purify, slice, compose, spaceJoin, defaultJoin, remove, execPromise} = FU

// Robot Brain Utilities
const {newUserCheckAndCreate} = RBU

const expenseResp = require('./expenseLogic/responses')
const Misc = require('./expenseLogic/misc.js')
const isExpenseValid = require('./expenseLogic/validate.js')

const checkTeamExpenseLimit = (team) => execPromise(`ledger bal Assets:${team} -f "${path.resolve(__dirname)}/expenseLogic/ledgerAccFiles/currentMonthAcc.dat"`)

const removeDoge = remove('doge')
const parseRemoveDoge = compose(spaceJoin, removeDoge, spaceSplit)

const removeSpace = remove(' ')
const parseRemoveSpace = compose(defaultJoin, removeSpace, spaceSplit)
const parseRemoveSpaceArr = compose(removeSpace, spaceSplit)
const oneArgSlice = slice(2)
const lastChar = slice(-1)

const ChatURL = 'http://159.65.101.16:3000'

const buildDescription = cmdArr => {
  const newArr = oneArgSlice(purify(cmdArr))
  let description = []
  let i = 0

  while (lastChar(newArr[i]) != "\"") {
    description.push(newArr[i])
    i++
  }
  description.push(newArr[i])

  return {description: spaceJoin(description),
    catagory: spaceJoin(newArr.slice(i + 1, newArr.length)).trim()}
}

module.exports = (robot) => {

  let expenseObj = {}

  // use bool variables to accept / reject user input depending on what stage of the expense they are in
  let awaitingOffice = false
  let awaitingTeam = false
  let awaitingExpense = false
  let awaitingSubmit = false
  let awaitingInvoiceUpload = false

  robot.respond(/(expense setup)/i, (msg) => {
    msg.reply('Hi, welcome to expense setup wizard. Please select which office you work for or are permenently based out of: \n \n *New York City* \n *Santa Cruz* \n *China* \n *Copenhagen* \n *Remote*')
    awaitingOffice = true
  })

  robot.hear(/(New York City|Santa Cruz|China|Copenhagen|Remote)/i, (msg) => {
    console.log('heard it!', msg.message.text);
    if (awaitingOffice) {
      msg.message.text = parseRemoveDoge(msg.message.text)

      newUserCheckAndCreate(robot, msg.message.user.id)

      //addOffice and get back userObj
      const addOffice = modObjKickBack('office', msg.message.text)

      robot.brain.set(msg.message.user.id, addOffice(robot.brain.get(msg.message.user.id)))

      msg.reply('Thank you, now please respond with which team (provided in bold) you are apart of: \n \n *Executive* \n *Marketing* \n *Oasis* \n *Market Making* \n *Legal* \n *Code Development* -> (dapphub, etc) \n *Integrations* \n *Business Dev* \n *Other*')

      awaitingOffice = false
      awaitingTeam = true
    }
  })

  robot.hear(/(Executive|Marketing|Oasis|Market Making|Legal|Code Development|Integrations|Business Dev|Other)/i, (msg) => {
    if (awaitingTeam) {
      msg.message.text = parseRemoveDoge(msg.message.text)

      //addTeam and get back userObj
      const addTeam = modObjKickBack('team', msg.message.text)

      robot.brain.set(msg.message.user.id, addTeam(robot.brain.get(msg.message.user.id)))

      msg.reply('Thank you for using the setup wizard, you can now enter expenses with the command `@doge expense create`')
      awaitingTeam = false
    }
  })

  robot.respond(/(expense create)$/i, (msg) => {

    if (Misc.checkIfUserIsSetup(robot, msg.message.user.id)) {
      return msg.reply('To use the `@doge expense create` feature you must first go through the setup wizard. Do so by typing the command `@doge expense setup`.')
    }

    Gsheets.authAndGetActiveEmploy(msg).then(response => {
      const {outcome, explain} = response
      if (!outcome) {
        // problem with request to goog sheet or they are not an active employee
        return msg.reply(explain)
      }
      //active employee
      msg.reply(expenseResp.create())
      awaitingExpense = true
    })
  })

  robot.hear(/(.*)/i, function (msg) {
    const incomingText = parseRemoveDoge(msg.message.text)

    if (awaitingExpense && (/^[0-9]*$/i.test(incomingText[0]))) {

      const {outcome, explain} = isExpenseValid.surfaceCheck(incomingText)

      if (outcome) {
        //destructure and grab description, catagory, office and team
        const {description, catagory} =  buildDescription(spaceSplit(incomingText))

        const {office, team} = robot.brain.get(msg.message.user.id)

        expenseObj = {
          office, team, description, catagory,
          name: msg.message.user.name,
          date: spaceSplit(incomingText)[0],
          amount: spaceSplit(incomingText)[1]
        }

        expenseObj = Misc.objectToLowerCase(expenseObj)

        msg.reply(expenseResp.textUploaded(expenseObj))
        awaitingInvoiceUpload = true

      } else {
        msg.reply(explain)
        awaitingInvoiceUpload = false
      }
      awaitingExpense = false
    }
  })

  robot.hear(/(.*)/i, function (msg) {
    if (awaitingInvoiceUpload && msg.message.attachment.title_link) {
      expenseObj.invFileType = msg.message.attachment.title.substr(msg.message.attachment.title.length - 4)
      msg.reply(expenseResp.pdfReceived())
      expenseObj.downloadLink = `${ChatURL}${msg.message.attachment.title_link}`
      awaitingInvoiceUpload = false
      awaitingSubmit = true
    }
  })


  robot.hear(/(submit)/i, function (msg) {

    if (awaitingSubmit) {
      let valid = {}
      valid.synDeepCheck = isExpenseValid.deepCheck(expenseObj)

      if (!valid.synDeepCheck.outcome) { // compile and return validation errors
        let validationErrors = ''
        valid.synDeepCheck.explain.forEach( valErr => validationErrors += `:x:${valErr} \n`)
        return msg.reply(`Your expense was not valid in the following areas: \n ${validationErrors} \n please re attempt the expense by typing \`@doge expense create\``)
      }
      msg.reply(`:ballot_box_with_check:${valid.synDeepCheck.explain}`)

      // either pass message into each Promise OR wait untill the last .then and compile all successes

      Gsheets.authAndCheckTeamLimit(expenseObj)
      .then(RBU.getAuthToken)
      .then(resp => Dropbox.downloadInvoice(expenseObj.downloadLink, resp.data.authToken, resp.data.userId))
      .then(fileContent => Dropbox.uploadInvoice(fileContent, expenseObj))
      .then(resp => {
        expenseObj.invoiceURL = `https://dropbox.com/home/${resp.path_lower}`
        return Gsheets.authAndGetEthAddr(expenseObj)
      }).then(resp => {
        expenseObj.userEthAddr = resp
        return Gsheets.authAndPostExpense(expenseObj)
      })
      .then(response => {
        msg.reply(`:ballot_box_with_check: Expense submission was successful`)
      }).catch( error => {
        msg.reply(`:x: ${error}`)
        console.log('error', error);

        // Notify Accountant that someone is attempting to over withdraw
        if (error.slice(0,26) === 'Unfortunatley your expense') {
          RBU.sendUserMessage(expenseResp.notifyExpAlert(expenseObj, FU), robot, `iant`)
        }

      })
      awaitingSubmit = false
    }
  })

}
