import {ElementTable, ElementRelationMap, ElementCombination, formatElementCombinations, ElementCombinationMap, formatElementOperator, getOperatorRelation} from "./LatticeBase";
import * as LatticeRel from "./LatticeRel";
import * as LatticeMod from "./LatticeMod";

const debug = false;

export function genElementCombinationExpression (elementTable: ElementTable, comb: ElementCombination, simplify = false) : string {
   const e1 = elementTable.get(comb.elementNo1);
   const e2 = elementTable.get(comb.elementNo2);
   let expr1 = e1.elementName;
   let expr2 = e2.elementName;
   if (e1.elementNameOperator != undefined && (e1.elementNameOperator != comb.operator || !simplify)) {
      expr1 = "(" + expr1 + ")"; }
   if (e2.elementNameOperator != undefined && (e2.elementNameOperator != comb.operator || !simplify)) {
      expr2 = "(" + expr2 + ")"; }
   return expr1 + formatElementOperator(comb.operator) + expr2; }

export function genElementCombinationExpressions (elementTable: ElementTable, combs: ElementCombination[], omitBracketsIfSingle = false) : string {
   const s = combs.map((comb: ElementCombination) => genElementCombinationExpression(elementTable, comb, false)).join(", ");
   return (omitBracketsIfSingle && combs.length == 1) ? s : "[" + s + "]"; }

// Evaluates an element combination whose result is one of the two elements.
// Returns -1 if it's not a simple combination.
export function evalSimpleElementCombination (relMap: ElementRelationMap, comb: ElementCombination) : number {
   if (comb.elementNo1 == comb.elementNo2) {
      return comb.elementNo1; }
   const rel = relMap.get(comb.elementNo1, comb.elementNo2);
   if (!rel) {
      return -1; }
   return (rel == getOperatorRelation(comb.operator)) ? comb.elementNo1 : comb.elementNo2; }

export function verifyPrimaryInfimumsAndSupremums (elementTable: ElementTable, relMap: ElementRelationMap) {
   const n = elementTable.n;
   for (let elementNo3 = 0; elementNo3 < n; elementNo3++) {
      const combinations = elementTable.get(elementNo3).combinations;
      for (const comb of combinations) {
         const elementNo4 = LatticeRel.findInfimumOrSupremum(relMap, comb.elementNo1, comb.elementNo2, comb.operator);
         if (elementNo4 != elementNo3) {
            const expr = genElementCombinationExpression(elementTable, comb, false);
            if (elementNo4 == -2) {
               throw new Error(`Consistency error: Primary infinum/supremum is ambiguous: ${expr}`); }
            throw new Error(`Consistency error: Primary infinum/supremum has changed: ${expr} = ` +
               `${elementTable.getName(elementNo3)} | ${elementTable.getName(elementNo4)}`); }}}}

export function verifyModularElementGroups (elementTable: ElementTable, relMap: ElementRelationMap, combMap: ElementCombinationMap) {
   const n = elementTable.n;
   for (let elementNo = 0; elementNo < n; elementNo++) {
      const e = elementTable.get(elementNo);
      const combs = e.combinations;
      if (!combs.length) {
         continue; }
      const comb0 = combs[0];
      const mr = LatticeMod.findModularAliasCombinations(comb0, elementTable, relMap, combMap);
      if (debug && mr.missingPrecursors.length && debug) {
         console.log(`Consistency warning: Possibly incomplete modular element group ${e.elementName}, missing precursors: ${formatElementCombinations(mr.missingPrecursors)}`); }
      if (mr.modAliasElementNo != -1 && mr.modAliasElementNo != elementNo) {
         throw new Error(`Consistency error: Duplicate modular elements: ${e.elementName} ${elementTable.getName(mr.modAliasElementNo)}`); }
      if (debug && mr.modCombs.length) {
         console.log(`Consistency warning: Missing modular combinations for ${e.elementName}: ${formatElementCombinations(mr.modCombs)}`); }}}
