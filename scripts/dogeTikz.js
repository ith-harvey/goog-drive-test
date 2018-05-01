

module.exports = (robot) => {

  robot.respond(/(tikz create)/i, function (msg) {
    msg.reply('Hi there, just so you know I write all the boilerplate for you:\n\n ```
    \documentclass{standalone}
    \usepackage{tikz-cd}
    \begin{document}
    \begin{tikzcd}

    //* your code here *//

    \end{tikzcd}
    \end{document}
    ```')
  })

}
