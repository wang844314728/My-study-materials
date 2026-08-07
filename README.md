# Yook's Notes

## 项目简介

这是一个用 VitePress 整理学习、研究与思考的笔记站点。现有内容按 Python、LangChain 1.2 与 LangGraph 分类；侧栏由脚本从笔记目录生成，站点也提供本地搜索、数学公式、Mermaid 图表和 LangGraph 运行时交互图。

## 技术栈与五个直接依赖的用途

- `vitepress`：构建静态文档站点，并提供本地开发、构建与预览能力。
- `markdown-it`：作为 VitePress 的 Markdown 解析基础，用于扩展 Markdown 渲染。
- `@mdit/plugin-katex`：让 Markdown 支持 KaTeX 数学公式语法。
- `katex`：提供公式排版所需的运行时与样式资源。
- `mermaid`：将 Mermaid 代码块渲染为流程图等图表。

## 环境要求

- Node.js 20 或更高版本。
- npm。

## 安装与本地启动

在仓库根目录安装依赖后启动本地开发服务器：

```bash
npm install
npm run docs:dev
```

开发服务器会在启动前生成 `.vitepress/sidebar.ts`，因此新增或调整笔记后无需手工维护侧栏。

## 添加新笔记

1. 在 `python/`、`LangChain_1.2/` 或 `LangGraph/` 中新增 `.md` 文件；分类首页分别是各目录的 `index.md`。
2. 使用文件名前的数字控制顺序，例如 `11-新主题.md`；也可以在文件顶部使用 `order` frontmatter 指定顺序。
3. 图片放在笔记同级的 `assets/` 目录，并用相对路径引用；构建会检查本地图片是否缺失。
4. 运行 `npm run docs:dev` 查看侧栏和路由，提交前再运行构建。

不要手工编辑 `.vitepress/sidebar.ts`，它由 `npm run docs:generate` 自动生成；`docs:dev` 和 `docs:build` 都会调用该脚本。

内容校验把最初导入的 30 篇课程记录在 `scripts/content-baseline.mjs` 中，并把 401 处本地图片引用作为最低基线。新增课程和有效图片引用不会导致校验失败；删除或重命名基线课程时，需要明确更新基线清单。所有仍被 Markdown 引用的本地图片都必须存在。

## 修改站点名称、副标题和 GitHub 链接

集中修改 [`.vitepress/site.ts`](.vitepress/site.ts) 中的 `SITE`：

- `title` 是站点名称；
- `description` 是副标题和页面描述；
- `github` 是导航栏和社交链接使用的 GitHub 地址；
- `repository` 保留项目仓库名称，便于部署配置与维护说明保持一致。

## 本地构建与预览

构建会依次生成侧栏、验证必需页面与本地资源，再输出静态文件到 `.vitepress/dist`。预览已构建的站点时：

```bash
npm run docs:build
npm run docs:preview
```

## GitHub Pages 部署

`.github/workflows/deploy.yml` 会在 `main` 分支有推送时构建并部署，也可在 Actions 页面手动运行。工作流使用 Node 20、`npm ci` 和 `VITEPRESS_BASE=/My-study-materials/`，上传的 Pages 构建产物是 `.vitepress/dist`。

首次启用时，在仓库中依次打开 **Settings → Pages → Source**，选择 **GitHub Actions**。随后推送到 `main`，或从 Actions 页面手动触发 `Deploy VitePress site to Pages`。

## `VITEPRESS_BASE`：用户名主页仓库与普通项目仓库

VitePress 的 `base` 必须与 Pages 地址中的仓库路径一致：

- 用户名主页仓库（例如 `username.github.io`）部署在域名根路径，使用 `/`；不设置 `VITEPRESS_BASE` 时，站点配置默认就是 `/`。
- 普通项目仓库（例如 `repository-name`）部署在 `/repository-name/`，构建时使用对应环境变量：

  ```bash
  VITEPRESS_BASE=/repository-name/ npm run docs:build
  ```

当前仓库是普通项目仓库，Pages 工作流因此使用 `/My-study-materials/`。如果仓库名称改变，请同时更新工作流中的值；本地验证也应使用同一段路径。

## Settings → Pages → Source 选择 GitHub Actions

仓库管理员需要在 GitHub 的 **Settings → Pages → Source** 选择 **GitHub Actions**，让 Pages 接收工作流上传的构建产物。不要选择从分支直接发布；本项目由部署工作流负责构建和发布。

## 项目目录

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages 构建与部署
├── .vitepress/                   # VitePress 配置、主题和生成的侧栏
├── python/                       # Python 笔记
├── LangChain_1.2/                # LangChain 1.2 笔记
├── LangGraph/                    # LangGraph 笔记与运行时交互图
├── scripts/                      # 侧栏生成、内容校验与运行时资源复制
├── index.md                      # 首页
├── notes.md                      # 笔记分类总览
└── package.json                  # 脚本与依赖声明
```

## 常见问题

**侧栏没有出现新文章？** 运行 `npm run docs:dev` 或 `npm run docs:build` 重新生成侧栏，并确认文件位于三个笔记分类目录之一。

**构建提示图片不存在？** 检查 Markdown 中相对图片路径是否能从当前笔记文件定位到 `assets/` 内的文件。

**Pages 页面中的静态资源 404？** 检查 `VITEPRESS_BASE` 是否匹配部署类型：用户名主页仓库为 `/`，项目仓库为 `/repository-name/`。

**工作流没有部署？** 确认默认分支名为 `main`，并确认 **Settings → Pages → Source** 已选择 **GitHub Actions**。

## 内容与版权说明

本站内容用于个人学习记录、研究整理与复盘。除非对应文件另有说明，笔记、图表和配图不表示第三方内容的授权；引用的资料、截图和商标仍归各自权利人所有。转载或再利用前，请自行核实原始来源、许可证与适用范围。
