// Lattice element relations logic routines.

import {ElementRelationMap, ElementRelation, formatElementRelation, formatElementRelations, ElementTable, ElementOperator, formatElementOperator, getOperatorRelation, ElementCombination, formatElementCombination} from "./LatticeBase";
import {genElementCombinationExpression} from "./LatticeUtils";
import {assert} from "./Utils";

const debugLevel = 0;
const debug      = debugLevel > 0;

// export const stats = new Int32Array(10);

export function completeElementRelationChains (relMap: ElementRelationMap) : number {
   const n = relMap.n;
   let totalUpdates = 0;
   while (true) {
      let updateCount = 0;
      for (let elementNo1 = 0; elementNo1 < n; elementNo1++) {
         for (let elementNo2 = elementNo1 + 1; elementNo2 < n; elementNo2++) {
            const relation12 = relMap.get(elementNo1, elementNo2);
            if (!relation12) {
               continue; }
            const relation21 = -relation12;
            for (let elementNo3 = 0; elementNo3 < n; elementNo3++) {
               if (elementNo3 == elementNo1 || elementNo3 == elementNo2) {
                  continue; }
               const relation13 = relMap.get(elementNo1, elementNo3);
               const relation23 = relMap.get(elementNo2, elementNo3);
               if (!relation13 && relation12 == relation23) {
                  relMap.set(elementNo1, elementNo3, relation12);
                  updateCount++;
                  if (debug) {
                     const relFmt = formatElementRelation(relation12);
                     console.log(`completeElementRelationChains: ${elementNo1} ${relFmt} ${elementNo2} ${relFmt} ${elementNo3}`); }}
               if (!relation23 && relation21 == relation13) {
                  relMap.set(elementNo2, elementNo3, relation21);
                  updateCount++;
                  if (debug) {
                     const relFmt = formatElementRelation(relation21);
                     console.log(`completeElementRelationChains: ${elementNo2} ${relFmt} ${elementNo1} ${relFmt} ${elementNo3}`); }}}}}
      if (updateCount == 0) {
         break; }
      totalUpdates += updateCount; }
   return totalUpdates; }

// Returns `true` if any of the elements in `elementNos` are related.
export function areElementsRelated (relMap: ElementRelationMap, elementNos: number[]) : boolean {
   const n = elementNos.length;
   for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
         if (!relMap.get(elementNos[i], elementNos[j])) {
            return false; }}}
   return true; }

export function getMinElementRelation (relMap: ElementRelationMap, elementNo: number) : ElementRelation {
   let minRel = ElementRelation.higher;
   for (let elementNo2 = 0; elementNo2 < relMap.n; elementNo2++) {
      if (elementNo2 == elementNo) {
         continue; }
      const rel = relMap.get(elementNo, elementNo2);
      if (rel < minRel) {
         minRel = rel; }}
   return minRel; }

export function getMaxElementRelation (relMap: ElementRelationMap, elementNo: number) : ElementRelation {
   let maxRel = ElementRelation.lower;
   for (let elementNo2 = 0; elementNo2 < relMap.n; elementNo2++) {
      if (elementNo2 == elementNo) {
         continue; }
      const rel = relMap.get(elementNo, elementNo2);
      if (rel > maxRel) {
         maxRel = rel; }}
   return maxRel; }

export function getMinElementRelationA (rels: ArrayLike<ElementRelation>) : ElementRelation {
   let minRel = ElementRelation.higher;
   for (let elementNo2 = 0; elementNo2 < rels.length; elementNo2++) {
      const rel = rels[elementNo2];
      if (rel < minRel) {
         minRel = rel; }}
   return minRel; }

export function getMaxElementRelationA (rels: ArrayLike<ElementRelation>) : ElementRelation {
   let maxRel = ElementRelation.lower;
   for (let elementNo2 = 0; elementNo2 < rels.length; elementNo2++) {
      const rel = rels[elementNo2];
      if (rel > maxRel) {
         maxRel = rel; }}
   return maxRel; }

// Returns an array of the element numbers of the common lower or higher elements of a pair of elements.
// If no common elements are found, undefined is returned.
export function findCommonRelatedElements (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, rel: ElementRelation) : number[] | undefined {
   let a: number[] | undefined;
   for (let elementNo3 = 0; elementNo3 < relMap.n; elementNo3++) {
      if (relMap.get(elementNo3, elementNo1) == rel && relMap.get(elementNo3, elementNo2) == rel) {
         if (!a) {
            a = [elementNo3]; }
          else {
            a.push(elementNo3); }}}
   return a; }

// Returns two arrays with the non-common lower/higher elements of a pair of elements.
// If no non-common elements are found, undefined is returned.
export function findNonCommonRelatedElements (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, rel: ElementRelation) : number[][] | undefined {
   let a: number[][] | undefined;
   for (let elementNo3 = 0; elementNo3 < relMap.n; elementNo3++) {
      const r1 = relMap.get(elementNo1, elementNo3) == rel;
      const r2 = relMap.get(elementNo2, elementNo3) == rel;
      if (r1 != r2) {
         if (!a) {
            a = new Array(2);
            a[0] = [];
            a[1] = []; }
         if (r1 && !r2) {
            a[0].push(elementNo3); }
         if (!r1 && r2) {
            a[1].push(elementNo3); }}}
   return a; }

// Returns an array with the direct predecessors of an element.
export function findDirectPredecessors (relMap: ElementRelationMap, elementNo1: number, rel: ElementRelation) : number[] {
   const rels1 = relMap.getRow(elementNo1);
   return findDirectPredecessorsByRels(relMap, rels1, rel); }

// Same as findDirectPredecessors(), but instead of an element number, the relations of the element are passed.
export function findDirectPredecessorsByRels (relMap: ElementRelationMap, rels1: ArrayLike<ElementRelation>, rel: ElementRelation) : number[] {
   const n = rels1.length;
   assert(n == relMap.n);
   const a: number[] = [];
   for (let elementNo2 = 0; elementNo2 < n; elementNo2++) {
      const rel21 = -rels1[elementNo2];
      if (rel21 != rel) {
         // Element2 is no predecessor of element1.
         continue; }
      let push = true;
      let i = 0;
      while (i < a.length) {
         const elementNo3 = a[i++];
         // At this point, element2 and element3 are both predecessors of element1.
         const rel23 = relMap.get(elementNo2, elementNo3);
         if (rel23 == rel) {
            // Element2 is before element3. Ignore element2.
            push = false;
            break; }
         if (rel23 == -rel) {
            // Element2 is after element3. Element2 must be added and element3 removed.
            if (push) {
               // Element2 has not yet been added. Replace element3 by element2.
               a[i - 1] = elementNo2;
               push = false; }
             else {
               // Element2 has already been added. Remove element3 from array.
               a.splice(--i, 1); }}}
      if (push) {
         a.push(elementNo2); }}
   return a; }

// Returns the lowest or highest element of a set of elements.
// If no lowest or highest element can be found or if it is undefined, -1 is returned.
export function findLowestOrHighestElement (relMap: ElementRelationMap, elementNos: number[], rel: ElementRelation) : number {
   const n = elementNos.length;
   if (n == 0) {
      return -1; }
   if (n == 1) {
      return elementNos[0]; }
   const a = elementNos.slice();
   let p1 = 0;
   while (true) {
      while (p1 < n && a[p1] < 0) {
         p1++; }
      if (p1 >= n) {
         throw new Error("Program logic error in findLowestOrHighestElement."); }
      let p2 = p1 + 1;
      let undefSkipped = false;
      while (true) {
         while (p2 < n && a[p2] < 0) {
            p2++; }
         if (p2 >= n) {
            if (debug && undefSkipped) {
               console.log(`findLowestOrHighestElement: p1=${p1}, p2=${p2}, a=${a}`); }
            return undefSkipped ? -1 : a[p1]; }
         const rel12 = relMap.get(a[p1], a[p2]);
         if (!rel12) {
            p2++;
            undefSkipped = true;
            continue; }
         if (rel12 == rel) {
            a[p2++] = -1; }
          else {
            a[p1++] = -1;
            break; }}}}

// Returns the element number of the infimum or supremum of an element pair,
// or -1 if no infimum or supremum exists,
// or -2 if the infimum/supremum is ambiguous.
export function findInfimumOrSupremum (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, operator: ElementOperator) : number {
   const rel = getOperatorRelation(operator);
   const rel12 = relMap.get(elementNo1, elementNo2);
   if (rel12) {
      return (rel12 == rel) ? elementNo1 : elementNo2; }          // if the elements are comparable, return the higher or lower element
   const a = findCommonRelatedElements(relMap, elementNo1, elementNo2, rel);
   if (!a) {
      return -1; }
   const elementNo3 = findLowestOrHighestElement(relMap, a, -rel);
   if (elementNo3 < 0) {
      if (debug) {
         console.log(`Common related elements for ${elementNo1} ${formatElementOperator(operator)} ${elementNo2}: ${a}`); }
      return -2; }
   return elementNo3; }

export function updateAllElementRelations (relMap: ElementRelationMap, elementTable: ElementTable) : number {
   let updates = 0;
   for (let elementNo = 0; elementNo < elementTable.n; elementNo++) {
      const combs = elementTable.get(elementNo).combinations;
      if (!combs.length) {
         continue; }
      const rels = createNewElementRelations(relMap, elementTable, combs, elementNo).rels;
      let oldRels: ArrayLike<ElementRelation>;
      if (debug) {
         oldRels = relMap.getRowCopy(elementNo).slice(); }
      const updates2 = relMap.mergeRow(elementNo, rels);
      updates += updates2;
      if (debug && updates2) {
         console.log(`updateAllElementRelations: ${elementNo}`);
         console.log(` old ${elementNo}: ${formatElementRelations(oldRels!)}`);
         console.log(` upd ${elementNo}: ${formatElementRelations(rels)}`);
         console.log(` new ${elementNo}: ${formatElementRelations(relMap.getRow(elementNo))}`); }}
   return updates; }

export function createNewElementRelations (relMap: ElementRelationMap, elementTable: ElementTable, combs: ElementCombination[], aliasElementNo: number) {
   assert(combs.length > 0);
   const relss: Int8Array[] = Array(combs.length);
   for (let i = 0; i < combs.length; i++) {
      relss[i] = createNewElementRelations2(relMap, elementTable, combs[i]); }
   return mergeGroupRelations(relss, aliasElementNo); }

function createNewElementRelations2 (relMap: ElementRelationMap, elementTable: ElementTable, comb: ElementCombination) : Int8Array {
   const rels = new Int8Array(relMap.n);
   let pass = 0;
   while (true) {
      pass++;
      const updates1 = completeCombinationRelations(rels, relMap, comb);
      if (debugLevel >= 8) {
         console.log(`Relations of ${formatElementCombination(comb)} (${pass}-A-${updates1}): ${formatElementRelations(rels)}`); }
      if (updates1 == 0 && pass > 1) {
         break; }
      const updates2 = completeReverseRelations(rels, relMap, elementTable, comb);
      if (debugLevel >= 8 && updates2 > 0) {
         console.log(`Relations of ${formatElementCombination(comb)} (${pass}-B-${updates2}): ${formatElementRelations(rels)}`); }
      if (updates2 == 0 && (pass > 1 || updates1 == 0)) {
         break; }}
   return rels; }

function mergeGroupRelations (relss: ArrayLike<ElementRelation>[], aliasElementNo0: number) {
   const n = relss[0].length;
   const rels = new Int8Array(n);
   let aliasElementNo = aliasElementNo0;
   for (let elementNo = 0; elementNo < n; elementNo++) {
      if (elementNo == aliasElementNo) {
         rels[elementNo] = 0;
         continue; }
      let rel = relss[0][elementNo];
      for (let i = 1; i < relss.length; i++) {
         const rel2 = relss[i][elementNo];
         if (!rel2 || rel2 == rel) {
            continue; }
         if (!rel) {
            rel = rel2;
            continue; }
         if (aliasElementNo < 0) {
            aliasElementNo = elementNo;
            rel = ElementRelation.undef;
            break; }
         throw new Error("Conflicting element group relations."); }
      rels[elementNo] = rel; }
   return {rels, aliasElementNo}; }

function completeCombinationRelations (rels: Int8Array, relMap: ElementRelationMap, comb: ElementCombination) : number {
   let updates = 0;
   for (let elementNo3 = 0; elementNo3 < relMap.n; elementNo3++) {
      if (rels[elementNo3]) {
         continue; }
      if (elementNo3 == comb.elementNo1 || elementNo3 == comb.elementNo2) {
         rels[elementNo3] = getOperatorRelation(comb.operator);
         updates++;
         continue; }
// stats[0]++;
      const rel31 = relMap.get(elementNo3, comb.elementNo1);
      const rel32 = relMap.get(elementNo3, comb.elementNo2);
      const rel3 = genCombinationRelation(rel31, rel32, comb.operator);
      if (!rel3) {
         continue; }
      rels[elementNo3] = rel3;
// stats[1]++;
      updates++; }
   return updates; }

// Rules:
//   e3 > e1 and e3 > e2 implies e3 >= e1 + e2
//   e3 < e1 or  e3 < e2 implies e3 <= e1 + e2
//   e3 < e1 and e3 < e2 implies e3 <= e1 * e2
//   e3 > e1 or  e3 > e2 implies e3 >= e1 * e2
function genCombinationRelation (rel31: ElementRelation, rel32: ElementRelation, operator: ElementOperator) : ElementRelation {
   const combRel = getOperatorRelation(operator);
   if (rel31 == combRel && rel32 == combRel) {
      return -combRel; }
   if (rel31 == -combRel || rel32 == -combRel) {
      return combRel; }
   return ElementRelation.undef; }

function completeReverseRelations (rels: Int8Array, relMap: ElementRelationMap, elementTable: ElementTable, comb: ElementCombination) : number {
   const n = relMap.n;
   let updates = 0;
   for (let elementNo3 = 0; elementNo3 < n; elementNo3++) {
      if (rels[elementNo3]) {
         continue; }
      const rel3 = findElementRelation2(relMap, elementTable, comb, rels, elementNo3);
      if (!rel3) {
         continue; }
      rels[elementNo3] = rel3;
      updates++;
// stats[2]++;
      const rels3 = relMap.getRow(elementNo3);
      updates += completeCascadedRelations(rels, rels3, rel3); }
   return updates; }

function findElementRelation2 (relMap: ElementRelationMap, elementTable: ElementTable, comb: ElementCombination, rels: ArrayLike<ElementRelation>, elementNo3: number) : ElementRelation {
// stats[3]++;
   for (const comb2 of elementTable.get(elementNo3).combinations) {
      const rel03a = rels[comb2.elementNo1];
      const rel03b = rels[comb2.elementNo2];
      const rel30 = genCombinationRelation(rel03a, rel03b, comb2.operator);
      if (rel30) {
         return -rel30; }
      const rel = findElementRelation3(relMap, comb, comb2);
      if (rel) {
         return rel; }}
   return ElementRelation.undef; }

function findElementRelation3 (relMap: ElementRelationMap, comb: ElementCombination, comb2: ElementCombination) : ElementRelation {
   if (comb.operator != comb2.operator) {
      return ElementRelation.undef; }
// stats[4]++;
   const rel1 = findElementRelation4(relMap, comb.elementNo1, comb.elementNo2, comb2.elementNo1, comb2.elementNo2);
   const rel2 = findElementRelation4(relMap, comb.elementNo1, comb.elementNo2, comb2.elementNo2, comb2.elementNo1);
   assert(!(rel1 && rel2 && rel1 != rel2));
   return rel1 ? rel1 : rel2; }

// Rules:
//    e1 <= e3 and e2 <= e4 implies e1 + e2 <= e3 + e4, e1 * e2 <= e3 * e4
//    e1 >= e3 and e2 >= e4 implies e1 + e2 >= e3 + e4, e1 * e2 >= e3 * e4
function findElementRelation4 (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, elementNo3: number, elementNo4: number) : ElementRelation {
// stats[5]++;
   const rel1 = relMap.get(elementNo1, elementNo3);
   const rel2 = relMap.get(elementNo2, elementNo4);
   const eq1  = elementNo1 == elementNo3;
   const eq2  = elementNo2 == elementNo4;
   assert(!(eq1 && eq2));
   if (eq1) {
      return rel2; }
   if (eq2) {
      return rel1; }
   return rel1 == rel2 ? rel1 : ElementRelation.undef; }

function completeCascadedRelations (rels1: Int8Array, rels2: ArrayLike<ElementRelation>, rel12: ElementRelation) : number {
// stats[6]++;
   const n = rels1.length;
   assert(n == rels2.length);
   let updates = 0;
   for (let elementNo3 = 0; elementNo3 < n; elementNo3++) {
      if (rels1[elementNo3] || rels2[elementNo3] != rel12) {
         continue; }
      rels1[elementNo3] = rel12;
// stats[7]++;
      updates++; }
   return updates; }

export function findNewElementAliasCombination (elementTable: ElementTable, newElementRels: ArrayLike<ElementRelation>) : number {
   for (let elementNo = 0; elementNo < elementTable.n; elementNo++) {
      for (const comb of elementTable.get(elementNo).combinations) {
         if (testNewElementAliasCombination(elementNo, comb, newElementRels)) {
            if (debug) {
               console.log("Alias combination found: " + genElementCombinationExpression(elementTable, comb)); }
            return elementNo; }}}
   return -1; }

function testNewElementAliasCombination (aliasElementNo: number, aliasElementComb: ElementCombination, newElementRels: ArrayLike<ElementRelation>) : boolean {
   const rel4 = newElementRels[aliasElementNo];
   if (!rel4) {
      return false; }
   const rel1 = newElementRels[aliasElementComb.elementNo1];
   const rel2 = newElementRels[aliasElementComb.elementNo2];
   const rel3 = genCombinationRelation(rel1, rel2, aliasElementComb.operator);
   return rel3 == rel4; }
      // Rule: e1 <= e2 && e1 >= e2 impies e1 = e2

// Finds all elements between elementNo1 and elementNo2.
export function findElementsBetween (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, a: Int16Array) : number {
   const n = relMap.n;
   const r1 = relMap.getRow(elementNo1);
   const r2 = relMap.getRow(elementNo2);
   let p = 0;
   for (let elementNo3 = 0; elementNo3 < n; elementNo3++) {
      if (r1[elementNo3] == ElementRelation.lower && r2[elementNo3] == ElementRelation.higher) {
         a[p++] = elementNo3; }}
   return p; }

// Returns the number of an element for which {elementNo1, elementNo2, operator} is a secondary alias.
// Or returns -1 if no matching element is found.
export function findSecondaryAlias (relMap: ElementRelationMap, elementTable: ElementTable, elementNo1: number, elementNo2: number, operator: ElementOperator) : number {
   for (let elementNo3 = 0; elementNo3 < elementTable.n; elementNo3++) {
      for (const comb3 of elementTable.get(elementNo3).combinations) {
         if (comb3.operator != operator) {
            continue; }
         if (isSecondaryAliasCombination(relMap, elementNo1, elementNo2, operator, comb3, elementNo3)) {
            return elementNo3; }}}
   return -1; }

// Returns true if {elementNo1, elementNo2, operator} is a secondary alias of comb3/elementNo3.
// A secondary alias is an alias that is not relevant for constructing the lattice graph.
// Rules:
//   e1 >= e3, e2 >= e4, e1 <= e3+e4, e2 <= e3+e4 implies e1+e2 = e3+e4
//   e1 <= e3, e2 <= e4, e1 >= e3*e4, e2 >= e3*e4 implies e1*e2 = e3*e4
function isSecondaryAliasCombination (relMap: ElementRelationMap, elementNo1: number, elementNo2: number, operator: ElementOperator, comb3: ElementCombination, elementNo3: number) : boolean {
   if (operator != comb3.operator) {
      return false; }
   const opRel = getOperatorRelation(operator);
   return (
      test(elementNo3, elementNo1) &&
      test(elementNo3, elementNo2) &&
      ( test(elementNo1, comb3.elementNo1) && test(elementNo2, comb3.elementNo2) ||
        test(elementNo1, comb3.elementNo2) && test(elementNo2, comb3.elementNo1) ));
   function test (elementNo4: number, elementNo5: number) : boolean {
      return elementNo4 == elementNo5 || relMap.get(elementNo4, elementNo5) == opRel; }}
