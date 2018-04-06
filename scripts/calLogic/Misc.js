
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
  console.log('buildEventWeek day', day.toDate() );

  while (day <= endOfWorkWeek) {
    if (day.isSameOrAfter(Time.getTodaysDate(), 'day')) {
      console.log('in if' );
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

function randomStartTimesArray(availBlockStarts, availBlockEnds, dateRequested) {

  let buildStTime = (date, hr, min) =>  moment(date).hours(hr).minutes(min).seconds(00).milliseconds(00)

  let randomIntFromInterval = (min, max) => {
    max = max - 1
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  let startTime = {
    Obj: {},
    Arr: [],
  }

  let currStartTime
  let stagingStartTime = randomIntFromInterval(availBlockStarts, availBlockEnds)

  startTime.Obj[stagingStartTime] = true
  startTime.Arr.push(buildStTime(dateRequested, stagingStartTime, 00))

  while (Object.keys(startTime.Obj).length <= 2) {

    currStartTime = randomIntFromInterval(availBlockStarts, availBlockEnds)

    if (!startTime.Obj[currStartTime]) {
      startTime.Obj[currStartTime] = true
      startTime.Arr.push(buildStTime(dateRequested, currStartTime, 00))
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
