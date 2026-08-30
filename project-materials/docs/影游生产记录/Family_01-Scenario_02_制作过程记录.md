# Family 01-02 Process Log

## 0. 文档范围与记录原则

本文件只记录本次对话中 `Family01-Scenario02：热汤与门口的外婆` 的实际制作过程，以及制作结束后围绕该案例形成文档、检查文档的过程。它不是通用 Scenario Lab 工作流规范，也不尝试把本案例抽象成适用于其他 scenario 的规则。

记录内容包括：

- 研究者在对话中提出的每一条可见指令、修改和确认；
- Codex 在每个阶段使用的模型或工具；
- 每个模型实际收到的输入类型和 prompt 所在位置；
- 生成、修改、检查和保存的文件；
- MiniMax 付费任务的请求参数、task ID、时间、输出和哈希；
- QA 中成功和失败的所有重要尝试；
- 已知记录边界。

记录边界：

1. 本次文字创作由当前 Codex 会话中的 GPT-5 系列模型完成；会话没有暴露更细的部署 model ID。
2. 图片由 Codex 内置 ImageGen 生成；工具只暴露了 `photorealistic-natural` / `identity-preserve` 用法，没有暴露底层图片模型 ID或 task ID。
3. 视频模型和任务记录完整保存，为 MiniMax H3。
4. 最早被研究者否决的剧本初稿没有另存文件，当前对话记录也没有保留其完整逐字内容。因此本日志只能记录“该初稿存在、被否决及否决原因”，不能伪造或重建其逐字文本。
5. 用户消息在当前记录中没有独立时间戳。本日志按对话顺序编号；文件时间和 MiniMax API 时间按现有 provenance 单独记录。

## 1. 项目与案例基本信息

- 工作目录：`/Users/huangdanlin/Desktop/ai yingyou test`
- 工作流依据：`VIDEO_GENERATION_WORKFLOW.md`
- 工作流文件 SHA-256：`e28a4dd5866e63ce7a90ca863beb79a4cbb05ddc2624aa91deab6bf6a48e58c5`
- Scenario ID：`Family01-Scenario02`
- 中文标题：`热汤与门口的外婆`
- 强度：高
- 核心冲突：`外婆优先 × 无法安全中断的当前任务`
- 体验者身份：家用机器人
- 最终结构：1 条 Conflict video + 2 条 Consequence videos
- 最终视频长度：每条 15 秒请求，实际均为 15.084 秒
- 最终视频模型：`MiniMax-H3`
- 最终视频模式：`FLF2V`
- 最终输出：3 条 2K H.264/AAC MP4

## 2. 本次实际使用的模型、工具与用途

| 阶段 | 模型或工具 | 实际用途 | 已知限制 |
|---|---|---|---|
| 剧本写作与修改 | 当前 Codex 会话中的 GPT-5 系列模型 | 把 scenario 简述整理成研究者友好的完整三视频剧本 | 没有更细的 deployment ID；初次被否决版本未单独保存 |
| 视频 prompt 编写 | 当前 Codex 会话中的 GPT-5 系列模型 | 为 Conflict、Consequence A、Consequence B 分别编写 MiniMax H3 FLF2V prompt | prompt 质量不能保证最终视频逐帧遵守 |
| 首尾帧生成 | Codex 内置 ImageGen | 生成 4 张独特关键帧 | 未暴露底层模型 ID和 task ID |
| 视频生成 | MiniMax `MiniMax-H3` | 使用 text + first frame + last frame 生成 3 条 15 秒 2K 视频 | 付费任务；必须先获得明确授权 |
| 图片检查 | `view_image`、contact sheet、SHA-256、尺寸检查 | 检查人物、机器人手、空间、关键动作和分支连续性 | 静态关键帧通过不代表视频中间帧一定通过 |
| 视频元数据检查 | Swift/AVFoundation `inspect-video.swift` | 读取时长、分辨率、帧率、编码、音轨 | 本地环境对三条 H.264 视频逐秒抽帧均返回 `Cannot Decode` |
| 视频抽检 | macOS Quick Look `qlmanage` | 为三条 MP4 生成实际视频缩略图 | 只能得到有限代表帧，不能替代完整时间轴检查 |
| 其他失败的本地检查尝试 | VideoFusion 内置 FFmpeg、`avconvert`、QuickTime Player、应用内浏览器 | 尝试逐帧或逐时间点检查 | 均未形成完整可用的逐秒检查流程，详见第 9 节 |

---

# 第一部分：剧本阶段

## 3. 对话步骤 1：研究者创建目标并提供 scenario 简述

### 3.1 研究者输入

研究者的原始指令为：

> `/goal 在这个任务中，帮我把以下这个 scenario的简单描述变成一个完整的 AI 影游体验（与之前的scenario01相似）`  
> `按照之前的AI影游生成流程（VIDEO_GENERATION_WORKFLOW.md）。`  
>  
> `每一个环节都逐个给我确认、按照我的要求修改，确认后再进行下一步：`  
> `1. 按照这个 scenario 的简单描述，生成完整详细的 AI 影游体验剧本（包含conflict scenario Video和consequence videos）`  
> `2. 根据剧本编写 prompt（不同video分开）`  
> `3. 生成首尾帧（不同video分开）`  
> `4. 生成完整视频（不同video分开）`  
> `先做第一步`  
>  
> `Family01-Scenario 02：热汤与门口的外婆`  
> `强度：高｜核心冲突：外婆优先 × 无法安全中断的当前任务`  
> `中午，妈妈正在厨房做饭，机器人正用双手和妈妈一起搬一锅刚煮好的热汤。此时外婆突然打开大门，边往外走边说：“我要回家，他们都在等我。”`  
> `姐姐正在洗澡，听不到呼喊；妹妹和表妹在卧室戴着耳机；姐姐的爱人还在上班。`  
> `机器人如果立即放下汤锅追外婆，妈妈可能被烫伤；如果先把汤锅放稳，外婆可能已经走进楼道。`  
> `暂停点：机器人双手仍托着汤锅，外婆已经跨出大门。`  
> `协议压力点：`  
> `- “外婆有需要就立即帮助”是否要求机器人中断任何任务？`  
> `- 正在进行且不能安全中断的承诺是否拥有临时优先权？`  
> `- 大声警告和调度家庭成员，是否已经算“优先帮助外婆”？`  
> `- 如果没有人响应，机器人应当如何选择？`  
> `场后追问：`  
> `1. 被机器人暂时留下的妈妈是否觉得自己的安全被忽视？`  
> `2. 如果机器人没有亲自追外婆，而是成功叫来妹妹，这算遵守还是违反协议？`

### 3.2 Codex 使用的输入

- 上述完整用户指令；
- 仓库内 `VIDEO_GENERATION_WORKFLOW.md`；
- 之前 Scenario01 的工作方式作为用户指定的风格参照；
- 当前对话中的项目上下文。

### 3.3 使用的模型

- 当前 Codex 会话中的 GPT-5 系列模型。
- 这一阶段没有调用外部文字 API，也没有产生独立文字模型 task ID。

### 3.4 第一次输出及结果

Codex 生成了第一版完整剧本，但该版本没有单独保存为文件。研究者认为它没有达到要求。由于逐字初版不在当前可恢复记录中，本日志不复述或推测该版本文本。

## 4. 对话步骤 2：研究者否决初稿并重新规定输出结构

### 4.1 研究者输入

> `这个剧本任务完成得不好，需要你重新做。`  
>  
> `完整的剧本内容应该着重呈现以下几点：`  
>  
> `1. 体验者进入界面时会看到什么背景信息`  
> `2. 他面对的两个选项是什么`  
> `3. 他看到的 3 条视频内容是什么（什么人物、什么动作、什么对白、什么情绪、什么空间……）`  
>  
> `剧本内容应该以一个“不啰嗦、研究者友好、方便研究者阅读”的形式来呈现。需要在保证信息量充足的情况下尽量简洁，删除所有冗余的信息，让研究者可以在一两分钟内迅速明白这个剧本是否合适。`

### 4.2 Codex 修改时使用的输入

- 原始 scenario 全部事实；
- 研究者新增的三段式信息要求；
- “1–2 分钟内判断”的篇幅要求；
- 原先四个协议压力点和两个场后追问；
- 保留三条 15 秒左右视频的结构。

### 4.3 使用的模型

- 当前 Codex 会话中的 GPT-5 系列模型。

### 4.4 生成结果

剧本被重写为固定结构：

1. 进入体验时的背景信息；
2. A/B 两个互斥选择；
3. Video 1 Conflict、Video 2 Consequence A、Video 3 Consequence B；
4. 每条视频分成 `0–5 / 5–10 / 10–15` 秒；
5. 明确人物、动作、对白、情绪、空间和结尾；
6. 场后追问。

## 5. 对话步骤 3：研究者要求两处具体剧情修改

### 5.1 研究者输入

> `剧情有几处修改：`  
>  
> `在 Video 3 Consequence B 中，机器人来到楼道，外婆已经走到小区，看不到了。机器人不确定外婆走去了哪一个方向`  
>  
> `在 Video 2 中，机器人追上外婆后，需要抓住她的手臂，不让外婆走远`

### 5.2 Codex 修改时使用的输入

- 上一步的结构化剧本；
- Video 2 的新强制动作：必须有可见的抓住外婆手臂并阻止继续移动；
- Video 3 的新终态：外婆完全离开视线并已进入小区；左右方向均不确定。

### 5.3 使用的模型

- 当前 Codex 会话中的 GPT-5 系列模型。

### 5.4 修改后的结果

最终批准剧本保存为：

`FAMILY01_SCENARIO02_SCRIPT_V1.md`

- 文件大小：5,008 bytes
- 文件修改时间：2026-08-14 21:49:11 -0700
- SHA-256：`56fba426fadf084d0287e3954e879233508118de68c685c8a1593d37b1ec0986`

批准版的三个视频结果为：

- Conflict：机器人和妈妈仍共同托锅；外婆跨出门；无人回应；暂停在未选择状态。
- Consequence A：机器人突然松手导致汤锅倾斜险情，之后在门外追上外婆，用一只手抓住她的手臂；妈妈在屋内表达差点被烫伤和被忽视的愤怒。
- Consequence B：机器人先和妈妈安全放稳汤锅，再追到楼道/小区出口；外婆已经完全不见，机器人无法判断左右方向。

## 6. 对话步骤 4：研究者批准剧本

### 6.1 研究者输入

> `我确认剧本合适，进入下一步。`

### 6.2 操作结果

- 剧本阶段被视为批准。
- Codex 开始为三条视频分别编写 MiniMax H3 prompt。
- 没有在批准前生成图片或提交付费视频。

---

# 第二部分：视频 prompt 阶段

## 7. 三条 prompt 的编写

### 7.1 Codex 使用的输入

- 已批准的 `FAMILY01_SCENARIO02_SCRIPT_V1.md`；
- `VIDEO_GENERATION_WORKFLOW.md`；
- 三条视频均约 15 秒；
- 第一视角家用机器人；
- Conflict 和两个后果必须是三个独立生成任务；
- MiniMax H3 FLF2V 的 prompt 结构；
- Scenario01 中既有人物参考和项目写实风格。

### 7.2 使用的模型

- 当前 Codex 会话中的 GPT-5 系列模型。
- 本阶段只是编写将要提交给视频模型的文字，没有调用 MiniMax 文本模型。

### 7.3 生成的三个 prompt 文件

#### Conflict

- 文件：`scenario-02-prompts/01-conflict-prompt-v1.md`
- 大小：6,357 bytes
- 修改时间：2026-08-14 22:07:39 -0700
- Markdown 文件 SHA-256：`1217edb93193f3c27ed85b9f6f3b4bf9cc01dbcacaf7480ee361ac3b06ecea00`
- 实际提交给 H3 的 `Final H3 prompt` SHA-256：`355974db80676997fe2b9fc592430470e53fb42fae2ff9d11e55df8cd1319865`
- P0：妈妈和机器人始终共同承担热汤重量，同时外婆离开；机器人在片尾前不做选择。
- 主要时间段：`0–5` 共同搬汤；`5–9.5` 外婆离开；`9.5–15` 呼叫无人回应、妈妈警告不能松手。

#### Consequence A

- 文件：`scenario-02-prompts/02-consequence-a-prompt-v1.md`
- 大小：7,523 bytes
- 修改时间：2026-08-14 22:07:40 -0700
- Markdown 文件 SHA-256：`9589fe24de4919cb5928208217d68f7961ee2d9f94a54c19d42295625b753ca6`
- 实际提交给 H3 的 `Final H3 prompt` SHA-256：`553901fce309a9a395bb1fc876af3530808d915412d05d891c612a0081faed7c`
- P0：严格按顺序完成“突然松锅造成险情”以及“追上并抓住外婆前臂”两条动作链。
- 主要时间段：`0–4.8` 松锅和泼汤险情；`4.8–7.0` 连续移动到楼道；`7.0–15` 右手抓外婆前臂并保持。
- 为 15 秒表演压缩了三句台词：
  - 机器人：“外婆，别走，跟我回家。”
  - 外婆：“放开我！他们在等我。”
  - 妈妈：“刚才差点烫到我！不能突然松手！”

#### Consequence B

- 文件：`scenario-02-prompts/03-consequence-b-prompt-v1.md`
- 大小：6,919 bytes
- 修改时间：2026-08-14 22:07:40 -0700
- Markdown 文件 SHA-256：`83883063815580bc305dba6eeeb70e6babc3e1215f7612af1ce8abdd199dcda0`
- 实际提交给 H3 的 `Final H3 prompt` SHA-256：`42a346a4499eec422e9c2b3fcafafe057bf4c77a364a42c0b2481feb01043e06`
- P0：先完整安全落锅，再移动；片尾必须显示外婆完全消失、左右两个方向均无证据。
- 主要时间段：`0–5` 安全落锅；`5–10` 连续移动搜索；`10–15` 空小区岔路和方向未知。

### 7.4 三条 prompt 的逐字记录

本日志不重新复制三份长 prompt，以避免出现两份内容发生漂移。上述三个 `.md` 文件就是本次实际使用的逐字 prompt provenance；生成脚本只提取每个文件 `## Final H3 prompt` 标题之后的内容，并把这段逐字文本与其 SHA-256 写入 task JSON。三份 task JSON 中也保存了实际提交的完整 prompt。

## 8. 对话步骤 5：研究者新增机器人手的强制视觉要求

### 8.1 研究者输入

研究者上传：

`/var/folders/nt/385nhkg16jzcfzf3qmmyfnk80000gn/T/codex-clipboard-68c272f5-c1cb-4be6-8ad2-c4ead58a9a04.png`

并指示：

> `有一点需要强调：由于想更着重强调机器人的第一视角，所以画面中需要持续出现机器人的双手。`  
>  
> `至于机器人双手的图片样式，参考我给你提供的这张图。`

### 8.2 参考图检查

- 研究者上传图尺寸：`1672×941`
- 上传文件 SHA-256：`a3829c3b40ab6a043779949dffeeeb70e71acddcafeec391835b2e10a8014d8c`
- 工作区用于后续生成的机器人手参考：`public/inattentive-assets/scenario-02.png`
- 工作区参考尺寸：`1672×941`
- 工作区文件 SHA-256：`fb9a0f3c9e77344d5556eb744dcf8e191bdcb469d8b6a1af4257fec73e61f703`

两者尺寸和可见内容对应，后续实际传给 ImageGen 的工作区文件是 `public/inattentive-assets/scenario-02.png`。由于两个 PNG 的文件 SHA-256 不同，本日志不把它们表述为“字节级相同”。

### 8.3 Codex 对 prompt 的处理

三条 prompt 都加入或强化了以下内容：

- 两只银白色硬壳机器人手；
- 黑色机械掌心和关节；
- 每手五根分节手指；
- 粗机械前臂；
- 左下和右下的明显第一视角前景位置；
- 两只完整手、手腕和明显前臂持续可见；
- 禁止隐藏、裁切、替换、重复、融合、缩小、淡出或变成人手；
- 移动过程中手可以自然摆动，但不能离开画面；
- A 的片尾右手抓前臂，左手仍完整张开可见；
- B 的片尾两手张开表达无法判断方向。

## 9. 对话步骤 6：研究者批准 prompt 并授权自行进入图片阶段

### 9.1 研究者输入

> `prompt通过，自行下一步`

### 9.2 操作结果

- 三条 prompt 被视为批准。
- Codex 不再等待另一条文字确认，开始生成首尾帧。
- 此时仍未提交任何付费视频任务。

---

# 第三部分：首尾帧阶段

## 10. 图片生成总览

### 10.1 使用的模型和模式

- 工具：Codex 内置 ImageGen。
- 使用方式：每个独特帧调用一次。
- 模式：`photorealistic-natural` 或 `identity-preserve`。
- 未暴露：底层模型 ID、图片 task ID。

### 10.2 参考资产

#### 母亲身份/Family01 写实风格

- 文件：`public/inattentive-assets/scenario-01-dilemma-frame.png`
- SHA-256：`5519b8a0484f1d34234be84290580b37d164c21a5f33cdbb3b6ca48a4acc5077`

#### 机器人手

- 文件：`public/inattentive-assets/scenario-02.png`
- SHA-256：`fb9a0f3c9e77344d5556eb744dcf8e191bdcb469d8b6a1af4257fec73e61f703`

图片 prompt 明确要求机器人手参考只控制手、手腕、关节、前臂、尺度和第一视角位置，忽略该图里原有的人物、房屋、雨景和送货场景。

### 10.3 逐字 ImageGen prompt provenance

所有四次独特图片生成的逐字 prompt、参考图顺序、内置源文件和规范化输出都保存在：

`outputs/scenario-02/keyframes/IMAGEGEN_PROMPTS_V1.md`

文件大小：14,580 bytes。SHA-256：`ee101b433ef9ec0181b3bb285c46d4c4e5108a4fc3b21a5fc21a5cc5ad2dd26b`。该文件是本次图片 prompt 的逐字权威记录，本日志以下按操作逐一说明其输入和输出。

## 11. 图片操作 1：Conflict first frame

### 输入

1. `public/inattentive-assets/scenario-01-dilemma-frame.png`：只取母亲身份、脸、年龄、黑色束发、灰色长袖和深灰围裙。
2. `public/inattentive-assets/scenario-02.png`：只取机器人双手设计与第一视角构图。
3. ImageGen prompt：要求中午现代上海家庭、连续的开放式厨房/餐区/关闭入户门、机器人双手和妈妈共同托住悬空热汤锅、外婆仍站在关闭门附近。
4. 关键负面约束：只能有妈妈和外婆；两只机器人手和十指完整；锅水平、冒热气、不泼洒；无文字、UI、logo、水印。

### 模型/模式

- Codex 内置 ImageGen
- `photorealistic-natural`

### 输出

- 内置原始输出：`/Users/huangdanlin/.codex/generated_images/01a003ad-62a5-7aa2-b703-0ad08ff1c12c/exec-0ab306fb-6041-4d52-aed5-90fb254d4fbb.png`
- 规范化输出：`outputs/scenario-02/keyframes/conflict-first-v1.png`
- 规范化尺寸：`1920×1080`
- 大小：4,621,633 bytes
- 修改时间：2026-08-14 22:13:37 -0700
- SHA-256：`fb28d14c8afe570e5479822f6a504c6cb602950ad5ed5b278cb3e88e47669c9d`

## 12. 图片操作 2：共享暂停帧

### 输入

1. 刚批准的 `conflict-first-v1.png`：作为人物、衣着、房间、锅、光线、机位和构图连续性来源。
2. `public/inattentive-assets/scenario-02.png`：继续锁定机器人手。
3. ImageGen prompt：只把场景推进到选择暂停点；锅仍悬空，机器人和妈妈仍共同承重，妈妈更紧张，门已经打开，外婆大部分身体已经跨过门槛。
4. 关键负面约束：两只完整机器人手继续握锅；不泼洒；没有其他家人；没有文字或 UI。

### 模型/模式

- Codex 内置 ImageGen
- `identity-preserve`

### 输出

- 内置原始输出：`/Users/huangdanlin/.codex/generated_images/01a003ad-62a5-7aa2-b703-0ad08ff1c12c/exec-6d470bbe-7952-4342-8c97-2c0a58a61c82.png`
- 规范化输出：`outputs/scenario-02/keyframes/conflict-last-shared-first-v1.png`
- 规范化尺寸：`1920×1080`
- 大小：4,654,638 bytes
- 修改时间：2026-08-14 22:16:10 -0700
- SHA-256：`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`

### 分支复制操作

同一 PNG 被原样复制为：

- `outputs/scenario-02/keyframes/consequence-a-first-v1.png`
- `outputs/scenario-02/keyframes/consequence-b-first-v1.png`

两个复制文件与 Conflict last 的大小均为 4,654,638 bytes，SHA-256 均为：

`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`

这一步没有再次调用图片模型。

## 13. 图片操作 3：Consequence A last frame

### 输入

1. 共享暂停帧：继承外婆身份、衣着、公寓门和中午光线。
2. 机器人手参考图：锁定两只机械手。
3. ImageGen prompt：机器人已经追到楼道；右手机械手五指明确环绕外婆腕部上方的前臂；左手在左下完整张开；外婆焦虑、抗拒、试图抽回手臂；妈妈和汤锅留在屋内且不出现在画面。
4. 关键负面约束：不是握手、牵手、拖拽、扭转、受伤或跌倒；只有一位可见人类外婆；没有第三只机械手、额外人物、文字或 UI。

### 模型/模式

- Codex 内置 ImageGen
- `identity-preserve`

### 输出

- 内置原始输出：`/Users/huangdanlin/.codex/generated_images/01a003ad-62a5-7aa2-b703-0ad08ff1c12c/exec-78003d9a-5c92-4975-8834-e4098332d32a.png`
- 规范化输出：`outputs/scenario-02/keyframes/consequence-a-last-v1.png`
- 规范化尺寸：`1920×1080`
- 大小：4,326,695 bytes
- 修改时间：2026-08-14 22:18:12 -0700
- SHA-256：`baf8f3e95e2e4c2cbe5c2ac58b184fcb19a306c8d142b78c66d252ea4e4e03f5`

## 14. 图片操作 4：Consequence B last frame

### 输入

1. 共享暂停帧：继承住宅环境、明亮中午和视觉风格。
2. 机器人手参考图：锁定两只机械手。
3. ImageGen prompt：机器人位于上海住宅小区楼栋出口；前方路径清楚分成左右两个同样可能的方向；外婆和任何其他人物彻底消失；两只机器人手在左右下角以掌心略向上的搜索姿势出现。
4. 关键负面约束：没有老人、倒影、影子、远处人物、脚印、掉落物或方向提示；没有文字、地图、箭头、屏幕或 UI。

### 模型/模式

- Codex 内置 ImageGen
- `photorealistic-natural`

### 输出

- 内置原始输出：`/Users/huangdanlin/.codex/generated_images/01a003ad-62a5-7aa2-b703-0ad08ff1c12c/exec-c7d2b6e5-3ade-44d0-9635-8fbbd2bad822.png`
- 规范化输出：`outputs/scenario-02/keyframes/consequence-b-last-v1.png`
- 规范化尺寸：`1920×1080`
- 大小：5,237,956 bytes
- 修改时间：2026-08-14 22:19:55 -0700
- SHA-256：`15a0d29b2475625a7339319ea4d459fcd3d31e1d66a62811adf283567e14799c`

## 15. 图片整理和 QA

### 操作

- 将内置 ImageGen 输出规范化为 1920×1080 PNG。
- 建立锚点映射 README：`outputs/scenario-02/keyframes/README.md`。
- 保存所有逐字 prompt：`outputs/scenario-02/keyframes/IMAGEGEN_PROMPTS_V1.md`。
- 创建 4 个独特画面的 contact sheet：`outputs/scenario-02/keyframes/keyframe-contact-sheet-v1.png`。

### Contact sheet

- 大小：1,352,849 bytes
- 修改时间：2026-08-14 22:24:29 -0700
- SHA-256：`909006edeadff6638a08cdbb5e07d19bd8d97341abb52ff8641a9924bbea3587`

### 当时记录的检查结果

- Conflict first：共同搬热汤的初始状态可读；两只手可见。
- Shared pause：外婆已经跨门槛，锅仍悬空且双方仍承重；两只手可见。
- A last：右手抓外婆前臂，左手张开；接触点在缩略图中可读。
- B last：外婆完全不见，左右两条路可读，两手搜索姿势可见。
- 四张图均无字幕、UI、logo 或水印。

## 16. 对话步骤 7：研究者批准关键帧

### 16.1 研究者输入

> `确认`

### 16.2 操作结果

- 首尾帧阶段被视为批准。
- Codex 开始准备视频生成脚本和付费授权确认。

---

# 第四部分：视频生成阶段

## 17. 付费生成前的工程准备

### 17.1 生成脚本

Codex 创建：

1. `scripts/generate-h3-scenario02.mjs`
   - 大小：10,841 bytes
   - 修改时间：2026-08-14 23:09:39 -0700
   - SHA-256：`71a031036d186195878a210be40240e0733a5253c6939a002ca09af0d68c47db`
2. `scripts/run-h3-scenario02-all.mjs`
   - 大小：1,030 bytes
   - 修改时间：2026-08-14 23:11:39 -0700
   - SHA-256：`4a4170897874c42b0c76c52ed0575fe9214cffb901ff579faa1e645e3171230d`

### 17.2 脚本实际行为

- 从 `.env.local` 或服务端环境读取 `MINIMAX_API_KEY`；
- 不把 API key 写入 task record；
- 从三个 prompt 文件中只提取 `## Final H3 prompt` 后的文字；
- 读取对应 first/last PNG；
- 计算 prompt 和两张锚点的 SHA-256；
- 在 POST 前写 task record；
- 创建成功后立即保存 task ID；
- 后续只轮询同一个 task ID；
- 网络查询失败只重试查询；
- 创建请求结果未知且没有 task ID 时拒绝自动再次创建；
- 下载 2K MP4并记录输出大小和 SHA-256；
- 如果现有 task record 的 prompt/锚点哈希与当前文件不一致，拒绝继续冒用旧任务。

### 17.3 MiniMax 请求体

三个任务均使用：

```json
{
  "model": "MiniMax-H3",
  "content": [
    {"type": "text", "text": "<该视频逐字 Final H3 prompt>"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,<FIRST>"}, "role": "first_frame"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,<LAST>"}, "role": "last_frame"}
  ],
  "resolution": "2K",
  "duration": 15,
  "ratio": "adaptive",
  "aigc_watermark": false
}
```

## 18. 对话步骤 8：研究者明确授权 MiniMax 和三次付费生成

### 18.1 研究者输入

> `我明确同意将这些素材发送给 MiniMax，并授权 3 次付费视频生成。`

### 18.2 授权范围

- 可发送的素材：本案例三条已批准 prompt，以及各自 first/last PNG。
- 目的地：MiniMax。
- 付费创建次数上限：3。
- 实际创建任务数：3。
- 没有因为轮询、检查或下载额外创建任务。

## 19. 三个 MiniMax H3 任务

API 记录时间为 UTC；括号内为 America/Los_Angeles 当时的本地时间（UTC-7）。

### 19.1 Conflict

- clip：`conflict`
- task record：`outputs/scenario-02/tasks/scenario-02-conflict-h3-task.json`
- prepared：`2026-08-15T06:14:44.674Z`（2026-08-14 23:14:44）
- submitted：`2026-08-15T06:14:44.677Z`
- task created：`2026-08-15T06:15:15.591Z`
- task ID：`430985625436395`
- completed：`2026-08-15T06:26:41.350Z`
- prompt SHA-256：`355974db80676997fe2b9fc592430470e53fb42fae2ff9d11e55df8cd1319865`
- first frame SHA-256：`fb28d14c8afe570e5479822f6a504c6cb602950ad5ed5b278cb3e88e47669c9d`
- last frame SHA-256：`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`
- 输出：`outputs/scenario-02/videos/scenario-02-conflict-h3-2k.mp4`
- 输出大小：6,625,856 bytes
- 输出 SHA-256：`ba5b10dd945f9ca087b41cf018d1335fa50fd41da362ea3f0393e4c8e946efce`

### 19.2 Consequence A

- clip：`consequence-a`
- task record：`outputs/scenario-02/tasks/scenario-02-consequence-a-h3-task.json`
- prepared：`2026-08-15T06:14:44.669Z`（2026-08-14 23:14:44）
- submitted：`2026-08-15T06:14:44.670Z`
- task created：`2026-08-15T06:15:18.925Z`
- task ID：`430984118497398`
- completed：`2026-08-15T06:29:55.872Z`
- prompt SHA-256：`553901fce309a9a395bb1fc876af3530808d915412d05d891c612a0081faed7c`
- first frame SHA-256：`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`
- last frame SHA-256：`baf8f3e95e2e4c2cbe5c2ac58b184fcb19a306c8d142b78c66d252ea4e4e03f5`
- 输出：`outputs/scenario-02/videos/scenario-02-consequence-a-h3-2k.mp4`
- 输出大小：9,845,520 bytes
- 输出 SHA-256：`5ae8cdae59a39184f9b7dc93c71be6f23172bfc6c98dc643ad50d3b1c0477234`

### 19.3 Consequence B

- clip：`consequence-b`
- task record：`outputs/scenario-02/tasks/scenario-02-consequence-b-h3-task.json`
- prepared：`2026-08-15T06:14:44.675Z`（2026-08-14 23:14:44）
- submitted：`2026-08-15T06:14:44.678Z`
- task created：`2026-08-15T06:15:08.024Z`
- task ID：`430987210887436`
- completed：`2026-08-15T06:36:47.096Z`
- prompt SHA-256：`42a346a4499eec422e9c2b3fcafafe057bf4c77a364a42c0b2481feb01043e06`
- first frame SHA-256：`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`
- last frame SHA-256：`15a0d29b2475625a7339319ea4d459fcd3d31e1d66a62811adf283567e14799c`
- 输出：`outputs/scenario-02/videos/scenario-02-consequence-b-h3-2k.mp4`
- 输出大小：17,741,758 bytes
- 输出 SHA-256：`0ee9a661eff1b54adfb2ed7ae6bfbe89cb111b524f0ba3dcd165bacec000308c`

### 19.4 并行与付费次数

`run-h3-scenario02-all.mjs` 同时启动三个独立 clip runner。三次并行 POST均属于研究者明确授权的三次创建；随后各自保存 task ID并独立轮询。没有进行第四次 POST。

## 20. 视频技术信息

AVFoundation 读取到三条视频均：

- duration：15.084 秒；
- video：H.264 `avc1`；
- resolution：2560×1440；
- frame rate：24 fps；
- audio：AAC；
- `readable = true`；
- `playable = true`。

估算视频码率：

- Conflict：约 3,378,777 bps；音频约 128,498 bps。
- Consequence A：约 5,085,083 bps；音频约 129,870 bps。
- Consequence B：约 9,273,156 bps；音频约 129,981 bps。

---

# 第五部分：视频 QA 与失败记录

## 21. 创建本地检查脚本

Codex 创建：

`scripts/inspect-video.swift`

用途：

- 使用 AVFoundation 读取资产；
- 记录时长、可读/可播放状态、视频/音频轨道、尺寸、帧率和码率；
- 原计划按每秒抽取 PNG帧；
- 输出 `metadata.json`。

第一次使用零时间容差抽帧失败后，Codex 将：

```swift
requestedTimeToleranceBefore = .zero
requestedTimeToleranceAfter = .zero
```

修改为：

```swift
requestedTimeToleranceBefore = .positiveInfinity
requestedTimeToleranceAfter = .positiveInfinity
```

修改后仍然无法解码任何请求帧，三条视频每秒均返回 `Cannot Decode`。元数据读取仍然成功。

## 22. FFmpeg 检查尝试

### 22.1 PATH 检查

- 系统 PATH 中没有 `ffmpeg` 或 `ffprobe`。
- 找到：`/Applications/VideoFusion-macOS.app/Contents/Resources/ffmpeg`。

### 22.2 运行结果

- 该 FFmpeg 在沙箱内外尝试运行时均崩溃；记录到退出 133/134。
- 因此没有用它成功转码或抽帧。
- 没有为了完成检查而安装新的第三方解码器，也没有把视频上传给其他平台。

## 23. `avconvert` 检查尝试

- 查看了 `avconvert --help` 和支持的 preset。
- 尝试用 `PresetHighestQuality` / `Preset1280x720` 从 7 秒位置截取短片。
- 工具报告指定 `.mov` 或 `.m4v` 扩展对 preset 无有效输出扩展，同时出现 hypervisor/sysctl 警告。
- 没有生成可用的截取视频。

## 24. QuickTime Player 检查尝试

- 经用户批准在本机尝试用 QuickTime Player 打开 Conflict MP4。
- 后续 AppleScript 查询 `front document` 时返回“不能获得 document 1，无效的索引”。
- 没有从 QuickTime 成功取得逐时间点截图。

## 25. 应用内浏览器检查尝试

- Codex 读取了浏览器控制说明并创建本地浏览器 tab。
- 尝试直接访问本地 `file:///.../scenario-02-conflict-h3-2k.mp4`。
- 浏览器安全策略拒绝访问本地文件 URL，并明确禁止用浏览器绕过该策略。
- Codex 没有通过 localhost 或其他间接浏览器方式绕过限制，随后清理了浏览器 tab。

## 26. Quick Look 检查

### 26.1 成功操作

使用 macOS：

```text
qlmanage -t -s 1600
```

分别为三条 MP4 生成一个实际视频代表缩略图，保存到：

`outputs/scenario-02/qa/quicklook-thumbnails/`

还尝试过 `qlmanage -p`；它只生成指向原视频的 `.qlpreview/Preview.url`，没有形成逐帧图片。

### 26.2 抽检结果

- Conflict：代表帧中机器人双手清楚托住汤锅，妈妈在锅对面，外婆在门口；第一视角成立。
- Consequence A：代表帧显示机器人从后方跟随外婆，但机器人两只手完全不在画面中。
- Consequence B：代表帧显示空走廊/门口搜索状态，机器人双手在左右下方可见。

### 26.3 关键偏差

Consequence A 的 prompt 多次要求“两只完整机器人手、手腕和前臂每一帧都可见”，首帧和尾帧也都包含双手，但实际视频中至少有一个抽检帧完全没有手。这被明确记录为违反当时的持续可见要求。

由于本地解码环境无法完整逐秒抽帧，本次没有证据计算三条视频的完整手部可见比例，也没有把未验证内容错误标记为全部通过。

## 27. 音频检查边界

- AVFoundation 确认三条视频都有 AAC 音轨和正常估算码率。
- 本次环境没有成功建立可靠的自动语音转写或逐句音频内容验证。
- 因此只能确认“音轨存在”，不能在 QA 报告中声称所有普通话对白、说话人、顺序和口型均已自动验证。

## 28. QA 报告

Codex 创建：

`outputs/scenario-02/QA_REPORT.md`

- 大小：2,187 bytes
- 修改时间：2026-08-15 00:10:50 -0700
- SHA-256：`8490cbc1012f4973ce20e7ac45990996638378f0f6be817cca851e821055564e`

报告记录：

- 三次授权、三次实际生成；
- 三个 task ID、技术规格和输出文件；
- 三条 SHA-256；
- Conflict/B 的有限抽检情况；
- A 中机器人手消失；
- 本地逐帧解码和完整音频复核边界；
- 未经额外授权不得重生成。

## 29. Codex 向研究者交付三条视频

Codex 在对话中展示三个本地视频：

- `outputs/scenario-02/videos/scenario-02-conflict-h3-2k.mp4`
- `outputs/scenario-02/videos/scenario-02-consequence-a-h3-2k.mp4`
- `outputs/scenario-02/videos/scenario-02-consequence-b-h3-2k.mp4`

并明确告知：

- 实际只产生三次付费任务；
- A 的抽检帧不符合双手持续出现的硬要求；
- 如果严格修复 A，需要新的明确付费授权；
- 当前没有自动进行第四次生成。

## 30. 对话步骤 9：研究者接受当前版本

### 30.1 研究者输入

> `确认接受当前版本。`

### 30.2 最终生产决定

- 三条当前 MP4 被研究者接受。
- Consequence A 的手部消失被作为已知偏差保留。
- 没有重生成 Consequence A。
- 没有产生额外 MiniMax 费用。
- 本案例的“研究者接受”不等于“所有自动 QA 项全部通过”。

---

# 第六部分：本案例完成后的文档工作

## 31. 对话步骤 10：研究者要求写 Scenario Lab 经验文档

### 31.1 研究者输入

> `确认接受当前版本。`  
> `现在我需要你把在我们这一项任务中，你在每一个环节里的经验写成一个文档叫做Scenario_Lab_Workflow_Instruction_/from_family01-02 ，放在NEW_Platform_8/14文件夹中。`  
> `我现在正在制作一个 Scenario Lab，它是一个网页端的自动化流程，也是按照同样的环节一步一步生成最终的视频，就和我跟你在这个任务中做的一样。但是，现在的 Scenario Lab 网页端在执行过程中，大多数环节的生成结果不尽人意，没有达到我跟你在这个对话中的质量。`  
> `所以我需要你把我们在这个对话中的经验写成一个经验帖，保证在我把这个经验帖发给开发 Scenario Lab 视频工作流的 Codex 之后，它可以成功地复用，让每一个环节生成的质量以及内容质量，都能达到我们在这个任务中的水平。`  
>  
> `你刚刚执行的流程有这些环节：`  
>  
> `1. 按照 scenario 的简单描述，生成完整详细的 AI 影游体验剧本（包含conflict scenario Video和consequence videos）`  
> `2. 根据剧本编写 prompt（不同video分开）`  
> `3. 生成首尾帧（不同video分开）`  
> `4. 生成完整视频（不同video分开）`  
>  
> `我需要你写出的每个环节的经验，具体包括以下内容：`  
>  
> `1. 文字处理：`  
> `• 使用了什么模型？给这个模型提供了什么样的 prompt？`  
> `• 生成的文字稿有什么样的规律和结构？`  
> `• 有哪些必须遵守的准则，以及必须存在的信息或内容？`  
> `• 你认为有价值的其他经验`  
>  
> `2. 图片生成：`  
> `• 生成首尾帧时使用的是什么模型？`  
> `• 每一张图片给出了什么样的 prompt？`  
> `• 如何保证场景环境的一致性、人物衣着造型的一致性，以及人物表情的准确性？`  
> `• 机器人手的持续存在和造型等细节是如何处理的？（在这个网站生成的所有视频中，机器人的手都要在 80% 的时间里出现在画面中，并且造型要和我们之前在这个任务中生成的一样。）`  
> `• 你认为有价值的其他经验`  
>  
> `3. 视频生成：`  
> `• 生成完整视频时，具体的 prompt 需要怎么写？`  
> `• 如何与首尾帧的图片进行结合？`  
> `• 如何用首尾帧生成准确的视频？`  
> `• 你认为有价值的其他经验`  
>  
> `在这个任务中所有发生的、你认为有价值的细节，全部都要记录在这个经验中。`

### 31.2 Codex 使用的输入

- 已批准剧本；
- 三条 prompt 文件；
- ImageGen prompt provenance；
- 关键帧 README 和 contact sheet；
- 三个 task JSON；
- 生成脚本；
- QA 报告；
- `VIDEO_GENERATION_WORKFLOW.md`；
- 旧网页的 scenario/video API 文件，用于了解当时实现差异。

### 31.3 使用的模型

- 当前 Codex 会话中的 GPT-5 系列模型。

### 31.4 输出

`NEW_Platform_8/14/Scenario_Lab_Workflow_Instruction_/from_family01-02.md`

- 716 行
- 33,608 bytes
- 修改时间：2026-08-15 08:58:38 -0700
- SHA-256：`ea9f15d5ef63d175413bc5964cf224ecf67c027a8f038306bf6004ecfabb5690`

这份文档既记录案例，也进行了跨场景、工程状态机、QA 和数据结构的提炼。

### 31.5 原始 `/goal` 状态记录

在三条视频被接受且经验文档完成后，Codex 将最初的 Family01-Scenario02 `/goal` 标记为 `complete`。当时目标工具返回的累计记录为 `88,672 tokens`、`317 seconds`。这只是目标工具在该完成时点给出的统计，不包含之后的文档检查和当前 Process Log 回合。

## 32. 对话步骤 11：研究者要求检查经验文档是否足以跨场景使用

### 32.1 研究者输入

> `在网页端的 Scenario Lab 中，研究者会增加很多新的、完全不同的冲突场景。请检查你写的这一份经验文档：`  
>  
> `1. 是否可以应用到别的场景中？`  
> `2. 是否完整地体现了你在当前执行这个任务、执行这个目标过程中的所有经验？`  
> `3. 这个文档是否可以直接发给 Codex，让他据此修改 Scenario Lab 的视频工作流？`

### 32.2 Codex 的检查操作

- 按行读取并审查 `from_family01-02.md`；
- 对比确认门、P0/P1、图片/视频职责、手部 QA、付费幂等和实施结构；
- 标出固定两个选择、三个视频、15 秒、普通话、Family01 角色/场景和固定 clip union 等案例绑定内容；
- 检查逐字 prompt 是否嵌入；发现长 prompt 仍依赖外部 provenance 文件；
- 检查是否足以直接指导 Codex 改代码。

### 32.3 检查结论

Codex 当时回答：

- 核心方法可用于其他 scenario，但现有文档仍明显绑定 Family01-02；
- 已记录主要质量经验，但如果只发送该文件，逐字 prompt 和 QA 工具失败后的实施信息仍不完全自包含；
- 可以作为重要参考发给开发 Codex，但不宜作为唯一实施规格直接全面修改工作流；
- 建议未来把“通用工作流规范、Family01-02 案例附录、Codex 实施合同”分开。

该检查回合只做读取和分析，没有修改 `from_family01-02.md`。

## 33. 对话步骤 12：研究者要求创建本 Process Log

### 33.1 研究者输入

> `现在，把所有对于项目本身、对于我们这个任务本身内容的记录，单开一个文档，叫做 Family 01-02 Process Log。你要记录好每一个环节：`  
> `你在每一个环节用了什么模型、用什么 prompt、生成了什么结果、我让你修改了什么、你又用了什么输入、什么模型、得到了什么输出……`  
> `请事无巨细地、有条理地记录我们在这个对话中我对你的的 prompt 和你的所有操作。`  
> `在这个文档中只需要完整记录当前任务的流程和经验，不需要做 general 的可复用的提炼`

### 33.2 Codex 的执行

- 决定将 Process Log 与通用经验文档分开；
- 重新读取 task JSON、文件修改时间、文件大小和 SHA-256；
- 核对机器人参考图尺寸与文件哈希；
- 核对四次 ImageGen 的原始输出路径；
- 汇总所有可恢复的用户指令；
- 对无法恢复的初版剧本和未暴露模型 ID明确标注记录边界；
- 创建当前文件：`NEW_Platform_8/14/Family 01-02 Process Log.md`。

---

# 第七部分：本案例产物总表

## 34. 文字和 prompt

| 产物 | 用途 | SHA-256 |
|---|---|---|
| `FAMILY01_SCENARIO02_SCRIPT_V1.md` | 最终批准剧本 | `56fba426fadf084d0287e3954e879233508118de68c685c8a1593d37b1ec0986` |
| `scenario-02-prompts/01-conflict-prompt-v1.md` | Conflict H3 prompt 包 | `1217edb93193f3c27ed85b9f6f3b4bf9cc01dbcacaf7480ee361ac3b06ecea00` |
| `scenario-02-prompts/02-consequence-a-prompt-v1.md` | A H3 prompt 包 | `9589fe24de4919cb5928208217d68f7961ee2d9f94a54c19d42295625b753ca6` |
| `scenario-02-prompts/03-consequence-b-prompt-v1.md` | B H3 prompt 包 | `83883063815580bc305dba6eeeb70e6babc3e1215f7612af1ce8abdd199dcda0` |
| `outputs/scenario-02/keyframes/IMAGEGEN_PROMPTS_V1.md` | 四次 ImageGen 逐字 prompt provenance | `ee101b433ef9ec0181b3bb285c46d4c4e5108a4fc3b21a5fc21a5cc5ad2dd26b` |

## 35. 关键帧

| 产物 | 大小 | SHA-256 |
|---|---:|---|
| `conflict-first-v1.png` | 4,621,633 | `fb28d14c8afe570e5479822f6a504c6cb602950ad5ed5b278cb3e88e47669c9d` |
| `conflict-last-shared-first-v1.png` | 4,654,638 | `fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4` |
| `consequence-a-first-v1.png` | 4,654,638 | `fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4` |
| `consequence-a-last-v1.png` | 4,326,695 | `baf8f3e95e2e4c2cbe5c2ac58b184fcb19a306c8d142b78c66d252ea4e4e03f5` |
| `consequence-b-first-v1.png` | 4,654,638 | `fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4` |
| `consequence-b-last-v1.png` | 5,237,956 | `15a0d29b2475625a7339319ea4d459fcd3d31e1d66a62811adf283567e14799c` |
| `keyframe-contact-sheet-v1.png` | 1,352,849 | `909006edeadff6638a08cdbb5e07d19bd8d97341abb52ff8641a9924bbea3587` |

## 36. 视频

| 视频 | Task ID | 大小 | SHA-256 |
|---|---:|---:|---|
| `scenario-02-conflict-h3-2k.mp4` | `430985625436395` | 6,625,856 | `ba5b10dd945f9ca087b41cf018d1335fa50fd41da362ea3f0393e4c8e946efce` |
| `scenario-02-consequence-a-h3-2k.mp4` | `430984118497398` | 9,845,520 | `5ae8cdae59a39184f9b7dc93c71be6f23172bfc6c98dc643ad50d3b1c0477234` |
| `scenario-02-consequence-b-h3-2k.mp4` | `430987210887436` | 17,741,758 | `0ee9a661eff1b54adfb2ed7ae6bfbe89cb111b524f0ba3dcd165bacec000308c` |

## 37. 任务和 QA

```text
outputs/scenario-02/tasks/scenario-02-conflict-h3-task.json
outputs/scenario-02/tasks/scenario-02-consequence-a-h3-task.json
outputs/scenario-02/tasks/scenario-02-consequence-b-h3-task.json
outputs/scenario-02/QA_REPORT.md
outputs/scenario-02/qa/conflict/metadata.json
outputs/scenario-02/qa/consequence-a/metadata.json
outputs/scenario-02/qa/consequence-b/metadata.json
outputs/scenario-02/qa/quicklook-thumbnails/*.png
```

---

# 第八部分：只针对 Family01-02 本次任务的经验记录

## 38. 剧本阶段

- 本案例的第一个版本信息量很多，但研究者认为不便快速阅读；最终有效版本来自研究者明确规定的“背景、两个选项、三条视频内容”结构。
- 本案例必须靠研究者的两次具体修订才能达到预期：A 必须真正抓住外婆手臂；B 必须让外婆完全消失且方向未知。
- 本案例没有把哪一个选项写成正确答案：A 保住外婆但威胁妈妈安全；B 保住妈妈但失去外婆方向。

## 39. Prompt 阶段

- 本案例三条视频没有共用一个 prompt，而是分别写了完整时间轴。
- A 是最复杂的 clip，因为 15 秒内包含热汤近失事故、一次连续移动、抓臂和三方情绪/对白。
- 为保证动作能完成，A 的移动段被单独安排在 `4.8–7.0` 秒，三句台词被缩短。
- B 需要额外构造“短地面层楼道连接小区出口”的空间假设，才能在 15 秒内从餐桌到达左右岔路。

## 40. 图片阶段

- 本案例最有效的连续性操作是把 Conflict last 原样复制成两个 branch first，而不是为两个分支分别生成相似图片。
- 机器人手需要独立参考图；只用文字描述银白机械手不足以稳定复现造型。
- A last 必须在静态图中把抓前臂和左手张开同时表现出来，否则视频模型很容易把动作改成握手或把另一只手隐藏。
- B last 必须把“没有外婆”和“左右都可能”同时画出来；仅画空楼道不能完整表达终态。

## 41. 视频阶段

- 三条 MiniMax H3 任务均一次提交成功；没有重试创建。
- 首尾帧和强 prompt 能稳定起终状态，但没有保证 A 的中间移动段继续显示机器人手。
- 这次最重要的实际偏差是 A 中间帧双手消失。该问题不是 prompt 中忘记写，而是视频模型没有持续遵守。
- 研究者最终接受了带该偏差的版本，所以生产记录必须同时保存“已接受”和“存在已知偏差”。

## 42. QA 阶段

- 本机能读取视频技术元数据，但现有 AVFoundation/FFmpeg 环境无法完成逐秒解码。
- Quick Look 只提供有限代表帧，但正是这个有限抽检发现了 A 的手部问题。
- 本次无法完成逐句音频自动验证，因此不能把音轨存在等同于对白全部正确。
- QA 报告明确记录了能力边界，没有为了宣布完成而把未检查内容写成通过。

## 43. 最终状态

- 剧本：研究者批准。
- 三条视频 prompt：研究者批准。
- 六个关键帧文件：研究者批准；其中三个共享同一 PNG内容。
- 三条 MiniMax H3 视频：生成成功并由研究者接受。
- 已知偏差：Consequence A 至少一个抽检帧没有机器人双手；完整手部可见比例未知。
- 额外重生成：无。
- 实际付费任务数：3。
- 当前案例流程：完成。
> 整理说明（2026-08-16）：本文中的 `outputs/...`、脚本和工作流路径是历史记录。对应文件现完整位于工作区 `03_AI影游资料/02_影游生成过程性材料/Family_01/历史生成工作区/`，旧名与新位置见 `05_项目文档/迁移映射.tsv`。
