import { AppState, DEBUG, getSyncData, storageStateKey } from "./AppState";

// background script
chrome.windows.getCurrent({}, (w) => {
  const mainWindowId = w.id;

  let appState: AppState | undefined = undefined;

  // load the initial state
  getSyncData().then((s) => {
    appState = s;
    if (DEBUG) {
      console.log("loaded", appState);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (storageStateKey in changes) {
      const storageChange = changes[storageStateKey];
      const newState =
        storageChange.newValue === undefined
          ? undefined
          : JSON.parse(storageChange.newValue);
      if (newState !== undefined) {
        appState = newState;
        if (DEBUG) {
          console.log("updated", appState);
        }
      }
    }
  });

  // when a window is created
  chrome.windows.onCreated.addListener((popupWindow) => {
    // if it is a popup
    if (popupWindow.type === "popup") {
      if (DEBUG) {
        console.log("opened popup");
      }
      // load the popup window
      chrome.windows.get(popupWindow.id, { populate: true }, (popupWindow) => {
        // get the popup window tabs
        chrome.tabs.query(
          {
            active: true,
            windowId: popupWindow.id,
          },
          (popupTabs) => {
            // load the main window
            chrome.windows.get(
              mainWindowId,
              { populate: true },
              (mainWindow) => {
                // get the main window tabs
                chrome.tabs.query(
                  {
                    active: true,
                    windowId: mainWindow.id,
                  },
                  (mainWindowTabs) => {
                    if (
                      appState === undefined ||
                      appState.enabled === false ||
                      popupTabs.length === 0 ||
                      mainWindowTabs.length === 0
                    ) {
                      if (DEBUG) {
                        console.log(
                          "early exit",
                          appState,
                          popupTabs,
                          mainWindowTabs
                        );
                      }
                      return;
                    }
                    // get the info we need
                    const popupActiveTab = popupTabs[0];
                    const popupActiveTabUrl = popupActiveTab.url;
                    const popupActiveTabId = popupActiveTab.id;
                    const mainWindowActiveTab = mainWindowTabs[0];
                    const mainWindowActiveTabUrl = mainWindowActiveTab.url;
                    const mainWindowActiveTabId = mainWindowActiveTab.id;
                    // exit if anything undefined
                    if (
                      popupActiveTabUrl !== undefined &&
                      popupActiveTabId !== undefined &&
                      mainWindowActiveTabUrl !== undefined &&
                      mainWindowActiveTabId !== undefined &&
                      (appState.popupWhitelistUrls.some((url) =>
                        url.startsWith(popupActiveTabUrl)
                      ) ||
                        appState.windowWhitelistUrls.some((url) =>
                          url.startsWith(mainWindowActiveTabUrl)
                        ))
                    ) {
                      chrome.tabs.move(
                        popupActiveTabId,
                        { windowId: mainWindowId, index: -1 },
                        () => {
                          chrome.tabs.update(popupActiveTabId, {
                            active: true,
                          });
                        }
                      );
                    } else {
                      if (DEBUG) {
                        console.log("late exit", {
                          popupActiveTab,
                          popupActiveTabUrl,
                          popupActiveTabId,
                          mainWindowActiveTab,
                          mainWindowActiveTabUrl,
                          mainWindowActiveTabId,
                        });
                      }
                    }
                  }
                );
              }
            );
          }
        );
      });
    }
  });
});
