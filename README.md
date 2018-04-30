# doge Bot

![alt text](https://github.com/ith-harvey/hubot-fastmail-cal/blob/master/imgs/dog2.png)


doge is a chat bot built on the [Hubot][hubot] framework and houses several utility bots, they are as follows:

* The Calendar Meeting Suggestion Bot (`@doge cal suggest`) is a meeting query tool that finds availability in user's schedules and responds with suggested meeting times. It is designed to work with the fast-mail API ([www.fastmail.com](https://www.fastmail.com/)) which provides a busy calendar URL.

### Configuration for DEV environment
You can test your hubot by running the following, however some plugins will not
behave as expected unless the [environment variables](#configuration) they rely
upon have been set.

Environment variables to be set in the root folder:
* export ROCKETCHAT_ROOM=''
* export LISTEN_ON_ALL_PUBLIC=true
* export RESPOND_TO_DM=true
* export ROCKETCHAT_USER=doge
* export ROCKETCHAT_PASSWORD=doge
* export ROCKETCHAT_URL=159.65.101.16:3000
* export NODE_VERSION=default

(To learn more about environment variables and how they effect Hubot look at the Rocket.Chat Hubot github: https://github.com/RocketChat/hubot-rocketchat)

Note this bot has already been modified to work specifically with Rocket Chat in the `./bin/hubot` file:

`exec node_modules/.bin/hubot --name "doge" --adapter "rocketchat"`

Since we have already set our adapter in the `./bin/hubot` file above, you can start doge by running the following command from the root folder:

    % bin/hubot

You'll see some start up output and a prompt:

    [Sat Feb 28 2015 12:38:27 GMT+0000 (GMT)] INFO Using default redis on localhost:6379
    doge>

Then you can interact with doge by typing `@doge help`.

    To get more specific information regarding which feature of the `@doge` bot you are having trouble with please run one of the following commands:

    `@doge help cal` : help with the calendar bot

### Commands

There are several commands which allow you to change the window of your suggestion and the users (who are already setup) it includes. The commands are as follows:

* `@doge cal setup` : starts the setup wizard to get users up and running with the cal bot.
* `@doge cal suggest` : provides available meeting suggestions for today.
* `@doge cal suggest week` : provides available meeting suggestions for this week.
* `@doge cal suggest <month> <day>` : provides available meeting suggestions for the specified day.
* `@doge cal suggest week <month> <day>` : provides available meeting suggestions for that week starting on the specified day.
* `@doge cal suggest <users>` : provides available meeting suggestions for all included users, today.
* `@doge cal suggest <users> <month> <day>` : provides available meeting suggestions for all included users on the specified day.
* `@doge cal suggest <users> week` : provides available meeting suggestions for all included users on that week.
* `@doge cal suggest <users> week <month> <day>` : provides available meeting suggestions for all included users for that week, starting on the specified day.

### pre-existing hubot-scripts

There are some added hubot-scripts that already came with Hubot.

Before hubot plugin packages were adopted, most plugins were held in the
[hubot-scripts][hubot-scripts] package. Some of these plugins have yet to be
migrated to their own packages. They can still be used but the setup is a bit
different.

To enable scripts from the hubot-scripts package, add the script name with
extension as a double quoted string to the `hubot-scripts.json` file in this
repo.

[hubot-scripts]: https://github.com/github/hubot-scripts

##  Persistence

If you are going to use the `hubot-redis-brain` package (strongly suggested),
you will need to add the Redis to Go addon on Heroku which requires a verified
account or you can create an account at [Redis to Go][redistogo] and manually
set the `REDISTOGO_URL` variable.

    % heroku config:add REDISTOGO_URL="..."

If you don't need any persistence feel free to remove the `hubot-redis-brain`
from `external-scripts.json` and you don't need to worry about redis at all.

[redistogo]: https://redistogo.com/

## Adapters

Adapters are the interface to the service you want your hubot to run on, such
as Campfire or IRC. There are a number of third party adapters that the
community have contributed. Check [Hubot Adapters][hubot-adapters] for the
available ones.

If you would like to run a non-Campfire or shell adapter you will need to add
the adapter package as a dependency to the `package.json` file in the
`dependencies` section.

Once you've added the dependency with `npm install --save` to install it you
can then run hubot with the adapter.

    % bin/hubot -a <adapter>

Where `<adapter>` is the name of your adapter without the `hubot-` prefix.

[hubot-adapters]: https://github.com/github/hubot/blob/master/docs/adapters.md

## Deployment

    % heroku create --stack cedar
    % git push heroku master

If your Heroku account has been verified you can run the following to enable
and add the Redis to Go addon to your app.

    % heroku addons:add redistogo:nano

If you run into any problems, checkout Heroku's [docs][heroku-node-docs].

You'll need to edit the `Procfile` to set the name of your hubot.

More detailed documentation can be found on the [deploying hubot onto
Heroku][deploy-heroku] wiki page.

### Deploying to UNIX or Windows

If you would like to deploy to either a UNIX operating system or Windows.
Please check out the [deploying hubot onto UNIX][deploy-unix] and [deploying
hubot onto Windows][deploy-windows] wiki pages.

[heroku-node-docs]: http://devcenter.heroku.com/articles/node-js
[deploy-heroku]: https://github.com/github/hubot/blob/master/docs/deploying/heroku.md
[deploy-unix]: https://github.com/github/hubot/blob/master/docs/deploying/unix.md
[deploy-windows]: https://github.com/github/hubot/blob/master/docs/deploying/windows.md

## Campfire Variables

If you are using the Campfire adapter you will need to set some environment
variables. If not, refer to your adapter documentation for how to configure it,
links to the adapters can be found on [Hubot Adapters][hubot-adapters].

Create a separate Campfire user for your bot and get their token from the web
UI.

    % heroku config:add HUBOT_CAMPFIRE_TOKEN="..."

Get the numeric IDs of the rooms you want the bot to join, comma delimited. If
you want the bot to connect to `https://mysubdomain.campfirenow.com/room/42`
and `https://mysubdomain.campfirenow.com/room/1024` then you'd add it like
this:

    % heroku config:add HUBOT_CAMPFIRE_ROOMS="42,1024"

Add the subdomain hubot should connect to. If you web URL looks like
`http://mysubdomain.campfirenow.com` then you'd add it like this:

    % heroku config:add HUBOT_CAMPFIRE_ACCOUNT="mysubdomain"

[hubot-adapters]: https://github.com/github/hubot/blob/master/docs/adapters.md

## Restart the bot

You may want to get comfortable with `heroku logs` and `heroku restart` if
you're having issues.

## More information on Hubot:
[hubot]: http://hubot.github.com
[generator-hubot]: https://github.com/github/generator-hubot
