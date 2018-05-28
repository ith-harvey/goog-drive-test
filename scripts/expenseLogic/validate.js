
// Things to do:

// 2. learn how to handle false / null values in FP (using a container??) so my compose funcions will run and when the error kicks it doesn't break shit

class OutcomeObj {
  constructor() {
    this.failureArr = []
  }

  failure(statement) {
    console.log('failArr',this.failureArr);
    this.failureArr.push(statement)
  }

  getFailures() {
    return this.failureArr
  }


}


const { FU } = require('../utils')

// functional Utilities
const {regTest, compose, indexOf, boolValTranslator} = FU

//Use:
const catagory = (text, outcome) => {
console.log('catagory text!', text);
console.log('catagory outcome', /^(Accomodation|Flight|Train|Lyft|Uber|Taxi|Breakfast|Lunch|Dinner|Drinks|Conference Sponsorship|Conference Tickets|Parking|Gym Membership|Bug Bounties|Rent|Maker Clothing|Other)$/i.test(text));

return /^(Accomodation|Flight|Train|Lyft|Uber|Taxi|Breakfast|Lunch|Dinner|Drinks|Conference Sponsorship|Conference Tickets|Parking|Gym Membership|Bug Bounties|Rent|Maker Clothing|Other)$/i.test(text) ? '' : outcome.failure("The catagory is not valid")
}

const amount = (text, outcome) => {

  console.log('amount text!', text);
  console.log('amount outcome!', /^\d+(\.\d{2,2})*$/i.test(text));


  return /^\d+(\.\d{2,2})*$/i.test(text) ? '' : outcome.failure("The amount is not valid")
}

const description = (text, outcome) => {
  console.log('descript text!', text);
  console.log('descript outcome!', /^(")([a-zA-Z]|[0-9]+[a-zA-Z]+|[a-zA-Z]+[0-9]+)[0-9a-zA-Z]*(")$/i.test(text));

  return /(")(.*)(")$/i.test(text) ?  '' : outcome.failure("The description is not valid")
}

const date = (text, outcome) => {

  return /([0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9])/i.test(text) ? '' : outcome.failure("The date is not valid")
}

const isExpenseValid = expObj => {
  const outcome = new OutcomeObj
  catagory(expObj.catagory, outcome)
  date(expObj.date, outcome)
  amount(expObj.amount, outcome)
  description(expObj.description, outcome)

  return (outcome.getFailures().length === 0) ? // is the expense valid?
  {outcome: true, explain: 'expense has been validated'} : //expense is valid
  {outcome: false, explain: outcome.getFailures() } //expense is not valid
}

module.exports = {
  isExpenseValid
}
