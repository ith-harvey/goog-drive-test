
const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')
const Misc = require('./Misc.js')

class RecordSuggestion {
  constructor() {
    this.suggestionArr = []
  }

  generateThree(timeWindowStart, timeWindowEnd, wrkHrs) {
    let endTime

    let arr = Misc.randomStartTimesArray(timeWindowStart.hour(), timeWindowEnd.hour(), wrkHrs.start)

    arr.forEach(startTime =>  {

        endTime = moment(startTime).add(1, 'hours')
        this.add(wrkHrs, startTime, endTime)
      })

    return this.get()
  }

  add(wrkHrs, availStart, availEnd) {

    this.suggestionArr.push({
      start: `${wrkHrs.timeZone}: ${Time.localTime(availStart, wrkHrs.timeZone)} UTC: ${availStart}`,

      end: `${wrkHrs.timeZone}: ${Time.localTime(availEnd, wrkHrs.timeZone)} UTC: ${availEnd}`,

      rawStartTime: availStart,

      rawEndTime: availEnd,
    })


  }

  get() { return this.suggestionArr}

}

module.exports = RecordSuggestion
