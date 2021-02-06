import isEqual from "lodash.isequal";

export const DEBUG = false;

export interface AppState {
  popupWhitelistUrls: string[];
  windowWhitelistUrls: string[];
  enabled: boolean;
}

export const defaultAppState: AppState = {
  popupWhitelistUrls: [],
  windowWhitelistUrls: [],
  enabled: true,
};

export const storageStateKey = "state";

export const getSyncData = () =>
  new Promise<AppState>((resolve, reject) => {
    return chrome.storage.sync.get(storageStateKey, (result) =>
      chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(
            result[storageStateKey] === undefined
              ? defaultAppState
              : JSON.parse(result[storageStateKey])
          )
    );
  });

export const setSyncData = (state: AppState) =>
  new Promise<void>((resolve, reject) => {
    return chrome.storage.sync.set(
      { [storageStateKey]: JSON.stringify(state) },
      () =>
        chrome.runtime.lastError
          ? reject(Error(chrome.runtime.lastError.message))
          : resolve()
    );
  });

export const isStateEqual = (s1: any, s2: any) => {
  return isEqual(s1, s2);
};
