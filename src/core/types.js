/** @typedef {'bad'|'warn'|'ok'} Level */
/** @typedef {'battery'|'solar'|'mains'|'integrated'} Power */
/** @typedef {{id:string, level:Level, slot:string, title:string, why:string,
 *   fix?:{label:string, slot:string, partId:string}, source:string}} AuditItem */
/** @typedef {{projectId:number, parts:Record<string,string>, location:string|null,
 *   uf:string|null, ddd:string|null, customRegion:string|null,
 *   daysNoSun:number, daysRecharge:number, hsp:number, txDbm:number, hasWifi:boolean|null}} State */
/** @typedef {{id:string, source:string, checkedAt:string, firmware:string,
 *   evaluate:(ctx:RuleCtx)=>AuditItem|AuditItem[]|null}} Rule */
/** @typedef {{state:State, project:object, parts:Record<string,object>, energy:object|null,
 *   lessConservative:boolean}} RuleCtx */

export {};
