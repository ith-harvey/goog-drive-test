
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


let checkIfDMOrPublic = (msg) => msg.split(' ')[1] ? msg.split(' ')[1] : msg.split(' ')[0] // if in DM the mssge has an added 'doge' string -> this gets rid of it

function setupFindAvailability(robot, UserArray ) {
  let allUsersAvailability = []

  UserArray.arr.forEach( (User, i) => {
    // loop over each user

    allUsersAvailability.push( User.datesRequested.map( (dayToCheck) => {

      console.log('wrk hrs here : ', robot.brain.get(User.userId).workHrs);

      let wrkHrsInUTC = Time.wrkHrsParse(robot.brain.get(User.userId).workHrs, User.timeZone, dayToCheck)
      // console.log('here are the workHrs', wrkHrsInUTC);

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

  let dayIsFullyBooked = (dayRequested) => buildDayHeader(dayRequested) + '\n This day is fully booked. :( \n'

  let suggestString = ''
  let daySuggestionArr

  mergedAvailArr.forEach( weekAvailability => {

    weekAvailability.forEach( (dayAvailability, i) => {

      let Suggestion = new CreateSuggestion()


      // this is our error day is booked -> just because first set of avails don't work doesn't mean the 2nd or third don't share avail
      if (dayAvailability[0].dayIsBooked) {
        suggestString += dayIsFullyBooked(requestersDatesRequested[i])
        return

      } else if (dayAvailability.length === 1) {
        //run if the day's availability is 'whole' (not broken up)
        if (dayAvailability[0].availEnd
          .isSameOrBefore(dayAvailability[0].availStart)) {
          suggestString += dayIsFullyBooked(requestersDatesRequested[i])
          return
        }

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

  return `Here are some meeting suggestions for ${Command.getRequestedQuery()}: \n \n` + suggestString
}

module.exports = (robot) => {

  let awaitingUrl = false, awaitingWorkHours = false, calSetupDone = false

  robot.respond(/(cal setup)/i, function (msg) {
    msg.reply('Welcome to the cal setup wizard. \n \n Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.\n\n (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)')
    awaitingUrl = true
  })

  robot.hear(/https/i, function (msg) {
    if (awaitingUrl) {
      msg.message.text = checkIfDMOrPublic(msg.message.text)

      rp(msg.message.text).then( response => {
        robot.brain.set(msg.message.user.id, { busyCalUrl: msg.message.text })

        msg.reply('URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Enter them in 24hr format: <HH:mm>-<HH:mm> (e.g. 09:00-17:00)')

        awaitingUrl = false
        awaitingWorkHours = true
      }).catch( err => {
        console.log('err', err);
        msg.reply('Uh oh, it looks like there was an error when trying to retreive your busy calendar information... Did you hit save in the top left after you checked the free/busy information box? \n \n Please try to reenter your free/busy URL again -> (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)')
      })


    }
  })

  robot.hear(/[0-9][0-9]:[0-5][0-9]-[0-9][0-9]:[0-5][0-9]/i, function (msg) {
    if (awaitingWorkHours) {

      msg.message.text = checkIfDMOrPublic(msg.message.text)

      let hrs = msg.message.text.split('-')

      let compareprep = (hrsArr) => Number(hrsArr.split('').splice(0,2).join(''))

      let compareStart = compareprep(hrs[0])
      let compareEnd = compareprep(hrs[1])

      if ((compareEnd - compareStart) < 5) {
        return msg.reply('The times you have provided amount to less than five hours i.e. `09:00-13:00` or cross into the next day i.e. `17:00-4:00`. Please enter in work hours with a difference of five or more hours that don\'t cross into the next day. \n \n Enter them in a 24hr format: <HH:mm>-<HH:mm> (e.g. 09:00-17:00)')
      }

      robot.brain.set(msg.message.user.id, {
        busyCalUrl: robot.brain.get(msg.message.user.id).busyCalUrl,
        workHrs: msg.message.text,
      })

      msg.reply('Thank you for completing the cal setup wizard!, you may now use the `@doge cal suggest` feature.')

      awaitingWorkHours = false
      calSetupDone = true
    }
  })

  robot.respond(/(cal suggest)/i, function (msg) {

    if (Misc.checkIfUserIsSetup(robot, msg.message.user.id)) {
      msg.reply('To use the `@doge cal suggest` feature you must first go through the setup wizard. Do so by typing the command `@doge cal setup`.')
    } else {
        console.log('incoming message : ', msg.message.text);

        let Command = new IncomingCommand()
        let UserArray = Command.interpreter(robot, msg.message)

        let userInfoPromiseArr = UserArray.arr.map( user => {
              return new Promise( (resolve, reject) => {
                resolve(rp(robot.brain.get(user.userId).busyCalUrl))
            })
          })

          Promise.all(userInfoPromiseArr).then( userInfoArr => {
            let response = []

            UserArray = Misc.completeUserInformation(robot, userInfoArr, UserArray, Command)
            // Uses get request above to complete User information

            if (UserArray.error) {
              return msg.reply(UserArray.error)
            }

            return setupFindAvailability(robot, UserArray)
            // sets up and calls findAvailability


          }).then(allUsersAvailability => {
            console.log('allUsersAvailability pre merge:');
            allUsersAvailability.forEach( user => {
              console.log(user);
            })

            if (UserArray.arr.length > 1) {
              // if more than one users info is supplied -> merge availability
              while (allUsersAvailability.length >= 2) {
                // run cross check with first 2 users info and remove them from arr
                allUsersAvailability.unshift(Merge.availability(allUsersAvailability.shift(), allUsersAvailability.shift()))
                // re-add the merged availability and rerun until 1 avail is left
              }
            }

            msg.reply('Your current Timezone (set at fastmail.com): ' + UserArray.arr[0].get().timeZone)

            msg.reply(dayVsWeekAvailLoopAndBuildSuggestions(allUsersAvailability, UserArray.arr[0].get().timeZone, UserArray.arr[0].get().datesRequested, Command))

          }).catch(err => {
            console.log('err', err)
            return err
          })
        }
    })

    robot.respond(/(help)/i, function (msg) {
      msg.reply('I\'m here to help! \n \n To get more specific information regarding which feature of the `@doge` bot you are having trouble with please run one of the following commands: \n \n`@doge cal help` : help with the calendar bot \n \n if you are still having trouble send a DM to the creator `@iant` \n \n additionally here are some commands that come baked in: \n \n')
    })

    robot.respond(/(cal help)/i, function (msg) {
      msg.reply('I\'m here to help! \n \n The `@doge cal suggest` bot is a meeting query tool that finds availability in users schedules and responds with suggested meeting times.\n \n There are several commands which allow you to change the window of your suggestion and the users (who are already setup) it includes. The commands are as follows: \n \n `@doge cal setup` : starts the setup wizard to get users up and running with the cal bot. \n `@doge cal suggest` : provides available meeting suggestions for today. \n `@doge cal suggest week` : provides available meeting suggestions for this week. \n `@doge cal suggest <month> <day>` : provides available meeting suggestions for the specified day. \n `@doge cal suggest week <month> <day>` : provides available meeting suggestions for that week starting on the specified day. \n `@doge cal suggest <users>` : provides available meeting suggestions for all included users, today. \n `@doge cal suggest <users> <month> <day>` : provides available meeting suggestions for all included users on the specified day. \n `@doge cal suggest <users> week` : provides available meeting suggestions for all included users on that week. \n `@doge cal suggest <users> week <month> <day>` : provides available meeting suggestions for all included users for that week, starting on the specified day. \n \n if you are still having trouble shoot a DM to the creator `@iant`')
    })

}
