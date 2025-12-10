import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// connects the React app to the HTML page
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
