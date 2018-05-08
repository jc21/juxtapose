![Juxtapose](https://public.jc21.com/juxtapose/icons/github.png "Juxtapose")

# Juxtapose

![Version](https://img.shields.io/badge/version-1.1.1-green.svg?style=for-the-badge)
![Stars](https://img.shields.io/docker/stars/jc21/juxtapose.svg?style=for-the-badge)
![Pulls](https://img.shields.io/docker/pulls/jc21/juxtapose.svg?style=for-the-badge)

> **[juhk-stuh-pohz, juhk-stuh-pohz]**
>
> *to place close together or side by side, especially for comparison or contrast*

This Web App is a self-hosted Web Service glue for some of the applications I use on a daily
basis. It's purpose is to notify you of events that you want to know about, without being
swamped in noise, thus improving productivity.


## Supported Services

**Incoming services via Webhooks:**

- Jira
- Bitbucket
- Docker Hub
- Zendesk

**Outgoing services**

- Slack (via Slack Bot)
- Jabber / XMPP / Google Hangouts

 
## Features

- Easy to use interface to configure your services, templates and rules
- Configure multiple templates for each notification type
- Multiple users who can create and manage their own rules
- Per-rule filtering options based on incoming service


## Getting started

There are a few ways to run this app and most of the time you'll want to create a config file.

See `config/default.json` for an example of the config file. At this time only a Mysql/Mariadb database is supported.

When first run, the app will generate private and public gpg keys for use with JsonWebTokens. For security reasons these will not be saved
in the database and are instead saved in a config file in the `/config` directory.


## Using [Rancher](https://rancher.com)?

Easily start an Juxtapose Stack by adding [my template catalog](https://github.com/jc21/rancher-templates).


### Method 1: Pre-built Docker Image with docker-compose and local mariadb

By far the easiest way to get up and running. Create this `docker-compose.yml`

```bash
version: "2"
services:
  app:
    image: jc21/juxtapose
    ports:
      - 80:80
    environment:
      - NODE_ENV=production
    volumes:
      - ./default.json:/srv/app/config/default.json
    depends_on:
      - db
    links:
      - db
    restart: on-failure
  db:
    image: mariadb
    environment:
      MYSQL_ROOT_PASSWORD: "juxtapose"
      MYSQL_DATABASE: "juxtapose"
      MYSQL_USER: "juxtapose"
      MYSQL_PASSWORD: "juxtapose"
    volumes:
      - ./mysql:/var/lib/mysql
    restart: on-failure
```

In this docker-compose file, your Juxtapose config file should be named `default.json` and should exist in the same directory as `docker-compose.yml`

This will define a Juxtapose container and also a Mariadb container to connect to. Make sure the database credentials match your config file entries.

Now it's time to start up the containers. First we'll start with the database first, because it takes a few seconds to intialize and in this time, the Juxtapose
app will crash if it can't connect to it. Hence we will initialize it on it's own first:

```bash
docker-compose up db
```

Check the output and make sure there were no errors.

Now start the app/whole stack:

```bash
docker-compose up
```

And observe the output.


### Method 2: Pre-built Docker Image with docker-compose and your own database

Create this `docker-compose.yml`

```bash
version: "2"
services:
  app:
    image: jc21/juxtapose
    ports:
      - 80:80
    environment:
      - NODE_ENV=production
    volumes:
      - ./default.json:/srv/app/config/default.json
    restart: on-failure
```

In this docker-compose file, your Juxtapose config file should be named `default.json` and should exist in the same directory as `docker-compose.yml`

Make sure your config database settings are correct! Juxtapose only needs a new, empty database to get started.

Now start the app:

```bash
docker-compose up
```

And observe the output.


### Method 3: Pre-built Docker Image with your own database

Run this:

```bash
docker run --name juxtapose -p 80:80 -e NODE_ENV=production -v "./default.json:/srv/app/config/default.json" jc21/juxtapose
```

For this example, your Juxtapose config file should be named `default.json` and should exist in the current directory.

Make sure your config database settings are correct! Juxtapose only needs a new, empty database to get started.


### Method 4: Run pre-built package using Node

For when you don't know Docker and don't want to know. You'll need node version 6+ and a database ready to go.


### Method 5: Run for development, yes using Docker

If you intend on developing and extending this app, this is how you'll want to get started. You'll need docker-compose installed.

```bash
git clone https://github.com/jc21/juxtapose.git
cd juxtapose
bin/npm install
bin/gulp build
docker-compose up
```

This will start a nodemon container to monitor for changes in files and restart the node app.

To start monitoring for frontend files that need to be built with gulp:

```bash
bin/gulp
```


## Default User

Juxtapose will create an admin user when it initialises the database. The login details are:

- Email: `admin@example.com`
- Password: `changeme`


## Known issues

### Slack Login Failures

When the credentials for a Slack bot are invalid it crashes the entire app. This is due mainly
to the `slackbots` package throwing errors incorrectly imo. Make sure you specify the correct
credentials when creating a Slack bot service. If you encounter this issue, simply remove the service
from the database with:

```sql
DELETE FROM `service` WHERE `type` = "slack";
-- alternatively update the api token:
UPDATE `service` SET `data` = '{"api_token":"NEWTOKEN"}' WHERE `type` = "slack";
```


## Advanced Topics

### Change the Port that the app runs on

It's as easy as adding this to your config file:

```json
{
  "port": 1234
}
```

### Template Language Tips

This project uses [Liquid template engine](http://shopify.github.io/liquid/basics/introduction/) for dynamic notification content.

This means that your Templates can contain wildcards from the data supplied and also display different message content based on fields using control sturctues.

In addition to the functionality provided in the base Liquid engine, this project supports the following modifiers:

1. `unescape` - Will convert HTML entities like `&amp;` to `&`.

   Example: `{{ summary | unescape }}`

2. `jsonstring` - Will take any data type and return it as a JSON encoded string. Be aware that the string will be prepended/appended with the `"` double quotes.

   Example: `{{ issuetype | jsonstring }}`

3. `jsonescape` - Will make a data type compatible to be included in a existing json string. It will also `unescape` for you. Does not prepend/append `"` double quotes.

   Example: `{{ summary | jsonescape }}`


### Proxy

Should you be running behind a HTTP Proxy, just specify the `HTTP_PROXY` environment variable. Note: Proxy support was added in v1.0.1

```bash
version: "2"
services:
  app:
    image: jc21/juxtapose
    ports:
      - 80:80
    environment:
      - NODE_ENV=production
      - HTTP_PROXY=http://10.60.10.1:3128
    volumes:
      - ./default.json:/srv/app/config/default.json
    depends_on:
      - db
    links:
      - db
    restart: on-failure
  db:
    image: mariadb
    environment:
      MYSQL_ROOT_PASSWORD: "juxtapose"
      MYSQL_DATABASE: "juxtapose"
      MYSQL_USER: "juxtapose"
      MYSQL_PASSWORD: "juxtapose"
    volumes:
      - ./mysql:/var/lib/mysql
    restart: on-failure
```

or

```bash
docker run --name juxtapose -p 80:80 -e NODE_ENV=production -e HTTP_PROXY=http://10.60.10.1:3128 -v "./default.json:/srv/app/config/default.json" jc21/juxtapose
```


## Screenshots

[![Login](https://public.jc21.com/juxtapose/screenshots/small/login.jpg "Login")](https://public.jc21.com/juxtapose/screenshots/login.jpg)
[![Rules](https://public.jc21.com/juxtapose/screenshots/small/rules.jpg "Rules")](https://public.jc21.com/juxtapose/screenshots/rules.jpg)
[![Edit Template](https://public.jc21.com/juxtapose/screenshots/small/edit_template.jpg "Edit Template")](https://public.jc21.com/juxtapose/screenshots/edit_template.jpg)
[![Bitbucket Template Example](https://public.jc21.com/juxtapose/screenshots/small/new_rule_template_bitbucket.jpg "Bitbucket Template Example")](https://public.jc21.com/juxtapose/screenshots/new_rule_template_bitbucket.jpg)
[![Jira Templates Example](https://public.jc21.com/juxtapose/screenshots/small/new_rule_template_jira.jpg "Jira Templates Example")](https://public.jc21.com/juxtapose/screenshots/new_rule_template_jira.jpg)
[![Bitbucket Triggers](https://public.jc21.com/juxtapose/screenshots/small/new_rule_trigger_bitbucket.jpg "Bitbucket Triggers")](https://public.jc21.com/juxtapose/screenshots/new_rule_trigger_bitbucket.jpg)
[![Jira Triggers](https://public.jc21.com/juxtapose/screenshots/small/new_rule_trigger_jira.jpg "Jira Triggers")](https://public.jc21.com/juxtapose/screenshots/new_rule_trigger_jira.jpg)
[![Services](https://public.jc21.com/juxtapose/screenshots/small/services.jpg "Services")](https://public.jc21.com/juxtapose/screenshots/services.jpg)
