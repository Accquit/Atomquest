// Shared Supabase helper to cast insert/update payloads when DB types aren't inferrable
export function asInsert<T>(value: T): never {
  return value as never
}


