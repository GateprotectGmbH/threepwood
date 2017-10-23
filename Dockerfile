FROM rocketboy/node-phantomjs

EXPOSE 3000
ENV APP /app
WORKDIR $APP
COPY . $APP
