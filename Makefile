test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha \
		--reporter spec \
		$(TESTFLAGS)

test-browser:
	open test/browser.html

build:
	./node_modules/.bin/grunt concat min

all:
	make test
	./node_modules/.bin/grunt lint concat min

lint:
	./node_modules/.bin/grunt lint

.PHONY: all test test-browser lint