FROM docker-registry.lan.adytonsystems.com/node-4-phantomjs

EXPOSE 3000
ENV APP /app
WORKDIR $APP
COPY . $APP
# necesssary while GP registry is down
RUN npm config set registry https://registry.npmjs.org/