const controller = document.getElementById("controller");
let obsStatus = false;
function observerStatusChecker() {
  if (obsStatus) {
    controller.name = "stop";
    controller.textContent = "Stop";
  } else {
    controller.name = "start";
    controller.textContent = "Start";
  }
}
function onSuccess(message) {
  console.log(message.response);
  obsStatus = message.response;
  observerStatusChecker();
}
function onFailure(error) {
  console.log(error);
  observerStatusChecker();
}

function sendPopupStatus(firstRun = false) {
  let sending = browser.runtime.sendMessage({
    message: obsStatus,
    firstrun: firstRun,
  });
  sending.then(onSuccess, onFailure);
}

sendPopupStatus(true);

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
  console.log(obsStatus);

  if (obsStatus) {
    controller.name = "stop";
    controller.textContent = "Stop";
  } else {
    controller.name = "start";
    controller.textContent = "Start";
  }
  console.log("Content script succesfully injected into the active tab.");
  document.addEventListener("click", (e) => {
    console.log(`A click was logged: ${e.target.textContent}.`);
    /**
     * Given the name of a beast, get the URL to the corresponding image.
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
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
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
      console.error(`Could not beastify: ${error}`);
    }

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
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
    } else if (e.target.name === "stop") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(stopping)
        .catch(reportError);
    } else {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(observing)
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
