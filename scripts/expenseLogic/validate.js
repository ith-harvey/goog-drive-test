
// Things to do:

// 1. get rid of doge incoming in doge expense file!

// 2. learn how to handle false / null values in FP (using a container??) so my compose funcions will run and when the error kicks it doesn't break shit

const { FU } = require('../utils')

// functional Utilities
const {regTest, compose, indexOf, boolValTranslator} = FU

class OutcomeObj {
  constructor() {
    this.failureArr = []
  }

  failure(statement) {
    this.failureArr.push(statement)
  }

  getFailures() {
    return this.failureArr
  }
}

const catagory = (text, outcome) => /^(Accomodation|Flight|Train|Lyft|Uber|Taxi|Breakfast|Lunch|Dinner|Drinks|Conference Sponsorship|Conference Tickets|Parking|Gym Membership|Bug Bounties|Rent|Maker Clothing|Other)$/i.test(text) ? '' : outcome.failure("The catagory is not valid (be sure to remove all trailing spaces)")

const amount = (text, outcome) => /^\d+(\.\d{2,2})*$/i.test(text) ? '' : outcome.failure("The amount is not valid")

const description = (text, outcome) => /(")(.*)(")$/i.test(text) ?  '' : outcome.failure("The description is not valid")

const date = (text, outcome) => /^([0-9][0-9][0-9][0-9]\/[0-9][0-9]\/[0-9][0-9])$/i.test(text) ? '' : outcome.failure("The date is not valid")

const surfaceCheck = (text) => {
  // is the expense valid?
  return /^[0-9\/]+ [0-9\.]+ (")(.*)(") [a-zA-Z_ ]*$/i.test(text) ?
  {outcome: true, explain: 'expense is in correct format'} : // valid
  {outcome: false, explain: "The expense is in an invalid format. Please check that the spaces and quotes are in the appropriate place (refer to example above). To attempt the expense again type `@doge expense create`." } //invalid
}

const deepCheck = expObj => {
  const outcome = new OutcomeObj
  catagory(expObj.catagory, outcome)
  date(expObj.date, outcome)
  amount(expObj.amount, outcome)
  description(expObj.description, outcome)

  return (outcome.getFailures().length === 0) ? // is the expense valid?
  {outcome: true, explain: ' Expense has been validated.'} : //expense is valid
  {outcome: false, explain: outcome.getFailures() } //expense is not valid
}

module.exports = {
  deepCheck,
  surfaceCheck
}
