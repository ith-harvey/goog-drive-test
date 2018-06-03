
const { FU } = require('./utils')
const {compose, spaceSplit, remove} = FU

const Helptxt = {
  cal: () => 'The `@doge cal suggest` bot is a meeting query tool that finds availability in users schedules and responds with suggested meeting times.\n \n There are several commands which allow you to change the window of your suggestion and the users (who are already setup) it includes. The commands are as follows: \n \n `@doge cal setup` : starts the setup wizard to get users up and running with the cal bot. \n `@doge cal suggest` : provides available meeting suggestions for today. \n `@doge cal suggest week` : provides available meeting suggestions for this week. \n `@doge cal suggest <month> <day>` : provides available meeting suggestions for the specified day. \n `@doge cal suggest week <month> <day>` : provides available meeting suggestions for that week starting on the specified day. \n `@doge cal suggest <users>` : provides available meeting suggestions for all included users, today. \n `@doge cal suggest <users> <month> <day>` : provides available meeting suggestions for all included users on the specified day. \n `@doge cal suggest <users> week` : provides available meeting suggestions for all included users on that week. \n `@doge cal suggest <users> week <month> <day>` : provides available meeting suggestions for all included users for that week, starting on the specified day. \n \n If you are still having trouble shoot a DM to the creator `@iant`.',

  tikz: () => 'The `@doge tikz create` bot is a `tikz-cd` processing tool that takes in tikz-cd code, transforms the code into a jpg then into a base64 image. The image is then uploaded to imgur.com and the user is provided a link to the image.\n \n The commands are as follows: \n \n `@doge tikz create` : provides user boilerplate instructions and instructs doge to receive and process your tikz code. \n \n `@doge tikz direct` : immediatley receives and processes your tikz code all in one command (NOTE: the tikz code should be pasted on a new line directly below the `@doge tikz direct` command). \n \n If you are still having trouble shoot a DM to the creator `@iant`.',

  expense: () => 'The `@doge expense create` bot is an expense processing tool that takes in a user\'s expense and posts their expense to a google sheet managed by Maker\'s accounting team. \n \n The commands are as follows: \n \n `@doge expense create` : provides user a list of viable expense catagories and the format with which to submit the expense. \n `@doge expense setup` : prompts user to go through the expense setup wizard allowing them to expense business related costs to Maker.\n \n If you are still having trouble shoot a DM to the creator `@iant`.',

  basic: () => 'I\'m here to help! \n \n To get more specific information regarding which feature of the `@doge` bot you are having trouble with please run one of the following commands: \n \n`@doge help cal` : help with the calendar bot \n \n`@doge help tikz` : help with the tikz-cd bot \n \n`@doge help expense` : help with the expense bot \n \n If you are still having trouble send a DM to the creator `@iant`.'

}
const purifyArray = array => array.slice()

const removeDoge = remove('@doge')
const parseCommand = cmdArray => {
  if ((cmdArray[0] === 'help') && (cmdArray.length === 1)) {
    return Helptxt.basic()
  } else if (cmdArray[1] === 'cal') {
    return Helptxt.cal()
  } else if (cmdArray[1] === 'tikz') {
    return Helptxt.tikz()
  } else if (cmdArray[1] === 'expense') {
    return Helptxt.expense()
  } else {
    return Helptxt.basic()
  }
}

const helpResponse = compose(parseCommand, removeDoge, spaceSplit)

module.exports = (robot) => {

  robot.respond(/(help)/i, (msg) => msg.reply(helpResponse(msg.message.text)))

}
