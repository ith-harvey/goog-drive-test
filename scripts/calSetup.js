
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
const rp = require('request-promise')
const ical2json = require('ical2json')

const IncomingCommand = require('./calLogic/IncomingCommand.js')
const RecordAvailability = require('./calLogic/RecordAvailability.js')
const RecordSuggestion = require('./calLogic/RecordSuggestion.js')
const Delegator = require('./calLogic/Delegator.js')
const Time = require('./calLogic/Time.js')
const Misc = require('./calLogic/Misc.js')






function dayVsWeekAvailLoopAndBuildSuggestions(findAvailResp, Command) {

  let suggestString = ''
  let daySuggestionArr


  findAvailResp.forEach( dayAvailability => {

    let Suggestion = new RecordSuggestion()

    if (dayAvailability.arr[0].booked) {
      let bookedStatement = 'Woof woof! Unfortunatley it looks like your day is fully booked. Try running `@doge cal suggest week` to check your availability for the week.'
      return bookedStatment

    } else if (dayAvailability.arr[0].dayIsFree) {

      let startWindow = dayAvailability.arr[0].rawStartTime
      let endWindow = dayAvailability.arr[0].rawEndTime

      daySuggestionArr = Suggestion.generateThreeFreeDay(startWindow, endWindow, dayAvailability.wrkHrs)

    } else {
      daySuggestionArr = Suggestion.generatethreeSemiBusyDay(dayAvailability.arr, dayAvailability.wrkHrs)

    }


    let dayOfWeek = moment(daySuggestionArr[0].rawStartTime, 'DD-MM-YYYY HH-mm-ss')
    let dayOfWeekBold = dayOfWeek.format('dddd')
    let justDate = dayOfWeek.format('LL')

    suggestString = `*${dayOfWeekBold} ${justDate}*`

    daySuggestionArr.forEach( availWindow => {

      suggestString += `\n ${availWindow.localTime}
      ${availWindow.UTC}\n`

    })

  })

  return `Woof woof! Here are some meeting suggestions for ${Command.getRequestedQuery()}: \n \n` + suggestString

}












/**
   * findAvailabilityOverTime()
   * @param {Array} eventArr - The event data retreived from fastmail.
   * @param {Object} wrkHrs - Users prefered working hours & timezone
   *    i.e: {start: XXXX, end: XXXX, timeZone: XXXX}
   * @param {String} dateAvailRequested - the date the user has requested avail * on
   * @param {Class} Availability - instance of the RecordAvailability Class
   *
   * @returns Nothing - calls Availability.set() method
**/

/*
* 1) events that happen on selected day
*
*/

const findAvailabilityOverTime = (eventArr, wrkHrs, dateAvailRequested, Availability) => {
  let i = 0
  let currEvent = eventArr[i]
  let eventStart = Time.formatDate(wrkHrs.timeZone, currEvent.DTSTART)
  let eventEnd = Time.formatDate(wrkHrs.timeZone, currEvent.DTEND)

  while (eventStart.date() <= dateAvailRequested.date()) {
    // console.log('same day! rquest', dateAvailRequested)
    // console.log('same day! start', eventStart)
    // console.log('same day! end', eventEnd)


    if (eventStart.date() === dateAvailRequested.date()) {
      // events that happen on selected day

      if (Time.minutesOfDay(eventStart) <= Time.minutesOfDay(wrkHrs.start)) {
        // event start happens before || same time as wrkhrs start

        if (Time.minutesOfDay(eventEnd) <= Time.minutesOfDay(wrkHrs.start)) {
          // event end happens before || same time as wrkhrs start
          // the entire event happens before working hours
          // do nothing -> go to next event
        } else if (Time.minutesOfDay(eventEnd) >= Time.minutesOfDay(wrkHrs.end)) {
          // event books out the entire day!
          Availability.wholeDayIsBooked(wrkHrs)
        } else {
          //event ends during working hours
          Availability.set(wrkHrs, eventEnd)
        }

      } else { // event start happens after wrkhrs start

        if (Time.minutesOfDay(eventStart) < Time.minutesOfDay(wrkHrs.end)) {

          // event start happens during work hours
          Availability.set(wrkHrs, eventEnd, eventStart)

        } else {
          // the entire event happens after working hours
          // do nothing -> go to next event
        }

      }
    } else {
      // console.log('Do nothing event doesnt match day requested')
    }

    if (eventArr.length - 1 === i) break

    i++
    currEvent = eventArr[i]
    eventStart = Time.formatDate(wrkHrs.timeZone, currEvent.DTSTART)
    eventEnd = Time.formatDate(wrkHrs.timeZone, currEvent.DTEND)
  }

  if (Availability.get().length) {
    Availability.setUntilEndOfWorkDay(wrkHrs)
  } else {
    Availability.dayIsFreeAddAvail(wrkHrs, dateAvailRequested)
    console.log('day is free!')
  }

  return {
    arr: Availability.get(),
    wrkHrs: wrkHrs,
  }
}

module.exports = (robot) => {

  let awaitingUrl = false, awaitingWorkHours = false, calSetupDone = false

  robot.respond(/(cal setup)/i, function (msg) {
    msg.reply('Woof woof! Welcome to the cal setup wizard. \n \n Please enter your fastmail account’s free/busy calendar URL so I can share your availability upon request.\n\n (To access your free/busy calendar URL visit www.fastmail.com/calendar/ while logged in.\n Select the calendar dropdown > settings > calendars > Edit&share > check free/busy information > copy the url > hit save up top > paste URL in chat and hit enter)')
    awaitingUrl = true
  })

  robot.hear(/^(http|https)/i, function (msg) {
    if (awaitingUrl) {
      robot.brain.set(msg.message.user.id, { busyCalUrl: msg.message.text })

      msg.reply('Woof woof! URL was received... \n \n Excellent, now I need to know your preferred working hours when you will be available for meetings. \n \n Please enter them in 24hr format: <HH:mm>-<HH:mm> (e.g. 09:00-17:00)')

      awaitingUrl = false
      awaitingWorkHours = true
    }
  })

  robot.hear(/[0-9][0-9]:[0-5][0-9]-[0-9][0-9]:[0-5][0-9]/i, function (msg) {
    if (awaitingWorkHours) {
      console.log('in save', robot.brain.get(msg.message.user.id))

      robot.brain.set(msg.message.user.id, {
        busyCalUrl: robot.brain.get(msg.message.user.id).busyCalUrl,
        workHrs: msg.message.text,
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

      let Command = new IncomingCommand()

      let delegatorObj = Command.interpreter(msg.message.text.split(' '))

      rp(robot.brain.get(msg.message.user.id).busyCalUrl)
      .then((response)=> {

        let output = ical2json.convert(response);

        let data = {
          dateArr: output.VCALENDAR[0].VEVENT,
          timeZone: output.VCALENDAR[0]['X-WR-TIMEZONE'],
        }

        msg.reply('Your current Timezone (set at fastmail.com): ' + data.timeZone)

        let Availability = new RecordAvailability()

        let wrkHrsInUTC = Time.wrkHrsParse(robot.brain.get(msg.message.user.id).workHrs, data.timeZone)

        let findAvailPromiseArr = [ new Promise((resolve, reject) => {
              resolve(findAvailabilityOverTime(data.dateArr, wrkHrsInUTC, delegatorObj.datesRequested[0], Availability))
          })]

        if (delegatorObj.datesRequested.length > 1) {
          findAvailPromiseArr = delegatorObj.datesRequested.map( dayToCheck => {

            Availability = new RecordAvailability()

            return new Promise((resolve,reject) => {
              resolve(findAvailabilityOverTime(data.dateArr, wrkHrsInUTC, dayToCheck, Availability))
            })
          })
        }

        Promise.all(findAvailPromiseArr).then(findAvailResp => {

          msg.reply(dayVsWeekAvailLoopAndBuildSuggestions(findAvailResp, Command))

          // console.log('dayvsweek return: ',dayVsWeekAvailLoopAndBuildSuggestions(findAvailResp, Command))


        }).catch(err => {
          console.log('err', err)
        })

      }).catch((err)=> {
        msg.reply('in err')
        console.log('ERROR: ', err)
        msg.reply(err)
      })
    }
  })

}
