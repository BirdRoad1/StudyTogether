import { createContext } from "react";
import type { Client } from "../ws/client.tsx";

export const ClientContext = createContext<Client | null>(null);
