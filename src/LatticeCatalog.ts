// Catalog of available free modular lattices.

import {ElementRelation, ElementRelationDef} from "./LatticeBase";

export interface LatticeDef {
   elements:                           number;
   latticeName:                        string;
   hide?:                              boolean;                                          // true = hide in GUI
   generatorElementNames:              string[];
   generatorElementRelations:          ElementRelationDef[]; }

export const latticeDefs: LatticeDef[] = [
   {
      elements:                  8,
      latticeName:               "2-1",
      hide:                      true,                                                   // not interesting
      generatorElementNames:     ["a", "b", "c"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower} ] },
   {
      elements:                  13,
      latticeName:               "3-1",
      hide:                      true,                                                   // not interesting
      generatorElementNames:     ["a", "b", "c", "d"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower} ] },
   {
      elements:                  18,
      latticeName:               "2-2",
      generatorElementNames:     ["a", "b", "c", "d"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower} ] },
   {
      elements:                  19,
      latticeName:               "4-1",
      hide:                      true,                                                   // not interesting
      generatorElementNames:     ["a", "b", "c", "d", "e"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower} ] },
   {
      elements:                  26,
      latticeName:               "5-1",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower} ] },
   {
      elements:                  33,
      latticeName:               "3-2",
      generatorElementNames:     ["a", "b", "c", "d", "e"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower} ] },
   {
      elements:                  54,
      latticeName:               "4-2",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower} ] },
   {
      elements:                  68,
      latticeName:               "3-3",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower} ] },
   {
      elements:                  82,
      latticeName:               "5-2",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "f", elementName2: "g", relation: ElementRelation.lower} ] },
   {
      elements:                  118,
      latticeName:               "6-2",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g", "h"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower},
         {elementName1: "g", elementName2: "h", relation: ElementRelation.lower} ] },
   {
      elements:                  124,
      latticeName:               "4-3",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower},
         {elementName1: "f", elementName2: "g", relation: ElementRelation.lower} ] },
   {
      elements:                  208,
      latticeName:               "5-3",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g", "h"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "f", elementName2: "g", relation: ElementRelation.lower},
         {elementName1: "g", elementName2: "h", relation: ElementRelation.lower} ] },
   {
      elements:                  250,
      latticeName:               "4-4",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g", "h"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower},
         {elementName1: "f", elementName2: "g", relation: ElementRelation.lower},
         {elementName1: "g", elementName2: "h", relation: ElementRelation.lower} ] },
   {
      elements:                  328,
      latticeName:               "6-3",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "e", elementName2: "f", relation: ElementRelation.lower},
         {elementName1: "g", elementName2: "h", relation: ElementRelation.lower},
         {elementName1: "h", elementName2: "i", relation: ElementRelation.lower} ] },
   {
      elements:                  460,
      latticeName:               "5-4",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower},
         {elementName1: "d", elementName2: "e", relation: ElementRelation.lower},
         {elementName1: "f", elementName2: "g", relation: ElementRelation.lower},
         {elementName1: "g", elementName2: "h", relation: ElementRelation.lower},
         {elementName1: "h", elementName2: "i", relation: ElementRelation.lower} ] },
   {
      elements:                  28,
      latticeName:               "1-1-1",
      generatorElementNames:     ["a", "b", "c"],
      generatorElementRelations: [] },
   {
      elements:                  138,
      latticeName:               "2-1-1",
      generatorElementNames:     ["a", "b", "c", "d"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower} ] },
   {
      elements:                  629,
      latticeName:               "3-1-1",
      generatorElementNames:     ["a", "b", "c", "d", "e"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower} ] },
   {
      elements:                  2631,
      latticeName:               "2-2-1",
      hide:                      true,                                                   // lattice generation does not yet work
      generatorElementNames:     ["a", "b", "c", "d", "e"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower} ] },
   {
      elements:                  2784,
      latticeName:               "4-1-1",
      generatorElementNames:     ["a", "b", "c", "d", "e", "f"],
      generatorElementRelations: [
         {elementName1: "a", elementName2: "b", relation: ElementRelation.lower},
         {elementName1: "b", elementName2: "c", relation: ElementRelation.lower},
         {elementName1: "c", elementName2: "d", relation: ElementRelation.lower} ] },
   ];

export function getLatticeDefByName (latticeName: string) : LatticeDef {
   for (const def of latticeDefs) {
      if (def.latticeName == latticeName) {
         return def; }}
   throw new Error(`No definition found for lattice name "${latticeName}".`); }
