console.log("Network.js started...");

if (typeof observingStatus === "undefined") {
  let observingStatus = false;
  console.log(`Current observingStatus: ${observingStatus}.`);
  // notifyBackgroundPage();
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

browser.browserAction.onClicked.addListener((tab) => {
  console.log(`A click was logged.`);
});

browser.runtime.onMessage.addListener(notify);

function notify(request, sender, sendResponse) {
  console.log(request.message);
  if (firstRun === "") {
    firstRun = false;
    observingStatus = request.message;
    console.log("This was the first run...");
    // notifyBackgroundPage();
  } else if (firstRun === false) {
    if (request.firstrun === false) {
      console.log("This was NOT the first run...");
      if (observingStatus !== request.message) {
        observingStatus = request.message;
      }
    }
  }
  sendResponse({ response: observingStatus });
  // send message to multitasker.js
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(sendMultitasker)
    .catch(reportAnError);
}

function reportAnError(error) {
  console.log(error);
}

function sendMultitasker(tabs) {
  setTimeout(function () {
    browser.tabs
      .sendMessage(tabs[0].id, {
        message: observingStatus,
      })
      .then(success)
      .catch(error);
  }, 1000);
}

function success(response) {
  console.log("Multitasker.js received the message.");
}

function error(error) {
  console.log(error);
}

// function handleResponse(message) {
//   console.log(`Message from the background script: ${message.response}`);
// }

// function handleError(error) {
//   console.log(`Error: ${error}`);
// }

// function notifyBackgroundPage(observingStatus, e) {
//   const sending = browser.runtime.sendMessage({
//     greeting: "Greeting from the content script",
//     status: observingStatus,
//   });
//   sending.then(handleResponse, handleError);
// }

// background-script.js
// function handleMessage(request, sender, sendResponse) {
//   console.log(`A content script sent a message: ${request.greeting}`);
//   sendResponse({ response: "Response from background script" });
// }

// browser.runtime.onMessage.addListener(handleMessage);
