(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  setTimeout(() => console.log(age), 5000);

  // Select the node that will be observed for mutations
  const targetNode = document.getElementsByClassName("sc-1g53n8-0")[0];
  let originalNumberOfTickets = document.querySelectorAll(
    '.sc-1g53n8-0 > div[role="presentation"]'
  ).length;
  console.log(originalNumberOfTickets);
  var mp3_url =
    "https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3";
  var timer = null;
  let userRecentlyScrolled = false;

  function scrollStatus() {
    if (userRecentlyScrolled) {
      targetNode.style.backgroundColor = "aliceblue";
      return true;
    } else if (!userRecentlyScrolled) {
      targetNode.style.backgroundColor = "yellowgreen";
      return false;
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      if (timer !== null) {
        clearTimeout(timer);
      }
      // targetNode.style.backgroundColor = "green";
      userRecentlyScrolled = true;
      console.log("User scrolling detected...");
      scrollStatus();
      timer = setTimeout(function () {
        //   targetNode.style.backgroundColor = "yellow";
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
    let currentNumberOfTickets = document.querySelectorAll(
      '.sc-1g53n8-0 > div[role="presentation"]'
    );

    console.log(currentNumberOfTickets.length);
    console.log("originalNumberOfTickets = " + originalNumberOfTickets);
    if (currentNumberOfTickets.length > originalNumberOfTickets) {
      console.log("The number of tickets has increased.");
      if (scrollStatus() === false) {
        new Audio(mp3_url).play();
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
   * Listen for messages from the background script.
   * Call "insertBeast()" or "removeExistingBeasts()".
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "start") {
      console.log("Started observing...");
      observer.observe(targetNode, config);
    } else if (message.command === "stop") {
      console.log("Stopped observing...");
      observer.disconnect();
    }
  });
})();

// Start observing the target node for configured mutations
// observer.observe(targetNode, config);
