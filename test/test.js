const puppeteer = require('puppeteer');
const EventEmitter = require("events");

function createIdleWaiter() {
  class Emitter extends EventEmitter {}

  let pendingItems = [];
  const emitter = new Emitter();

  function push(item) {
    pendingItems.push(item);
    emitter.emit("active");
  }

  function pop(item) {
    pendingItems = pendingItems.filter((r) => r !== item);
    if (pendingItems.length === 0) {
      emitter.emit("idle");
    }
  }

  /**
   * Return a promise that will resolve when idle (i.e. when there are no pending items).
   *
   * @param idleTimeout
   *   The minimum amount of idle time before the promise will resolve.
   *
   * @param failTimeout
   *   The maximum amount of time to wait before rejecting.
   */
  async function wait(idleTimeout, failTimeout) {
    let failTimer;
    let idleTimer;

    return new Promise((resolve, reject) => {
      function fail() {
        reject(
          new Error(
            `After ${failTimeout}ms, there are still ${pendingItems.length} pending items.`
          )
        );
      }

      function succeed() {
        clearTimeout(failTimer);
        resolve();
      }

      // Start failure time immediately.
      failTimer = setTimeout(fail, failTimeout);

      // Handle edge case where neither active nor idle is emitted during the lifetime of this promise.
      if (pendingItems.length === 0) {
        idleTimer = setTimeout(succeed, idleTimeout);
      }

      // Play a game of whack-a-mole with the idle and active events.
      emitter.on("idle", () => {
        idleTimer = setTimeout(succeed, idleTimeout);
      });
      emitter.on("active", () => {
        clearTimeout(idleTimer);
      });
    });
  }

  return {
    wait,
    push,
    pop,
  };
}

async function test() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  const { wait, push, pop } = createIdleWaiter();

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    push(request);

    request.continue();
  });

  page.on("requestfinished", (request) => {
    pop(request);
  });

  page.on("requestservedfromcache", (request) => {
    pop(request);
  });

  page.on("requestfailed", (request) => {
    pop(request);

    throw new Error(
      `Request to ${request.url()} failed. ${
        request.failure()?.errorText
      }`
    );
  });

  await page.goto("http://localhost:8080", {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
  });

  await wait(100, 1000);
  await page.close();
  await browser.close();
}

test();
