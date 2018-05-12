
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
  return spaceJoin(description)
}


module.exports = (robot) => {
  let expenseObj = {}

  robot.respond(/(expense create)/i, (msg) => {
    msg.reply('Hi, welcome to expense creator. I accept the following format for expenses: \n \n `<date(DD/MM/YYYY)> <amount(in USD)> <"description of purchase"> <categories(seperated by comma)>`\n \n here is an example: \n `10/28/2018 130.20 "Such wow dog treats...for a client of course!" food`')
  })

  robot.hear(/([0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9])/i, function (msg){

    console.log('here is what comes in', msg.message.text);

    expenseObj = {
      date: spaceSplit(msg.message.text)[1],
      amount: Number(spaceSplit(msg.message.text)[2]),
      description: buildDescription(spaceSplit(msg.message.text)),
    }

    console.log('expense obj', expenseObj);




  })




}
