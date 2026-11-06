/**
 * rehype-table-scroll —— 给正文里每张 <table> 套一层 <div class="table-scroll">。
 *
 * 为什么：表格的最小内容宽度由最长的那个单元格决定，`width: 100%` 只能把它拉宽、
 * 压不窄。列一多（这篇手册里有 7 列的定投示例表，最小宽度 473px），390px 的手机上
 * 整页就会被撑出横向滚动条。套一层 overflow-x:auto 之后，滚动被关在表格内部。
 *
 * 放在 rehype 阶段（而不是 CSS）：因为 CSS 没有「父元素选择器」，想不改
 * 表格的 display（那会破坏表格布局与 100% 宽度）就只能加一层容器。
 *
 * 跳过图表内部：`<figure class="chart-embed">` 里的表格已经由 .ch-scroll 负责滚动，
 * 再套一层会变成两层滚动条。
 */
export default function rehypeTableScroll() {
  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;

      node.children = node.children.flatMap((child) => {
        if (child.type !== 'element') {
          walk(child);
          return [child];
        }

        // 图表内部整棵子树不再处理
        const classes = child.properties?.className;
        if (Array.isArray(classes) && (classes.includes('chart-embed') || classes.includes('ch-scroll'))) {
          return [child];
        }

        if (child.tagName === 'table') {
          return [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['table-scroll'] },
              children: [child],
            },
          ];
        }

        walk(child);
        return [child];
      });
    };

    walk(tree);
  };
}
