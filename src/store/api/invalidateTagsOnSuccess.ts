import type { TagDescription } from '@reduxjs/toolkit/query'

export function invalidateTagsOnSuccess<Tag extends string>(
  tags: readonly TagDescription<Tag>[]
): (_result: unknown, error: unknown) => TagDescription<Tag>[] {
  return (_result, error) => (error ? [] : [...tags])
}
