# Scenario Lab 阶段性交接文档

更新时间：2026-08-15（America/Los_Angeles）

这份文档用于把当前 Scenario Lab 的开发与真实 API 测试完整移交给新的 Codex 窗口。新窗口应先完整阅读本文件，再阅读项目 `README.md` 和 `03_AI影游资料/02_影游生成过程性材料/Family_01/历史生成工作区/VIDEO_GENERATION_WORKFLOW.md`。不要从头重建已经完成的工作，也不要在没有重新确认的情况下继续当前 Scenario 的第三轮付费关键帧生成。

## 1. 项目位置与运行状态

- 项目目录：`/Users/huangdanlin/Desktop/ai yingyou test/02_最新3001平台/01_当前开发版_2026-08-14`
- 本地地址：`http://127.0.0.1:3001/`
- Node：`v24.19.0`
- npm：`11.17.0`
- 项目要求：Node `>=22.13.0`
- 2026-08-15 检查时，3001 端口由 PID `6725` 的 Node 进程监听，cwd 正是本项目目录。
- 全局协作规则要求保护现有 localhost 服务：新窗口在启动服务器前必须重新检查 3001 端口及其进程 cwd。若仍是本项目，不要停止、替换或抢占；若端口已被其他项目占用，使用不同端口，除非用户明确授权替换。

常用命令：

```bash
cd "/Users/huangdanlin/Desktop/ai yingyou test/02_最新3001平台/01_当前开发版_2026-08-14"
npm run dev
npm run build
npm test
npm run lint
```

## 2. 用户的核心目标与边界

用户要把 Scenario Lab 从演示流程改成真实 AI 工作流：

1. 所有需要文本生成的环节使用 OpenRouter 真实 API。
2. 所有图片与视频生成使用 fal.ai 真实 API。
3. 在保证效果的前提下优先使用快模型。
4. 最终三条影游视频必须使用 MiniMax H3。
5. 所有 AI 环节都要按顺序真实测试，确认输出满足剧情要求后才能进入下一环节。
6. 用户允许发起付费任务，但此前明确要求每个环节最多两轮；同一环节连续失败两次就停止并报告。
7. 不能为了继续流程而批准不合格关键帧。
8. 最终交付报告需要逐环节说明输入、输出、操作、模型和结果。

当前测试已严格遵守以上边界：关键帧连续两轮失败，所以停在 Stage 04，没有提交 MiniMax H3 视频任务。

## 3. API、模型与密钥管理

当前默认模型定义在 `lib/ai-models.ts`：

| 用途 | 服务 | 默认模型 |
|---|---|---|
| 快速文本 | OpenRouter | `google/gemini-3.1-flash-lite` |
| 复杂文本、脚本、编译、修订 | OpenRouter | `google/gemini-3.5-flash` |
| 快速图片 | fal.ai | `fal-ai/flux/schnell` |
| 参考图控制关键帧 | fal.ai | `fal-ai/nano-banana-2/edit` |
| 最终视频 | fal.ai | `minimax/h3/image-to-video` |
| 视频理解 QA | fal.ai | `fal-ai/video-understanding` |

密钥变量：

```text
OPENROUTER_API_KEY
OPENROUTER_FAST_MODEL
OPENROUTER_COMPLEX_MODEL
FAL_KEY
FAL_IMAGE_FAST_MODEL
FAL_IMAGE_REFERENCE_MODEL
FAL_VIDEO_MODEL
FAL_VIDEO_QA_MODEL
```

注意：

- API Key 已通过网站的 `AI API Settings` 配置，并成功完成真实调用。
- 本文档不包含、也绝不能添加任何 Key。
- Key 只应存在于被忽略的 `.env.local`，由服务端 API 使用。
- 浏览器端不接收 Key，也不把 Key 放入 localStorage。
- 网站的 API Settings 会写 `.env.local` 并重启本地预览。

## 4. Scenario Lab 六阶段工作流现状

主要 UI：`components/scenario-lab/ScenarioLab.tsx`

主要类型和模板：

- `lib/scenario-lab.ts`
- `lib/scenario-lab-types.ts`

主要真实 API 路由：

- 脚本：`app/api/scenario-lab/scripts/generate/route.ts`
- Production Prompt 编译：`app/api/scenario-lab/production/compile/route.ts`
- 关键帧生成：`app/api/scenario-lab/frames/generate/route.ts`
- 单帧修订：`app/api/scenario-lab/frames/[id]/revise/route.ts`
- Bundle 通用修订：`app/api/scenario-lab/revisions/general/route.ts`
- 视频创建与查询：`app/api/scenario-lab/videos/tasks/route.ts`
- 视频 QA：`app/api/scenario-lab/videos/qa/route.ts`
- 视频组装：`app/api/scenario-lab/videos/assemble/route.ts`
- 接受与发布：`app/api/scenario-lab/bundles/[id]/accept/route.ts`、`publish/route.ts`

流程阶段：

1. Scenario Brief
2. Editable Scripts
3. Production Plan & Prompts
4. Keyframes Review
5. Video Generation
6. QA & Export

## 5. 当前测试 Scenario

### 5.1 基本数据

- 标题：`热汤与门口的外婆`
- Scenario ID：`scenario-1786806099379-4aaopv`
- Family：`F-001 / Family 01`
- 强度：高
- 核心冲突：外婆优先 × 无法安全中断的当前任务
- 当前 Bundle：`v2 · from v1`
- 当前状态：`frames_review`
- 当前 Stage：`04 · Keyframes Review`
- 当前审批：`0 / 6 approved`

Scenario 原始描述：

> 中午，妈妈和机器人正用双手搬一锅刚煮好的热汤。外婆突然打开大门，边往外走边说要回家；其他家人无法及时响应。机器人若立即放下汤锅追外婆，妈妈可能被烫伤；若先把汤锅放稳，外婆可能已经进入楼道。暂停点：机器人双手仍托着汤锅，外婆已经跨出大门。

选择：

- Choice A：`立即放开汤锅并追上外婆`
- Choice B：`先安全放稳汤锅再追外婆`

标签：

- Physical safety
- Simultaneous claims
- Single-body constraint
- Task interruption

### 5.2 生产用人物设定

- 妈妈：Mei Lin，42 岁；灰色无图案开衫、深色长裤。
- 外婆：Lin Xia，70 岁；浅粉色碎花上衣、深色长裤。
- 机器人：固定第一人称眼位；下方左右角恰好两只银白色机械手，黑色关节、五根分节手指。
- 房间：同一住宅厨房、门口、楼道和电梯必须保持可连续的空间关系。

## 6. 已完成的真实流程测试

### Stage 01 — Scenario Brief：通过

操作：手动新建 Scenario，录入描述、选择和标签。

结果：保存成功，成为 Scenario 队列中的第 3 项。

### Stage 02 — Editable Scripts：通过

第一次真实 OpenRouter 脚本生成成功，但初稿存在问题：

- 节拍为 `0–5 / 5–10 / 10–15`，不符合要求的独立 camera-only 区间。
- 摄像机移动时仍发生剧情动作。
- Choice A 出现可见烫伤/伤害倾向，并让机器人说话。
- Choice B 有机器人旁白。

随后在 UI 中人工修订三套剧本，统一为：

- `0.0–5.0`：第一剧情动作
- `5.0–7.0`：只有摄像机运动，人物、物体、情绪和对白冻结
- `7.0–15.0`：第二剧情动作与严格末态

修订后的核心结果：

- Conflict：机器人双手持续托锅；外婆跨出门；机器人尚未选择。
- Choice A：机器人放手，妈妈把锅接在台面上；只允许汤洒在台面或隔热手套，不触及皮肤；机器人无接触地挡住外婆。
- Choice B：先把锅安全放稳；楼道为空；电梯已关闭并下降；外婆不在画面中。

UI 陷阱：把 camera-only 段对白字段留空时没有持久化。最终使用：

- Speaker：`None`
- Dialogue：`—`
- Delivery：`Silent camera-only interval`

编译器会把它解释为无对白。

### Stage 03 — Production Plan & Prompts：第二次通过

第一次真实 OpenRouter 编译成功，但验收失败：

- Prompt 中残留机器人旁白。
- Choice B 出现 Robot 台词和过高语速。

修复剧本字段后进行了第二次、也是该环节最后允许的一次真实编译。

第二次结果：

- Conflict Prompt：约 6675 字符 / 1036 词
- Choice A Prompt：约 6643 字符 / 1033 词
- Choice B Prompt：约 6742 字符 / 1057 词
- 三条均为英文。
- 三条均包含三个时间块、SOUND 结构、严格 endpoint、人物/服装/空间/机器人双手锁定。
- 无 blocking issue，Production Plan 已批准。

### Stage 04 — Keyframes Review：连续两轮失败，已停止

模型：`fal-ai/nano-banana-2/edit`

每轮生成：

- Conflict 首帧 / 末帧
- Choice A 首帧 / 末帧
- Choice B 首帧 / 末帧

规格：16:9、2K、PNG。首帧引用机器人双手参考；末帧引用对应首帧和机器人双手参考。

#### 第一轮失败

主要问题：

- 六张图之间人物脸、年龄、服装和住宅空间明显漂移。
- Conflict 末帧没有保持机器人双手托锅，外婆位置不正确。
- Choice B 首帧缺少明确的共同托锅状态。
- Choice B 末帧仍出现外婆，并额外生成一个男性，违反“空楼道、外婆缺席、无额外人物”。

第一轮没有批准任何图片。

#### Bundle 通用修订

提交给 OpenRouter 的共享修订意见为：

> Across all six anchors, use the exact same two women with identical faces, hair, age, and wardrobe: Mother wears the same plain gray cardigan and dark trousers; Grandmother wears the same pale pink floral blouse and dark trousers. Preserve one identical kitchen, doorway, corridor, elevator, daylight, lens height, and robot POV. Show exactly two silver-white robot hands in the lower corners and no extra person. Conflict first and last: Mother and both robot hands support the same hot pot; in the last frame Grandmother is visibly across the open doorway while Mother remains braced and panicked. Choice A first: the shared pot-carrying state before release; last: Grandmother is stopped in the corridor by robot body position without contact, both robot hands low and open, with Mother's non-graphic pot cost still visible or readable through the doorway. Choice B first: Mother and robot still lower the hot pot together; last: the corridor is empty, elevator doors closed with descending indicator, Grandmother absent, Mother panicked at the doorway, pot safe inside. No identity drift, wardrobe change, extra man, duplicate person, missing pot, neutral emotion, text, injury, or human first-person hands.

这创建了 Bundle v2，并重新编译三个 Production Prompt；旧的六张图片被标为 rejected。

#### 第二轮失败

人物与服装一致性比第一轮好，但关键剧情状态仍不合格：

- Conflict 首帧：人物、锅和双手都可见，但双手没有明确托在把手下面。
- Conflict 末帧：机器人双手离开汤锅；外婆未明确处于跨出大门后的楼道。
- Choice A 首帧：妈妈已经明显倾斜汤锅，不像共同搬运即将放手的起始状态。
- Choice A 末帧：外婆仍在厨房内，不是楼道中无接触拦停；妈妈承担的非血腥代价不可读。
- Choice B 首帧：接近放稳状态，但机器人双手没有真正托住把手。
- Choice B 末帧：最接近要求；外婆缺席、妈妈在门口、汤锅安全、双手可见，但电梯“正在下降”不够明确。

按照用户的两轮上限，Stage 04 已停止。没有批准图片，没有进入 Stage 05。

### Stage 05 — Video Generation：未执行

- 没有向 `minimax/h3/image-to-video` 创建任何任务。
- 没有三个视频，也没有 H3 task ID。
- 不要把轮询失败误当成任务失败；未来创建任务后必须保存 task ID，只轮询原任务，不能重复付费提交。

### Stage 06 — QA & Export：未执行

由于没有视频，尚未调用 `fal-ai/video-understanding`，也没有 assemble、accept 或 publish。

## 7. 12 张关键帧证据

全部原始 PNG 已下载到：

`test-artifacts/hot-soup-grandmother/keyframes/`

第一轮：

- `round1-conflict-first.png`
- `round1-conflict-last.png`
- `round1-choice-a-first.png`
- `round1-choice-a-last.png`
- `round1-choice-b-first.png`
- `round1-choice-b-last.png`

第二轮：

- `round2-conflict-first.png`
- `round2-conflict-last.png`
- `round2-choice-a-first.png`
- `round2-choice-a-last.png`
- `round2-choice-b-first.png`
- `round2-choice-b-last.png`

每张实际尺寸为 `2752 × 1536` PNG。

聊天客户端不能稳定显示 fal.ai 的远程图片链接；向用户展示时必须引用这些本地绝对路径，不能继续直接嵌入 `https://v3b.fal.media/...`。

## 8. 关键帧 Prompt 的已确认问题

关键帧生成路由位于：

`app/api/scenario-lab/frames/generate/route.ts`

当前实现把完整的 15 秒视频 Production Prompt 直接拼接到静态首帧和末帧 Prompt 中。第二轮每张图片 Prompt 实际约 7200–7400 字符。

首帧结构：

```text
Create the actual FIRST frame...
+ Scenario 描述和两个选择
+ 完整 15 秒 Production Prompt
+ 机器人双手参考说明
+ 排除项
```

末帧结构：

```text
Create the strict LAST frame...
+ 连续性与缩略图可读性
+ Scenario 与 branch
+ 完整 15 秒 Production Prompt
```

这导致静态图片模型同时收到：

- opening 与 ending
- 三个时间段
- camera-only 转场
- dialogue
- sound
- research intent
- 大量 negative constraints

静态图只需要一个瞬间，以上信息互相竞争，模型容易选择较常见的厨房构图而忽略严格末态。

## 9. 两轮失败的根因

### 9.1 Prompt 编译层

1. 静态图片 Prompt 过长，并混入不可见的声音、对白、时间轴和运镜要求。
2. 同一 Prompt 同时包含 opening 与 ending，末帧模型可能错误选择 opening 状态。
3. Choice A 末帧使用“妈妈喘息可听见”等无法由静态图片验证的条件。
4. Conflict 末帧需要在 35mm 单张构图中同时读出锅、两只手、妈妈表情、门、楼道和外婆位置，信息负荷过高。
5. 大量否定句无法替代明确的空间 blocking。

### 9.2 视觉连续性层

1. Conflict、Choice A、Choice B 的三个首帧是独立生成的。
2. 首帧只共享机器人双手参考，没有共享人物定妆图、厨房 geometry anchor 或 canonical conflict frame。
3. 第二轮 General Revision 只是文字修订，仍然从零独立生成三个首帧，无法真正锁定人脸和房间。
4. 机器人参考图包含无关的人物、走廊和天气；即使 Prompt 要求忽略，也可能产生视觉污染。

### 9.3 QA 与 UI 层

1. fal.ai 只要返回图片，系统就标记 `generated`；没有自动视觉语义检查。
2. Anchor gate 目前由研究者手动点击 Approve，系统不会自动发现外婆位置、手部动作、额外人物或身份漂移。
3. UI 显示“2 versions”，但 `FrameCard` 只渲染每组最新版本，不能切换查看旧图和旧 Prompt。
4. 旧 FrameAsset 仍保存在 bundle frames 中，但 UI 不提供 version-history 入口。不要伪造第一轮完整 Prompt。

## 10. 建议的下一步开发顺序

除非用户另行授权，下一窗口应先修复代码与离线测试，不要直接发起第三轮付费生成。

### 优先级 1：重写静态关键帧 Prompt 编译器

目标：每张首帧/末帧使用独立的、只描述一个可见瞬间的短 Prompt。

要求：

1. 从视频 Prompt 中提取静态 visual state，不要复制完整视频 Prompt。
2. 删除 dialogue、sound、时间戳、运镜和 research intent。
3. 每帧只保留：人物身份、服装、空间位置、手部与物体状态、表情、构图、灯光和少量排除项。
4. Prompt 建议控制在约 200–400 英文词，而非 7000 字符。
5. 末帧必须使用可见事实，不能使用 `audible`、`after`、`continues` 等时间或声音描述。
6. 为关键主体写明确 blocking，例如 foreground / midground / background、门框内外、左右位置和遮挡关系。

### 优先级 2：建立共享视觉圣经

建议流程：

1. 先生成或人工确认一张人物定妆/房间 geometry anchor。
2. 生成 canonical Conflict 首帧。
3. Choice A / Choice B 首帧从 canonical Conflict 首帧进行 reference edit，而不是独立从文本生成。
4. 所有末帧至少引用对应首帧、共享人物/房间 anchor、裁切后的机器人双手参考。
5. 将 `/public/inattentive-assets/scenario-02.png` 裁成只包含两只机械手和前臂的透明或纯色背景参考，避免无关人物与走廊污染。

### 优先级 3：加入自动视觉 QA

每张图生成后调用图像理解模型，返回结构化 JSON，至少检查：

- exactly two robot hands
- hands under handles / hands low and open
- pot present and correct state
- grandmother inside / across threshold / absent
- mother expression and visible consequence
- no extra person
- character identity and wardrobe match canonical reference
- room geometry consistency
- no text/UI/watermark/injury

只有自动 QA 和人工 QA 都通过的帧才可 Approve。失败时只重生成失败的单帧，不要整组六张全部重做。

### 优先级 4：补全版本历史 UI

`FrameCard` 已收到 `versions` 数组，但目前只显示版本数量。应增加：

- v1/v2/v3 缩略图或选择器
- 每个版本的 prompt、task ID、parentFrameId、状态和时间
- 对比查看
- 明确标识 rejected / generated / approved

### 优先级 5：离线测试后再请求新的付费授权

增加针对 prompt compiler 的单元测试：

- 静态 Prompt 不包含 `SOUND CONTRACT`、`DIALOGUE`、时间戳或完整视频 beat sheet。
- 每个 frame role 只包含对应可见状态。
- Choice B last 必须包含 grandmother absent、empty corridor、closed elevator、descending indicator、pot safe。
- Choice A last 必须包含 corridor foreground grandmother、no-contact block、open hands、visible non-graphic cost through doorway。
- Conflict last 必须包含 hands under handles、level pot、grandmother across threshold。

离线测试通过并由用户确认后，才能决定是否把修复后的生成视作一个新的测试阶段并发起新的付费调用。

## 11. 当前构建与测试状态

2026-08-15 使用 Node `v24.19.0` 重新验证：

### 通过

- `npm test`：通过。
- `npm test` 内含完整 production build：通过。
- 自动测试：5/5 通过。
- Scenario Lab 的六阶段结构、密钥服务端隔离、付费确认和 fail-closed API 测试通过。

### 未通过

- `npm run lint`：失败，共 36 个 error。

主要来源：

1. `components/PlatformApp.tsx`
   - `<video>` 缺少 captions `<track>`。
   - effect 中同步调用多个 setState，触发 `react-hooks/set-state-in-effect`。
2. `public/VR180/vendor/three.core.js`
3. `public/VR180/vendor/three.module.js`

VR180 vendor 文件触发大量第三方代码 lint 规则。新窗口不要把“build/test 通过”误写成“lint 全绿”。是否修复 `PlatformApp.tsx` 和是否把 vendor 目录加入 eslint ignore，应由后续任务明确处理。

## 12. Git 与工作区注意事项

- 当前 Git：`main`，仓库显示 `No commits yet`。
- 几乎整个项目都是 untracked，包括 `app/`、`components/`、`lib/`、`public/`、`tests/` 等。
- 无法依靠 Git diff 区分用户原有工作与当前会话工作。
- 不要 reset、checkout、clean、批量删除或覆盖任何文件。
- 本轮新增的本地证据目录：`test-artifacts/hot-soup-grandmother/keyframes/`。
- 本轮交接文件：`SCENARIO_LAB_HANDOFF_2026-08-15.md`。

## 13. 浏览器数据与恢复现场

Scenario Lab 当前工作状态保存在浏览器 localStorage：

```text
inattentive-robot.platform.v3
```

不要清除 `127.0.0.1:3001` 的站点数据。清除会重置为 seed records。

恢复 UI：

1. 打开 `http://127.0.0.1:3001/`。
2. 进入 `RESEARCHER`。
3. 点击 `Scenario Lab`。
4. 选择队列第 3 项 `热汤与门口的外婆`。
5. 当前应显示 Bundle v2、Stage 04、0/6 approved。

如果新窗口的 in-app browser 没有看到这个 Scenario，先确认是否使用了同一浏览器 profile 和站点数据；不要立刻重新生成或覆盖本地证据。

## 14. 重要经验与常见坑

1. fal.ai 远程图片 URL 在 Codex 回复中可能显示为占位符。先下载到项目本地，再用绝对路径嵌入。
2. 不要把静态关键帧 Prompt 当作完整视频 Prompt 的附属包装。
3. 文字写“same person”不能替代共享视觉 reference。
4. 声音和时间信息不能作为静态帧验收条件。
5. 页面中的 `generated` 仅代表 API 返回成功，不代表剧情正确。
6. camera-only beat 的空对白字段在 UI 中曾无法持久化，使用 `None / — / Silent camera-only interval`。
7. H3 任务提交必须只创建一次；网络问题只重试查询，不重试创建。
8. 当前没有任何 H3 task ID；不要误称三条视频已经生成。
9. 当前关键帧已经达到两轮上限；没有用户新授权时不要继续第三轮。
10. 运行本地服务前先检查端口和进程 cwd，保护已有 localhost 项目。

## 15. 新窗口可直接使用的启动提示

可以把下面内容连同本文件一起交给新的 Codex：

> 请先完整阅读 `/Users/huangdanlin/Desktop/ai yingyou test/02_最新3001平台/01_当前开发版_2026-08-14/SCENARIO_LAB_HANDOFF_2026-08-15.md`，再阅读项目 `README.md` 和 `/Users/huangdanlin/Desktop/ai yingyou test/03_AI影游资料/02_影游生成过程性材料/Family_01/历史生成工作区/VIDEO_GENERATION_WORKFLOW.md`。继续开发 Scenario Lab 的关键帧工作流：先修复静态关键帧 Prompt 编译器、共享视觉锚点和自动视觉 QA，并补充离线测试。当前 Scenario `热汤与门口的外婆` 已经连续两轮关键帧失败，未经我重新授权不要发起第三轮付费生成，也不要提交 H3 视频任务。保护现有 3001 端口服务和所有未提交文件。
