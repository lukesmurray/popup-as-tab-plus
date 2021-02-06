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
  | { type: "add_whitelist_url"; url: string }
  | { type: "remove_whitelist_url"; url: string }
  | { type: "load_initial_state"; state: AppState }
  | { type: "load_changed_state"; state: AppState }
  | { type: "update_sync_state" }
  | { type: "update_sync_state_fail" };

const reducer = (state: State, action: Action): State => {
  console.log(action.type, state, action);
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
    case "add_whitelist_url":
      return {
        ...state,
        appState: {
          ...state.appState,
          whitelistUrls: [...state.appState.whitelistUrls, action.url],
        },
        synced: false,
      };
    case "remove_whitelist_url": {
      const idx = state.appState.whitelistUrls.indexOf(action.url);
      if (idx === -1) {
        return state;
      }
      return {
        ...state,
        appState: {
          ...state.appState,
          whitelistUrls: [
            ...state.appState.whitelistUrls.slice(0, idx),
            ...state.appState.whitelistUrls.slice(idx + 1),
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
        console.log(
          "ignoring change",
          "equal",
          isStateEqual(state.appState, action.state)
        );
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
    appState: {
      whitelistUrls: [],
      enabled: false,
    },
    loaded: false,
    synced: false,
  });

  // local state
  const [whitelistUrl, setWhitelistUrl] = useState("");
  const [whitelistUrlErrorText, setWhitelistUrlErrorText] = useState("");

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

  // function called to validate a whitelist url
  const validateWhiteListUrl = (newUrl: string) => {
    if (state.appState.whitelistUrls.indexOf(newUrl) !== -1) {
      setWhitelistUrlErrorText("Url already added to whitelist.");
    } else {
      setWhitelistUrlErrorText("");
    }
  };

  const handleWhitelistUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWhitelistUrl(event.target.value);
    validateWhiteListUrl(event.target.value);
  };

  const handleWhitelistUrlKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      whitelistUrl !== "" &&
      whitelistUrlErrorText === ""
    ) {
      dispatch({ type: "add_whitelist_url", url: whitelistUrl });
      setWhitelistUrl("");
    }
  };

  const handleRemoveWhitelistUrl = (url: string) => {
    dispatch({ type: "remove_whitelist_url", url });
  };

  const CloseIconSize = "18px";

  return (
    // max height and width are 600x600
    <Flex w={"400px"} h={"400px"} direction={"column"} p={2}>
      <Heading size={"md"}>
        Popup as tab plus{" "}
        <span role="img" aria-label="star emoji">
          ✨
        </span>
      </Heading>
      <FormControl id="enabled">
        <FormLabel>Enabled</FormLabel>
        <Checkbox
          isChecked={state.appState.enabled}
          onChange={(e) =>
            dispatch({ type: "set_enabled", enabled: e.target.checked })
          }
          isDisabled={!state.loaded}
        />
        <FormHelperText>Enable or disable the extension.</FormHelperText>
        <FormErrorMessage>{whitelistUrlErrorText}</FormErrorMessage>
      </FormControl>
      <FormControl id="whitelist" isInvalid={whitelistUrlErrorText !== ""}>
        <FormLabel>Whitelist</FormLabel>
        <Input
          type="url"
          placeholder="https://google.com"
          variant="filled"
          size="sm"
          value={whitelistUrl}
          onChange={handleWhitelistUrlChange}
          onKeyUp={handleWhitelistUrlKeyUp}
          isDisabled={!state.loaded}
        />
        <FormHelperText fontSize="xs">
          Set the urls which open a popup as a new tab.
          <br />
          (Uses exact prefix match. https://g matches https://google.com)
        </FormHelperText>
        <FormErrorMessage>{whitelistUrlErrorText}</FormErrorMessage>
      </FormControl>
      <List flexShrink={100} flexGrow={1} overflowX="auto">
        {state.appState.whitelistUrls.map((url) => (
          <ListItem key={url} spacing={1}>
            <ListIcon
              as={(props) => <VscTrash {...props} size={CloseIconSize} />}
              w={CloseIconSize}
              h={CloseIconSize}
              style={{ cursor: "pointer" }}
              onClick={() => handleRemoveWhitelistUrl(url)}
            />
            <Text fontSize="md" as="span">
              {url}
            </Text>
          </ListItem>
        ))}
      </List>
    </Flex>
  );
};

export default App;
