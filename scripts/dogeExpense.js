
const {spaceSplit, newLineSplit, purify, slice, spaceJoin} = require('./utils.js')

const oneArgSlice = slice(3)
const lastChar = slice(-1)

const buildDescription = cmdArr => {
  const newArr = oneArgSlice(purify(cmdArr))
  let description = []
  let i = 0
  while(lastChar(newArr[i]) != "\"") {
    description.push(newArr[i])
    i++
  }
  description.push(newArr[i])

  return {description: spaceJoin(description),
    catagories: newArr.slice(i + 1, newArr.length)}
}

module.exports = (robot) => {

  robot.respond(/(expense create)/i, (msg) => {
    msg.reply('Hi, welcome to expense creator. I accept the following format for expenses: \n \n `<date(DD/MM/YYYY)> <amount(in USD)> <"description of purchase"> <categories(seperated by comma)>`\n \n here is an example: \n `10/28/2018 130.20 "Such wow dog treats...for a client of course!" food`')
  })

  robot.hear(/([0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9])/i, function (msg){
    const {description, catagories} =  buildDescription(spaceSplit(msg.message.text))

    const expenseObj = {
      date: spaceSplit(msg.message.text)[1],
      amount: `$${spaceSplit(msg.message.text)[2]}`,
      description: description,
      catagories: catagories,
    }

    msg.reply(`Here is your expense: \n \n *date:* ${expenseObj.date} \n *amount:* ${expenseObj.amount} \n *description:* ${expenseObj.description} \n *catagories:* ${expenseObj.catagories} \n \n If the above looks correct respond by typing \`submit\``)
  })

  robot.hear(/(submit)/i, function (msg) {
    console.log('running post request!');
  })




}
