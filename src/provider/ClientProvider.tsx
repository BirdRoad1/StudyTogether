import React, { useRef, useEffect } from "react";
import { ClientContext } from "../context/ClientContext.ts";
import { Client } from "../ws/client.tsx";

type ProviderArgs = {
  children: React.ReactNode;
};

export const ClientProvider = ({ children }: ProviderArgs) => {
  const client = useRef<Client>(null);

  if (client.current === null) {
    client.current = new Client();
  }

  useEffect(() => {
    return () => {
      client.current?.close();
    };
  }, []);

  return (
    <ClientContext.Provider value={client.current}>
      {children}
    </ClientContext.Provider>
  );
};
