import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import sourcemaps from 'rollup-plugin-sourcemaps';
import builtinModules from 'builtin-modules';

export default [
{
   input: "tempBuild/browserApp/Main.js",
   output: {
      file: "app.js",
      format: "iife",
      intro: "const window = globalThis;"                  // this is necessary to prevent an error when loading the three module in the web worker
   },
   plugins: [
      nodeResolve(),
      commonjs()
   ]
},
{
   input: "tempBuild/nodeApp/Main.js",
   output: {
      file: "lattice.js",
      format: "cjs",
      banner: "#!/usr/bin/env node",
      sourcemap: "inline",
   },
   external: [
      ...builtinModules,
      ],
   plugins: [
      nodeResolve(),
      commonjs(),
      sourcemaps()
   ]
}];
