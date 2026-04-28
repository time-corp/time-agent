import type { agents } from "./agents.pg"
import type { models } from "./models.pg"
import type { providers } from "./providers.pg"
import type { users } from "./users.pg"

type BaseImmutableFields =
  | "id"
  | "tenantId"
  | "createdAt"
  | "createdBy"
  | "updatedAt"
  | "updatedBy"

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UpdateUser = Partial<Omit<NewUser, BaseImmutableFields>>

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type UpdateProvider = Partial<Omit<NewProvider, BaseImmutableFields>>

export type Model = typeof models.$inferSelect
export type NewModel = typeof models.$inferInsert
export type UpdateModel = Partial<Omit<NewModel, BaseImmutableFields>>

export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
export type UpdateAgent = Partial<Omit<NewAgent, BaseImmutableFields>>
