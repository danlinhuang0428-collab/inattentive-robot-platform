import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PlatformApp from "../components/PlatformApp";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlatformApp />
  </StrictMode>,
);
