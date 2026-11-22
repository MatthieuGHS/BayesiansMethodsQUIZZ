import type { Element, ElementContent, Root } from 'hast'

/** French spacing: no line may start with : ; ? ! or ». Formulas are left untouched. */
export function typeset(markdown: string): string {
  return markdown
    .split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/)
    .map((part, i) => (i % 2 ? part : part.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ')))
    .join('')
}

// Roughly one phone line. Longer formulas must be allowed to wrap like text.
const LONG_FORMULA = 40

function visibleLength(node: ElementContent): number {
  if (node.type === 'text') return node.value.length
  if (node.type !== 'element' || node.properties.className?.toString() === 'katex-mathml') return 0
  return node.children.reduce((total, child) => total + visibleLength(child), 0)
}

const isKatex = (node?: ElementContent): boolean =>
  node?.type === 'element' && [node.properties.className].flat().includes('katex')

const endsWithFormula = (node?: ElementContent): boolean =>
  isKatex(node) || (node?.type === 'element' && node.properties.className?.toString() === 'glue' && isKatex(node.children.at(-1)))

/**
 * KaTeX formulas are inline blocks, so browsers happily wrap "(" | formula | ")," apart.
 * Keep each formula on the line of the characters that touch it.
 */
export function rehypeGlueFormulas() {
  return (tree: Root) => glue(tree)
}

function glue(parent: Root | Element) {
  const children = parent.children as ElementContent[]
  for (let i = 0; i < children.length; i++) {
    let node = children[i]
    if (node.type !== 'element') continue
    if (isKatex(node)) {
      if (visibleLength(node) > LONG_FORMULA) node.properties.className = ['katex', 'katex-long']
    } else {
      glue(node)
      if (node.tagName !== 'strong' && node.tagName !== 'em') continue
      const last = node.children.at(-1)
      if (!last || !endsWithFormula(last)) continue
      // Split the emphasis, otherwise the whole bold phrase would become unbreakable.
      if (node.children.length > 1) {
        node.children.pop()
        node = { ...node, children: [last] }
        children.splice(++i, 0, node)
      }
    }

    const previous = children[i - 1]
    const next = children[i + 1]
    const before = previous?.type === 'text' ? (previous.value.match(/[^ \n]+$/)?.[0] ?? '') : ''
    const after = next?.type === 'text' ? (next.value.match(/^[^ \n]+/)?.[0] ?? '') : ''
    if (!before && !after) continue

    const group: ElementContent[] = [node]
    if (before && previous.type === 'text') {
      previous.value = previous.value.slice(0, -before.length)
      group.unshift({ type: 'text', value: before })
    }
    if (after && next.type === 'text') {
      next.value = next.value.slice(after.length)
      group.push({ type: 'text', value: after })
    }
    children[i] = { type: 'element', tagName: 'span', properties: { className: ['glue'] }, children: group }
  }
}
