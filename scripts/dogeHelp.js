const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)))

const split = sep => str => str.split(sep);
const spaceSplit = split(' ')
const purifyArray = array => array.slice()

const remove = item => array => {
  const arr = purifyArray(array)
  return arr.slice((arr.indexOf(item) + 1), arr.length)
}

const removeDoge = remove('@doge')

const parseCommand = cmdArray => {
  if ((cmdArray[0] === 'help') && (cmdArray.length === 1)) {
    return Helptxt.basic()
  } else if (cmdArray[1] === 'cal') {
    return Helptxt.cal()
  } else {
    return Helptxt.basic()
  }
}

const helpResponse = compose(parseCommand, removeDoge, spaceSplit)

const Helptxt = {

  cal: () => 'I\'m here to help! \n \n The `@doge cal suggest` bot is a meeting query tool that finds availability in users schedules and responds with suggested meeting times.\n \n There are several commands which allow you to change the window of your suggestion and the users (who are already setup) it includes. The commands are as follows: \n \n `@doge cal setup` : starts the setup wizard to get users up and running with the cal bot. \n `@doge cal suggest` : provides available meeting suggestions for today. \n `@doge cal suggest week` : provides available meeting suggestions for this week. \n `@doge cal suggest <month> <day>` : provides available meeting suggestions for the specified day. \n `@doge cal suggest week <month> <day>` : provides available meeting suggestions for that week starting on the specified day. \n `@doge cal suggest <users>` : provides available meeting suggestions for all included users, today. \n `@doge cal suggest <users> <month> <day>` : provides available meeting suggestions for all included users on the specified day. \n `@doge cal suggest <users> week` : provides available meeting suggestions for all included users on that week. \n `@doge cal suggest <users> week <month> <day>` : provides available meeting suggestions for all included users for that week, starting on the specified day. \n \n if you are still having trouble shoot a DM to the creator `@iant`',

  basic: () => 'I\'m here to help! \n \n To get more specific information regarding which feature of the `@doge` bot you are having trouble with please run one of the following commands: \n \n`@doge help cal` : help with the calendar bot \n \n if you are still having trouble send a DM to the creator `@iant` \n \n additionally here are some commands that come baked in: \n \n'

}


module.exports = (robot) => {

  robot.respond(/(help)/i, (msg) => msg.reply(helpResponse(msg.message.text)))

}
