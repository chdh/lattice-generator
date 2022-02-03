// Logic for modular lattice

import {ElementTable, ElementRelationMap, ElementCombinationMap, ElementCombination, createNormalizedElementCombination, formatElementCombination, formatElementCombinations, ElementOperator, getOperatorRelation, findElementCombination} from "./LatticeBase";
import * as LatticeUtils from "./LatticeUtils";

export interface ModularResult {
   modCombs:                 ElementCombination[];
      // Modular combinations that have not yet been assigned to an element.
   missingPrecursors:        ElementCombination[];
      // Precursor combinations that have not yet been assigned to an element.
   modAliasElementNo:        number; }
      // Element number of the modular combination group, or -1.

// Finds modular alias combinations and a possibly existing element for a specified start element combination.
// Modular rule formula: a <= b implies a + (b * x) = b * (a + x)       (this form is used in the documentation below)
//                       a >= b implies a * (b + x) = b + (a * x)       (alternate form for the same formula)
export function findModularAliasCombinations (comb0: ElementCombination, elementTable: ElementTable, relMap: ElementRelationMap, combMap: ElementCombinationMap) : ModularResult {
   let recursion = 0;
   let modAliasElementNo = -1;                                       // holds the element number of the modular combination group, or -1.
   const modCombs: ElementCombination[] = [];                        // modular alias combinations (without associated elements)
   const processedCombs: ElementCombination[] = [];                  // used to check whether a combination has already been processed
   const missingPrecursors: ElementCombination[] = [];               // precursor combinations without associated elements
   const elementNo0 = combMap.get(comb0);                            // element number of start combination, or -1
   if (elementNo0 >= 0) {
      modAliasElementNo  = elementNo0; }
    else {
      modCombs.push(comb0); }
   addCombinations1(comb0);
   return {modCombs, missingPrecursors, modAliasElementNo};

   // (recursive)
   function addCombinations1 (comb: ElementCombination) {
      if (recursion++ > 500) {
         console.log(`Modular alias combinations found so far for ${formatElementCombination(comb0)}: ${formatElementCombinations(modCombs)}`);
         console.log(`Current: ${formatElementCombination(comb)}`);
         throw new Error("Too many recursions."); }
      processedCombs.push(comb);
      addCombinations2(comb.elementNo1, comb.elementNo2, comb.operator);
      addCombinations2(comb.elementNo2, comb.elementNo1, comb.operator); }

   // elementNo1 and elementNo2 correspond to a and (b * x) or to b and (a + x) in the modular rule formula.
   // (recursive)
   function addCombinations2 (elementNo1: number, elementNo2: number, operator: ElementOperator) {
      const e2 = elementTable.get(elementNo2);
      for (const comb2 of e2.combinations) {                         // loop over alias combinations of element 2
         if (comb2.operator == operator) {
            continue; }
         addCombinations3(elementNo1, comb2.elementNo1, comb2.elementNo2, operator);
         addCombinations3(elementNo1, comb2.elementNo2, comb2.elementNo1, operator); }
      recursion--; }

   // elementNo1, elementNo2a and elementNo2b correspond to a, b and x in the modular rule formula.
   // (recursive)
   function addCombinations3 (elementNo1: number, elementNo2a: number, elementNo2b: number, operator: ElementOperator) {
      const rel = relMap.get(elementNo1, elementNo2a);
      if (rel != -getOperatorRelation(operator)) {                   // elements are not related or relation does not match operator
         return; }
      const comb3 = createNormalizedElementCombination(elementNo1, elementNo2b, operator);
         // comb3 corresponds to (a + x) in the modular rule formula.
      const elementNo3 = findElementForComb(comb3);
      if (elementNo3 < 0) {                                          // no element exists for (a + x)
         if (findElementCombination(missingPrecursors, comb3) < 0) { // if not already in missing precursors list
            missingPrecursors.push(comb3); }                         // add to missing precursors list
         return; }
      const comb4 = createNormalizedElementCombination(elementNo2a, elementNo3, -operator);
         // comb4 corresponds to b * (a + x) in the modular rule formula.
      if (findElementCombination(processedCombs, comb4) >= 0) {
         return; }                                                   // exit if b * (a + x) has already been processed
      const elementNo4 = findElementForComb(comb4);
      if (elementNo4 >= 0) {                                         // if an element exists for b * (a + x)
         if (modAliasElementNo >= 0 && modAliasElementNo != elementNo4) {
            throw new Error(`Multiple modular alias elements found for ${formatElementCombination(comb0)}: (${modAliasElementNo}, ${elementNo4}).`); }
         modAliasElementNo = elementNo4; }
       else {
         modCombs.push(comb4); }                                     // add b * (a + x) to the liste of alias combinations
      addCombinations1(comb4); }                                     // recursive call

   // Returns an element number for the specified combination, or -1 if not element is found.
   function findElementForComb (comb: ElementCombination) : number {
      let elementNo: number;
      elementNo = LatticeUtils.evalSimpleElementCombination(relMap, comb);
      if (elementNo >= 0) {
         return elementNo; }
      elementNo = combMap.get(comb);
      if (elementNo >= 0) {
         return elementNo; }
      return -1; }

   }
