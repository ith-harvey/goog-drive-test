const expenseResp = {
  notMkrEmp: () => `You are not setup as an active Maker employee and therefore cannot post an expense. If you beleive this is a mistake or an error please reach out to the expense bot creator \`@iant\`.`,

  activMkrEmp: () => `:ballot_box_with_check: You are an active employee at Maker.`,

  create: () => 'Hi, welcome to expense creator. I accept the following format for expenses: \n \n `<date(YYYY/MM/DD)> <amount(in USD)> <"description of purchase"> <category>`\n \n Expense catagories (only apply one catagory to one expense): \n *Accomodation* \n *Flight* \n *Train* \n *Lyft* \n *Uber* \n *Taxi* \n *Breakfast* \n *Lunch* \n *Dinner* \n *Drinks* \n *Conference Sponsorship* \n *Conference Tickets* \n *Parking* \n *Gym Membership* \n *Bug Bounties* \n *Rent* \n *Maker Clothing* \n *Other* \n \n Example: \n `2018/03/01 130.20 "Such wow dog treats...for a client of course!" lunch`',

  textUploaded: (expenseObj) => `Here is your expense: \n \n *office:* ${expenseObj.office} \n *team:* ${expenseObj.team} \n *date:* ${expenseObj.date} \n *amount:* ${expenseObj.amount} \n *description:* ${expenseObj.description} \n *catagory:* ${expenseObj.catagory} \n \n If the above looks correct proceed by uploading a PDF copy of your invoice. \n \n To do so, click the bottom right \`+\` and select the PDF from your file system`,

  pdfReceived: () => `Please quickly review the above expense and verify that the expense you entered matches the PDF you uploaded. Once you have reviewed the expense respond by typing \`submit\` to post your expense.`,

  successPostToGoogSheet: () => `:ballot_box_with_check: Successfully sent expense to master google sheet.'`,

  failPostToGoogSheet: (error) => `Post to google sheet failed: ${error}'`,

  successEthAddrRetreive: () => `:ballot_box_with_check: Ethereum address successfully retreived`,

  failEthAddrRetreive: (error) => `Ethereum address retreival failed: ${error}`,

  failTeamExpenseLimitHit: (team) => `Unfortunatley your expense exceeds the maximum expense limit for the ${team} team. \`@JOEQ\` has been alerted of the attempt, please reach out to him to see if your expense can be approved.`,

  successTeamExpenseLimit: () => ':ballot_box_with_check: expense fits into team\'s monthly budget',

  notifyExpAlert: (expenseObj, FU) => `Heya sir Joe! It looks like they\'re at it again... \n :x: Today is ${FU.getTodaysDateInUTC()} and @${expenseObj.name} is attempting to post a ${expenseObj.amount} expense to the ${expenseObj.team} team\'s budget, but they are over their limit!! They\'ve been notified that they should contact you, but you should also probs reachout.` ,

}

module.exports = expenseResp
