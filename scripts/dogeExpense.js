

const {FU, RBU} = require('./utils')

const {authAndPostExpense, authAndGetActiveEmploy} = require('./expenseLogic/APIResource.js')

// functional Utilities
const {spaceSplit, prop, equalModifier, newLineSplit, modObjKickBack, purify, slice, compose, spaceJoin, remove} = FU

const removeDoge = remove('doge')
const parseRemoveDoge = compose(spaceJoin, removeDoge, spaceSplit)

// Robot Brain Utilities
const {newUserCheckAndCreate} = RBU

const Misc = require('./expenseLogic/misc.js')

const isExpenseValid = require('./expenseLogic/validate.js')

const oneArgSlice = slice(2)
const lastChar = slice(-1)

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
    catagory: spaceJoin(newArr.slice(i + 1, newArr.length))}
}

  const getActEmplCallback = (expenseObj, msg, response) => {

    if (response) {
      let activEmployeeObj = {}
      let username = `@${msg.message.user.name}`

      // build activEmployeeObj
      response.values.forEach( row => {
        if (!row[3]) return // removes all people who havent setup rocket.chat
        activEmployeeObj[row[3]] = row[0]
      })

      console.log('pulling @zandy', activEmployeeObj[username]);
      console.log('id incoming', username);


      if (activEmployeeObj[username] === undefined) {
        return msg.reply(`You are not setup as an active Maker employee and therefore cannot post an expense. If you beleive this is a mistake or an error please reach out to the expense bot creator \`@iant\`.`)

      } else if ((activEmployeeObj[username] === 'yes')
      || (activEmployeeObj[username].slice(0,5) === 'until')) {
        msg.reply(`:ballot_box_with_check: You are an active employee at Maker.`)
        authAndPostExpense(expenseObj, msg)

      } else {
        return msg.reply(`You are not setup as an active Maker employee and therefore cannot post an expense. If you beleive this is a mistake or an error please reach out to the expense bot creator \`@iant\`.`)
      }
    }
  }

module.exports = (robot) => {
  let expenseObj = {}

  // use bool variables to accept / reject user input depending on what stage of the expense they are in
  let awaitingOffice = false
  let awaitingTeam = false
  let awaitingExpense = false
  let awaitingSubmit = false

  robot.respond(/(expense setup)/i, (msg) => {
    msg.reply('Hi, welcome to expense setup wizard. Please select which office you work for or are permenently based out of: \n \n *New York City* \n *Santa Cruz* \n *China* \n *Copenhagen* \n *Remote*')
    awaitingOffice = true
  })

  robot.hear(/(New York City|Santa Cruz|China|Copenhagen|Remote)/i, (msg) => {
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

  robot.respond(/(expense create)/i, (msg) => {
    if (Misc.checkIfUserIsSetup(robot, msg.message.user.id)) {
      return msg.reply('To use the `@doge expense create` feature you must first go through the setup wizard. Do so by typing the command `@doge expense setup`.')
    }

    msg.reply('Hi, welcome to expense creator. I accept the following format for expenses: \n \n `<date(DD/MM/YYYY)> <amount(in USD)> <"description of purchase"> <category>`\n \n Expense catagories (only apply one catagory to one expense): \n *Accomodation* \n *Flight* \n *Train* \n *Lyft* \n *Uber* \n *Taxi* \n *Breakfast* \n *Lunch* \n *Dinner* \n *Drinks* \n *Conference Sponsorship* \n *Conference Tickets* \n *Parking* \n *Gym Membership* \n *Bug Bounties* \n *Rent* \n *Maker Clothing* \n *Other* \n \n Example: \n `10/28/2018 130.20 "Such wow dog treats...for a client of course!" lunch`')

    awaitingExpense = true
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

        msg.reply(`Here is your expense: \n \n *office:* ${expenseObj.office} \n *team:* ${expenseObj.team} \n *date:* ${expenseObj.date} \n *amount:* ${expenseObj.amount} \n *description:* ${expenseObj.description} \n *catagory:* ${expenseObj.catagory} \n \n If the above looks correct respond by typing \`submit\``)
        awaitingSubmit = true

      } else {
        msg.reply(explain)
        awaitingSubmit = false
      }
      awaitingExpense = false

    }
  })

  robot.hear(/(submit)/i, function (msg) {

    if (awaitingSubmit) {
      const {outcome, explain} = isExpenseValid.deepCheck(expenseObj)

      authAndGetActiveEmploy(expenseObj, msg, getActEmplCallback)

      awaitingSubmit = false
    }
  })

}
