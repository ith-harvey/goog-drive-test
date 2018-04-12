
// jscs:disable requireSemicolons
// jscs:disable maximumLineLength
// @doge calendar setup and calendar feature script

/* First things first set your environment variables in the root folder:
* export ROCKETCHAT_ROOM=''
* export LISTEN_ON_ALL_PUBLIC=true
* export RESPOND_TO_DM=true
* export ROCKETCHAT_USER=doge
* export ROCKETCHAT_PASSWORD=doge
* export ROCKETCHAT_URL=159.65.101.16:3000
* export NODE_VERSION=default
*
* To setup doge run:
* @doge cal setup - and follow the remaining prompts
*
* Once @doge is setup run:
* @doge cal suggest - receive 3 meeting suggestions for the current day
*
*/

const momentTZ = require('moment-timezone');
const moment = require('moment');

const IncomingCommand = require('./calLogic/IncomingCommand.js')
const CreateAvailability = require('./calLogic/RecordAvailability.js')
const CreateSuggestion = require('./calLogic/RecordSuggestion.js')
const Delegator = require('./calLogic/Delegator.js')
const Time = require('./calLogic/Time.js')
const Merge = require('./calLogic/MergeAvail.js')
const Misc = require('./calLogic/Misc.js')







function dayVsWeekAvailLoopAndBuildSuggestions(mergedAvailArr, requestersTimeZone, Command) {

  let buildDayHeader = (dayOfWeek) => {
    let dayOfWeekBold = dayOfWeek.format('dddd')
    let justDate = dayOfWeek.format('LL')

    return `\n *${dayOfWeekBold} ${justDate}*`
  }

  let suggestString = ''
  let daySuggestionArr

  mergedAvailArr.forEach( weekAvailability => {

    weekAvailability.forEach( dayAvailability => {

      let Suggestion = new CreateSuggestion()

      if (dayAvailability[0].dayIsBooked) {
        suggestString += buildDayHeader(moment(dayAvailability[0].availStart, 'DD-MM-YYYY HH-mm-ss'))

        suggestString += '\n Ruh ro... This day is already fully booked. :('

        return

      } else if (dayAvailability.length === 1) {
        daySuggestionArr = Suggestion.generateThreeWholeAvail(dayAvailability[0].availStart, dayAvailability[0].availEnd, requestersTimeZone)

      } else {
        daySuggestionArr = Suggestion.generatethreeSeperatedAvail(dayAvailability, requestersTimeZone)
      }

      suggestString += buildDayHeader(moment(daySuggestionArr[0].rawStartTime, 'DD-MM-YYYY HH-mm-ss'))

      daySuggestionArr.forEach( availWindow => {

        suggestString += `\n ${availWindow.localTime}
        ${availWindow.UTC}\n`
      })

    })

    console.log('suggest string!!!',suggestString );

  })

  return `Woof woof! Here are some meeting suggestions for ${Command.getRequestedQuery()}: \n \n` + suggestString
}

module.exports = (robot) => {

  let awaitingUrl = false, awaitingWorkHours = false, calSetupDone = false

  robot.respond(/(cal setup)/i, function (msg) {
    msg.reply('Woof woof! Welcome to the cal setup wizard. \n \n Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.\n\n (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)')
    awaitingUrl = true
  })

  robot.hear(/https/i, function (msg) {
    if (awaitingUrl) {
      let url = msg.message.text.split(' ')[1]
      console.log('user setting URL',msg.message.user);
      robot.brain.set(msg.message.user.id, { busyCalUrl: url })

      msg.reply('Woof woof! URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Please enter them in 24hr format: <HH:mm>-<HH:mm> (e.g. 09:00-17:00)')

      awaitingUrl = false
      awaitingWorkHours = true
    }
  })

  robot.hear(/[0-9][0-9]:[0-5][0-9]-[0-9][0-9]:[0-5][0-9]/i, function (msg) {
    if (awaitingWorkHours) {
      let hrs = msg.message.text.split(' ')[1]

      robot.brain.set(msg.message.user.id, {
        busyCalUrl: robot.brain.get(msg.message.user.id).busyCalUrl,
        workHrs: hrs,
      })

      msg.reply('Woof woof! Thank you for completing the cal setup wizard!, you may now use the `@doge cal suggest` feature.')

      awaitingWorkHours = false
      calSetupDone = true
    }
  })

  robot.respond(/(cal suggest)/i, function (msg) {

    if (Misc.checkIfUserIsSetup(robot, msg.message.user.id)) {
      msg.reply('Woof woof! To use the `@doge cal suggest` feature you must first go through the setup wizard. Do so by typing the command `@doge cal setup`.')
    } else {
        console.log('incoming message : ', msg.message.text);

        let Command = new IncomingCommand()
        let delegatorObj = Command.interpreter(robot, msg.message)

        console.log('delg obj ', delegatorObj)

        if (delegatorObj.error) return msg.reply(delegatorObj.error)


    let allUsersAvailPromises = delegatorObj.requesterUserIds.map( userId => {
        return new Promise((resolve, reject) => {
          resolve(Misc.getIndividualUserAvailability(robot, delegatorObj, userId, Command))
        })
      })


      Promise.all(allUsersAvailPromises).then( allUsersAvail => {

        while (allUsersAvail.length >= 2) {
          // run cross check with first 2 users info and remove them from arr
          allUsersAvail.unshift(Merge.availability(allUsersAvail.shift(), allUsersAvail.shift()))
          // re-add the merged availability and rerun until 1 avail is left
        }

        // console.log('merged set', allUsersAvail);

        // allUsersAvail.forEach(thing => {
        //   thing.forEach( log => {
        //     console.log('merged set', log);
        //   })
        // })

        msg.reply('Your current Timezone (set at fastmail.com): ' + Command.getTimeZone().requesterTimeZone)

        msg.reply(dayVsWeekAvailLoopAndBuildSuggestions(allUsersAvail, Command.getTimeZone().requesterTimeZone, Command))



        // msg.reply(dayVsWeekAvailLoopAndBuildSuggestions(findAvailResp, Command))

      }).catch( err => {
        console.log('master promise err', err);
      })

    }
  })

}
