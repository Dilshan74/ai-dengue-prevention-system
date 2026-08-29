import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider } from "@vis.gl/react-google-maps";
import App from "./App";
import "./index.css";

console.log("Maps API Key:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <APIProvider 
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      onLoad={() => console.log('Maps API has loaded.')}
    >
      <App />
    </APIProvider>
  </StrictMode>,
);
