// This file is ran as a background script
console.log("Hello from background script!");

// background script

// get settings
chrome.storage.sync.get(
  {
    // default value
    t1pop: true,
    t1foc: true,
  },
  function (items) {
    t1pop = items.t1pop;
    t1foc = items.t1foc;

    // open pop-up as a tab
    chrome.windows.getCurrent({}, function (w) {
      var mainwindow = w.id;
      chrome.windows.onCreated.addListener(function (w) {
        if (w.type == "popup" && t1pop == true) {
          chrome.windows.get(w.id, { populate: true }, function (w) {
            chrome.tabs.query(
              {
                active: true,
                windowId: w.id,
              },
              function (tabs) {
                var t1popUrl = tabs[0].url;
                if (t1popUrl.startsWith("chrome-extension://") == false) {
                  chrome.tabs.move(
                    w.tabs[0].id,
                    { windowId: mainwindow, index: -1 },
                    function () {
                      chrome.tabs.update(w.tabs[0].id, {
                        active: t1foc /* focus new window or not */,
                      });
                    }
                  );
                }
              }
            );
          });
        }
      });

      chrome.windows.onFocusChanged.addListener(function (w) {
        chrome.windows.get(w, {}, function (w) {
          if (w.type == "normal") {
            mainwindow = w.id;
          }
        });
      });
    });
  }
);
