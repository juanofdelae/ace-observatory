import { EditionsPosterSvg } from "./EditionsPosterSvg";

// SVG poster — pure client-side React + SVG, no map library. Touches
// `window` only inside `useEffect` so it's safe to import directly into
// a server component without `dynamic({ ssr: false })`.
export function EditionsPosterPage() {
  return <EditionsPosterSvg />;
}
