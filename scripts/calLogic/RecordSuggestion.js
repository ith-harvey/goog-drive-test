
const momentTZ = require('moment-timezone');
const moment = require('moment');

const Time = require('./Time.js')
const Misc = require('./Misc.js')

class CreateSuggestion {
  constructor() {
    this.suggestionArr = []
  }

  generateThreeFreeDay(timeWindowStart, timeWindowEnd, wrkHrs) {
    let endTime
    let dateRequested = timeWindowStart
    let arr = Misc.randomStartTimesArray(timeWindowStart.hour(), timeWindowEnd.hour(), dateRequested)

    arr.forEach(startTime =>  {

        endTime = moment(startTime).add(1, 'hours')
        this.add(wrkHrs, startTime, endTime)
      })

    return this.get()
  }


  // sortSuggestsChronologically () {
  //   if (this.suggestionArr.length === 1) return
  //
  //   for (i = 0; i < arrCline - 1; i++) {
  //     if (this.suggestionArr[i].isAfter(this.suggestionArr[i+1])) {
  //       this.suggestionArr.splice()
  //     }
  //   }
  // }

  recurseToFindSuggest(availArr, wrkHrs, currItem, suggestObj) {

    if (this.suggestionArr.length === 3) {
      return
    }

    currItem = availArr[Math.floor(Math.random()*availArr.length)];

    if (!suggestObj[currItem.rawStartTime]) {
      suggestObj[currItem.rawStartTime] = true
      this.add(wrkHrs, currItem.rawStartTime, currItem.rawEndTime)
    }

    return this.recurseToFindSuggest(availArr, wrkHrs, currItem, suggestObj)
  }

  generatethreeSemiBusyDay(availArr, wrkHrs) {

    if (availArr.length <= 3) {
      // could have only one/two/three items in ARR
      // this.sortSuggestsChronologically()
      availArr.forEach( currItem => {
        this.add(wrkHrs, currItem.rawStartTime, currItem.rawEndTime)
      })
      return this.get()
    }

    this.recurseToFindSuggest(availArr, wrkHrs, '', {})
    // this.sortSuggestsChronologically()

    return this.get()
  }

  add(wrkHrs, availStart, availEnd) {

    this.suggestionArr.push({

      localTime: `${wrkHrs.timeZone}: ${moment(Time.localTime(availStart, wrkHrs.timeZone), 'DD-MM-YYYY hh:mm:ss a').format("hh:mm:ss a")} - ${moment(Time.localTime(availEnd, wrkHrs.timeZone), 'DD-MM-YYYY hh:mm:ss a').format("hh:mm:ss a")}`,

      UTC: `UTC: ${availStart} - ${availEnd}`,

      rawStartTime: availStart,

      rawEndTime: availEnd,
    })

  }

  get() { return this.suggestionArr}

}

module.exports = CreateSuggestion
