/**
 * remark-bold-fallback —— 补上「中文标点紧贴 ** 时无法成对」的粗体。
 *
 * 背景：CommonMark 的强调规则看的是**空白与标点**。像
 *
 *   纸币的购买力无时无刻不在被**通货膨胀（Inflation）**侵蚀。
 *
 * 结尾的 `**` 前面是「）」（标点）、后面是「侵」（既非空白也非标点），
 * 于是它不算 right-flanking，闭合失败 —— 整段 `**…**` 原样留在页面上。
 * 中文写作里「**术语（英文）**」这种句式极常见，这不是作者的错。
 *
 * 做法：解析完成后扫过 mdast 的 text 节点，把还残留的 `**…**` 换成 strong。
 * 为什么安全：**正常解析成功的强调根本不会留下 `**` 在 text 节点里**，
 * 所以这个插件只碰那些本来就渲染失败的段落，不会改动任何已经正确的排版；
 * code / inlineCode 是另外的节点类型，也不会被误伤。
 */
export default function remarkBoldFallback() {
  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;

      node.children = node.children.flatMap((child) => {
        if (child.type === 'text' && child.value.includes('**')) {
          const parts = [];
          let cursor = 0;

          for (const match of child.value.matchAll(/\*\*([^*]+?)\*\*/g)) {
            const [whole, inner] = match;
            const at = match.index;

            if (at > cursor) parts.push({ type: 'text', value: child.value.slice(cursor, at) });
            parts.push({ type: 'strong', children: [{ type: 'text', value: inner }] });
            cursor = at + whole.length;
          }

          if (!parts.length) return [child];
          if (cursor < child.value.length) parts.push({ type: 'text', value: child.value.slice(cursor) });
          return parts;
        }

        walk(child);
        return [child];
      });
    };

    walk(tree);
  };
}
