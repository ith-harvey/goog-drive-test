require('dotenv').config()
const rp = require('request-promise');
const fs = require('fs');
const {compose, spaceJoin, spaceSplit, remove, newLineSplit} = require('./utils.js')
const {exec} = require('child_process')

const removeDoge = remove('doge')
const removeDirectLine = remove('@doge tikz direct')

const parseRemoveDoge = compose(spaceJoin, removeDoge, spaceSplit)
const parseRemoveDirect = compose(spaceJoin, removeDirectLine, newLineSplit)

// const parseRemoveDirect = compose(spaceJoin, removeDirect, spaceSplit)

const createFileCb = err => {
  if (err) {
    throw err
    console.log('ERROR PEEPS', err);
  }
  console.log('file has been created! ->', err);
}
const createFile = data => fs.writeFile('laTexFile.tex', data, createFileCb)

const addBoilerPlate = data => `\\documentclass{standalone}
\\usepackage{tikz-cd}
\\begin{document}
\\begin{tikzcd}
${data}
\\end{tikzcd}
\\end{document}`

const addBoilerAndCreateFile = compose(createFile, addBoilerPlate)

const buildPost = imgInBase64 => {
  return {
    method: 'POST',
    uri: 'https://api.imgur.com/3/image',
    headers: {'Authorization': process.env.IMGUR_CLIENT_ID},
    body: { image: imgInBase64, type: 'base64'},
    json: true
  }
}

const HTTPrequest = options => rp(options)

const execPromise = cmd => new Promise( (resolve, reject) => {
  exec(cmd, function(err, stdout) {
    if (err) return reject(err)
    return resolve(stdout);
  });
});

const laTexCreationFlow = (msg) => {
  return laTexToPDF()
  .then(pdfToJPG)
  .then(jpgToBase64)
  .then(imgInBase64 => compose(HTTPrequest, buildPost)(imgInBase64))
  .then(response => msg.reply(`Here is your tikz rendering: ${response.data.link}`))
  .catch(error => {
    console.log('// err //', error);
    msg.reply('There seems to be an error with the provided tikz-cd code or how it was processed:\n \n' + error + '\n \n in the event you have already tested this tikz-cd on your own and the was working, please notify the bot creator @iant')
  })
}

const laTexToPDF = () => execPromise('pdflatex laTexFile.tex')
const pdfToJPG = () => execPromise('convert -density 300 laTexFile.pdf -quality 90 laTexFile.jpg')
const jpgToBase64 = () => execPromise('openssl base64 -in laTexFile.jpg')

module.exports = (robot) => {

  let awaitingTikzCode = false

  robot.respond(/(tikz direct)/i, function (msg) {
    msg.reply('processing tikz...')
    console.log('post remove:', parseRemoveDirect(msg.message.text));

    addBoilerAndCreateFile(parseRemoveDirect(msg.message.text))

    laTexCreationFlow(msg)

  })

  robot.respond(/(tikz create)/i, function (msg) {
    msg.reply('Hi there, just so you know I write all the boilerplate for you: ``` \\documentclass{standalone} \n \\usepackage{tikz-cd} \n \\begin{document} \n \\begin{tikzcd} \n\n //* your code here *// \n\n \\end{tikzcd} \n \\end{document}```\n Please provide me the tikZ code you would like to run:')
    awaitingTikzCode = true
  })

  robot.hear(/(.*)/i, function (msg) {
    if (awaitingTikzCode && (msg.message.text.split(' ')[1] !== 'tikz')) {
      msg.reply('processing tikz...')

      addBoilerAndCreateFile(parseRemoveDoge(msg.message.text))

      laTexCreationFlow(msg)

      awaitingTikzCode = false
    }
  })
}
