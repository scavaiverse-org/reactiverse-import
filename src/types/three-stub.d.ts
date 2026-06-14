// The "three" package ships no type declarations and no @types/three is
// installed. With allowJs/checkJs, TS resolves the real (untyped) .js
// sources and reports hundreds of errors against a third-party library we
// don't control. The "three" path mapping below (jsconfig.json) redirects
// type resolution to this `any`-typed stub instead. This only affects
// type-checking, not the Vite build/runtime.
declare const THREE: any;
export = THREE;
