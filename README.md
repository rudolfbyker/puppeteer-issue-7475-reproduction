# Minimal failing example for https://github.com/puppeteer/puppeteer/issues/7475

## Steps:

### Host a small webpage that loads a web font

```shell
cd serve
npm install
npm run serve
```

### Run puppeteer test script in a separate terminal

```shell
cd test
npm install
npm run test
```

### It fails

```
> test@1.0.0 test
> node test.js

/home/dolf/tmp/puppeteer-issue-7475-reproduction/test/test.js:38
          new Error(
          ^

Error: After 1000ms, there are still 2 pending items.
    at Timeout.fail [as _onTimeout] (/home/dolf/tmp/puppeteer-issue-7475-reproduction/test/test.js:38:11)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7)
```

### When did it break?

If you downgrade to puppeteer v9, it works without errors.

```shell
cd test
npm add puppeteer@^9
npm run test
```
