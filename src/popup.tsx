import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom";
import { IconContext } from "react-icons";
import App from "./App";
import "./popup.css";

var mountNode = document.getElementById("popup");
ReactDOM.render(
  <ChakraProvider>
    <IconContext.Provider value={{ style: { verticalAlign: "middle" } }}>
      <App />
    </IconContext.Provider>
  </ChakraProvider>,
  mountNode
);
