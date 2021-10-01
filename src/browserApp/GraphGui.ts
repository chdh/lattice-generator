import {LatticeStructure} from "./Worker";
import {genKeyName} from "./GuiUtils";
import ForceGraph3D from "3d-force-graph";
import {ConfigOptions, ForceGraph3DInstance} from "3d-force-graph";

export const enum LayoutMode {fixed, d3, ngraph}
export const layoutModeEnumNames = ["fixed", "d3", "ngraph"];

var graph:                   ForceGraph3DInstance;
var graphElement:            HTMLElement;
var graphCloseButtonElement: HTMLElement;
var graphVisible:            boolean = false;
var initDone:                boolean = false;
var scalingFactor:           number;

function createNode (ls: LatticeStructure, i: number, layoutMode: LayoutMode) {
   const node = <any>{};
   node.id = i;
   const pos = ls.layout.positions[i];
   node.x = pos[0] * scalingFactor;
   node.y = pos[1] * scalingFactor;
   node.z = pos[2] * scalingFactor;
   if (layoutMode == LayoutMode.fixed) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z; }
   const hue = (Math.atan2(pos[2], pos[0]) / Math.PI * 180 + 360 + 20) % 360;
   const sat = Math.sqrt(pos[0] ** 2 + pos[2] ** 2) * 100;
   node.color = "hsl(" + hue.toFixed(1) + ", " + sat.toFixed(1) + "%, 55%)";
   node.name = ls.elementNames[i].replace(/\+/g, "\u22C1").replace(/\*/g, "\u22C0");
   return node; }

function buildGraphData (ls: LatticeStructure, layoutMode: LayoutMode) {
   const nodes = Array(ls.elements);
   for (let i = 0; i < ls.elements; i++) {
      nodes[i] = createNode(ls, i, layoutMode); }
   const links = Array(ls.edges.length);
   for (let i = 0; i < ls.edges.length; i++) {
      const edge = ls.edges[i];
      links[i] = {source: edge[0], target: edge[1], color: "#ffffff"}; }
   return {nodes, links}; }

function initGraph() {
   const graphConfig: ConfigOptions = {
      controlType: "orbit" };
   graph = ForceGraph3D(graphConfig);
   graph(graphElement); }

function resetGraph (ls: LatticeStructure, layoutMode: LayoutMode) {
   setGraphSize();
   switch (layoutMode) {
      case LayoutMode.fixed: {
         graph.forceEngine("d3");
         scalingFactor = 1000;
         break; }
      case LayoutMode.d3: {
         graph.forceEngine("d3");
         scalingFactor = 1000;
         graph.d3Force("link")!.distance(scalingFactor * 2.5 / ls.layout.graphHeight);
         break; }
      case LayoutMode.ngraph: {
         graph.forceEngine("ngraph");
         scalingFactor = 16 * ls.layout.graphHeight;
         // graph.ngraphPhysics({springLength: scalingFactor * 1 / ls.layout.graphHeight});
         break; }
      default: break; }
   graph.nodeRelSize(scalingFactor * 0.24 / ls.layout.graphHeight);
   graph.nodeOpacity(1);
   graph.nodeResolution(15);
   graph.linkOpacity(1);
   graph.linkWidth(scalingFactor * 0.08 / ls.layout.graphHeight);
   graph.linkDirectionalArrowLength(scalingFactor * 0.36 / ls.layout.graphHeight);
   graph.linkDirectionalArrowRelPos(1);
   graph.enableNodeDrag(false);
   graph.cameraPosition({x: 0, y: 0, z: scalingFactor * 2.58}); }

function clearGraph() {
   graph.graphData({nodes: [], links: []}); }

function setGraphSize() {
   graph.width(window.innerWidth);
   graph.height(window.innerHeight); }

function setGraphVisibility (visible: boolean) {
   graphElement.classList.toggle("hidden", !visible);
   graphCloseButtonElement.classList.toggle("hidden", !visible);
   graphVisible = visible; }

function closeGraph() {
   setGraphVisibility(false);
   clearGraph(); }

function windowResizeEventHandler() {
   if (!graphVisible) {
      return; }
   setGraphSize(); }

function documentKeyDownEventHandler (event: KeyboardEvent) {
   const keyName = genKeyName(event);
   if (keyName == "Escape" && graphVisible) {
      closeGraph();
      event.preventDefault(); }}

function init() {
   if (initDone) {
      return; }
   graphElement = document.getElementById("graph")!;
   graphCloseButtonElement = document.getElementById("graphCloseButton")!;
   initGraph();
   window.addEventListener("resize", windowResizeEventHandler);
   graphCloseButtonElement.addEventListener("click", closeGraph);
   document.addEventListener("keydown", documentKeyDownEventHandler);
   initDone = true; }

export function loadLatticeGraph (ls: LatticeStructure, layoutMode: LayoutMode) {
   init();
   resetGraph(ls, layoutMode);
   const graphData = buildGraphData(ls, layoutMode);
   graph.graphData(graphData);
   setGraphVisibility(true); }
