# Inattentive Robot Platform

家用机器人“一个身体、多方诉求”研究平台，包含研究端、影游体验端、案例商店与 VR180 实验入口。

- 在线体验：[GitHub Pages](https://danlinhuang0428-collab.github.io/inattentive-robot-platform/)
- GitHub：[danlinhuang0428-collab/inattentive-robot-platform](https://github.com/danlinhuang0428-collab/inattentive-robot-platform)
- 本地入口：`http://localhost:3001/`
- 状态更新时间：2026-08-30（America/Los_Angeles）

## 当前开发状态

| 模块 | 状态 | 已实现内容 |
|---|---|---|
| 平台封面与项目切换 | 可用 | 新建、重命名和切换研究项目；中英文界面切换 |
| 研究端 | 可用 | 研究概览、家庭档案、家庭会议、Scenario Lab、案例商店编辑、体验报告导出 |
| 影游体验端 | 可用 | 家庭/成员入口、场景列表、冲突影片、A/B/C 分支、隐藏决策计时、超时分支、语音或键盘问卷 |
| 案例商店 | 可用 | 5 条一阶愿望、二阶冲突档案、详情页、选择统计与替代方案汇总 |
| Scenario Lab | 本地开发可用 | 六阶段脚本、Production Plan、关键帧、视频任务、QA、接受/发布流程 |
| 云端响应 | 已接入 | GitHub Pages 使用 Supabase 写入参与者结果；研究者登录后可读取并实时订阅 |
| VR180 | 实验性可用 | WebXR/Quest 入口、桌面拖拽预览、彩色+深度双目、头部跟随字幕与单目回退 |
| GitHub Pages | 已上线 | 当前静态构建已发布；服务器端 AI 生成接口只在本地开发环境运行 |

当前种子工作区包含 4 份家庭记录（其中 1 份为教程）、1 个初始 Scenario Lab 场景和 5 条愿望卡。发布资产包含 13 个可交互场景数据包：教程 1 个、Family 01 共 6 个、Family 02 共 6 个。浏览器中已经存在的旧 `localStorage` 数据会继续迁移并优先显示，因此本地仪表盘数字可能与全新浏览器的种子数据不同。

## 三个入口

### 研究端 · Researcher Port

- 管理多项目与家庭档案；
- 编辑家庭背景、成员、协议与会议记录；
- 使用 OpenRouter 生成场景文本；
- 通过 Scenario Lab 管理脚本、Production Contract、关键帧、视频和 QA；
- 查看本地或 Supabase 体验记录，并导出 TXT、CSV、JSON；
- 编辑案例商店愿望卡，并通过 fal.ai 重新生成配图。

### 影游体验端 · Experience Port

- 参与者按家庭和成员身份进入；
- 播放预生成冲突影片，并在分支点记录选择与反应时间；
- 支持两选项与三选项场景；
- 支持持久可拖动的双语对白、场景 HUD、倒计时和超时影片；
- 结束后收集困难度、替代方案与选择理由；支持浏览器语音识别；
- 在线版将完成记录写入 Supabase，离线时进入持久重试队列。

### 案例商店 · Case Shop Port

- 一阶愿望展示家庭对家用机器人的日常期待；
- 二阶冲突聚合已发布场景、Scenario Lab 草稿和占位案例；
- 档案卡保持简洁，只显示缩略图、标签、简介与选择；
- 参与者指标和替代方案位于场景详情页。

## 已发布场景资产

| 家庭 | 场景 |
|---|---|
| Tutorial | Kitchen or Care? |
| Family 01 | Hot Soup or Grandmother?；Grandmother Says: Don’t Stop Me；Two Stories in the Pillbox；Only 8% Battery Remaining；Ask Older Sister About Everything；The Dance Partner Promise |
| Family 02 | Broken Glass, Boiling Pot, and Who Cleans Up；Wali Remembered Two Versions；Songgao Always Comes Last；One Person Missing from the Family Portrait；Her First Try at a New Dish；The Purchaser Changed the Rules Remotely |

场景 JSON 位于 `public/data/`；海报与关键帧位于 `public/inattentive-assets/`；分支视频位于 `public/videos/`。在线发布仓库中，这些目录对应根目录下的 `data/`、`inattentive-assets/` 和 `videos/`。

## Scenario Lab

Scenario Lab 的六个阶段为：

1. Scenario Brief
2. Editable Scripts
3. Production Plan & Prompts
4. Keyframes Review
5. Video Generation
6. QA & Export

文本环节通过 OpenRouter 调用 Gemini Flash 系列；媒体环节通过 fal.ai 调用 FLUX Schnell、Nano Banana 2 Edit、MiniMax H3 和 Video Understanding。付费 MiniMax H3 提交必须显式确认，每个 clip 只创建一个候选，并立即保存 request ID；相同幂等键只补交缺失任务。

`SCENARIO_LAB_HANDOFF_2026-08-15.md` 是一次真实 API 测试的历史快照：该次“热汤与门口的外婆”测试因关键帧连续两轮未通过而停在 Stage 04，没有提交 H3 视频。之后人工批准并制作完成的场景资产与过程记录，以 `docs/影游生产记录/`、`public/data/` 和 `public/videos/` 中的当前文件为准。

## VR180

`public/VR180/` 是发布运行时，`experiments/VR180/` 是制作与 QA 工作区。当前运行时支持：

- 180° × 180° half-equirectangular 半球映射；
- Three.js WebXR 和桌面拖拽视角；
- 颜色视频加深度视频的双目视差；
- 跟随头部、独立于视频的双眼字幕平面；
- `?depth=off` 单目调试回退。

制作标准与当前选择依据见 `experiments/VR180/VR180_PRODUCTION_STANDARD.md` 和 `experiments/VR180/README.md`。未经新的明确授权，不应继续提交付费 fal.ai 任务。

## 开发与研究材料

- `docs/Scenario_Lab/Scenario_Lab工作流规范.md`：Scenario Lab 工作流规范；
- `docs/Scenario_Lab/开发提示词.md`：继续开发时的上下文提示；
- `docs/影游生产记录/Family_01-Scenario_02_制作过程记录.md`：Family 01–02 从脚本到 H3 视频的完整过程；
- `docs/影游生产记录/Family_01-Scenario_03_制作过程记录.md`：Family 01–03 四视频、三选择流程和修订证据；
- `docs/界面参考/`：界面方向、封面和历史截图；
- `experiments/VR180/`：VR180 prompts、manifest、QA、生成工具和发布运行时；
- `supabase/schema.sql`：共享体验记录、研究者 allowlist 与 RLS；
- `tests/`：Prompt compiler 与静态构建行为验证。

GitHub 发布仓库为保持现有 Pages 地址不变，根目录继续保存可运行静态站；可读源码快照位于 `source/`，可公开开发材料位于 `project-materials/`。密钥、本地缓存、日志、被忽略的构建目录及超过 GitHub 单文件限制的原始制作母版不会上传。

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
cd "02_最新3001平台/01_当前开发版_2026-08-14"
cp .env.example .env.local
npm install
npm run dev
```

打开 [http://localhost:3001](http://localhost:3001)。前端本地使用不要求登录。

### 环境变量

凭据只写入被忽略的 `.env.local`：

```text
OPENROUTER_API_KEY=
OPENROUTER_FAST_MODEL=google/gemini-3.1-flash-lite
OPENROUTER_COMPLEX_MODEL=google/gemini-3.5-flash
FAL_KEY=
FAL_IMAGE_FAST_MODEL=fal-ai/flux/schnell
FAL_IMAGE_REFERENCE_MODEL=fal-ai/nano-banana-2/edit
FAL_VIDEO_MODEL=minimax/h3/image-to-video
FAL_VIDEO_QA_MODEL=fal-ai/video-understanding
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

OpenRouter 和 fal.ai 密钥只由本地 `app/api/` 服务端路由读取，不返回浏览器。开发环境中的 API Settings 对话框也只把密钥写入本机 `.env.local`，不会存入源码或 `localStorage`。

## 数据持久化与 Supabase

本地项目数据保存在：

```text
inattentive-robot.platform.v3
```

旧版 `v1`、`v2` 数据会自动迁移。大型图片和视频二进制不会写入 `localStorage`。

在线共享响应配置：

1. 在 Supabase SQL Editor 执行 `supabase/schema.sql`；
2. 在 Supabase Authentication 创建研究者用户；
3. 把该用户加入 `public.researcher_access`；
4. 本地将 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 写入 `.env.local`；
5. GitHub Pages 构建时配置同名 Actions variable/secret；
6. 研究端或案例商店使用 Researcher sign in 读取受保护数据。

匿名参与者只能插入完整体验记录，不能读取共享记录；登录且在 allowlist 中的研究者可以读取和订阅。绝不能把 Supabase service-role key 放进浏览器或仓库。

## 验证

```bash
npm run lint
npm run build
npm test
npx vite build --config vite.github-pages.config.ts
```

最后一条命令生成 `dist-pages/`，即 GitHub Pages 的静态发布内容。服务器端 AI 接口不会被打包到静态站中。

