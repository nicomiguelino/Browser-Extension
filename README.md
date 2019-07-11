Develop
-------

The extension is built using webpack.

```
docker-compose up
```

Now load the content of the `dist/` folder as an unpacked extension in Chrome. As you make changes to the code, dist is automatically rebuilt.

Distribute
----------

```
docker-compose build
docker run \
    --rm -ti \
    -v $(pwd):/app:delegated \
    -v /app/node_modules \
    sce_webpack:latest npx webpack --env.production

(cd dist && zip -r ../screenly-chrome-extension-0.3.zip *)
```

Unit testing
------------

1. Build the extension in dev mode.
2. Load the extension as an unpacked extension from the `dist` folder.
3. Find the extension URL and then open `chrome-extension://extension-id/test/tests.html` in Chrome.