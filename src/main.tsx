import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import PrivacyPolicy from "./PrivacyPolicy";

const path = window.location.pathname;
const isPrivacyPolicy = path === "/privacy-policy" || path === "/privacy-policy/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPrivacyPolicy ? <PrivacyPolicy /> : <App />}
  </StrictMode>,
);
