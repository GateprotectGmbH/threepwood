# Build Monitor for Gitlab

Display job build statuses.

## Get this Project running

### Install dependencies

```sh
npm install && npm run deps
```

### Local development and running

#### Start web server with file watching

```sh
npm start
```

Monitor is located at `http://localhost:3000/`


### CI equivalent build

```sh
docker-compose up --build
```

Monitor is located at `http://gitlab-monitor.docker` (MacOS using dingy) or `http://localhost:3000` (Linux).


### Build standalone dist/index.html file

```sh
npm install && npm run deps && npm run build && npm run package
```
