
const momentTZ = require('moment-timezone');
const moment = require('moment');
const rp = require('request-promise');
const ical2json = require('ical2json');
const CreateAvailability = require('./RecordAvailability.js');

const Time = require('./Time.js');


/**
   * findAvailability()
   * @param {Array} eventArr - The event data retreived from fastmail.
   * @param {Object} wrkHrs - Users prefered working hours & timezone
   *    i.e: {start: XXXX, end: XXXX, timeZone: XXXX}
   * @param {String} dateAvailRequested - the date the user has requested avail * on
   * @param {Class} Availability - instance of the RecordAvailability Class
   *
   * @returns Nothing - calls Availability.set() method
**/

const findAvailability = (eventArr, wrkHrs, dateAvailRequested, Availability) => {
  let i = 0
  let currEvent = eventArr[i]
  let eventStart, eventEnd

  // using function to compare event to workingHours
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
          console.log('gets in here');
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

  if ((Availability.lastEventEndTime !== 'undefined')
      && Availability.lastEventEndTime.isBefore(wrkHrs.end)) {
    // an event has been set add more availability till end of day
    Availability.setUntilEndOfWorkDay(wrkHrs)
  }

  if (!Availability.get().length) {
    // no events have been set
    Availability.dayIsFreeAddAvail(wrkHrs)
  }

  return Availability.get()
}



function checkIfUserIsSetup(robot, userId) {

  console.log('here is their id', userId);
  console.log('here is their id',robot.brain.get(userId).busyCalUrl);
  console.log('here is their id', robot.brain.get(userId).workHrs);
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


function completeUserInformation(robot, userInfoArr, UserArray, Command) {

  UserArray.arr.forEach( (User, i) => {

  let output = ical2json.convert(userInfoArr[i]);

  if (!output.VCALENDAR[0].VEVENT) {
    console.log('This user has no events in their calendar -> inserting fake event.')
    output.VCALENDAR[0].VEVENT = [ { DTEND: '20180413T000000Z',
    DTSTAMP: '20180418T151757Z',
    DTSTART: '20180412T160000Z',
    SEQUENCE: '0',
    TRANSP: 'OPAQUE',
    UID: 'user was didnt have any events in their calendar this is a fake entry' }]
  }

  let data = {
    eventArr: output.VCALENDAR[0].VEVENT,
    timeZone: output.VCALENDAR[0]['X-WR-TIMEZONE'],
  }

  User.add('timeZone', data.timeZone).add('calBusyArr', data.eventArr).setDatesRequested(momentTZ().tz(data.timeZone), Command)

  })

  return UserArray.get()
}

module.exports = {
  selectRandomStartTimes,
  checkIfUserIsSetup,
  findAvailability,
  completeUserInformation
}
