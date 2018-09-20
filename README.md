pd-prayer-tracker
=================

As a Wycliffe Bible Translator, keeping track of my ministry prayer partners
and financial sponsors quickly got unwieldy.

This application helps keep track of supporters, how much they've donated, and
the last time you reached out with gratitude or prayer.

# Development

Clone and install dependencies:

```
git clone https://github.com/RaphaelDeLaGhetto/pd-prayer-tracker.git
cd pd-prayer-tracker && npm install
```

I use [Docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04)
and so should you. Start a MongoDB development server:

```
docker run --name dev-mongo -p 27017:27017 -d mongo
```

Once created, you can start and stop the container like this:

```
docker stop dev-mongo
docker start dev-mongo
```

Seed the database:

```
node seed.js
```

Start `maildev`:

```
docker run -d --name maildev -p 1080:80 -p 25:25 -p 587:587 djfarrelly/maildev
```

Run server:

```
npm start
```

# Testing

I use `jasmine` and `zombie` for testing. These are included in the package's development dependencies.

Run all the tests:

```
npm test
```

Run one set of tests:

```
NODE_ENV=test node_modules/.bin/jasmine spec/models/seriesSpec.js
```

You need to run the server to test features:

```
NODE_ENV=test node_modules/.bin/jasmine spec/features/startTestServerSpec.js spec/features/trackerIndexSpec.js
```

# Staging

## Docker MongoDB

Create a data volume for MongoDB:                                                                                                                                                                         
```
docker create --name pd-prayer-tracker_mongo_data -v /dbdata mongo /bin/true
``` 

## docker-compose

You may need to run this twice:

```
docker-compose up
```

## Seed

```
docker-compose run --rm node node seed.js NODE_ENV=staging 
```

### Debug Mongo container

```
docker exec -it pd-prayer-tracker_mongo_1 mongo
```

# Production

Note: the host environment needs to have the same version as the node in the app container.

Clone and install:

```
npm install --production
```

## Set up environment

Paste the following into a `.env` file:

```
FROM=missionary@example.com
PASSWORD=
```

Change the following in `docker-compose.prod.yml` to match your own Let's Encrypt credentials

```
  environment:
    - VIRTUAL_HOST=example.com
    - LETSENCRYPT_HOST=example.com
    - LETSENCRYPT_EMAIL=missionary@example.com
```

### Let's Encrypt

This works best behind an `nginx`/`jrcs/letsencrypt-nginx-proxy-companion` combo.

Create a new directory apart from the `pd-prayer-tracker` application directory:

```
cd ..
mkdir nginx-proxy && cd nginx-proxy
```

Copy and paste the following to a `docker-compose.yml` file:

```
nginx-proxy:
  image: jwilder/nginx-proxy
  restart: always
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./current/public:/usr/share/nginx/html
    - ./certs:/etc/nginx/certs:ro
    - /etc/nginx/vhost.d
    - /usr/share/nginx/html
    - /var/run/docker.sock:/tmp/docker.sock:ro
  log_opt:
    max-size: 1m
letsencrypt:
  image: jrcs/letsencrypt-nginx-proxy-companion
  restart: always
  volumes:
    - ./certs:/etc/nginx/certs:rw
    - /var/run/docker.sock:/var/run/docker.sock:ro
  volumes_from:
    - nginx-proxy
```

## File uploads

Watch the `uploads/` directory. The Docker container won't be able to write to the host without proper permissions.

In the past, changing ownership of the directory to `app` would work.

```
mkdir uploads # if necessary
sudo chown -R app:app uploads/
```

Currently, the user defined in the `Dockerfile` is `app`, so this doesn't need to be changed anymore... (I think).

## Docker MongoDB

Create a data volume for MongoDB:

```
docker create --name pd-prayer-tracker_mongo_data -v /dbdata mongo /bin/true
``` 

### Backup

Dump the data from the data-only container:

```
docker run --volumes-from pd-prayer-tracker_mongo_data -v $(pwd):/backup busybox tar cvf /backup/backup.tar /data/db
```

Restore to a data-only container:

```
docker run --volumes-from pd-prayer-tracker_mongo_data -v $(pwd):/backup busybox tar xvf /backup/backup.tar
```

Look at the contents of the data-only container:

```
docker run --rm --volumes-from pd-prayer-tracker_mongo_data busybox ls -lh /data/db
```

## docker-compose

You may need to run this twice:

```
docker-compose -f docker-compose.prod.yml up -d
```

## Seed

```
docker-compose -f docker-compose.prod.yml run --rm node-app node seed.js NODE_ENV=production
```

### Debug Mongo container

```
docker exec -it pd-prayer-tracker_mongo_1 mongo
```


