// General utilities.

export function assert (cond: boolean) : asserts cond {
   if (!cond) {
      throw new Error("Assertion failed."); }}

export function compareInt8Arrays (a1: Int8Array, a2: Int8Array) : boolean {
   const len = a1.length;
   if (a2.length != len) {
      return false; }
   for (let i = 0; i < len; i++) {
      if (a1[i] != a2[i]) {
         return false; }}
   return true; }

/*
function compareInt8ArraysSub (a1: Int8Array, p1: number, a2: Int8Array, p2: number, len: number) : boolean {
   for (let i = 0; i < len; i++) {
      if (a1[p1 + i] != a2[p2 + i]) {
         return false; }}
   return true; }
*/

export function compareArrays<T> (a1: ArrayLike<T>, a2: ArrayLike<T>) : boolean {
   const len = a1.length;
   if (a2.length != len) {
      return false; }
   for (let i = 0; i < len; i++) {
      if (a1[i] != a2[i]) {
         return false; }}
   return true; }
