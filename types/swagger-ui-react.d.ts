declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react'

  type SwaggerUIProps = {
    spec?: unknown
    url?: string
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    displayRequestDuration?: boolean
    tryItOutEnabled?: boolean
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}
