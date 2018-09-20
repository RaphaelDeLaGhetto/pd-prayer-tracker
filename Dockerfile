FROM node

#
# Create `app` user and update `npm`
# 2016-10-7 https://github.com/npm/npm/issues/9863
#
# 2017-6-9 The ticket above is still open. Hanging on for reference
#RUN useradd --user-group --create-home --shell /bin/false app &&\
#              curl -L https://npmjs.org/install.sh | sh
RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

COPY package.json $HOME/pd-prayer-tracker/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/pd-prayer-tracker

RUN npm install --production

USER root
COPY . $HOME/pd-prayer-tracker
RUN chown -R app:app $HOME/*
USER app

CMD ["node", "app.js"]
