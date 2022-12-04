(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  console.log("Multitasker launched successfully...");

  // Select the node that will be observed for mutations
  const targetNode = document.getElementsByClassName("sc-1g53n8-0")[0];
  let originalNumberOfTickets = document.querySelectorAll(
    '.sc-1g53n8-0 > div[role="presentation"]'
  ).length;
  console.log(`originalNumberOfTickets = ${originalNumberOfTickets}`);
  let player = document.createElement("audio");
  player.src = browser.runtime.getURL("assets/bell-notification.mp3");
  let mp3_url = browser.runtime.getURL("assets/bell-notification.mp3");
  console.log(mp3_url);
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
        let playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise
            .then((_) => {
              console.log("playPromise is not undefined...");
              // Automatic playback started!
              // Show playing UI.
            })
            .catch((error) => {
              console.log(`Multitasker Error: ${error}`);
              // Auto-play was prevented
              // Show paused UI.
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
  }

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
    } else if (message.command === "simulate") {
      console.log("Adding a fake ticket in 15 seconds...");
      setTimeout(function () {
        createNewTicket(targetNode);
      }, 15000);
    }
  });
})();

// Start observing the target node for configured mutations
// observer.observe(targetNode, config);
