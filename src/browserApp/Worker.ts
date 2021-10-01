import * as LatticeCatalog from "../LatticeCatalog";
import {LatticeController} from "../LatticeController";
import {Graph, getLatticGraphEdges, LatticeGraphLayout, getLatticeGraphLayout} from "../LatticeGraph";
import {assert} from "../Utils";
import * as DialogManager from "dialog-manager";

var webWorker:               Worker;
var workerActive:            boolean;
var workerPromiseResolve:    Function;

export interface LatticeStructure {
   elements:                 number;
   bottomElementNo:          number;
   topElementNo:             number;
   elementNames:             string[];
   edges:                    number[][];
   layout:                   LatticeGraphLayout; }

export function generateLattice (latticeName: string) : LatticeStructure {
   const def = LatticeCatalog.getLatticeDefByName(latticeName);
   const controller = new LatticeController(def.elements, def.generatorElementNames, def.generatorElementRelations);
   const maxIterations = 3 * def.elements;
   const startTime = performance.now();
   let lastProgressInfoStep = -1;
   let iteration = 0;
   while (true) {
      if (iteration++ > maxIterations) {
         throw new Error(`Aborting main loop after ${maxIterations} iterations.`); }
      const info = controller.createNewElement();
      if (!info) {
         break; }
      const progressInfoStep = Math.floor((performance.now() - startTime) / 500);
      if (progressInfoStep > lastProgressInfoStep) {
         sendProgressInfo(controller.elementTable.n + " elements");
         lastProgressInfoStep = progressInfoStep; }}
   const elementTable = controller.elementTable;
   assert(elementTable.n == def.elements);
   const ls = <LatticeStructure>{};
   ls.elements = def.elements;
   ls.bottomElementNo = elementTable.bottomElementNo!;
   ls.topElementNo = elementTable.topElementNo!;
   ls.elementNames = elementTable.getAllNames();
   ls.edges = getLatticGraphEdges(controller.relMap);
   const graph = new Graph(def.elements, ls.edges);
   ls.layout = getLatticeGraphLayout(elementTable, graph, controller.relMap, controller.generatorElementCount);
   return ls; }

// Wrapper function which starts a web worker when it takes a long time to generate the lattice.
export function generateLatticeAsync (latticeName: string) : Promise<LatticeStructure> {
   if (workerActive) {
      throw new Error("A worker is still active."); }
   const def = LatticeCatalog.getLatticeDefByName(latticeName);
   if (def.elements < 300) {
      const ls = generateLattice(latticeName);
      return Promise.resolve(ls); }
   if (!webWorker) {
      webWorker = new Worker("app.js");
      webWorker.addEventListener("message", webWorkerResponseMessageHandler);
      webWorker.addEventListener("error", webWorkerErrorHandler); }
   webWorker.postMessage({id: "start", latticeName});
   DialogManager.showProgressInfo({msgText: "Starting"});
   return new Promise<LatticeStructure>((resolve) => {
      workerPromiseResolve = resolve; }); }

function webWorkerErrorHandler (event: ErrorEvent) {
   console.log("Error in web worker.", event);
   alert("Fatal error: " + event.message); }

function webWorkerResponseMessageHandler (event: MessageEvent) {
   const msg = event.data;
   console.log("WebWorker response message received.", msg);
   switch (msg.id) {
      case "progressInfo": {
         DialogManager.showProgressInfo({msgText: msg.msgText});
         break; }
      case "complete": {
         workerPromiseResolve(msg.latticeStructure);
         workerActive = false;
         DialogManager.closeProgressInfo();
         break; }}}

//--- Inside Web Worker -----------------------------------

let workerScope: any;                                      // DedicatedWorkerGlobalScope

function sendProgressInfo (msgText: string) {
   if (!workerScope) {
      return; }
   workerScope.postMessage({id: "progressInfo", msgText}); }

function webWorkerRequestMessageHandler (event: MessageEvent) {
   const msg = event.data;
   console.log("WebWorker request message received.", msg);
   switch (msg.id) {
      case "start": {
         const latticeStructure = generateLattice(msg.latticeName);
         workerScope.postMessage({id: "complete", latticeStructure});
         break; }}}

export function webWorkerStartup() {
   console.log("WebWorker started.");
   workerScope = self;
   workerScope.addEventListener('message', webWorkerRequestMessageHandler); }
