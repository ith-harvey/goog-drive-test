require('dotenv').config()
const rp = require('request-promise');
const fs = require('fs');
const {compose, spaceJoin, spaceSplit, remove} = require('./utils.js')
const {exec} = require('child_process')

const removeDoge = remove('doge')
const parseRemoveDoge = compose(spaceJoin, removeDoge, spaceSplit)

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

const cleanAndCreateFile = compose(createFile, addBoilerPlate, parseRemoveDoge)

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

const laTexToPDF = () => execPromise('pdflatex laTexFile.tex')
const pdfToJPG = () => execPromise('convert -density 300 laTexFile.pdf -quality 90 laTexFile.jpg')
const jpgToBase64 = () => execPromise('openssl base64 -in laTexFile.jpg')

module.exports = (robot) => {

  let awaitingTikzCode = false

  robot.respond(/(tikz create)/i, function (msg) {
    msg.reply('Hi there, just so you know I write all the boilerplate for you: ``` \\documentclass{standalone} \n \\usepackage{tikz-cd} \n \\begin{document} \n \\begin{tikzcd} \n\n //* your code here *// \n\n \\end{tikzcd} \n \\end{document}```\n Please provide me the tikZ code you would like to run:')
    awaitingTikzCode = true
  })

  robot.respond(/(.*)/i, function (msg) {
    if (awaitingTikzCode && (msg.message.text.split(' ')[1] !== 'tikz')) {
      msg.reply('processing...')

      cleanAndCreateFile(msg.message.text)

      laTexToPDF()
      .then(pdfToJPG)
      .then(jpgToBase64)
      .then(imgInBase64 => compose(HTTPrequest, buildPost)(imgInBase64))
      .then(response => msg.reply(`Here is your tikZ rendering: ${response.data.link}`))
      .catch(error => {
        console.log('// err //', error);
        msg.reply('There seems to be an error with the provided tikz-cd code or how it was processed:\n \n' + error + '\n \n in the event you have already tested this tikz-cd on your own and the was working, please notify the bot creator @iant')
      })

      awaitingTikzCode = false
    }
  })
}
