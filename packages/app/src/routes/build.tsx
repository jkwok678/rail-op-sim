import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/build')({ component: Build })

function Build() {
  return <main />
}
