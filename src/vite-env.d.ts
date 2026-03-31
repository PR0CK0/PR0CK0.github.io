/// <reference types="vite/client" />

declare const __GIT_COMMIT__: string
declare const __BUILD_DATE__: string

declare module '*.ttf' {
  const src: string
  export default src
}
