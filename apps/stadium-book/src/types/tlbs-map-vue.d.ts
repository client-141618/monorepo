declare module "tlbs-map-vue" {
  import type { App, DefineComponent } from "vue"

  export const BaseMap: DefineComponent<any, any, any>
  export const MultiMarker: DefineComponent<any, any, any>
  export const MultiCircle: DefineComponent<any, any, any>

  const TlbsMap: {
    install: (_app: App) => void
  }

  export default TlbsMap
}
