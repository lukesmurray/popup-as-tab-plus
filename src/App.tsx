import {
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
  Text,
} from "@chakra-ui/react";
import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useReducer,
  useState,
} from "react";
import { VscTrash } from "react-icons/vsc";
import "./App.css";
import {
  AppState,
  defaultAppState,
  getSyncData,
  isStateEqual,
  setSyncData,
  storageStateKey,
} from "./AppState";

interface State {
  appState: AppState;
  loaded: boolean;
  synced: boolean;
}
type Action =
  | { type: "set_enabled"; enabled: boolean }
  | { type: "add_popup_whitelist_url"; url: string }
  | { type: "remove_popup_whitelist_url"; url: string }
  | { type: "add_window_whitelist_url"; url: string }
  | { type: "remove_window_whitelist_url"; url: string }
  | { type: "load_initial_state"; state: AppState }
  | { type: "load_changed_state"; state: AppState }
  | { type: "update_sync_state" }
  | { type: "update_sync_state_fail" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set_enabled":
      return {
        ...state,
        appState: {
          ...state.appState,
          enabled: action.enabled,
        },
        synced: false,
      };
    case "add_popup_whitelist_url":
      return {
        ...state,
        appState: {
          ...state.appState,
          popupWhitelistUrls: [
            ...state.appState.popupWhitelistUrls,
            action.url,
          ],
        },
        synced: false,
      };
    case "remove_popup_whitelist_url": {
      const idx = state.appState.popupWhitelistUrls.indexOf(action.url);
      if (idx === -1) {
        return state;
      }
      return {
        ...state,
        appState: {
          ...state.appState,
          popupWhitelistUrls: [
            ...state.appState.popupWhitelistUrls.slice(0, idx),
            ...state.appState.popupWhitelistUrls.slice(idx + 1),
          ],
        },
        synced: false,
      };
    }
    case "add_window_whitelist_url":
      return {
        ...state,
        appState: {
          ...state.appState,
          windowWhitelistUrls: [
            ...state.appState.windowWhitelistUrls,
            action.url,
          ],
        },
        synced: false,
      };
    case "remove_window_whitelist_url": {
      const idx = state.appState.windowWhitelistUrls.indexOf(action.url);
      if (idx === -1) {
        return state;
      }
      return {
        ...state,
        appState: {
          ...state.appState,
          windowWhitelistUrls: [
            ...state.appState.windowWhitelistUrls.slice(0, idx),
            ...state.appState.windowWhitelistUrls.slice(idx + 1),
          ],
        },
        synced: false,
      };
    }
    case "load_initial_state": {
      return { ...state, appState: action.state, loaded: true, synced: true };
    }
    case "load_changed_state": {
      if (isStateEqual(state.appState, action.state)) {
        return state;
      } else {
        return { ...state, appState: action.state, synced: true, loaded: true };
      }
    }
    case "update_sync_state":
      return { ...state, synced: true };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, {
    appState: defaultAppState,
    loaded: false,
    synced: false,
  });

  // get the synced data on load
  useEffect(() => {
    getSyncData()
      .then((state) => {
        dispatch({
          type: "load_initial_state",
          state,
        });
      })
      .catch((err) => console.error("got error", err));
  }, []);

  // listen for changes
  useEffect(() => {
    chrome.storage.onChanged.addListener((changes) => {
      if (storageStateKey in changes) {
        const storageChange = changes[storageStateKey];
        const newState =
          storageChange.newValue === undefined
            ? undefined
            : JSON.parse(storageChange.newValue);
        dispatch({
          type: "load_changed_state",
          state: newState,
        });
      }
    });
  }, []);

  // set the synced data on change
  useEffect(() => {
    if (state.loaded && state.synced === false) {
      dispatch({ type: "update_sync_state" });
      setSyncData(state.appState).catch((err) => {
        console.error("failed to update sync state", err);
      });
    }
  }, [state.appState, state.loaded, state.synced]);

  return (
    // max height and width are 600x600
    <Flex minW={"400px"} minH={"400px"} direction={"column"} p={2}>
      <Heading size={"md"}>
        Popup as tab plus{" "}
        <span role="img" aria-label="star emoji">
          ✨
        </span>
      </Heading>
      <Text size={"xs"}>
        Urls are matched by prefix. For example, &quot;https://e&quot; matches
        &quot;https://example.com&quot;. The entire prefix must match including
        the &quot;https&quot; part.
      </Text>
      <FormControl id="enabled">
        <FormLabel fontSize="sm">Enabled</FormLabel>
        <Checkbox
          isChecked={state.appState.enabled}
          onChange={(e) =>
            dispatch({ type: "set_enabled", enabled: e.target.checked })
          }
          isDisabled={!state.loaded}
        />
        <FormHelperText fontSize="xs">
          Enable or disable the extension.
        </FormHelperText>
        <UrlList
          state={state}
          dispatch={dispatch}
          onRemoveUrl={(url) =>
            dispatch({ type: "remove_popup_whitelist_url", url })
          }
          onAddUrl={(url) => dispatch({ type: "add_popup_whitelist_url", url })}
          urls={state.appState.popupWhitelistUrls}
          loaded={state.loaded}
          formId={"popup-whitelist"}
          formHelpText={
            "Popups with a url that matches one of these strings will be converted into tabs"
          }
          formLabel={"Popup Url Whitelist"}
        />
        <UrlList
          state={state}
          dispatch={dispatch}
          onRemoveUrl={(url) =>
            dispatch({ type: "remove_window_whitelist_url", url })
          }
          onAddUrl={(url) =>
            dispatch({ type: "add_window_whitelist_url", url })
          }
          urls={state.appState.windowWhitelistUrls}
          formId={"window-whitelist"}
          formHelpText={
            "Popups created by a window with a url that matches one of these strings will be converted into tabs"
          }
          formLabel={"Window Url Whitelist"}
          loaded={state.loaded}
        />
      </FormControl>
    </Flex>
  );
};

interface UrlListProps {
  dispatch: React.Dispatch<Action>;
  state: State;
  onRemoveUrl: (url: string) => void;
  onAddUrl: (url: string) => void;
  urls: string[];
  loaded: boolean;
  formId: string;
  formHelpText: string;
  formLabel: string;
}

const UrlList: React.VFC<UrlListProps> = (props) => {
  const {
    onAddUrl,
    onRemoveUrl,
    urls,
    loaded,
    formId,
    formHelpText,
    formLabel,
  } = props;
  // local state
  const [url, setUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // function called to validate a whitelist url
  const validateUrl = (newUrl: string) => {
    if (urls.indexOf(newUrl) !== -1) {
      setErrorMsg("Url already in list.");
    } else {
      setErrorMsg("");
    }
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    validateUrl(event.target.value);
  };

  const handleUrlEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && url !== "" && errorMsg === "") {
      onAddUrl(url);
      setUrl("");
    }
  };

  const handleRemoveWhitelistUrl = (url: string) => {
    onRemoveUrl(url);
  };

  const CloseIconSize = "16px";
  return (
    <>
      <FormControl id={formId} isInvalid={errorMsg !== ""}>
        <FormLabel fontSize="sm">{formLabel}</FormLabel>
        <Input
          type="url"
          placeholder="https://google.com"
          variant="filled"
          size="xs"
          value={url}
          onChange={handleUrlChange}
          onKeyUp={handleUrlEnter}
          isDisabled={!loaded}
        />
        <FormHelperText fontSize="xs">{formHelpText}</FormHelperText>
        <FormErrorMessage>{errorMsg}</FormErrorMessage>
      </FormControl>
      <List maxH={"135px"} overflowY="scroll" boxShadow="inner" bg="gray.100">
        {urls.map((url) => (
          <ListItem key={url} spacing={1}>
            <ListIcon
              as={(props) => <VscTrash {...props} size={CloseIconSize} />}
              w={CloseIconSize}
              h={CloseIconSize}
              style={{ cursor: "pointer" }}
              onClick={() => handleRemoveWhitelistUrl(url)}
            />
            <Text fontSize="sm" as="span">
              {url}
            </Text>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default App;
