const origFns = new Map()

function saveProto(Cls, method) {
  const key = `${Cls.name}::${method}`
  if (!origFns.has(key)) {
    origFns.set(key, Cls.prototype[method])
  }
}

function restoreProto(Cls, method) {
  const key = `${Cls.name}::${method}`
  const orig = origFns.get(key)
  if (orig !== undefined) {
    Cls.prototype[method] = orig
    origFns.delete(key)
  }
}

export function patchPrototype(Cls, method, fn) {
  saveProto(Cls, method)
  Cls.prototype[method] = fn
}

export function restorePrototype(Cls, method) {
  restoreProto(Cls, method)
}
