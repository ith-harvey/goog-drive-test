
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
const Delegator = require('./calLogic/Delegator.js')

const getTodaysDate = currentTimeZone => moment.utc()
const minutesOfDay = m => m.minutes() + m.hours() * 60;

function formatDate(timeZone, icalStr) {
  let strYear = icalStr.substr(0, 4);
  let strMonth = parseInt(icalStr.substr(4, 2), 10) - 2;
  let strDay = icalStr.substr(6, 2);
  let strHour = icalStr.substr(9, 2);
  let strMin = icalStr.substr(11, 2);
  let strSec = icalStr.substr(13, 2);
  strMonth += 1
  let dateNeedsFormat = new Date(strYear, strMonth, strDay, strHour, strMin, strSec)

  return moment.utc(dateNeedsFormat, 'YYYY-MM-DD HH:mm:ss Z').month(strMonth).date(strDay).hours(strHour).minutes(strMin).seconds(strSec)

}

function localTime(time, timeZone) {
  let timeClone = moment(time)
  return timeClone.tz(timeZone).format('DD-MM-YYYY hh:mm:ss')
}



function checkIfUserIsSetup(robot, userId) {
  // input validation function

  if (robot.brain.get(userId) === null) {
    //user has not started the setup process.
    return true

  } else if (robot.brain.get(userId).busyCalUrl === undefined) {
    //user has not provided a URL.
    return true

  } else if (robot.brain.get(userId).workHrs === undefined) {
    //user has not provided working hours.
    return true
  }

  return false // user is already setup for cal suggest feature
}

function buildEventWeek(dayProvided) {
  let startOfWorkWeek = moment(dayProvided).startOf('isoWeek');
  let endOfWorkWeek = moment(dayProvided).endOf('isoWeek').subtract(2, 'days')

  let daysToCheckAvailability = [];
  let day = startOfWorkWeek;

  while (day <= endOfWorkWeek) {
    if (day.date() >= getTodaysDate().date()) {

      daysToCheckAvailability.push(moment.utc(day.toDate()));
    }
      day = day.clone().add(1, 'd');
  }
  return daysToCheckAvailability
}

function setScopeOfWorkWeek(dayProvided) {
  if (1 <= dayProvided.isoWeekday() && dayProvided.isoWeekday() <= 5 ) {

    return buildEventWeek(dayProvided)

  } else if (6 === dayProvided.isoWeekday() || dayProvided.isoWeekday() === 7) {

    // What we should do for weekends when this query is run??

    // return buildEventWeek(dayProvided)
  }
}

function wrkHrsParse(wrkHrs, timeZone, dayRequested) {

  let start = {
    Hrs: wrkHrs.slice(0, 2),
    Min: wrkHrs.slice(3, 5),
  }

  let end = {
    Hrs: wrkHrs.slice(8, 10),
    Min: wrkHrs.slice(11, 13),
  }

  let returnObj = {
    start: moment(wrkHrs.slice(0, wrkHrs.indexOf('-')), 'HH:mm')
    .tz(timeZone).hours(start.Hrs).minutes(start.Min).utc(),

    end: moment(wrkHrs.slice(wrkHrs.indexOf('-') + 1, wrkHrs.length), 'HH:mm')
    .tz(timeZone).hours(end.Hrs).minutes(end.Min).utc(),

    timeZone: timeZone,
  }

  return returnObj
}

function chngWrkHrsToDateRequested(wrkHrs, dateAvailRequested) {

  return {
    start: moment.utc(dateAvailRequested).hours(wrkHrs.start.hours())
    .minutes(wrkHrs.start.minutes()),

    end: moment.utc(dateAvailRequested).hours(wrkHrs.end.hours())
    .minutes(wrkHrs.end.minutes()),
  }
}

function randomStartTimesArray(availBlockStarts, availBlockEnds, dateAvailRequested) {

  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  let startTime = {
    Obj: {},
    Arr: [],
  }

  let stagingStartTime = randomIntFromInterval(availBlockStarts, availBlockEnds)

  startTime.Obj[stagingStartTime] = true
  startTime.Arr.push(moment(dateAvailRequested).hours(stagingStartTime).minutes(00).seconds(00))

  let currStartTime

  while (Object.keys(startTime.Obj).length <= 2) {

    currStartTime = randomIntFromInterval(availBlockStarts, availBlockEnds)

    if (!startTime.Obj[currStartTime]) {
      startTime.Obj[currStartTime] = true
      startTime.Arr.push(moment(dateAvailRequested).hours(currStartTime).minutes(00).seconds(00))
    }
  }

  return startTime.Arr
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

const findAvailabilityOverTime = (eventArr, wrkHrs, dateAvailRequested,  Availability) => {
  let i = 0
  let currEvent = eventArr[i]
  let eventStart = formatDate(wrkHrs.timeZone, currEvent.DTSTART)
  let eventEnd = formatDate(wrkHrs.timeZone, currEvent.DTEND)

  while (eventStart.date() <= dateAvailRequested.date()) {
    // console.log('same day! rquest', dateAvailRequested)
    // console.log('same day! start', eventStart)
    // console.log('same day! end', eventEnd)


    if (eventStart.date() === dateAvailRequested.date()) {
      // events that happen on selected day

      if (minutesOfDay(eventStart) <= minutesOfDay(wrkHrs.start)) {
        // event start happens before || same time as wrkhrs start

        if (minutesOfDay(eventEnd) <= minutesOfDay(wrkHrs.start)) {
          // event end happens before || same time as wrkhrs start
          // the entire event happens before working hours
          // do nothing -> go to next event
        } else if (minutesOfDay(eventEnd) >= minutesOfDay(wrkHrs.end)) {
          // event books out the entire day!
          Availability.wholeDayIsBooked(wrkHrs)
        } else {
          //event ends during working hours
          Availability.set(wrkHrs, eventEnd)
        }

      } else { // event start happens after wrkhrs start

        if (minutesOfDay(eventStart) < minutesOfDay(wrkHrs.end)) {

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
    eventStart = formatDate(wrkHrs.timeZone, currEvent.DTSTART)
    eventEnd = formatDate(wrkHrs.timeZone, currEvent.DTEND)
  }

  Availability.setUntilEndOfWorkDay(wrkHrs)

  Availability.get().length ? '' : Availability.dayIsFreeAddAvail(wrkHrs, dateAvailRequested)

  return Availability.get()
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

    if (checkIfUserIsSetup(robot, msg.message.user.id)) {
      msg.reply('Woof woof! To use the `@doge cal suggest` feature you must first go through the setup wizard. Do so by typing the command `@doge cal setup`.')
    } else {

      let Command = new IncomingCommand

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

        let wrkHrsInUTC = wrkHrsParse(robot.brain.get(msg.message.user.id).workHrs, data.timeZone)

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


        console.log('before promiseAll', findAvailPromiseArr)
        Promise.all(findAvailPromiseArr).then(availabilityArr => {
          console.log('what we get back from Promise.all', availabilityArr)

          let suggestString = ''

          availabilityArr.forEach( dayAvailabilityArr => {
            if (dayAvailabilityArr[0].booked) {
              msg.reply('Woof woof! Unfortunatley it looks like your day is fully booked. Try running `@doge cal suggest week` to check your availability for the week.')
              return
            }

            dayAvailabilityArr.forEach((suggestion, index) => {
              let dayOfWeekBold = moment(suggestion.rawStartTime, 'DD-MM-YYYY HH-mm-ss').format('dddd')

              suggestString += `*${dayOfWeekBold}* \n ${suggestion.start}
              ${suggestion.end}\n \n`
            })

          })

          msg.reply(`Woof woof! Here are some meeting suggestions for ${Command.getRequestedQuery()}: \n \n` + suggestString)


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
