# caching container to avoid redownloading packages on every run

FROM busybox
VOLUME ["/src/node_modules", "/src/jspm_packages", "/src/typings"]
WORKDIR "/src"
CMD ["echo", "Caching container only"]
