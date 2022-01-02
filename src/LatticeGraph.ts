// Program logic to process a lattice as a graph.

import {ElementTable, ElementRelationMap, ElementRelation} from "./LatticeBase";
import * as LatticeRel from "./LatticeRel";
import {assert} from "./Utils";

// Returns an array of element pairs that build the edges of the graph.
export function getLatticGraphEdges (relMap: ElementRelationMap) : number[][] {
   const edges: number[][] = [];
   for (let elementNo1 = 0; elementNo1 < relMap.n; elementNo1++) {
      const higherPredecessors = LatticeRel.findDirectPredecessors(relMap, elementNo1, ElementRelation.higher);
      for (const elementNo2 of higherPredecessors) {
         edges.push([elementNo1, elementNo2]); }}
   return edges; }

interface CornerInfo {                                     // info about the lattice graph corners
   cornerCount:              number;                       // number of corners
   cornerGeneratorMap:       number[][];                   // maps corner number to generator numbers
   generatorCornerMap:       number[]; }                   // maps generator element number to corner number

// Related generator elements are placed in the same corner.
function getCornerInfo (relMap: ElementRelationMap, generatorElementCount: number) : CornerInfo {
   let cornerCount = 0;
   const cornerGeneratorMap: number[][] = [];
   const generatorCornerMap: number[] = Array(generatorElementCount);
   for (let elementNo1 = 0; elementNo1 < generatorElementCount; elementNo1++) {
      let cornerNo = -1;
      for (let elementNo2 = 0; elementNo2 < elementNo1; elementNo2++) {
         if (relMap.areElementsRelated(elementNo1, elementNo2)) {
            cornerNo = generatorCornerMap[elementNo2];
            break; }}
      if (cornerNo == -1) {
         cornerNo = cornerCount++;
         cornerGeneratorMap.push([]); }
      cornerGeneratorMap[cornerNo].push(elementNo1);
      generatorCornerMap[elementNo1] = cornerNo; }
   return {cornerCount, cornerGeneratorMap, generatorCornerMap}; }

export interface LatticeGraphLayout {
   positions:                number[][];                    // vertex/element/node positions
   graphHeight:              number;                        // height of graph in edges, which corresponds to a geometric distance of 2 (-1 to +1)
   graphWidth:               number; }                      // approximate width of graph in edges

// Computes 3D coordinates for the elements of the lattice graph.
// Coordinate system: x=left/right, y=down/up, z=behind/ahead
// The graph is placed within the unity sphere (coordinate range -1 .. 1).
export function getLatticeGraphLayout (elementTable: ElementTable, graph: Graph, relMap: ElementRelationMap, generatorElementCount: number) : LatticeGraphLayout {
   assert(elementTable.bottomElementNo !== undefined && elementTable.topElementNo !== undefined);
   const n = elementTable.n;
   const cornerInfo = getCornerInfo(relMap, generatorElementCount);
   const cornerCount = cornerInfo.cornerCount;
   const bottomDistances = graph.getDistances(elementTable.bottomElementNo);
   const topDistances = graph.getDistances(elementTable.topElementNo);
   const graphHeight = bottomDistances[elementTable.topElementNo];             // graph height in edges
   const graphWidth = getGraphWidth();                                         // graph width in edges
   const cornerHPos: number[][] = Array(cornerCount);
   for (let i = 0; i < cornerCount; i++) {
      const alpha = (i + 0.19) * 2 * Math.PI / cornerCount;
      const x = Math.cos(alpha);
      const z = -Math.sin(alpha);
      cornerHPos[i] = [x, z]; }
   const generatorDistances: ArrayLike<number>[] = Array(generatorElementCount); // distances from generators in edges
   for (let generatorElementNo = 0; generatorElementNo < generatorElementCount; generatorElementNo++) {
      generatorDistances[generatorElementNo] = graph.getDistances(generatorElementNo); }
   const cornerDistances: ArrayLike<number>[] = Array(cornerCount);              // distances from corners in edges
   for (let cornerNo = 0; cornerNo < cornerCount; cornerNo++) {
      cornerDistances[cornerNo] = getCornerDistances(cornerNo); }
   const positions: number[][] = Array(n);
   for (let elementNo = 0; elementNo < n; elementNo++) {
      const y = computeVerticalPosition(elementNo);
      const {x, z} = computeHorizontalPosition(elementNo);
      positions[elementNo] = [x, y, z]; }
   normalizeHorizontalExtent();
   if (cornerCount == 2) {
      inflate2DGraph(positions, cornerHPos, elementTable, graph, graphHeight, generatorElementCount); }
   roundPositionValues();
   return {positions, graphHeight, graphWidth};

   function getGraphWidth() : number {
      const e1 = getCenterElement(cornerInfo.cornerGeneratorMap[0]);
      const e2 = getCenterElement(getCenterElement(cornerInfo.cornerGeneratorMap));
      return graph.getDistance(e1, e2); }

   // Returns a value betwen -1 and 1.
   function computeVerticalPosition (elementNo: number) : number {
      const distanceFromBottom = bottomDistances[elementNo];
      const distanceFromTop = topDistances[elementNo];
      return (distanceFromBottom - distanceFromTop) / (distanceFromBottom + distanceFromTop); }

   function getCornerDistances (cornerNo: number) : ArrayLike<number> {
      const generatorElementNos = cornerInfo.cornerGeneratorMap[cornerNo];
      if (generatorElementNos.length == 1) {
         return generatorDistances[generatorElementNos[0]]; }
      const dists = new Int16Array(n);
      for (let elementNo = 0; elementNo < n; elementNo++) {
         let minDist = 9999;
         for (const generatorElementNo of generatorElementNos) {
            const dist = generatorDistances[generatorElementNo][elementNo];
            minDist = Math.min(minDist, dist); }
         dists[elementNo] = minDist; }
      return dists; }

   function computeHorizontalPosition (elementNo: number) : {x: number; z: number} {
      let distSum = 0;
      for (let cornerNo = 0; cornerNo < cornerCount; cornerNo++) {
         distSum += cornerDistances[cornerNo][elementNo]; }
      let x = 0;
      let z = 0;
      for (let cornerNo = 0; cornerNo < cornerCount; cornerNo++) {
         const dist = cornerDistances[cornerNo][elementNo];
         const w = 1 - dist / distSum;
         x += w * cornerHPos[cornerNo][0];
         z += w * cornerHPos[cornerNo][1]; }
      return {x, z}; }

   // Scales the horizontal coordinates for a matching aspect ratio for graph width and graph height.
   function normalizeHorizontalExtent() {
      let maxR = 0;
      for (let i = 0; i < n; i++) {
         const r = Math.sqrt(positions[i][0] ** 2 + positions[i][2] ** 2);
         maxR = Math.max(r, maxR); }
      if (maxR < 1E-6) {
         return; }
      const r = graphWidth / (graphHeight * maxR);
      for (let i = 0; i < n; i++) {
         positions[i][0] *= r;
         positions[i][2] *= r; }}

   function roundPositionValues() {
      for (let i = 0; i < n; i++) {
         for (let j = 0; j < 3; j++) {
            positions[i][j] = round6(positions[i][j]); }}}}

// Some flat graphs, e.g. 2-2 (18 elements) and 3-2 (33 elements), have edge crossings that don't look nice in 2D.
// Therefore we inflate those graphs to 3D.
function inflate2DGraph (positions: number[][], cornerHPos: number[][], elementTable: ElementTable, graph: Graph, graphHeight: number, generatorElementCount: number) {
   const n = elementTable.n;
   const displacements = new Float64Array(n);
   const fixedElementsMap = genFixedElementsMap();
   processNearElements(2 / graphHeight / 3.1);
   if (n < 200) {
      processNearElements(2 / graphHeight / 1.5); }
   disentangle();
   propagatePull();
   // console.log(displacements);

   function genFixedElementsMap() : Int8Array {
      const a = new Int8Array(n);
      for (let i = 0; i < generatorElementCount; i++) {
         a[i] = 1; }
      a[elementTable.bottomElementNo!] = 1;
      a[elementTable.topElementNo!] = 1;
      return a; }

   function processNearElements (maxDist: number) {
      const groups = findElementsInSameSpot(maxDist);
      sortElementGroupsByDescendingSize(groups);
      // logElementGroups(groups);
      spreadElementGroups(groups); }

   function spreadElementGroups (groups: number[][]) {
      for (const group of groups) {
         spreadElementGroup(group); }}

   function spreadElementGroup (group: number[]) {
      sortElementGroupByDescendingEdgeCount(group);
      const groupPull = genGroupPull(group);
      const groupDir = groupPull >= 0 ? 1 : -1;
      // console.log("group ", group, "pull=" + groupPull);
      for (let i = 0; i < group.length; i++) {
         const d1 = 0.5;
         const d2 = 0.5;
         const posDir = i % 2 ? -1 : 1;
         const p1 = Math.floor(i / 2);
         const p2 = d1 + p1 * d2;
         const p3 = p2 * posDir * groupDir;
         displaceElement(group[i], p3); }}

   function propagatePull() {
      const pulls = new Float64Array(n);
      for (let elementNo = 0; elementNo < n; elementNo++) {
         if (fixedElementsMap[elementNo]) {
            continue; }
         if (displacements[elementNo]) {
            continue; }
         pulls[elementNo] = genElementPull(elementNo); }
      for (let elementNo = 0; elementNo < n; elementNo++) {
         if (pulls[elementNo]) {
            displaceElement(elementNo, pulls[elementNo]); }}}

   function genGroupPull (group: number[]) : number {
      let groupPull = 0;
      for (let i = 0; i < group.length; i++) {
         const elementNo = group[i];
         const posDir = i % 2 ? -1 : 1;
         const elementPull = genElementPull(elementNo);
         groupPull += posDir * elementPull; }
      return groupPull; }

   function genElementPull (elementNo1: number) : number {
      const pullByFixed = n == 18;
      const dists = graph.getDistances(elementNo1);
      let dSum = 0;
      let wSum = 0;
      for (let elementNo2 = 0; elementNo2 < n; elementNo2++) {
         if (elementNo2 == elementNo1) {
            continue; }
         const displacement = displacements[elementNo2];
         if (!displacement && !(pullByFixed && fixedElementsMap[elementNo2])) {
            continue; }
         const distance = dists[elementNo2];
         const w = 1 / distance ** 1.75;
         dSum += displacement * w;
         wSum += w; }
      return dSum / wSum; }

   function findElementsInSameSpot (maxDist: number) : number[][] {
      const a2: number[][] = [];
      const matchedElements = new Int8Array(n);
      for (let elementNo1 = 0; elementNo1 < n; elementNo1++) {
         if (displacements[elementNo1]) {
            continue; }
         if (matchedElements[elementNo1]) {
            continue; }
         let a: number[]|undefined = undefined;
         for (let elementNo2 = elementNo1 + 1; elementNo2 < n; elementNo2++) {
            if (displacements[elementNo2]) {
               continue; }
            if (matchedElements[elementNo2]) {
               continue; }
            if (areElementsNear(elementNo1, elementNo2, maxDist)) {
               if (!a) {
                  a = [elementNo1]; }
               a.push(elementNo2);
               matchedElements[elementNo2] = 1; }}
         if (a) {
            a2.push(a); }}
      return a2; }

   function areElementsNear (elementNo1: number, elementNo2: number, maxDist: number) : boolean {
      const p1 = positions[elementNo1];
      const p2 = positions[elementNo2];
      for (let i = 0; i < 3; i++) {                        // speed optimization
         if (Math.abs(p1[i] - p2[i]) > maxDist) {
            return false; }}
      let sqrSum = 0;
      for (let i = 0; i < 3; i++) {
         sqrSum += (p1[i] - p2[i]) ** 2; }
      return sqrSum <= maxDist ** 2; }

   function sortElementGroupsByDescendingSize (groups: number[][]) {
      groups.sort((a1, a2) => a2.length - a1.length); }

   function sortElementGroupByDescendingEdgeCount (group: number[]) {
      group.sort((elementNo1, elementNo2) => graph.getEdgeCount(elementNo2) - graph.getEdgeCount(elementNo1)); }

   function displaceElement (elementNo: number, pos: number) {
      const ext = 2 / graphHeight * 1.5;
      const dx =  cornerHPos[0][1] * ext;
      const dz = -cornerHPos[0][0] * ext;
      positions[elementNo][0] += dx * pos;
      positions[elementNo][2] += dz * pos;
      displacements[elementNo] = pos; }

/*
   function logElementGroups (groups: number[][]) {
      console.log("== groups ==");
      for (const a of groups) {
         console.log("===", a);
         for (const elementNo of a) {
            console.log(elementNo + " " + elementTable.getName(elementNo) + " edges:" + graph.getEdgeCount(elementNo));
            }
         for (let i = 0; i < a.length; i++) {
            for (let j = i + 1; j < a.length; j++) {
               const elementNo1 = a[i];
               const elementNo2 = a[j];
               const dist = graph.getDistance(elementNo1, elementNo2);
               console.log(elementNo1 + " - " + elementNo2 + " = " + dist); }}}}
*/

   function disentangle() {
      const maxSalience = (n < 200) ? 0.34 : 0.201;
      const pairs = findDisentanglePointPairs(maxSalience);
      const groups = convertPairsToGroups(pairs);
      // console.log(groups);
      sortElementGroupsByDescendingSize(groups);
      spreadElementGroups(groups); }

   function findDisentanglePointPairs (maxSalience: number) : number[][] {
      const pairs: number[][] = [];
      for (let elementNo1 = 0; elementNo1 < n; elementNo1++) {
         if (displacements[elementNo1] || fixedElementsMap[elementNo1]) {
            continue; }
         for (let elementNo2 = elementNo1 + 1; elementNo2 < n; elementNo2++) {
           if (displacements[elementNo2] || fixedElementsMap[elementNo2]) {
              continue; }
           const salience = genDisentangleSalience(elementNo1, elementNo2);
           if (isNaN(salience) || salience > maxSalience) {
              continue; }
            // logDisentanglePair(elementNo1, elementNo2, salience);
            pairs.push([elementNo1, elementNo2]); }}
      return pairs; }

   function genDisentangleSalience (elementNo1: number, elementNo2: number) : number {
      const dx = positions[elementNo1][0] - positions[elementNo2][0];
      const dy = positions[elementNo1][1] - positions[elementNo2][1];
      const dz = positions[elementNo1][2] - positions[elementNo2][2];
      const geoDist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
      const geoDistNormalized = geoDist / (2 / graphHeight);
      if (geoDistNormalized > 1.05) {
         return NaN; }
      const edgeDist = graph.getDistance(elementNo1, elementNo2);
      return geoDistNormalized / edgeDist; }

/*
   function logDisentanglePair (elementNo1: number, elementNo2: number, salience: number) {
      console.log(`salience=${salience.toFixed(3)} e1=${elementNo1}[${elementTable.getName(elementNo1)}] e2=${elementNo2}[${elementTable.getName(elementNo2)}]`); }
*/

   function convertPairsToGroups (pairs: number[][]) : number[][] {
      const groups: number[][] = [];
      const index = new Int16Array(n);
      index.fill(-1);
      for (const pair of pairs) {
         const elementNo1 = pair[0];
         const elementNo2 = pair[1];
         const i1 = index[elementNo1];
         const i2 = index[elementNo2];
         if (i1 >= 0 && i2 >= 0) {
            continue; }
         if (i1 >= 0) {
            groups[i1].push(elementNo2);
            index[elementNo2] = i1;
            continue; }
         if (i2 >= 0) {
            groups[i2].push(elementNo1);
            index[elementNo1] = i2;
            continue; }
         const i = groups.length;
         index[elementNo1] = i;
         index[elementNo2] = i;
         groups.push([elementNo1, elementNo2]); }
      return groups; }

   }

function round6 (v: number) : number {
   return Math.round(v * 1E6) / 1E6; }

function getCenterElement<T> (a: T[]) : T {
   return a[Math.floor(a.length / 2)]; }

export class Graph {

   private vertexCount:      number;
   private edges:            number[][];                   // array of vertex number pairs
   private edgeMap:          number[][];                   // outer array is indexed by vertex number, inner array contains vertex numbers of connected edges, redundant
   private distCache:        Int16Array[];                 // cached distance values

   public constructor (vertexCount: number, edges: number[][]) {
      this.vertexCount = vertexCount;
      this.edges = edges;
      this.buildEdgeMap(); }

   private buildEdgeMap() {
      this.edgeMap = Array(this.vertexCount);
      for (let i = 0; i < this.vertexCount; i++) {
         this.edgeMap[i] = []; }
      for (const edge of this.edges) {
         const vertexNo1 = edge[0];
         const vertexNo2 = edge[1];
         assert(vertexNo1 >= 0 && vertexNo1 < this.vertexCount && vertexNo2 >= 0 && vertexNo2 < this.vertexCount);
         this.edgeMap[vertexNo1].push(vertexNo2);
         this.edgeMap[vertexNo2].push(vertexNo1); }
      this.distCache = Array(this.vertexCount); }

   // Returns the number of edges connected to a vertex.
   public getEdgeCount (vertexNo: number) : number {
      return this.edgeMap[vertexNo].length; }

   // Returns an array with distance values from the specified vertex to all vertices in the graph.
   public getDistances (vertexNo: number) : Int16Array {
      const n = this.vertexCount;
      assert(vertexNo >= 0 && vertexNo < n);
      if (this.distCache[vertexNo]) {
         return this.distCache[vertexNo]; }
      const distances = new Int16Array(n);
      distances.fill(-1);
      let a1 = new Int16Array(n);
      let a2 = new Int16Array(n);
      let p1 = 0;
      let p2: number;
      let distance = 0;
      a1[p1++] = vertexNo;
      distances[vertexNo] = 0;
      while (true) {
         distance++;
         assert(distance < n);
         p2 = 0;
         for (let i1 = 0; i1 < p1; i1++) {
            const vertexNo1 = a1[i1];
            for (const vertexNo2 of this.edgeMap[vertexNo1]) {
               if (distances[vertexNo2] >= 0) {
                  continue; }
               distances[vertexNo2] = distance;
               a2[p2++] = vertexNo2; }}
         if (p2 == 0) {
            break; }
         const temp1 = a1; a1 = a2; a2 = temp1;            // swap a1 and a2
         p1 = p2; }
      this.distCache[vertexNo] = distances;
      return distances; }

   // Returns the distance between two vertices in the graph.
   public getDistance (vertexNoA: number, vertexNoB: number) : number {
      const n = this.vertexCount;
      assert(vertexNoA >= 0 && vertexNoB >= 0 && vertexNoA < n && vertexNoB < n);
      if (vertexNoA == vertexNoB) {
         return 0; }
      if (this.distCache[vertexNoA]) {
         return this.distCache[vertexNoA][vertexNoB]; }
      if (this.distCache[vertexNoB]) {
         return this.distCache[vertexNoB][vertexNoA]; }
      const visited = new Int8Array(n);
      let a1 = new Int16Array(n);
      let a2 = new Int16Array(n);
      let p1 = 0;
      let p2: number;
      let distance = 0;
      a1[p1++] = vertexNoA;
      visited[vertexNoA] = 1;
      while (true) {
         distance++;
         assert(distance < n);
         p2 = 0;
         for (let i1 = 0; i1 < p1; i1++) {
            const vertexNo1 = a1[i1];
            for (const vertexNo2 of this.edgeMap[vertexNo1]) {
               if (visited[vertexNo2]) {
                  continue; }
               if (vertexNo2 == vertexNoB) {
                  return distance; }
               visited[vertexNo2] = 1;
               a2[p2++] = vertexNo2; }}
         if (p2 == 0) {
            break; }
         const temp1 = a1; a1 = a2; a2 = temp1;            // swap a1 and a2
         p1 = p2; }
      assert(false); }

   }
