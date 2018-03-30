const momentTZ = require('moment-timezone');
const moment = require('moment');


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
  return timeClone.tz(timeZone).format('DD-MM-YYYY hh:mm:ss a')
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

module.exports = {
  getTodaysDate,
  minutesOfDay,
  localTime,
  formatDate,
  wrkHrsParse,
  chngWrkHrsToDateRequested,
}
