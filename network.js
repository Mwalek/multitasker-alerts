console.log("Network.js started...");

if (typeof observingStatus === "undefined") {
  let observingStatus = false;
  console.log(`Current observingStatus: ${observingStatus}.`);
}

let firstRun = "";

/**
 * This event is triggered when a request is about to be made, and before headers are available.
 * This is a good place to listen...
 */

function reqListener(details) {
  const date = new Date(details.timeStamp);
  // console.log(date.toUTCString());
  // console.log(details);
}

const reqFilter = {
  urls: ["<all_urls>"],
};

browser.webRequest.onBeforeRequest.addListener(
  reqListener, // function
  reqFilter //  object
);

browser.runtime.onMessage.addListener(notify);

function notify(request, sender, sendResponse) {
  if (firstRun === "") {
    firstRun = false;
    observingStatus = request.message;
    console.log("This was the first run...");
    sendResponse({ response: observingStatus });
  } else if (firstRun === false) {
    /**
     * This IF block only fires when the observingStatus
     * has changed at least once.
     */
    if (request.firstrun === false) {
      console.log("This was NOT the first run...");
      if (observingStatus !== request.message) {
        observingStatus = request.message;
      }
    }
    sendResponse({ response: observingStatus });
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(sendMultitasker)
      .catch(reportAnError);
  }
}

function reportAnError(error) {
  console.log(error);
}

function sendMultitasker(tabs) {
  browser.tabs
    .sendMessage(tabs[0].id, {
      message: observingStatus,
    })
    .then(success)
    .catch(error);
}

function success(response) {
  /**
   * Uncomment this line when debugging:
   * console.log("Multitasker.js received the message.");
   **/
}

function error(error) {
  console.log(error);
}
