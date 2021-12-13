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
   graphHeight:              number;                        // height of graph in edges
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
      inflateGraph(); }
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

   // Scales the horizontal coordinates into the range -1 .. +1.
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

   // Some flat graphs, e.g. 2-2 (18 elements) and 3-2 (33 elements), have edge crossings that don't look nice in 2D.
   // Therefore we inflate those graphs to 3D.
   function inflateGraph() {
      while (true) {
         const inflateCornerElements = findInflateCornerElements();
         if (!inflateCornerElements) {
            return; }
         inflateElements(inflateCornerElements); }}

   function inflateElements (inflateCornerElements: number[]) {
      for (let i = 0; i < 2; i++) {
         const inflateCornerElementNo = inflateCornerElements[i];
         const ext = 0.25;
         const xDefl = cornerHPos[0][1] * (i == 0 ? 1 : -1) * ext;
         const zDefl = cornerHPos[0][0] * (i == 1 ? 1 : -1) * ext;
         for (let elementNo = 0; elementNo < n; elementNo++) {
            const edgeDist = graph.getDistance(elementNo, inflateCornerElementNo);
            const d = Math.max(graphHeight, graphWidth) / 2;
            const w = Math.max(0, d - edgeDist) / d;
            positions[elementNo][0] += xDefl * w;
            positions[elementNo][2] += zDefl * w; }}}

   function findInflateCornerElements() {
      let minSalience = 9999;
      let selElementNo1 = -1;
      let selElementNo2 = -1;
      for (let elementNo1 = 0; elementNo1 < n; elementNo1++) {
         for (let elementNo2 = elementNo1 + 1; elementNo2 < n; elementNo2++) {
            const dx = positions[elementNo1][0] - positions[elementNo2][0];
            const dy = positions[elementNo1][1] - positions[elementNo2][1];
            const dz = positions[elementNo1][2] - positions[elementNo2][2];
            const geoDist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
            const geoDistNormalized = geoDist / (2 / graphHeight);
            if (geoDistNormalized > 1.05) {
               continue; }
            const edgeDist = graph.getDistance(elementNo1, elementNo2);
            const salience = geoDistNormalized / edgeDist;
            if (salience > 0.34) {
               continue; }
            if (salience < minSalience) {
               minSalience = salience;
               selElementNo1 = elementNo1;
               selElementNo2 = elementNo2; }}}
      if (selElementNo1 < 0) {
         return undefined; }
      // console.log("minSalience: " + minSalience);
      return [selElementNo1, selElementNo2]; }

   function roundPositionValues() {
      for (let i = 0; i < n; i++) {
         for (let j = 0; j < 3; j++) {
            positions[i][j] = round6(positions[i][j]); }}}}

function round6 (v: number) : number {
   return Math.round(v * 1E6) / 1E6; }

function getCenterElement<T> (a: T[]) : T {
   return a[Math.floor(a.length / 2)]; }

export class Graph {

   private vertexCount:      number;
   private edges:            number[][];                   // array of vertex number pairs
   private edgeMap:          number[][];                   // outer array is indexed by vertex number, inner array contains vertex numbers of connected edges, redundant

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
         this.edgeMap[vertexNo2].push(vertexNo1); }}

   // Returns an array with distance values from the specified vertex to all vertices in the graph.
   public getDistances (vertexNo: number) : ArrayLike<number> {
      const n = this.vertexCount;
      assert(vertexNo >= 0 && vertexNo < n);
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
      return distances; }

   // Returns the distance between two vertices in the graph.
   public getDistance (vertexNoA: number, vertexNoB: number) : number {
      const n = this.vertexCount;
      assert(vertexNoA >= 0 && vertexNoB >= 0 && vertexNoA < n && vertexNoB < n);
      if (vertexNoA == vertexNoB) {
         return 0; }
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
