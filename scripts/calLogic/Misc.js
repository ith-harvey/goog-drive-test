
const momentTZ = require('moment-timezone');
const moment = require('moment');
const rp = require('request-promise');
const ical2json = require('ical2json')
const CreateAvailability = require('./RecordAvailability.js')

const Time = require('./Time.js');



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

const findAvailabilityOverTime = (eventArr, wrkHrs, dateAvailRequested, Availability) => {

  let i = 0
  let currEvent = eventArr[i]
  let eventStart, eventEnd

    // using function to compare event to wrkingHours
    eventStart = Time.formatDate(wrkHrs.timeZone, currEvent.DTSTART)
    eventEnd = Time.formatDate(wrkHrs.timeZone, currEvent.DTEND)

  while (eventStart.isSameOrBefore(wrkHrs.start, 'day')) {

    if (eventStart.isSame(wrkHrs.start, 'day')) {


      if (eventStart.isSameOrBefore(wrkHrs.start,'minutes')) {
        // event start happens before || same time as wrkhrs start

        if (eventEnd.isSameOrBefore(wrkHrs.start, 'minutes')) {
          // event end happens before || same time as wrkhrs start
          // the entire event happens before working hours
          // do nothing -> go to next event

        } else if (eventEnd.isSameOrAfter(wrkHrs.end,'minutes')) {
          // event books out the entire day!
          Availability.wholeDayIsBooked(wrkHrs)

        } else {
          //event ends during working hours
          Availability.set(wrkHrs, eventEnd)
        }

      } else { // event start happens after wrkhrs start

        if (eventStart.isBefore(wrkHrs.end, 'minutes')) {
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
    // using function to compare event to wrkingHours
    eventStart = Time.formatDate(wrkHrs.timeZone, currEvent.DTSTART)
    eventEnd = Time.formatDate(wrkHrs.timeZone, currEvent.DTEND)

  }

  if (Availability.lastEventEndTime !== 'undefined') {
    // no events have been set
    Availability.setUntilEndOfWorkDay(wrkHrs)
  }

  if (!Availability.get().length) {
    Availability.dayIsFreeAddAvail(wrkHrs)
  }

  return Availability.get()
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
    if (day.isSameOrAfter(Time.getTodaysDate(), 'day')) {
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

    return { err: 'Woof woof! I don\'t support week queries that land on weekend dates. To retrieve weekend meeting suggestions please use the single day query: `@doge cal suggest <users(optional)> <month> <day>`.'}
  }
}

function selectRandomStartTimes(startTimesArr) {

  let randomStartTime = {
    Obj: {},
    Arr: [],
  }

  let randomIntFromInterval = (min, max) => {
    max = max - 1
    return Math.floor(Math.random() * (max - min + 1) + min)
  }


  let recurseToSelectTimes = (origStartTimeArr, randomStartTimeArr, randomStartTimeObj) => {

    if (randomStartTimeArr.length === 3) {
      return randomStartTimeArr
    }

    let i = randomIntFromInterval(0, origStartTimeArr.length)

    if (!randomStartTimeObj[origStartTimeArr[i]]) {
      randomStartTimeObj[origStartTimeArr[i]] = true
      randomStartTimeArr.push(origStartTimeArr[i])
    }

    return recurseToSelectTimes(origStartTimeArr, randomStartTimeArr, randomStartTimeObj)
  }

  return recurseToSelectTimes(startTimesArr, randomStartTime.Arr, randomStartTime.Obj)
}





function getIndividualUserAvailability(robot, delegatorObj, userId, Command) {

  return rp(robot.brain.get(userId).busyCalUrl)
  .then((response)=> {

    let output = ical2json.convert(response);


    if (!output.VCALENDAR[0].VEVENT) {
      console.log(' //// ERROR! no events in this persons calendar!!! You can book anything! /// ')
    }

    let data = {
      dateArr: output.VCALENDAR[0].VEVENT,
      timeZone: output.VCALENDAR[0]['X-WR-TIMEZONE'],
    }

    if (delegatorObj.requesterUserIds[0] === userId) {
      // if first requester's id -> set requesters timezone
      Command.setTimeZone(data.timeZone)
    }

    let Availability, wrkHrsInUTC, findAvailPromiseArr

    findAvailPromiseArr = delegatorObj.datesRequested.map( dayToCheck => {

      wrkHrsInUTC = Time.wrkHrsParse(robot.brain.get(userId).workHrs, data.timeZone, dayToCheck)


      Availability = new CreateAvailability()

      return new Promise((resolve, reject) => {
        resolve(findAvailabilityOverTime(data.dateArr, wrkHrsInUTC, dayToCheck, Availability))
      })
    })

    return Promise.all(findAvailPromiseArr).then(findAvailResp => {

      return findAvailResp

    }).catch(err => {
      console.log('err', err)
      return err
    })

  }).catch((err)=> {
    console.log('ERROR: ', err)
    return err
  })

}

module.exports = {
  selectRandomStartTimes,
  checkIfUserIsSetup,
  buildEventWeek,
  setScopeOfWorkWeek,
  getIndividualUserAvailability,
  findAvailabilityOverTime,
}
