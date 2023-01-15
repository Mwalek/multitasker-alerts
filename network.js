console.log("Network.js started...");

if (typeof observingStatus === "undefined") {
  let observingStatus = false;
  console.log(`Current observingStatus: ${observingStatus}.`);
}

let firstRun = "";
let workingTab = 0;
let currentTab;
let hasWorkingTab;

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
  let responseObj = {};

  if (firstRun === "") {
    firstRun = false;
    observingStatus = request.message;
    console.log("This was the first run...");
    handlePopupMessage(request);
    sendResponse({
      result: "Network.js received the message..",
      hasWorkingTab,
      response: observingStatus,
      workingTab: workingTab,
      currentTab: currentTab,
    });
  } else if (firstRun === false) {
    if (request.firstrun === false) {
      console.log("This was NOT the first run...");
      if (observingStatus !== request.message) {
        observingStatus = request.message;
      }
    }
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(sendMultitasker)
      .catch(reportAnError);
    handlePopupMessage(request);

    if (request.name === "starterUpper" || "stopperDowner") {
      handlePopupMessage(request);
      sendResponse({
        results: "Network.js received the message..",
        hasWorkingTab,
        response: observingStatus,
        workingTab,
        currentTab,
      });
    } else {
      sendResponse({
        results: "Network.js received the message..",
        hasWorkingTab,
        response: observingStatus,
        workingTab,
        currentTab,
      });
    }
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

function foo() {
  console.log("I'm defined in background.js");
}

/**
 * Save the ID of the tab where the start button was clicked.
 */

function handlePopupMessage(request) {
  console.log(`working tab is ${workingTab}`);
  if (workingTab === 0 && request.initiator === "start") {
    workingTab = request.tab_id;
    hasWorkingTab = true;
    console.log(`working tab is ${workingTab}`);
  } else if (workingTab > 0) {
    currentTab = request.tab_id;
    console.log(`current tab is ${currentTab}`);
  }
  if (request.initiator === "stop") {
    workingTab = 0;
    hasWorkingTab = false;
    console.log("The initiator was 'stop'");
  }
  console.log(`Index.js sent a message: ${request.tab_id}`);
}
