import {ElementRelation, ElementRelationDef, formatElementRelations, ElementTable, ElementTableEntry, ElementRelationMap, ElementCombination, formatElementCombination, formatElementCombinations, findElementCombination, ElementCombinationMap, ElementOperator, formatElementOperator, elementOperators, getOperatorRelation} from "./LatticeBase";
import * as LatticeRel from "./LatticeRel";
import * as LatticeMod from "./LatticeMod";
import {ModularResult} from "./LatticeMod";
import * as LatticeUtils from "./LatticeUtils";
import {assert} from "./Utils";

const debug = false;

// Controller for generating a free modular lattice.
export class LatticeController {

   public  maxElements:                number;                                 // maximum number of elements
   public  generatorElementCount:      number;                                 // number of generator elements
   public  elementTable:               ElementTable;
   public  relMap:                     ElementRelationMap;
   public  combMap:                    ElementCombinationMap;

   // Speed optimization variables:
   private tempInt16Array1:            Int16Array;
   private tempInt16Array2:            Int16Array;
   private lastMinComplexity:          number;

   public constructor (maxElements: number, generatorElementNames: string[], generatorElementRelations: ElementRelationDef[]) {
      this.maxElements = maxElements;
      this.generatorElementCount = generatorElementNames.length;
      this.elementTable = new ElementTable();
      this.relMap = new ElementRelationMap(maxElements);
      this.combMap = new ElementCombinationMap(maxElements);
      this.tempInt16Array1 = new Int16Array(maxElements);
      this.tempInt16Array2 = new Int16Array(maxElements);
      this.lastMinComplexity = -1;
      this.loadGeneratorElements(generatorElementNames, generatorElementRelations); }

   private loadGeneratorElements (generatorElementNames: string[], generatorElementRelations: ElementRelationDef[]) {
      for (const elementName of generatorElementNames) {
         this.elementTable.add(elementName, true, undefined, 0, 1); }
      this.relMap.n = this.elementTable.n;
      for (const relDef of generatorElementRelations) {
         const elementNo1 = this.elementTable.lookupName(relDef.elementName1);
         const elementNo2 = this.elementTable.lookupName(relDef.elementName2);
         this.relMap.set(elementNo1, elementNo2, relDef.relation); }
      LatticeRel.completeElementRelationChains(this.relMap); }

   // Creates a new element or assigns an alias to an existing element.
   // Returns an info string about the new element or the alias.
   // Or returns undefined if no new element can be created.
   public createNewElement() : string | undefined {
      const mr = this.findNewElementCombinations();
      if (!mr) {
         return; }
      const combs = mr.modCombs;
      this.sortCombsByComplexity(combs);
      let aliasElementNo = mr.modAliasElementNo;
      const rr = LatticeRel.createNewElementRelations(this.relMap, this.elementTable, combs, aliasElementNo);
      const rels = rr.rels;
      aliasElementNo = rr.aliasElementNo;
      if (debug) {
         console.log(`Relations of ${formatElementCombinations(combs)}: ${formatElementRelations(rels)}`); }
      const aliasElementNo2 = this.findAliasElement(combs, rels);
      if (aliasElementNo2 >= 0) {
         if (aliasElementNo >= 0 && aliasElementNo2 != aliasElementNo) {
            throw new Error("Different alias elements found."); }
         aliasElementNo = aliasElementNo2; }
      let info: string;
      if (aliasElementNo >= 0) {                                               // alias found
         this.registerAliasCombinations(aliasElementNo, combs, rels);
         this.processSecondaryAliasCombinationsForTargetElement(aliasElementNo);
         info = "Alias: " + formatElementCombinations(combs) + " -> " + aliasElementNo; }
       else {
         const newElementNo = this.registerNewElement(combs, rels);
         this.processSecondaryAliasCombinationsForSourceElement(newElementNo);
         this.processSecondaryAliasCombinationsForTargetElement(newElementNo);
         if (debug) {
            console.log(newElementNo + ": " + formatElementRelations(rels)); }
         info = newElementNo + ": " + formatElementCombinations(combs); }
      return info; }

   private registerAliasCombinations (aliasElementNo: number, combs: ElementCombination[], rels: ArrayLike<ElementRelation>) {
      for (const comb of combs) {
         this.registerAliasCombination(aliasElementNo, comb, rels); }}

   private registerAliasCombination (aliasElementNo: number, comb: ElementCombination, rels: ArrayLike<ElementRelation>) {
      this.elementTable.addAlias(aliasElementNo, this.genCombExpr(comb), comb);
      this.combMap.set(comb, aliasElementNo);
      const relUpdates = this.relMap.mergeRow(aliasElementNo, rels);
      if (relUpdates && debug) {
         console.log(`Relations updated for alias ${aliasElementNo}.`); }}

   private registerNewElement (combs: ElementCombination[], rels: ArrayLike<ElementRelation>) {
      assert(this.elementTable.n < this.maxElements);
      const comb0 = combs[0];
      const fullExpr0 = this.genCombExpr(comb0);
      const expr0 = this.genCombExpr(comb0, true);
      const name =
         LatticeRel.getMinElementRelationA(rels) == ElementRelation.higher ? "1" :
         LatticeRel.getMaxElementRelationA(rels) == ElementRelation.lower ? "0" :
         expr0;
      const exprDepth = this.genExprDepth(comb0);
      const exprWidth = this.genExprWidth(comb0);
      const newElementNo = this.elementTable.add(name, false, comb0, exprDepth, exprWidth);
      if (expr0 != name) {
         this.elementTable.addAlias(newElementNo, expr0); }
      if (fullExpr0 != expr0) {
         this.elementTable.addAlias(newElementNo, fullExpr0); }
      for (let i = 1; i < combs.length; i++) {             // add modular alias combinations
         const comb2 = combs[i];
         const expr = this.genCombExpr(comb2, true);
         this.elementTable.addAlias(newElementNo, expr, comb2); }
      this.combMap.setMulti(combs, newElementNo);
      this.relMap.addRow(rels);
      return newElementNo; }

   private findNewElementCombinations() : ModularResult | undefined {
      const checkedCombs:  ElementCombination[] = [];
      const backlogCombs: ElementCombination[] = [];
      let checkedElementNo = -1;
      let candidateMr: ModularResult | undefined;
      let candidateIteration = -1;
      let iteration = 0;
      while (true) {
         let comb: ElementCombination | undefined;
         let elementNo = -1;
         if (!comb) {
            comb = backlogCombs.shift(); }
         if (!comb && checkedElementNo < this.elementTable.n - 1) {
            elementNo = ++checkedElementNo;
            const e = this.elementTable.get(elementNo);
            if (e.combinations.length == 0) {
               continue; }
            comb = e.combinations[0]; }
         if (!comb && candidateMr) {
            if (debug) {
               console.log(`Selecting candidate from iteration ${candidateIteration}.`); }
            return candidateMr; }
         if (!comb && checkedElementNo == this.elementTable.n - 1 && !candidateMr) {
            checkedElementNo++;
            comb = this.findMinComplexNewElementCombination();
            if (!comb) {
               return; }}
         if (!comb) {
            throw new Error("Nodular backtrack loop run out."); }
         if (findElementCombination(checkedCombs, comb) >= 0) {
            continue; }
         if (iteration++ > this.maxElements + 100) {
            throw new Error("Too many modular backtrack iterations."); }
         const mr = LatticeMod.findModularAliasCombinations(comb, this.elementTable, this.relMap, this.combMap);
         if (debug && (mr.modCombs.length > 0 || mr.missingPrecursors.length > 0 || mr.modAliasElementNo == -1)) {
            console.log(`Iteration ${iteration}: ${formatElementCombination(comb)}`);
            console.log(`Modular group: ${formatElementCombinations(mr.modCombs)}`);
            console.log(`Missing precursors: ${formatElementCombinations(mr.missingPrecursors)}`);
            console.log(`Modular alias element: ${mr.modAliasElementNo} = ${this.elementTable.getName(mr.modAliasElementNo)}`); }
         if (mr.modAliasElementNo >= 0 && elementNo >= 0 && mr.modAliasElementNo != elementNo) {
            throw new Error("Conflicting modular alias element."); }
         if (mr.modCombs.length > 0 && (mr.missingPrecursors.length == 0 || mr.modAliasElementNo >= 0)) {
            return mr; }
         if (mr.modCombs.length > 0 && !candidateMr) {
            candidateMr = mr;
            candidateIteration = iteration; }
         checkedCombs.push(...mr.modCombs);
         backlogCombs.push(...mr.missingPrecursors); }}

   private processSecondaryAliasCombinationsForTargetElement (targetElementNo: number) {
      for (const comb of this.elementTable.get(targetElementNo).combinations) {
         this.processSecondaryAliasCombinationsForTargetComb(comb, targetElementNo); }}

   private processSecondaryAliasCombinationsForSourceElement (sourceElementNo: number) {
      const n = this.elementTable.n;
      for (let targetElementNo = 0; targetElementNo < n; targetElementNo++) {
         const rel = this.relMap.get(targetElementNo, sourceElementNo);
         if (!rel) {
            continue; }
         for (const comb of this.elementTable.get(targetElementNo).combinations) {
            const opRel = getOperatorRelation(comb.operator);
            if (opRel != rel) {
               continue; }
            if (this.relMap.get(sourceElementNo, comb.elementNo1) == opRel) {
               this.processSecondaryAliasCombinationsFixed(sourceElementNo, comb.elementNo2, comb.operator, targetElementNo); }
            else if (this.relMap.get(sourceElementNo, comb.elementNo2) == opRel) {
               this.processSecondaryAliasCombinationsFixed(sourceElementNo, comb.elementNo1, comb.operator, targetElementNo); }}}}

   // A secondary alias is an alias that is not relevant for constructing the lattice graph.
   // Rules:
   //   e1 >= e3, e2 >= e4, e1 <= e3+e4, e2 <= e3+e4 implies e1+e2 = e3+e4
   //   e1 <= e3, e2 <= e4, e1 >= e3*e4, e2 >= e3*e4 implies e1*e2 = e3*e4
   private processSecondaryAliasCombinationsForTargetComb (comb: ElementCombination, targetElementNo: number) {
      const up = comb.operator == ElementOperator.sup;
      const lo1 = up ? comb.elementNo1 : targetElementNo;
      const lo2 = up ? comb.elementNo2 : targetElementNo;
      const up1 = up ? targetElementNo : comb.elementNo1;
      const up2 = up ? targetElementNo : comb.elementNo2;
      const a1 = this.tempInt16Array1;
      const a2 = this.tempInt16Array2;
      let n1 = LatticeRel.findElementsBetween(this.relMap, lo1, up1, a1);
      let n2 = LatticeRel.findElementsBetween(this.relMap, lo2, up2, a2);
      a1[n1++] = comb.elementNo1;
      a2[n2++] = comb.elementNo2;
      const cMap = this.combMap.getComboMap(comb.operator);
      // Test all element combinations that lie between comb and targetElementNo.
      for (let p1 = 0; p1 < n1; p1++) {
         for (let p2 = 0; p2 < n2; p2++) {
            const elementNo1 = a1[p1];
            const elementNo2 = a2[p2];
            const elementNo3 = cMap.get(elementNo1, elementNo2);
            if (elementNo3 == targetElementNo) {
               continue; }
            if (elementNo3 != -1) {
               throw new Error("Lattice consistency error for secondary alias combination."); }
            if (debug) {
               console.log(`Secondary alias: ${formatElementCombination({elementNo1, elementNo2, operator: comb.operator})} -> ${targetElementNo}`); }
            cMap.set(elementNo1, elementNo2, targetElementNo); }}}

   private processSecondaryAliasCombinationsFixed (elementNo1Fixed: number, elementNo2Start: number, operator: ElementOperator, targetElementNo: number) {
      const up = operator == ElementOperator.sup;
      const lo2 = up ? elementNo2Start : targetElementNo;
      const up2 = up ? targetElementNo : elementNo2Start;
      const a2 = this.tempInt16Array2;
      let n2 = LatticeRel.findElementsBetween(this.relMap, lo2, up2, a2);
      a2[n2++] = elementNo2Start;
      const cMap = this.combMap.getComboMap(operator);
      // Test all element combinations with the second element between elementNo2Start and targetElementNo.
      for (let p2 = 0; p2 < n2; p2++) {
         const elementNo2 = a2[p2];
         const elementNo3 = cMap.get(elementNo1Fixed, elementNo2);
         if (elementNo3 == targetElementNo) {
            continue; }
         if (elementNo3 != -1) {
            throw new Error("Lattice consistency error for secondary alias combination."); }
         if (debug) {
            console.log(`Secondary alias: ${formatElementCombination({elementNo1: elementNo1Fixed, elementNo2, operator})} -> ${targetElementNo}`); }
         cMap.set(elementNo1Fixed, elementNo2, targetElementNo); }}

   private findAliasElement (combs: ElementCombination[], rels: ArrayLike<ElementRelation>) : number {
      let aliasElementNo = -1;
      for (const comb of combs) {
         const i = this.findAliasElement2(comb, rels);
         if (aliasElementNo == -1) {
            aliasElementNo = i; }
          else if (i != -1 && aliasElementNo != i) {
            throw new Error(`Multiple alias elements found for modular element combination group (${aliasElementNo}, ${i}).`); }}
      return aliasElementNo; }

   private findAliasElement2 (_comb: ElementCombination, rels: ArrayLike<ElementRelation>) : number {
//    // Find element with same relations.
//    const aliasElementNo1 = this.relMap.findRow(rels, true);
//    if (aliasElementNo1 >= 0) {
//       if (debug) {
//          console.log("aliasElementNo1=" + aliasElementNo1); }
//       return aliasElementNo1; }
      // Find alias element in primary infimum/supremum combinations.
      const aliasElementNo2 = LatticeRel.findNewElementAliasCombination(this.elementTable, rels);
      if (aliasElementNo2 >= 0) {
         if (debug) {
            console.log("aliasElementNo2=" + aliasElementNo2); }
         return aliasElementNo2; }
//    // Find element with same predecessors.
//    const predecessorRel = -getOperatorRelation(comb.operator);
//    const predecessors = LatticeRel.findDirectPredecessorsByRels(this.relMap, rels, predecessorRel);
//    if (debug) {
//       console.log(`Direct predecessors of ${this.genCombExpr(comb)}: ${this.elementTable.getNames(predecessors)}`); }
//    for (let i1 = 0; i1 < predecessors.length; i1++) {
//       for (let i2 = i1 + 1; i2 < predecessors.length; i2++) {
//          const aliasElementNo3 = this.combMap.get({operator: comb.operator, elementNo1: predecessors[i1], elementNo2: predecessors[i2]});
//          if (aliasElementNo3 >= 0) {
//             if (debug) {
//                console.log("aliasElementNo3=" + aliasElementNo3); }
//             return aliasElementNo3; }}}
      return -1; }

   // Scans the remaining element combinations for the one with the lowest complexity.
   private findMinComplexNewElementCombination() : ElementCombination | undefined {
      const n = this.elementTable.n;
      assert(this.relMap.n == n);
      assert(n <= this.maxElements);
      let minComplexity = 0x7fffffff;
      let minElementNo1 = -1;
      let minElementNo2 = -1;
      let minOperator = 0;
      const lastMinComplexity = this.lastMinComplexity;
      for (let elementNo2 = 1; elementNo2 < n; elementNo2++) {
         for (let elementNo1 = 0; elementNo1 < elementNo2; elementNo1++) {
            if (this.relMap.get(elementNo1, elementNo2)) {
               continue; }                                                  // elements are related
            for (const operator of elementOperators) {
               if (this.combMap.get2(elementNo1, elementNo2, operator) >= 0) {
                  continue; }                                               // combination already exists
               const complexity = this.genElementCombinationComplexity2(elementNo1, elementNo2, operator);
               if (complexity == lastMinComplexity) {
                  if (debug) {
                     console.log("findMinComplexNewElementCombination: " + elementNo1 + formatElementOperator(operator) + elementNo2 + " complexity=" + complexity); }
                  return {elementNo1, elementNo2, operator}; }
               if (complexity < minComplexity) {
                  minComplexity = complexity;
                  minElementNo1 = elementNo1;
                  minElementNo2 = elementNo2;
                  minOperator = operator; }}}}
      if (minElementNo1 < 0) {
         return; }
      if (debug) {
         console.log("findMinComplexNewElementCombination: " + minElementNo1 + formatElementOperator(minOperator) + minElementNo2 + " complexity=" + minComplexity); }
      this.lastMinComplexity = minComplexity;
      return {elementNo1: minElementNo1, elementNo2: minElementNo2, operator: minOperator}; }

   private genExprDepth (comb: ElementCombination) : number {
      return this.genExprDepth2(this.elementTable.get(comb.elementNo1), this.elementTable.get(comb.elementNo2), comb.operator); }

   private genExprDepth2 (e1: ElementTableEntry, e2: ElementTableEntry, operator: ElementOperator) : number {
      const comb1 = e1.combinations.length ? e1.combinations[0] : undefined;
      const comb2 = e2.combinations.length ? e2.combinations[0] : undefined;
      const delta1 = (comb1 != undefined && comb1.operator != operator) ? 1 : 0;
      const delta2 = (comb2 != undefined && comb2.operator != operator) ? 1 : 0;
      return Math.max(e1.exprDepth + delta1, e2.exprDepth + delta2); }

   private genExprWidth (comb: ElementCombination) : number {
      return this.genExprWidth2(this.elementTable.get(comb.elementNo1), this.elementTable.get(comb.elementNo2)); }

   private genExprWidth2 (e1: ElementTableEntry, e2: ElementTableEntry) : number {
      return e1.exprWidth + e2.exprWidth; }

   private genElementCombinationComplexity (comb: ElementCombination) : number {
      return this.genElementCombinationComplexity2(comb.elementNo1, comb.elementNo2, comb.operator); }

   private genElementCombinationComplexity2 (elementNo1: number, elementNo2: number, operator: ElementOperator) : number {
      const e1 = this.elementTable.get(elementNo1);
      const e2 = this.elementTable.get(elementNo2);
      const exprDepth = this.genExprDepth2(e1, e2, operator);
      const exprWidth = this.genExprWidth2(e1, e2);
      return exprWidth * 1000 + exprDepth; }

   private sortCombsByComplexity (combs: ElementCombination[]) {
      combs.sort((comb1: ElementCombination, comb2: ElementCombination) => this.genElementCombinationComplexity(comb1) - this.genElementCombinationComplexity(comb2)); }

   public verifyLatticeConsistency() {
      LatticeUtils.verifyModularElementGroups(this.elementTable, this.relMap, this.combMap);
      LatticeUtils.verifyPrimaryInfimumsAndSupremums(this.elementTable, this.relMap); }

   public dumpGraph() : string {
      let s = "";
      for (let elementNo = 0; elementNo < this.elementTable.n; elementNo++) {
         const lowerPredecessors = LatticeRel.findDirectPredecessors(this.relMap, elementNo, ElementRelation.lower);
         const higherPredecessors = LatticeRel.findDirectPredecessors(this.relMap, elementNo, ElementRelation.higher);
         if (s) {
            s += "\n"; }
         s += `${this.elementTable.getNames(lowerPredecessors)} => ${this.elementTable.getName(elementNo)} => ${this.elementTable.getNames(higherPredecessors)}`; }
      return s; }

   public dumpAll() : string {
      return (
         "Elements:\n" + this.elementTable.dump() +
         "\n\nCombinations expr:\n" + this.elementTable.dumpCombinations(false) +
         "\n\nCombinations numeric:\n" + this.elementTable.dumpCombinations(true) +
//       "\n\nRelations:\n" + this.relMap.dump(this.elementTable) +
         "\n\nRaw relations:\n" + this.relMap.dumpRaw() +
         "\n\nGraph:\n" + this.dumpGraph() ); }

   private genCombExpr (comb: ElementCombination, simplify = false) {
      return LatticeUtils.genElementCombinationExpression(this.elementTable, comb, simplify); }

   }
