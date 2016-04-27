FROM eye_chrome

WORKDIR "/src"

# copy current source
# directory should match that of cache Dockerfile to enable caching
COPY . /src

CMD ["/src/ci.sh"]
