PATH := $(PATH):./node_modules/.bin

DOCS = $(shell find docs/*.md)
HTMLDOCS =$(DOCS:.md=.html)

test:
	@NODE_ENV=test expresso \
		-I lib \
		-I support \
		$(TESTFLAGS) \
		test/*.test.js

test-cov:
	@TESTFLAGS=--cov $(MAKE) test


.PHONY: test test-cov