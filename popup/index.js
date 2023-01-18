const controller = document.getElementById("controller");
let obsStatus = false;
let workingTab;
let currentTab;
let theCurrentTab;
let workingTabExists;
const x = document.getElementsByTagName("BODY")[0];
let preloader = document.createElement("div");

browser.tabs
  .query({ active: true, url: "*://*.atlassian.net/*" })
  .then(launcher, unsupportedSite);

function preloaderSetup() {
  preloader.textContent = "Loading ...";
  preloader.setAttribute(
    "style",
    "background-color: salmon; color: white; text-align: center; padding:20px;"
  );
  x.prepend(preloader);
}

preloaderSetup();
window.addEventListener("load", function () {
  preloaderSetup();
});
function observerStatusChecker() {
  if (obsStatus) {
    controller.name = "stop";
    controller.textContent = "Stop";
  } else {
    controller.name = "start";
    controller.textContent = "Start";
  }
}

function removePreLoader() {
  preloader.remove();
}
function onSuccess(message) {
  /**
   * Uncomment the following line when debugging:
   * console.log(message.response);
   **/
  removePreLoader();
  console.log(JSON.stringify(message));
  obsStatus = message.response;
  workingTab = message.workingTab;
  /*
   * Get all tabs with supported URLs in order to later determine
   * whether the workingTab still exists
   */
  browser.tabs
    .query({ url: "*://*.atlassian.net/*" })
    .then(retrievedSupportedTabs, errorRetrievingSupportedTabs);
  function retrievedSupportedTabs(tabs) {
    console.log(tabs);
    workingTabExists = tabs.find((item) => item.id === workingTab);
    console.log(`Working tab: ${workingTab}`);
    if (message.currentTab) {
      currentTab = message.currentTab;
      if (!message.hasWorkingTab && workingTab !== currentTab) {
        console.log("There is no working tab.");
      } else if (message.hasWorkingTab && !workingTabExists) {
        console.log("There was a working tab, but it doesn't exist anymore.");
        stopper(tabs);
        stopperDowner(tabs);
      } else if (workingTab !== currentTab) {
        document.querySelector("#popup-content").classList.add("hidden");
        document.querySelector("#error-content").classList.remove("hidden");
      }
    }
  }
  function errorRetrievingSupportedTabs(e) {
    console.log(`Error retreiving supported tabs: ${e}.`);
  }

  observerStatusChecker();
}
function onFailure(error) {
  console.log(error);
  observerStatusChecker();
}

function sendPopupStatus(firstRun = false, currentTab = "") {
  let sending = browser.runtime.sendMessage({
    message: obsStatus,
    firstrun: firstRun,
    tab_id: currentTab,
  });
  sending.then(onSuccess, onFailure);
}

function launcher(tabs) {
  if (tabs.length === 0) {
    console.log(
      `The tabs array has a length of 0: This means the current URL is not supported.`
    );
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
  } else {
    console.log(`The tabs array has a length not equal to 0.`);
  }
  if (isIterable(tabs)) {
    console.log(tabs);
    for (const tab of tabs) {
      // tab.url requires the `tabs` permission or a matching host permission.
      console.log(tab.url);
      currentTab = tab.id;
    }
    sendPopupStatus(true, currentTab);
  }
}

// console.log(window.wrappedJSObject.foo);

/**
 * Check status of Observer
 */

observerStatusChecker();

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  if (obsStatus) {
    controller.name = "stop";
    controller.textContent = "Stop";
  } else {
    controller.name = "start";
    controller.textContent = "Start";
  }
  document.addEventListener("click", (e) => {
    console.log(`A click was logged: ${e.target.textContent}.`);
    /**
     * Given the name of a button that was clicked, send a corresponding command/message.
     */
    function standardiseInput(actionName) {
      switch (actionName) {
        case "Start":
          return "start";
        case "Stop":
          return "stop";
        case "Simulate":
          return "simulate";
        case "Reset":
          return "reset";
      }
    }

    /**
     * Change the observing state to true and notify
     * the popup and background script of the change.
     */
    function observing(tabs) {
      obsStatus = true;
      sendPopupStatus();

      let command = standardiseInput(e.target.textContent);
      browser.tabs.sendMessage(tabs[0].id, {
        command,
      });
      controller.name = "stop";
      controller.textContent = "Stop";
    }

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      obsStatus = false;
      sendPopupStatus();

      let command = standardiseInput(e.target.textContent);
      browser.tabs.sendMessage(tabs[0].id, {
        command,
      });
    }

    function stopping(tabs) {
      obsStatus = false;
      sendPopupStatus();

      let command = standardiseInput(e.target.textContent);
      browser.tabs.sendMessage(tabs[0].id, {
        command,
      });
      controller.name = "start";
      controller.textContent = "Start";
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Multitasker Error (logged after click): ${error}`);
    }

    /**
     * Get the active tab,
     * then call the appropriate function based on the buton
     * that was clicked.
     */
    if (e.target.type === "reset") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError);
    } else if (e.target.name === "start") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(observing)
        .catch(reportError);
      browser.tabs
        .query({ active: true, url: "*://*.atlassian.net/*" })
        .then(starterUpper, onError);
    } else if (e.target.name === "stop") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(stopping)
        .catch(reportError);
      browser.tabs
        .query({ active: true, url: "*://*.atlassian.net/*" })
        .then(stopperDowner, onError);
    } else {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(stopping)
        .catch(reportError);
    }
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute alert content script: ${error.message}`);
}

// index.js
function handleMessage(request, sender, sendResponse) {
  obsStatus = request.status;
  console.log(request.status);
  console.log(`A content script sent a message: ${request.greeting}`);
  sendResponse({ response: "Response from index script" });
  obsStatus = request.status;
}

browser.runtime.onMessage.addListener(handleMessage);

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/multitasker.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);

function onGot(page) {
  page.foo();
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function unsupportedSite() {
  console.log(`Unsupported website: ${error}`);
}

let getting = browser.runtime.getBackgroundPage();
getting.then(onGot, onError);

function logTabs(tabs) {
  for (const tab of tabs) {
    // tab.url requires the `tabs` permission or a matching host permission.
    console.log(tab.id);
  }
}

function onError(error) {
  console.error(`Error: ${error}`);
}

browser.tabs
  .query({ active: true, url: "*://*.atlassian.net/*" })
  .then(logTabs, onError);

function handleResponseA(message) {
  console.log(`hasWorkingTab: ${message.hasWorkingTab}`);
}

function notifyBackgroundScript(tabs, name, initiator) {
  console.log(`notifyBackgroundScript: ${tabs}`);
  if (isIterable(tabs)) {
    for (const tab of tabs) {
      // tab.url requires the `tabs` permission or a matching host permission.
      console.log(tab.id);
      const sending = browser.runtime.sendMessage({
        tab_id: tab.id,
        name,
        initiator: initiator,
      });
      sending.then(handleResponseA, onFailure);
    }
  }
}

function starterUpper(tabs) {
  notifyBackgroundScript(tabs, "starterUpper", "start");
}

function stopperDowner(tabs) {
  notifyBackgroundScript(tabs, "stopperDowner", "stop");
}

/**
 * Check if an object is iterable, before attempting to loop through
 */
function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
}

function stopper(tabs) {
  obsStatus = false;
  sendPopupStatus();

  let command = "stop";
  browser.tabs.sendMessage(tabs[0].id, {
    command,
  });
  controller.name = "start";
  controller.textContent = "Start";
}
