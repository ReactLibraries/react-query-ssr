"use client";
import {
  isServer,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/react-query";
import React, { createContext, ReactNode, useContext } from "react";
import { FC, useRef } from "react";

const DATA_NAME = "__REACT_QUERY_DATA_PROMISE__";

type PropertyType = {
  finished?: boolean;
  promises?: Promise<unknown>[];
  isDataRender?: boolean;
  promise: Promise<void>;
  resolve: () => void;
  value?: unknown;
};

/**
 * Context for asynchronous data management
 */
const promiseContext = createContext<PropertyType>(undefined as never);

export const SSRDataRender: FC<{ builtIn?: boolean }> = ({ builtIn }) => {
  const ssrContext = useContext(promiseContext);
  const queryClient = useQueryClient();
  if (ssrContext.isDataRender && builtIn) return null;
  if (!builtIn) ssrContext.isDataRender = true;
  if (isServer && !ssrContext.finished) {
    throw ssrContext.promise;
  }
  const value = isServer ? dehydrate(queryClient) : ssrContext.value;
  return (
    <script id={DATA_NAME} type="application/json">
      {JSON.stringify(value)}
    </script>
  );
};

const SSRResolve = () => {
  const ssrContext = useContext(promiseContext);
  const queryClient = useQueryClient();
  const promises = queryClient
    .getQueryCache()
    .getAll()
    .flatMap(({ promise }) => (promise ? [promise] : []));
  if (isServer && !promises.every((p) => ssrContext.promises?.includes(p))) {
    ssrContext.promises = promises;
    throw Promise.all(promises);
  }
  if (isServer) {
    ssrContext.finished = true;
    ssrContext.resolve();
  }
  return null;
};

export const SSRProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const property = useRef<PropertyType>(Promise.withResolvers()).current;
  if (!isServer && !property.finished) {
    const node = document.getElementById(DATA_NAME);
    if (node) {
      const value = JSON.parse(node.innerText);
      hydrate(queryClient, value);
      property.value = value;
    }
    property.finished = true;
  }
  return (
    <promiseContext.Provider value={property}>
      {children}
      <SSRResolve />
      <SSRDataRender builtIn={true} />
    </promiseContext.Provider>
  );
};

export const enableSSR = { suspense: isServer };
