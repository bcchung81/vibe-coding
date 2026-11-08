// MapLibre 6 loads its worker from a separate file next to its own module. Once bundled, that file is not there,
// so copy it into public/ and the map (/topics/map) points setWorkerUrl at it. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/maplibre", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre/maplibre-gl-worker.mjs");
