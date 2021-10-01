export function catchError (f: Function, ...args: any[]) {
   void catchErrorAsync(f, ...args); }

async function catchErrorAsync(f: Function, ...args: any[]) {
   try {
      const r = f(...args);
      if (r instanceof Promise) {
         await r; }}
    catch (error) {
      console.log(error);
      alert("Error: " + error); }}

export function genKeyName (event: KeyboardEvent) : string {
   return (
      (event.altKey   ? "Alt+"   : "") +
      (event.ctrlKey  ? "Ctrl+"  : "") +
      (event.shiftKey && event.key.length > 1 ? "Shift+" : "") +
      (event.metaKey  ? "Meta+"  : "") +
      event.key ); }
