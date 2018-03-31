const Delegator = require('./Delegator')
const DelegatorObject = new Delegator()

const Time = require('./Time.js')
const Misc = require('./Misc.js')

class IncomingCommand {

  constructor() {
    this.timeFrameRequested = ''
  }

  interpreter (cmdArr) {
    let DelegatorObject = new Delegator
    let basicQuery = cmdArr.indexOf('suggest')
    let regExp = /(may|february|january|august|september|october|november|december|march|april|july|june)/
    let monthQuery = (text) => regExp.test(text)

    if (cmdArr.length - 1 === basicQuery) {
      DelegatorObject.add('datesRequested', Time.getTodaysDate())
      this.setRequestedQuery(`today, ${Time.getTodaysDate().format('LL')}`)
      return DelegatorObject.get() // just today query
    }

    if (cmdArr[basicQuery + 1][0] === '@') {
      console.log('adding users to query')
    }

    if (cmdArr[basicQuery + 1] === 'week') {
      console.log('week query')

      if (cmdArr.length === 4) {
        console.log('no dates')
        let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(Time.getTodaysDate())
        this.setRequestedQuery('this week')
        DelegatorObject.add('datesRequested', weeksWorkingDaysArr)

        return DelegatorObject.get()

      } else if (monthQuery(cmdArr[basicQuery + 2])){
        console.log('with dates')
        let dateRequested = Time.interpDate(cmdArr[basicQuery + 2], cmdArr[basicQuery + 3])

        let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(dateRequested)

        this.setRequestedQuery(`week of ${dateRequested.format('LL')}`)
        DelegatorObject.add('datesRequested', weeksWorkingDaysArr)

        return DelegatorObject.get()
        // let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(Time.interpDate())
      }
    }

    if (monthQuery(cmdArr[basicQuery + 1])) {
      console.log('specific month/day query')
      return 'specificDayQuery'
    }

    return DelegatorObject.get()
  }

  setRequestedQuery(msg) {
    this.timeFrameRequested = msg
  }

  getRequestedQuery(msg) {
    return this.timeFrameRequested
  }
}

module.exports = IncomingCommand