const origFns = new Map<string, unknown>()

/* eslint-disable @typescript-eslint/no-explicit-any -- 对三方类原型做monkey patch,类形态各异 */
function saveProto(Cls: any, method: string): void {
  const key = `${Cls.name}::${method}`
  if (!origFns.has(key)) {
    origFns.set(key, Cls.prototype[method])
  }
}

function restoreProto(Cls: any, method: string): void {
  const key = `${Cls.name}::${method}`
  const orig = origFns.get(key)
  if (orig !== undefined) {
    Cls.prototype[method] = orig
    origFns.delete(key)
  }
}

export function patchPrototype(Cls: any, method: string, fn: unknown): void {
  saveProto(Cls, method)
  Cls.prototype[method] = fn
}

export function restorePrototype(Cls: any, method: string): void {
  restoreProto(Cls, method)
}
