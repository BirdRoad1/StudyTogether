import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./css/default.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import { RoomScreen } from "./screen/RoomScreen.tsx";
import { ClientProvider } from "./provider/ClientProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/room/:roomCode" element={<RoomScreen />} />
        </Routes>
      </BrowserRouter>
    </ClientProvider>
  </StrictMode>
);
