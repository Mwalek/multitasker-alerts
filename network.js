console.log("Network.js started...");

/**
 * This event is triggered when a request is about to be made, and before headers are available.
 * This is a good place to listen...
 */

function reqListener(details) {
  const date = new Date(details.timeStamp);
  console.log(date.toUTCString());
  console.log(details);
}

const reqFilter = {
  urls: ["<all_urls>"],
};

browser.webRequest.onBeforeRequest.addListener(
  reqListener, // function
  reqFilter //  object
);
