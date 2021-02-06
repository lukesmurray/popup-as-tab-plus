# Popup as Tab Plus

![](./images/icon300.png)

Simple chrome extension for opening popups as tabs with support for whitelisting. If "https://example.com" always opens popups and you want it to open tabs instead you can add "https://example.com" to the window whitelist.
Useful for developing applications which tend to open in new windows.

## Develop

`yarn start` and load unpacked extension into chrome.
You can set DEBUG in AppState to try and debug the logic flow.

## Build prod

`yarn build`

## Release

`yarn build && zip -r -9 dist.zip dist/*`

Upload the `dist.zip` file to the [chrome developer dashboard](https://chrome.google.com/webstore/developer/dashboard)
