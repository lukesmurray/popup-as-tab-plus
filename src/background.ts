// This file is ran as a background script
console.log("Hello from background script!");
console.log("foo");

// background script
chrome.windows.getCurrent({}, (w) => {
  const mainWindowId = w.id;

  chrome.windows.onCreated.addListener((window) => {
    // if we found a popup
    if (window.type === "popup") {
      chrome.windows.get(window.id, { populate: true }, (w) => {
        chrome.tabs.query(
          {
            active: true,
            windowId: w.id,
          },
          (tabs) => {
            if (tabs.length === 0) {
              return;
            }
            const activeTab = tabs[0];
            const activeTabUrl = activeTab.url;
            const activeTabId = activeTab.id;
            if (activeTabId !== undefined) {
              chrome.tabs.move(
                activeTabId,
                { windowId: mainWindowId, index: -1 },
                () => {
                  chrome.tabs.update(activeTabId, { active: false });
                }
              );
            }
          }
        );
      });
    }
  });
});
