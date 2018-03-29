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
    let i = cmdArr.indexOf('suggest')
    let regExp = /(may|february|january|august|september|october|november|december|march|april|july|june)/
    let monthQuery = regExp.test(cmdArr[i+1])

    if (cmdArr.length - 1 === i) {
      DelegatorObject.add('datesRequested', Time.getTodaysDate())
      this.setRequestedQuery(`today, ${Time.getTodaysDate().format('LL')}`)
      return DelegatorObject.get()// just basic query
    }

    if (cmdArr[i+1][0] === '@') {
      console.log('adding users to query')
    }

    if (cmdArr[i+1] === 'week') {
      console.log('week query')
      let weeksWorkingDaysArr = Misc.setScopeOfWorkWeek(Time.getTodaysDate())
      this.setRequestedQuery('this week')

      DelegatorObject.add('datesRequested', weeksWorkingDaysArr)

      return DelegatorObject.get()
    }

    if (monthQuery) {
      return 'specificDayQuery'
      console.log('specific month/day query')
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
