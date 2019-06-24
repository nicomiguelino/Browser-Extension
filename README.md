Build
-----

1. Compile the haml.
1. Zip it up:

        zip -r screenly-chrome-extension-0.2.zip -x lib/vendor/jasmine *.html assets lib *.json *.js zip -r screenly-chrome-extension-0.2.zip *.html assets lib *.json *.js -x "lib/vendor/jasmine*"

Unit testing
------------

1. Load the extension as an unpacked extension.
2. Find the extension URL and then open `chrome-extension://extension-id/test/tests.html` in Chrome.