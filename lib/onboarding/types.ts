import type { Guide } from './guides'
import type { Mods } from './services'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Answers = Record<string, any>

export type FileRec = { id: string; field_id: string; name: string; size: number | null; content_type: string | null }

export type Ctx = {
  files: FileRec[]
  /** A valid demo-site link was passed in the URL. */
  demo: boolean
  /** An EIN is already stored for this submission (it is never sent back to the browser). */
  einOnFile: boolean
  einLast4: string | null
  /** Which sections apply, based on the services in the link. */
  mods: Mods
}

export type Option = { value: string; label: string; hint?: string }

export type RowCol = {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'email' | 'tel'
  options?: Option[]
  required?: boolean
  placeholder?: string
}

type Dyn<T> = T | ((a: Answers, ctx: Ctx) => T)

export type Field = {
  id: string
  label: string
  type:
    | 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'consent'
    | 'checkboxes' | 'tags' | 'hours' | 'rows' | 'file' | 'ein' | 'trade' | 'trades' | 'note' | 'demo'
  help?: Dyn<string | undefined>
  /** Expandable step-by-step instructions with direct links. */
  guide?: Dyn<Guide | undefined>
  placeholder?: string
  required?: Dyn<boolean>
  options?: Option[]
  columns?: RowCol[]
  showIf?: (a: Answers, ctx: Ctx) => boolean
  /** Value used the first time the field is shown and empty. */
  defaultValue?: (a: Answers) => unknown
  suggestions?: (a: Answers) => string[]
  accept?: string
  maxFiles?: number
  autoComplete?: string
  half?: boolean
  /** Body text for `note` fields. */
  body?: string
}

export type Step = {
  id: string
  title: Dyn<string>
  intro?: Dyn<string>
  fields: Field[]
  showIf?: (a: Answers, ctx: Ctx) => boolean
}
