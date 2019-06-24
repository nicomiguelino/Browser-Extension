Build
-----

1. Compile the haml.
2. `zip -r screenly-chrome-extension-0.1.0.zip *.html assets lib *.json *.js`

(TODO: Exclude jasmine from the build.)

Unit testing
------------

1. Load the extension as an unpacked extension.
2. Find the extension URL and then open `chrome-extension://extension-id/test/tests.html` in Chrome.