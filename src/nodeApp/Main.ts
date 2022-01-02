import * as LatticeCatalog from "../LatticeCatalog";
import {LatticeController} from "../LatticeController";
import * as LatticeRel from "../LatticeRel";
import * as LatticeGraph from "../LatticeGraph";
import {assert} from "../Utils";
import {performance} from "perf_hooks";
import * as SourceMapSupport from "source-map-support";

const consistencyCheckEnabled = true;
const relationsCheckEnabled   = true;
const logTime                 = false;
const latticeName             = "4-4";

function main() {
   SourceMapSupport.install();
   const def = LatticeCatalog.getLatticeDefByName(latticeName);
   const maxIterations = 3 * def.elements;
   const startTime = performance.now();
   const controller = new LatticeController(def.elements, def.generatorElementNames, def.generatorElementRelations);
   let iteration = 0;
   while (true) {
      if (iteration++ > maxIterations) {
         console.log(`Aborting main loop after ${maxIterations} iterations.`);
         break; }
      let info: string | undefined;
      try {
         info = controller.createNewElement();
         if (info) {
            console.log(info); }}
       catch (e) {
         console.log();
         console.log(e.stack);
         console.log();
         console.log(controller.dumpAll());
         throw e; }
      if (consistencyCheckEnabled) {
         try {
            controller.verifyLatticeConsistency(); }
          catch (e) {
            console.log(e.message);
            break; }}
      if (relationsCheckEnabled) {
         const updates1 = LatticeRel.completeElementRelationChains(controller.relMap);
         if (updates1) {
            console.log("Incomplete relation chains detected.");
            break; }
         const updates2 = LatticeRel.updateAllElementRelations(controller.relMap, controller.elementTable);
         if (updates2) {
            console.log("Incomplete element relations detected.");
            break; }}
// if (controller.elementTable.n == 16) {break; }
      if (logTime) {
         console.log(`Time: ${Math.round(performance.now() - startTime)} ms`); }
      if (!info) {
         console.log("No more elements found.");
         break; }
      console.log(); }
   console.log();
   console.log(`Time: ${Math.round(performance.now() - startTime)} ms`);
   console.log();
   console.log(controller.dumpAll());
   const edges = LatticeGraph.getLatticGraphEdges(controller.relMap);
   console.log("\nGraph edges:\n" + JSON.stringify(edges));
   const n = controller.elementTable.n;
   assert(n == def.elements);
// const graph = new LatticeGraph.Graph(n, edges);
// const layout = LatticeGraph.getLatticeGraphLayout(controller.elementTable, graph, controller.relMap, controller.generatorElementCount);
// console.log("\nGraph layout:\n" + JSON.stringify(layout));
   const elementNames = controller.elementTable.getAllNames();
   console.log("\nElement names JSON:\n" + JSON.stringify(elementNames));
// console.log("\nStats: ", LatticeRel.stats);
   }

main();
