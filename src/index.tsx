"use client";
import {
  isServer,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { FC, useRef } from "react";

const DATA_NAME = "__REACT_QUERY_DATA_PROMISE__";

type PropertyType = {
  finished?: boolean;
  promises?: Promise<unknown>[];
};

const DataTransfer: FC<{ property: PropertyType }> = ({ property }) => {
  const queryClient = useQueryClient();
  const promises = queryClient
    .getQueryCache()
    .getAll()
    .flatMap(({ promise }) => (promise ? [promise] : []));
  if (isServer && !promises.every((p) => property.promises?.includes(p))) {
    property.promises = promises;
    throw Promise.all(promises);
  }
  const value = dehydrate(queryClient);
  return (
    <script
      id={DATA_NAME}
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
};

export const SSRProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const property = useRef<PropertyType>({}).current;
  if (!isServer && !property.finished) {
    const node = document.getElementById(DATA_NAME);
    if (node) {
      const value = JSON.parse(node.innerHTML);
      hydrate(queryClient, value);
    }
    property.finished = true;
  }
  return (
    <>
      {children}
      <DataTransfer property={property} />
    </>
  );
};

export const enableSSR = { suspense: isServer };
