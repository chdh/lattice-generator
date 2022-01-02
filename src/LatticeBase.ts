// Basic components for lattice management.

import {assert} from "./Utils";

const debug = false;

export const enum ElementRelation {undef = 0, lower = -1, higher = 1}
export function formatElementRelation (rel: ElementRelation) {
   switch (rel) {
      case ElementRelation.undef:  return "undef";
      case ElementRelation.lower:  return "<";
      case ElementRelation.higher: return ">";
      default:                     return "err"; }}
export function formatElementRelations (rels: ArrayLike<ElementRelation>) : string {
   let s = "";
   for (let i = 0; i < rels.length; i++) {
      if (i > 0 && i % 10 == 0) {
         s += "|"; }
      if (i > 0 && i % 100 == 0) {
         s += " |"; }
      const rel = rels[i];
      s += rel ? formatElementRelation(rel) : "-"; }
   return s; }

export interface ElementRelationDef {
   elementName1:                       string;
   elementName2:                       string;
   relation:                           ElementRelation; }

export function mergeElementRelations (rel1: ElementRelation, rel2: ElementRelation) : ElementRelation {
   if (rel1 == rel2 || !rel2) {
      return rel1; }
   if (!rel1) {
      return rel2; }
   throw new Error("Relation merging conflict."); }

export const enum ElementOperator {inf = -1, sup = 1}                // infimum and supremum operators
export const elementOperators = [ElementOperator.inf, ElementOperator.sup];
export var   infOperatorSymbol = "*";
export var   supOperatorSymbol = "+";
export function formatElementOperator (op: ElementOperator) {
   switch (op) {
      case ElementOperator.inf: return infOperatorSymbol;
      case ElementOperator.sup: return supOperatorSymbol;
      default:                  return "err"; }}
export function decodeElementOperator (c: string) : ElementOperator {
   switch (c) {
      case infOperatorSymbol: return ElementOperator.inf;
      case supOperatorSymbol: return ElementOperator.sup;
      default:                throw new Error(`Invalid element operator '${c}'.`); }}
export function getOperatorRelation (op: ElementOperator) : ElementRelation {
   return <ElementRelation><any>op; }

export interface ElementCombination {
   elementNo1:                         number;
   elementNo2:                         number;
   operator:                           ElementOperator; }
export function createNormalizedElementCombination (elementNo1: number, elementNo2: number, operator: ElementOperator) {
   return (elementNo1 < elementNo2) ?
      {elementNo1: elementNo1, elementNo2: elementNo2, operator} :
      {elementNo1: elementNo2, elementNo2: elementNo1, operator}; }
export function formatElementCombination (comb: ElementCombination) : string {
   return comb.elementNo1 + formatElementOperator(comb.operator) + comb.elementNo2; }
export function formatElementCombinations (combs: ElementCombination[]) : string {
   return "[" + combs.map((comb: ElementCombination) => formatElementCombination(comb)).join(", ") + "]"; }
export function compareElementCombinations (comb1: ElementCombination, comb2: ElementCombination) : boolean {
   return comb1.operator == comb2.operator &&
      (comb1.elementNo1 == comb2.elementNo1 && comb1.elementNo2 == comb2.elementNo2 ||
       comb1.elementNo1 == comb2.elementNo2 && comb1.elementNo2 == comb2.elementNo1); }
export function findElementCombination (combs: ElementCombination[], comb: ElementCombination) : number {
   for (let i = 0; i < combs.length; i++) {
      if (compareElementCombinations(combs[i], comb)) {
         return i; }}
   return -1; }

export interface ElementTableEntry {
   elementName:                        string;                       // primary element name
   elementNameOperator?:               ElementOperator;              // top level operator in elementName expression, if elementName is an expression
   aliasNames:                         string[];                     // alias element names
   isGenerator:                        boolean;                      // true if this is a generator element
   isJoin:                             boolean;                      // true if this element is a supremum combination
   isMeet:                             boolean;                      // true if this element is a infimum combination
   isTop:                              boolean;                      // true if this is the top element (1)
   isBottom:                           boolean;                      // true if this is the bottom element (0)
   combinations:                       ElementCombination[];         // element combinations which result is this element
   exprDepth:                          number;                       // depth of element expression (number of brackets in simplified expression)
   exprWidth:                          number; }                     // width of element expression (number of generator elements in expression)

export class ElementTable {

   private _n:                         number;                       // number of elements
   private a:                          ElementTableEntry[];
   private nameMap:                    Map<string,number>;           // maps element names to element numbers
   private _topElementNo?:             number;
   private _bottomElementNo?:          number;

   public constructor() {
      this._n = 0;
      this.a = [];
      this.nameMap = new Map(); }

   public get n() : number {
      return this._n; }
   public get topElementNo() : number|undefined {
      return this._topElementNo; }
   public get bottomElementNo() : number|undefined {
      return this._bottomElementNo; }

   private validateElementNo (elementNo: number) {
      if (elementNo < 0 || elementNo >= this.n) {
         throw new Error(`ElementNo ${elementNo} out of range.`); }}
   // Adds an element to the table and returns its elementNo.
   public add (elementName: string, isGenerator: boolean, comb: ElementCombination|undefined, exprDepth: number, exprWidth: number) : number {
      assert(isGenerator == (comb == undefined));
      const isTop = elementName == "1";
      const isBottom = elementName == "0";
      const e: ElementTableEntry = {
         elementName,
         elementNameOperator: (isTop || isBottom) ? undefined : comb?.operator,
         aliasNames: [],
         isGenerator,
         isJoin: comb?.operator == ElementOperator.sup,
         isMeet: comb?.operator == ElementOperator.inf,
         isTop,
         isBottom,
         combinations: comb ? [comb] : [],
         exprDepth,
         exprWidth };
      const elementNo = this.a.length;
      this.a.push(e);
      this._n = this.a.length;
      this.nameMap.set(elementName, elementNo);
      if (isTop) {
         this._topElementNo = elementNo; }
      if (isBottom) {
         this._bottomElementNo = elementNo; }
      return elementNo; }
   public addAlias (elementNo: number, aliasName: string, aliasCombination?: ElementCombination) {
      this.validateElementNo(elementNo);
      const e = this.a[elementNo];
      e.aliasNames.push(aliasName);
      if (aliasCombination) {
         e.combinations.push(aliasCombination);
         switch (aliasCombination.operator) {
            case ElementOperator.sup: e.isJoin = true; break;
            case ElementOperator.inf: e.isMeet = true; break; }}}
   public get (elementNo: number) : Readonly<ElementTableEntry> {
      this.validateElementNo(elementNo);
      return this.a[elementNo]; }
   public getAll() : Readonly<ElementTableEntry>[] {
      return this.a; }
   public getByName (elementName: string) : Readonly<ElementTableEntry> {
      return this.get(this.lookupName(elementName)); }
   public getName (elementNo: number) : string {
      if (elementNo < 0 || elementNo >= this.n) {
         if (elementNo == -1) {
            return "undef"; }
         return "undef(" + elementNo + ")"; }
      return this.a[elementNo].elementName; }
   public getNames (elementNos: number[]) : string {
      if (!elementNos) {
         return "[]"; }
      const elementNameList = elementNos.map((elementNo: number) => this.getName(elementNo)).join(", ");
      return "[" + elementNameList + "]"; }
   public getAllNames() : string[] {
      return this.a.map((e: ElementTableEntry) => e.elementName); }
   public lookupName (elementName: string) : number {
      const elementNo = this.nameMap.get(elementName);
      if (elementNo == undefined) {
         throw new Error(`Element "${elementName}" is not known.`); }
      return elementNo; }
   public dumpCombinations (numeric: boolean) : string {
      let s = "";
      for (let elementNo = 0; elementNo < this.n; elementNo++) {
         const e = this.a[elementNo];
         if (s) {
            s += "\n"; }
         s += elementNo + ": " + e.elementName;
         for (let i = 0; i < e.combinations.length; i++) {
            const comb = e.combinations[i];
            s += (i == 0) ? " = " : ", ";
            if (numeric) {
               s += formatElementCombination(comb); }
             else {
               s += this.getName(comb.elementNo1) + " " + formatElementOperator(comb.operator) + " " + this.getName(comb.elementNo2); }}}
      return s; }
   public dump() : string {
      let s = "";
      for (let elementNo = 0; elementNo < this.n; elementNo++) {
         const e = this.a[elementNo];
         if (s) {
            s += "\n"; }
         s += elementNo + ": " + e.elementName;
         if (e.aliasNames.length) {
            s += " aliases: " + e.aliasNames.join(", "); }
         // s += " exprDepth=" + e.exprDepth;
         // s += " exprWidth=" + e.exprWidth;
         // if (e.isJoin) {s += " join";}
         // if (e.isMeet) {s += " meet";}
         }
      return s; }}

// A 2D array that stores relations between elements.
export class ElementRelationMap {
   private maxElements:                number;                       // maximum number of elements (=row size of the array)
   private _n:                         number;                       // number of active elements
   private _defCount:                  number;                       // number of defined relations
   private a:                          Int8Array;                    // element relations array
   public constructor (maxElements: number) {
      this.maxElements = maxElements;
      this._n = 0;
      this._defCount = 0;
      this.a = new Int8Array(maxElements ** 2); }
   public get n() : number {
      return this._n; }
   public set n (n: number) {
      assert(n >= this._n && n <= this.maxElements);
      this._n = n; }
   public get defCount() : number {
      return this._defCount; }
   public set (elementNo1: number, elementNo2: number, relation: ElementRelation) {
      assert(elementNo1 >= 0 && elementNo1 < this.n && elementNo2 >= 0 && elementNo2 < this.n);
      if (elementNo1 == elementNo2) {
         if (relation != ElementRelation.undef) {
            throw new Error("The self-relation must be undefined."); }
         return; }
      const i1 = elementNo1 * this.maxElements + elementNo2;
      const i2 = elementNo2 * this.maxElements + elementNo1;
      const oldRelation = this.a[i1];
      if (oldRelation == relation) {
         return; }
      if (oldRelation) {
         throw new Error(`Relation collision, e1=${elementNo1}, e2=${elementNo2}, oldRel=${formatElementRelation(oldRelation)}, newRel=${formatElementRelation(relation)}.`); }
      assert(relation != ElementRelation.undef);
      this.a[i1] = relation;
      this.a[i2] = -relation;
      this._defCount++; }
   public addRow (rels: ArrayLike<ElementRelation>) {
      assert(rels.length == this.n);
      const newElementNo = this.n++;
      for (let elementNo2 = 0; elementNo2 < newElementNo; elementNo2++) {
         this.set(newElementNo, elementNo2, rels[elementNo2]); }}
   public mergeRow (elementNo: number, rels: ArrayLike<ElementRelation>) : number {
      assert(rels.length == this.n);
      const n = this.n;
      let updates = 0;
      for (let elementNo2 = 0; elementNo2 < n; elementNo2++) {
         if (elementNo2 == elementNo) {
            continue; }
         const rel1 = this.get(elementNo, elementNo2);
         const rel2 = rels[elementNo2];
         if (rel1 && rel2 && rel1 != rel2) {               // redundant to the check in mergeElementRelations(), done for error exception with more info
            throw new Error(`Relation merging conflict: e1=${elementNo} e2=${elementNo2} rel1=${rel1} rel2=${rel2}`); }
         const rel3 = mergeElementRelations(rel1, rel2);
         if (rel3 != rel1) {
            this.set(elementNo, elementNo2, rel3);
            updates++; }}
      return updates; }
   public areElementsRelated (elementNo1: number, elementNo2: number) : boolean {
      return this.get(elementNo1, elementNo2) != ElementRelation.undef; }
   public get (elementNo1: number, elementNo2: number) : ElementRelation {
      // This methode is performance critical.
      if (debug) {
         assert(elementNo1 >= 0 && elementNo1 < this.n && elementNo2 >= 0 && elementNo2 <= this.n); }
      return this.a[elementNo1 * this.maxElements + elementNo2]; }
   public getRow (elementNo: number) : ArrayLike<ElementRelation> {
      assert(elementNo >= 0 && elementNo < this.n);
      const p = elementNo * this.maxElements;
      return this.a.subarray(p, p + this.n); }
   public getRowCopy (elementNo: number) : Int8Array {
      assert(elementNo >= 0 && elementNo < this.n);
      const p = elementNo * this.maxElements;
      return this.a.subarray(p, p + this.n).slice(); }
   public findRow (rels: ArrayLike<ElementRelation>, ignoreSelfRelations: boolean) : number {
      assert(rels.length == this.n);
      const n = this.n;
      for (let elementNo1 = 0; elementNo1 < n; elementNo1++) {
         const p = elementNo1 * this.maxElements;
         let diff = false;
         for (let elementNo2 = 0; elementNo2 < n; elementNo2++) {
            if (ignoreSelfRelations && elementNo2 == elementNo1) {
               continue; }
            if (rels[elementNo2] != this.a[p + elementNo2]) {
               diff = true;
               break; }}
         if (!diff) {
            return elementNo1; }}
      return -1; }
   public equals (x: ElementRelationMap) : boolean {
      if (this.n != x.n) {
         return false; }
      for (let elementNo1 = 0; elementNo1 < this.n; elementNo1++) {
         for (let elementNo2 = elementNo1 + 1; elementNo2 < this.n; elementNo2++) {
            if (this.get(elementNo1, elementNo2) != x.get(elementNo1, elementNo2)) {
               return false; }}}
      return true; }
   public dump (elementTable: ElementTable) : string {
      let s = "";
      for (let elementNo1 = 0; elementNo1 < this.n; elementNo1++) {
         for (let elementNo2 = elementNo1 + 1; elementNo2 < this.n; elementNo2++) {
            const rel = this.get(elementNo1, elementNo2);
            if (!rel) {
               continue; }
            if (s) {
               s += "\n"; }
            s += `${elementTable.getName(elementNo1)} ${formatElementRelation(rel)} ${elementTable.getName(elementNo2)}`; }}
      return s; }
   public dumpRaw() : string {
      let s = "";
      for (let elementNo = 0; elementNo < this.n; elementNo++) {
         if (s) {
            s += "\n"; }
         s += elementNo + ": ";
         const rels = this.getRow(elementNo);
         s += formatElementRelations(rels); }
      return s; }}

// Maps a pair of element numbers to another element number or -1.
export class ComboMap {
   private maxElements:                number;                       // maximum number of elements (=row size of the array)
   private a:                          Int8Array | Int16Array;
   public constructor (maxElements: number) {
      this.maxElements = maxElements;
      this.a = (maxElements <= 127) ? new Int8Array(maxElements ** 2) : new Int16Array(maxElements ** 2);
      this.a.fill(-1); }
   public set (elementNo1: number, elementNo2: number, elementNo3: number) {
      assert(elementNo1 >= 0 && elementNo1 < this.maxElements && elementNo2 >= 0 && elementNo2 < this.maxElements && elementNo3 >= 0 && elementNo3 < this.maxElements);
      this.a[elementNo1 * this.maxElements + elementNo2] = elementNo3;
      this.a[elementNo2 * this.maxElements + elementNo1] = elementNo3; }
   // Returns an element number or -1 when there is no mappping.
   public get (elementNo1: number, elementNo2: number) : number {
      return this.a[elementNo1 * this.maxElements + elementNo2]; }
   public dump (elementTable: ElementTable, comboOperator: string, dumpAll: boolean) : string {
      let s = "";
      for (let elementNo1 = 0; elementNo1 < elementTable.n; elementNo1++) {
         for (let elementNo2 = elementNo1 + 1; elementNo2 < elementTable.n; elementNo2++) {
            const elementNo3 = this.get(elementNo1, elementNo2);
            if (elementNo3 == -1 && !dumpAll) {
               continue; }
            if (s) {
               s += "\n"; }
            s += `${elementTable.getName(elementNo1)} ${comboOperator} ${elementTable.getName(elementNo2)} = ${elementTable.getName(elementNo3)}`; }}
      return s; }}

// Maps an ElementCombination to an element number or -1.
export class ElementCombinationMap {
   private infimums:                   ComboMap;
   private supremums:                  ComboMap;
   public constructor (maxElements: number) {
      this.infimums = new ComboMap(maxElements);
      this.supremums = new ComboMap(maxElements); }
   public set (comb: ElementCombination, elementNo3: number) {
      this.set2(comb.elementNo1, comb.elementNo2, comb.operator, elementNo3); }
   public set2 (elementNo1: number, elementNo2: number, operator: ElementOperator, elementNo3: number) {
      this.getComboMap(operator).set(elementNo1, elementNo2, elementNo3); }
   public setMulti (combs: ElementCombination[], elementNo3: number) {
      for (const comb of combs) {
         this.set(comb, elementNo3); }}
   // Returns an element number or -1 when there is no mappping.
   public get (comb: ElementCombination) : number {
      return this.get2(comb.elementNo1, comb.elementNo2, comb.operator); }
   public get2 (elementNo1: number, elementNo2: number, operator: ElementOperator) {
      return this.getComboMap(operator).get(elementNo1, elementNo2); }
   public getComboMap (operator: ElementOperator) : ComboMap {
      switch (operator) {
         case ElementOperator.inf: return this.infimums;
         case ElementOperator.sup: return this.supremums;
         default: throw new Error("Invalid element operator."); }}
   public dump (elementTable: ElementTable, dumpAll: boolean) : string {
      return "Infimums:\n"  + this.infimums.dump( elementTable, infOperatorSymbol, dumpAll) + "\n\n" +
             "Supremums:\n" + this.supremums.dump(elementTable, supOperatorSymbol, dumpAll); }}
