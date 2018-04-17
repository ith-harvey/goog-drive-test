
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


const rp = require('request-promise');
const IncomingCommand = require('./calLogic/IncomingCommand.js')
const CreateAvailability = require('./calLogic/RecordAvailability.js')
const CreateSuggestion = require('./calLogic/RecordSuggestion.js')
const User = require('./calLogic/User.js')
const Time = require('./calLogic/Time.js')
const Merge = require('./calLogic/MergeAvail.js')
const Misc = require('./calLogic/Misc.js')

function setupFindAvailability(robot, UserArray ) {
  let allUsersAvailability = []

  UserArray.arr.forEach( (User, i) => {
    // loop over each user

    allUsersAvailability.push( User.datesRequested.map( (dayToCheck) => {

      let wrkHrsInUTC = Time.wrkHrsParse(robot.brain.get(User.userId).workHrs, User.timeZone, dayToCheck)

      let Availability = new CreateAvailability()

      // findAvailOverTime -> requires the entire event arr for that person
      return Misc.findAvailability(User.calBusyArr, wrkHrsInUTC, dayToCheck, Availability)
      }))
  })

  return allUsersAvailability
}

function dayVsWeekAvailLoopAndBuildSuggestions(mergedAvailArr, requestersTimeZone, requestersDatesRequested, Command) {

  let buildDayHeader = (dayOfWeek) => {
    let dayOfWeekBold = dayOfWeek.format('dddd')
    let justDate = dayOfWeek.format('LL')

    return `\n *${dayOfWeekBold} ${justDate}*`
  }

  let suggestString = ''
  let daySuggestionArr

  mergedAvailArr.forEach( weekAvailability => {

    weekAvailability.forEach( (dayAvailability, i) => {

      let Suggestion = new CreateSuggestion()

      if (dayAvailability[0].dayIsBooked) {
        suggestString += buildDayHeader(requestersDatesRequested[i])
        suggestString += '\n Ruh ro... This day is already fully booked. :('
        return

      } else if (dayAvailability.length === 1) {
        //run if the day's availability is 'whole' (not broken up)
        daySuggestionArr = Suggestion.generateThreeWholeAvail(dayAvailability[0].availStart, dayAvailability[0].availEnd, requestersTimeZone)

      } else {
        //run if the day's availability is 'broken up' (busy in the middle of the day)
        daySuggestionArr = Suggestion.generateThreeSeperatedAvail(dayAvailability, requestersTimeZone)
      }

      suggestString += buildDayHeader(requestersDatesRequested[i])
      daySuggestionArr.forEach( availWindow => {
        suggestString += `\n ${availWindow.localTime}
        ${availWindow.UTC}\n`
      })

    })
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
        let UserArray = Command.interpreter(robot, msg.message)

        if (UserArray.error) {
          console.log('error', error);
          return msg.reply(delegatorObj.error)
          }

        let userInfoPromiseArr = UserArray.arr.map( user => {
              return new Promise( (resolve, reject) => {
                resolve(rp(robot.brain.get(user.userId).busyCalUrl))
            })
          })

          Promise.all(userInfoPromiseArr).then( userInfoArr => {
            let response = []

            UserArray = Misc.completeUserInformation(robot, userInfoArr, UserArray, Command)

            return setupFindAvailability(robot, UserArray)


          }).then(allUsersAvailability => {
            // console.log('all users availability (pre merge):');
            // allUsersAvailability.forEach( avail => {
            //   console.log(avail);
            // })

            if (UserArray.arr.length > 1) {
              // if more than one users info is supplied -> merge availability

              while (allUsersAvailability.length >= 2) {
                // run cross check with first 2 users info and remove them from arr
                allUsersAvailability.unshift(Merge.availability(allUsersAvailability.shift(), allUsersAvailability.shift()))
                // re-add the merged availability and rerun until 1 avail is left
              }
            }

            // console.log('all users availability (post merge):', allUsersAvailability);
            // allUsersAvailability.forEach( avail => {
            //   console.log(avail);
            // })

            msg.reply('Your current Timezone (set at fastmail.com): ' + UserArray.arr[0].get().timeZone)

            msg.reply(dayVsWeekAvailLoopAndBuildSuggestions(allUsersAvailability, UserArray.arr[0].get().timeZone, UserArray.arr[0].get().datesRequested, Command))

          }).catch(err => {
            console.log('err', err)
            return err
          })

    }
  })

}
