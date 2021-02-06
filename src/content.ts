// This file is injected as a content script
console.log("Hello from content script!");

// get settings
chrome.storage.sync.get(
  {
    // default value
    t1tab: false,
  },
  function (items) {
    t1tab = items.t1tab;

    if (t1tab == true) {
      var a = document.getElementsByTagName("a");
      for (i = 0; i < a.length; i++) {
        if (a[i].target == "_blank" /* aggressive mode goes here */) {
          a[i].target = "_top"; /* _self vs _top */
        }
      }
    }
  }
);
