export type PrefixTrieOptions = {
  caseSensitive?: boolean
}

type Node = {
  children: Map<string, Node>
  // Store IDs of words that pass through this node for fast prefix lookup.
  ids: Set<string>
}

export class PrefixTrie {
  private readonly root: Node = { children: new Map(), ids: new Set() }
  private readonly caseSensitive: boolean

  constructor(options: PrefixTrieOptions = {}) {
    this.caseSensitive = options.caseSensitive ?? false
  }

  insert(word: string, id: string) {
    const normalized = this.normalize(word)
    this.root.ids.add(id)

    let node = this.root
    for (const ch of normalized) {
      let next = node.children.get(ch)
      if (!next) {
        next = { children: new Map(), ids: new Set() }
        node.children.set(ch, next)
      }
      next.ids.add(id)
      node = next
    }
  }

  searchPrefix(prefix: string): Set<string> {
    const normalized = this.normalize(prefix)
    let node = this.root

    for (const ch of normalized) {
      const next = node.children.get(ch)
      if (!next) return new Set()
      node = next
    }

    return new Set(node.ids)
  }

  private normalize(input: string) {
    return this.caseSensitive ? input : input.toLowerCase()
  }
}
