import { memo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { rehypeGlueFormulas, typeset } from './typography'

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeKatex, rehypeGlueFormulas]

const blockComponents: Components = {
  table: ({ children }) => (
    <div className="table-scroll" tabIndex={0} role="group" aria-label="Tableau">
      <table>{children}</table>
    </div>
  ),
  // The corner cell of a two-way table is not a header.
  th: ({ children }) => (children ? <th>{children}</th> : <td />),
}
// <p> is not allowed inside a <label>.
const inlineComponents: Components = { p: ({ children }) => <span>{children}</span> }

function Rendered({ text, components }: { text: string; components: Components }) {
  return (
    <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {typeset(text)}
    </Markdown>
  )
}

export const RichText = memo(function RichText({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline) return <Rendered text={text} components={inlineComponents} />

  return text.split(/\$\$([\s\S]+?)\$\$/).map((part, i) => {
    if (i % 2 === 0) return <Rendered key={i} text={part} components={blockComponents} />
    // A row of equations separated by \quad wraps between equations, not in the middle of one.
    return (
      <div key={i} className="equations">
        {part.trim().split(/\s*\\q?quad\s*/).map((equation, j) => (
          <Rendered key={j} text={`$$\n${equation}\n$$`} components={blockComponents} />
        ))}
      </div>
    )
  })
})
