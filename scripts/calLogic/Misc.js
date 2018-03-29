
const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')

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
    if (day.date() >= Time.getTodaysDate().date()) {

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

module.exports = {
  randomStartTimesArray,
  checkIfUserIsSetup,
  buildEventWeek,
  setScopeOfWorkWeek


}
