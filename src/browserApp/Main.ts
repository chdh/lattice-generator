import {latticeDefs} from "../LatticeCatalog";
import * as Worker from "./Worker";
import * as GraphGui from "./GraphGui";
import {catchError} from "./GuiUtils";

const defaultLatticeName = "1-1-1";

var latticeTypeElement:      HTMLSelectElement;
var layoutModeElement:       HTMLSelectElement;

async function startButton_clickEvent() {
   const latticeName = latticeTypeElement.value;
   const ls = await Worker.generateLatticeAsync(latticeName);
   const layoutMode = GraphGui.layoutModeEnumNames.indexOf(layoutModeElement.value);
   GraphGui.loadLatticeGraph(ls, layoutMode); }

function startup2() {
   latticeTypeElement = <HTMLSelectElement>document.getElementById("latticeType")!;
   for (const def of latticeDefs) {
      if (def.hide) {
         continue; }
      const text = def.latticeName + " (" + def.elements + " elements)";
      const isDefault = def.latticeName == defaultLatticeName;
      latticeTypeElement.add(new Option(text, def.latticeName, isDefault, isDefault)); }
   layoutModeElement = <HTMLSelectElement>document.getElementById("layoutMode")!;
   document.getElementById("startButton")!.addEventListener("click", () => catchError(startButton_clickEvent)); }

function startup() {
   try {
      startup2(); }
    catch (e) {
      console.log(e);
      alert(e); }}

if ((<any>self).WorkerGlobalScope) {
   Worker.webWorkerStartup(); }
 else {
   document.addEventListener("DOMContentLoaded", startup); }
