'use client'

import SwaggerUI from 'swagger-ui-react'
import { openApiSpec } from '@/lib/openapi'

export function SwaggerDocs() {
  return (
    <SwaggerUI
      spec={openApiSpec}
      docExpansion="list"
      defaultModelsExpandDepth={1}
      displayRequestDuration
      tryItOutEnabled
    />
  )
}
