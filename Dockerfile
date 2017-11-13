FROM node:alpine

ENV NODE_ENV=production

ADD config/default.json /srv/app/config/default.json
ADD dist                /srv/app/dist
ADD migrations          /srv/app/migrations
ADD node_modules        /srv/app/node_modules
ADD views               /srv/app/views
ADD knexfile.js         /srv/app/knexfile.js
ADD LICENCE             /srv/app/LICENCE
ADD package.json        /srv/app/package.json
ADD README.md           /srv/app/README.md
ADD src/backend         /srv/app/src/backend

WORKDIR /srv/app

CMD node --max_old_space_size=250 --abort_on_uncaught_exception src/backend/index.js

HEALTHCHECK --interval=15s --timeout=3s CMD curl -f http://localhost/ || exit 1
