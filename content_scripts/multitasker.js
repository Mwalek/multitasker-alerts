(() => {
  window.hasRun = true;
  let observingStatus = "";

  // if (window.hasRun) {
  //   return;
  // }

  browser.runtime.onMessage.addListener(retrieveObserverMessage);

  function retrieveObserverMessage(data) {
    console.log(
      `Retrieved the following data from network.js: ${data.message}`
    );
    observingStatus = data.message;
    if (observingStatus) {
      observer.observe(targetNode, config);
    } else {
      observer.disconnect();
    }
  }

  /**
   * Determine (guess) the class of the ticket container
   */

  let parents = [];
  let matchList = document.querySelectorAll("div[role='presentation']");

  matchList.forEach(function (match) {
    let nextSibling = match.nextElementSibling;
    if (nextSibling) {
      if (nextSibling.getAttribute("role") === "presentation") {
        parents.push(match.parentElement.className);
      }
    }
  });
  // console.log(parents);

  function getMostFrequent(arr) {
    const hashmap = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(hashmap).reduce((a, b) =>
      hashmap[a] > hashmap[b] ? a : b
    );
  }

  const mostFrequentContainer = getMostFrequent(parents);

  // console.log(mostFrequentContainer);

  let ticketContainerClasses = mostFrequentContainer.split(" ");
  const individualTicket = `.${ticketContainerClasses[0]} > div[role="presentation"]`;
  // console.log(individualTicket);

  // Select the node that will be observed for mutations
  const targetNode = document.getElementsByClassName(
    ticketContainerClasses[0]
  )[0];
  let originalNumberOfTickets =
    document.querySelectorAll(individualTicket).length;
  console.log(`originalNumberOfTickets = ${originalNumberOfTickets}`);
  let player = document.createElement("audio");
  let mp3_url = browser.runtime.getURL("assets/bell-notification.mp3");
  player.src = mp3_url;
  var timer = null;
  let userRecentlyScrolled = false;

  function scrollStatus() {
    if (userRecentlyScrolled) {
      if (observingStatus) {
        targetNode.classList.add("scrolling");
        setTimeout(() => {
          targetNode.classList.remove("scrolling");
        }, 10000);
      }
      return true;
    } else if (!userRecentlyScrolled) {
      if (observingStatus) {
        targetNode.classList.add("not-scrolling");
        setTimeout(() => {
          targetNode.classList.remove("not-scrolling");
        }, 10000);
      }
      return false;
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      if (timer !== null) {
        clearTimeout(timer);
      }
      userRecentlyScrolled = true;
      console.log("User scrolling detected...");
      scrollStatus();
      timer = setTimeout(function () {
        userRecentlyScrolled = false;
        scrollStatus();
        console.log("User has not scrolled in the recent past.");
      }, 10000);
    },
    true
  );

  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: false };

  // Callback function to execute when mutations are observed
  const callback = (mutationList, observer) => {
    let currentNumberOfTickets = document.querySelectorAll(individualTicket);
    console.log(currentNumberOfTickets.length);
    console.log("originalNumberOfTickets = " + originalNumberOfTickets);
    if (currentNumberOfTickets.length > originalNumberOfTickets) {
      console.log("The number of tickets has increased.");
      if (scrollStatus() === false) {
        let playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Auto-play was prevented
            console.log(`Multitasker Error: ${error}`);
          });
        }
        alert("The number of tickets has increased.");
      }
    }
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        console.log("A child node has been added or removed.");
      } else if (mutation.type === "attributes") {
        console.log(`The ${mutation.attributeName} attribute was modified.`);
      }
    }
    originalNumberOfTickets = currentNumberOfTickets.length;
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  /**
   * This function is called to create a new ticket for
   * the purposes of simulation. It is added after 15s,
   * stays on the page for 15s, and is deleted thereafter.
   */
  function createNewTicket(ticketsContainer) {
    let div = document.createElement("div");
    let p = document.createElement("p");
    let del = document.createElement("del");
    p.textContent = "I'm a Dummy ";
    del.textContent = "ticket";
    p.append(del);
    div.appendChild(p);
    div.setAttribute(
      "style",
      "background-color: salmon; color: white; width: auto; height: auto; padding:20px;"
    );
    div.setAttribute("role", "presentation");
    ticketsContainer.prepend(div);
    console.log("Removing the fake ticket in 15 seconds...");
    setTimeout(() => div.remove(), 15000);
    console.log("Removed the fake ticket...");
  }

  /**
   * Listen for messages from the background script.
   * Call "insertBeast()" or "removeExistingBeasts()".
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "start") {
      console.log("Started observing...");
      observingStatus = true;
      if (observer) {
        observer.observe(targetNode, config);
      }
      // notifyBackgroundPage(observingStatus);
      console.log(`Inside start command: ${observingStatus}.`);
    } else if (message.command === "stop") {
      console.log("Stopped observing...");
      observingStatus = false;
      if (observer) {
        observer.disconnect();
      }
      // notifyBackgroundPage(observingStatus);
    } else if (message.command === "simulate") {
      console.log("Adding a fake ticket in 15 seconds...");
      setTimeout(function () {
        createNewTicket(targetNode);
      }, 15000);
      // notifyBackgroundPage(observingStatus);
    }
  });
})();
