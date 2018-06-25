
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

class isExpenseValid {

  static catagory(text, outcome) { return /^(Accomodation|Flight|Train|Lyft|Uber|Taxi|Breakfast|Lunch|Dinner|Drinks|Conference Sponsorship|Conference Tickets|Parking|Gym Membership|Bug Bounties|Rent|Maker Clothing|Other)$/i.test(text) ? '' : outcome.failure("The catagory is not valid (be sure to remove all trailing spaces)")
  }

  static amountSyntax(text, outcome) {
    /^\d+(\.{0,1}\d{2,2})$/i.test(text) ? '' :  outcome.failure("The amount format is not valid")
  }

  static lessThanExpenseCap(text, outcome) {
    console.log('numb text', Number(text));
    if (isNaN(Number(text))) return

    (Number(text) < 7000) ? '' : outcome.failure("Individual expenses can not be greater $7,000.00")
  }

  static description(text, outcome) {
    /^"(?:[^"\\]|\\.)(.*\S+)(?:[^"\\]|\\.)"$/i.test(text) ?  '' : outcome.failure("The description is not valid")
  }

  static date(text, outcome) { /^([0-9][0-9][0-9][0-9]\/[0-9][0-9]\/[0-9][0-9])$/i.test(text) ? '' : outcome.failure("The date is not valid")
  }

  static surfaceCheck(text) {
    // is the expense valid?
    return /^[0-9\/]+ [0-9\.]+ (")(.*)(") [a-zA-Z_ ]*$/i.test(text) ?
    {outcome: true, explain: 'expense is in correct format'} : // valid
    {outcome: false, explain: "The expense is in an invalid format. Please check that the spaces and quotes are in the appropriate place (refer to example above). To attempt the expense again type `@doge expense create`." } //invalid
  }

  static invfileTypeCheck(text, outcome) {
    return /^(.png|.zip|.jpg|.pdf)$/i.test(text) ? {outcome: true, explain: 'Expense invoice is in a valid format.'} : {outcome: false, explain:":x: The invoice file is not in accepted file format, please reupload in `.pdf`, `.jpg`, `.zip` or `.png` format."}
  }

  static deepCheck(expObj) {
    const outcome = new OutcomeObj
    this.catagory(expObj.catagory, outcome)
    this.date(expObj.date, outcome)
    this.amountSyntax(expObj.amount, outcome)
    this.lessThanExpenseCap(expObj.amount, outcome)
    this.description(expObj.description, outcome)

    return (outcome.getFailures().length === 0) ? // is the expense valid?
    {outcome: true, explain: ' Expense has been validated.'} : //expense is valid
    {outcome: false, explain: outcome.getFailures() } //expense is not valid
  }

}

class isSetupValid {

  static setupCheckOffice(text) {
    return /^(New York City|Santa Cruz|China|Copenhagen|Remote)$/i.test(text) ?
    {outcome: true, explain: 'city is correct'} : // valid
    {outcome: false, explain: ":x: City is not recognized, please restart the process by typing `@doge expense setup`" } //invalid
  }

  static setupCheckTeam(text) {
    return /^(Executive|Marketing|Oasis|Market Making|Legal|Code Development|Integrations|Business Dev|Other)$/i.test(text) ?
    {outcome: true, explain: 'Team is correct'} : // valid
    {outcome: false, explain: ":x: Team is not recognized" } //invalid
  }

}




module.exports = {
  isExpenseValid,
  isSetupValid
}
