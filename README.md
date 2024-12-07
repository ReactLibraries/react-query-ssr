# react-query-ssr

## overview

SSR functionality with react-query.

Provides SSR functionality from `Next.js`‘s `Pages Router` and `App Router`’s `Client Component`.
It also works with `React Router`.

SSR does not use the functionality of the respective frameworks and works only with standard React functionality.
Therefore, it does not require any environment.

## URL of sample program

<https://next-react-query-ssr.vercel.app/>  
<https://github.com/SoraKumo001/next-react-query-ssr>

## Notes.

Do not use `<Suspense>` for components using useSSR in ServerSide.
You will not be able to wait for asynchronous data.

## Example

- app/Provider.tsx

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, ReactNode, useState } from "react";
import { SSRProvider } from "react-query-ssr";

export const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <SSRProvider>{children}</SSRProvider>
    </QueryClientProvider>
  );
};
```

- app/Layout.tsx

```tsx
import { Provider } from "./Provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

- src/app/[page]/page.tsx

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { enableSSR } from "react-query-ssr";

import Link from "next/link";
import { useParams } from "next/navigation";

type PokemonList = {
  count: number;
  next: string;
  previous: string | null;
  results: { name: string; url: string }[];
};

const pokemonList = (page: number): Promise<PokemonList> =>
  fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${(page - 1) * 20}`).then(
    (r) => r.json()
  );

const Page = () => {
  const params = useParams();
  const page = Number(params["page"] ?? 1);
  const { data } = useQuery({
    // `useQuery` with this option.
    ...enableSSR,
    queryKey: ["pokemon-list", page],
    queryFn: () => pokemonList(page),
  });

  if (!data) return <div>loading</div>;
  return (
    <>
      <title>Pokemon List</title>
      <div style={{ display: "flex", gap: "8px", padding: "8px" }}>
        <Link
          href={page > 1 ? `/${page - 1}` : ""}
          style={{
            textDecoration: "none",
            padding: "8px",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          ⏪️
        </Link>
        <Link
          href={page < Math.ceil(data.count / 20) ? `/${page + 1}` : ""}
          style={{
            textDecoration: "none",
            padding: "8px",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          ⏩️
        </Link>
      </div>
      <hr style={{ margin: "24px 0" }} />
      <div>
        {data.results.map(({ name }) => (
          <div key={name}>
            <Link href={`/pokemon/${name}`}>{name}</Link>
          </div>
        ))}
      </div>
    </>
  );
};
export default Page;
```

- src/app/pokemon/[name]/page.tsx

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { enableSSR } from "../../react-query-ssr";

type Pokemon = {
  abilities: { ability: { name: string; url: string } }[];
  base_experience: number;
  height: number;
  id: number;
  name: string;
  order: number;
  species: { name: string; url: string };
  sprites: {
    back_default: string;
    back_female: string;
    back_shiny: string;
    back_shiny_female: string;
    front_default: string;
    front_female: string;
    front_shiny: string;
    front_shiny_female: string;
  };
  weight: number;
};

const pokemon = (name: string): Promise<Pokemon> =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then((r) => r.json());

const Page = () => {
  const params = useParams();
  const name = String(params["name"]);
  const { data } = useQuery({
    // `useQuery` with this option.
    ...enableSSR,
    queryKey: ["pokemon", name],
    queryFn: () => pokemon(name),
  });

  if (!data) return <div>loading</div>;
  return (
    <>
      <title>{name}</title>
      <div style={{ padding: "8px" }}>
        <Link
          href="/1"
          style={{
            textDecoration: "none",
            padding: "8px 32px",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          ⏪️List
        </Link>
      </div>
      <hr style={{ margin: "24px 0" }} />
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px",
        }}
      >
        <img
          style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.5)" }}
          src={data.sprites.front_default}
        />
        <div>{name}</div>
      </div>
    </>
  );
};
export default Page;
```
