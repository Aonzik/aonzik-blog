/**
 * 个人资料 —— 首页与关于页的人物内容，全部来自 docs/bio.md。
 *
 * 分工：品牌、导航、页脚、社交链接属于站点级配置，放在 src/lib/site.ts；
 * 这里只放「这个人是谁」——名字、坐标、标签、研究线索、工具栈、兴趣。
 * bio.md 之外的文字是围绕它写的中文句子，不新增事实（不编造学校、年份、项目名）。
 */

/** 身份：中英文名 + 坐标 + 状态 */
export const identity = {
  zh: '川崎·杭汐',
  en: 'Aonzik Kawasaki',
  /** 名字来历：Aonzik 取自「杭汐」的吴语音译，标准吴语罗马字 Ghaon-ziq */
  aliasNote: 'Aonzik 取自「杭汐」的吴语音译，标准吴语罗马字 Ghaon-ziq',
  city: 'Hangchow, Chekiang',
  languages: '汉语・English・日本語',
  status: '在读学生',
  major: '人工智能',
  /** 印章上的两个字 */
  seal: '杭汐',
  /** Bilibili 昵称 */
  bilibili: '@川崎龍井雀',
};

/** 个人标签（bio.md 的五个方括号标签） */
export const personalTags = [
  '二次元文化',
  '江浙吴越文化与方言',
  '人工智能本科在读',
  '曾经的乐队贝斯手',
  '日本文化',
];

/** 关于页的自我介绍（三段） */
export const intro = [
  '我是川崎·杭汐，也可以叫我 Aonzik Kawasaki —— Aonzik 取自「杭汐」的吴语音译（吴语罗马字 Ghaon-ziq）。人工智能专业本科在读，技术兴趣在自然语言处理与计算机视觉，另外在二次元文化和吴越方言上花的时间也不少。',
  '现在主要在做一件事：基于大语言模型的开源聊天机器人。除了让它把话说顺，还在尝试接入更多的多模态交互，让机器人陪人听歌、和人分享流媒体视频。',
  '同时在全栈这条路上补课：热衷于个人服务器自建服务与私有云生态的探索——数据、服务、备份都尽可能放在自己手里。一个能自己维护的系统，比一段跑得漂亮的 demo 更有意思。',
  '这个博客用来放那些还没想清楚、但不想丢掉的东西：踩过的坑、读过的书、某个方言词的来历，或者一次出门拍到的光、一次在厨房做出的菜。写下来的时候，含糊的地方会被迫变清楚。',
];

/** 关于页「研究线索」：四条正在推进的方向 */
export const research = [
  {
    no: '01',
    title: '基于大语言模型的开源聊天机器人',
    desc: '手上主要的项目。选开源模型，是为了把数据、检索与生成都握在自己手里，也方便改坏、改好、再改坏。',
    meta: 'LLM · chat',
  },
  {
    no: '02',
    title: '多模态交互',
    desc: '让对话不止发生在文字里。图像与语音是下一步要接进来的输入，先解决「看得懂」，再谈「听得清」。',
    meta: 'vision · speech',
  },
  {
    no: '03',
    title: '自主 Agent 机制',
    desc: '在对话之上加一层调度：拆解任务、调用工具、检查结果。目标是让它从「回答问题」走到「把事做完」。',
    meta: 'agent · tool use',
  },
  {
    no: '04',
    title: '全栈开发 · 个人服务器',
    desc: '在培养全栈开发能力，同时热衷于个人服务器自建服务与私有云生态：能自己部署、自己维护、自己兜底的东西，才算是自己的。',
    meta: 'full-stack · self-hosted',
  },
];

/** 工具栈：三组（开发 / 生产力 / AI 工具） */
export const stack = [
  {
    label: '开发',
    en: 'code',
    items: [
      { name: 'Python', href: 'https://www.python.org/' },
      { name: 'C / C++', href: 'https://isocpp.org/' },
      { name: 'JavaScript', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
      { name: 'Node.js', href: 'https://nodejs.org/' },
    ],
  },
  {
    label: '生产力',
    en: 'tools',
    items: [
      { name: 'VS Code', href: 'https://code.visualstudio.com/' },
      { name: 'Obsidian', href: 'https://obsidian.md/' },
      { name: 'Git', href: 'https://git-scm.com/' },
      { name: 'Adobe Photoshop', href: 'https://www.adobe.com/products/photoshop.html' },
    ],
  },
  {
    label: 'AI 工具',
    en: 'ai',
    items: [
      { name: 'DeepSeek Harness', href: 'https://github.com/deepseek-ai/deepseek-harness' },
      { name: 'ZCode', href: 'https://zcode.z.ai/' },
    ],
  },
];

/** 兴趣：探索 / 输入 / 创造 */
export const interests = [
  { label: '探索', en: 'explore', items: ['摄影', '立直麻将', '城市漫游'] },
  { label: '输入', en: 'input', items: ['ACGN', '科幻小说', '音乐', '日本文学'] },
  { label: '创造', en: 'make', items: ['料理', '独立开发', '设计'] },
];

/** 在玩的游戏（bio.md 里的五个链接） */
export const games = [
  { name: '鸣潮', href: 'https://mc.kurogames.com/' },
  { name: '明日方舟', href: 'https://ak.hypergryph.com/' },
  { name: '终末地', href: 'https://endfield.hypergryph.com/' },
  { name: '雀魂', href: 'https://mahjongsoul.com/' },
  { name: 'PEAK', href: 'https://peakpeakpeak.com/' },
];

/** 页面小标题用的编号 */
export const sectionNo = (n: number): string => String(n).padStart(2, '0');
