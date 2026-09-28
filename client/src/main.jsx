import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider } from "@vis.gl/react-google-maps";
import App from "./App";
import "./index.css";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const hasGoogleKey = Boolean(apiKey && apiKey !== "undefined" && apiKey.trim().length > 5);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {hasGoogleKey ? (
      <APIProvider 
        apiKey={apiKey}
        onLoad={() => console.log('Maps API has loaded.')}
      >
        <App />
      </APIProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);

