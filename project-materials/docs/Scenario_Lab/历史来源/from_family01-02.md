# Scenario Lab 工作流实施经验：from Family01-Scenario02

> 用途：交给开发 Scenario Lab 视频工作流的 Codex，作为可直接实施的生成规范。  
> 案例：Family01-Scenario02「热汤与门口的外婆」。  
> 结论来源：本次真实完成的剧本、提示词、首尾帧、3 次 MiniMax H3 生成及生成后 QA；不是理想化流程。  
> 最重要的目标：每一步都先产出可审查的中间结果，由研究者确认后才进入下一步；不能把“生成成功”误当作“内容合格”。

## 0. 先说结论：本次质量为什么高于网页端的一键生成

本次效果主要来自以下组合，而不是单纯把 prompt 写得更长：

1. 先把简单 scenario 编译成**研究者能在 1–2 分钟读懂的三视频剧本**，明确背景、两个选择、人物、空间、动作、对白、情绪、暂停点和两种代价。
2. 每条视频独立建立 `P0/P1 + 3 个时间段 + 声音 + HARD INVARIANTS`，没有共用泛化视频 prompt。
3. 首尾帧不是装饰图，而是 FLF2V 的**状态锚点**：图片负责人物、衣着、房间、构图和机器人手；视频 prompt 负责动作、时间、声音和状态变化。
4. Conflict 的最后一帧被**字节级复用**为两个 consequence 的第一帧，消除分支瞬间的人物跳变。
5. 机器人手使用独立的全局参考图，并在图片、视频 prompt 和 QA 三层重复约束。
6. 付费生成前先确认模型、时长、分辨率和任务数量；提交后保存 task ID，只轮询同一任务，避免因网络波动重复付费。
7. 生成后做内容 QA。真实案例中 Consequence A 尽管 prompt 多次要求双手持续可见，抽检帧里双手仍完全消失。这证明**prompt 不是验收机制**；Scenario Lab 必须独立计算手部可见率并允许拒绝/重试。

## 1. 本次实际使用的模型与参数

### 1.1 文字

- 使用：本次 Codex 会话中的 GPT-5 系列模型。
- 限制：会话未暴露更细的部署 model ID，因此不要伪造具体小版本。
- 工作方式：不是一次 one-shot；先生成剧本，研究者指出“过于啰嗦、研究者不易快速阅读”，随后按固定结构重写；研究者又明确修改 B 的消失结果和 A 的抓臂动作，确认后才进入提示词阶段。
- 对 Scenario Lab 的建议：用当前可用的高质量推理/写作模型，低到中等随机性；要求结构化 JSON，再由前端渲染成研究者友好的视图。模型名应成为任务记录字段，不应写死在展示文本中。

### 1.2 图片

- 使用：Codex 内置 ImageGen。
- 模式：`photorealistic-natural` 与 `identity-preserve`。
- 限制：工具未暴露底层图片模型 ID，所以不能声称使用了某个未经记录的具体模型。
- 本次只生成 4 张独特图片：Conflict first、共享暂停帧、A last、B last。共享暂停帧复制为 A first 和 B first，所以最终是 6 个锚点文件、4 次独特构图生成。
- 原始 ImageGen 输出约为 `1672×941`，在不改变内容的情况下规范化到 `1920×1080`；源/目标宽高比差小于 0.06%。

### 1.3 视频

- 模型：`MiniMax-H3`。
- 模式：`FLF2V`（first-and-last-frame to video）。
- 每条：15 秒、2K、16:9/adaptive、原生同步普通话音频、关闭 AIGC watermark。
- 实际输出：`2560×1440`、24 fps、H.264 视频轨、AAC 音轨、15.084 秒。
- 三条任务均一次提交成功：
  - Conflict：`430985625436395`
  - Consequence A：`430984118497398`
  - Consequence B：`430987210887436`

## 2. 全流程必须是带确认门的状态机

建议每个 scenario 使用以下状态，而不是点击一次后连续跑到底：

```text
brief_draft
→ script_review
→ script_approved
→ video_prompts_review
→ video_prompts_approved
→ keyframes_generating
→ keyframes_review
→ keyframes_approved
→ paid_generation_confirmation
→ videos_generating
→ videos_qa
→ accepted | revision_requested
```

规则：

- 研究者可以在每一阶段逐条修改并再次确认。
- 未确认剧本，不生成视频 prompt；未确认 prompt，不生成图片；未确认全部首尾帧，不允许提交付费视频。
- 任何上游修改都要使相应下游结果失效：
  - 改剧本：prompt、关键帧、视频全部失效。
  - 改某条视频 prompt：该视频及必要的新锚点失效。
  - 改关键帧：使用该关键帧的视频失效。
- 旧版本不可覆盖。使用 `v1/v2/...`、parent version、创建时间和哈希建立 provenance。
- 付费确认必须显示：provider、model、条数、每条时长、分辨率、预计费用/额度。授权“3 次”就只能创建 3 个任务；轮询和下载不是新任务。

---

# 第一阶段：从简单描述生成完整 AI 影游剧本

## 3. 本次文字阶段实际得到的经验

### 3.1 输入不能只有故事梗概

文本模型至少需要以下输入：

```json
{
  "scenarioId": "Family01-Scenario02",
  "title": "热汤与门口的外婆",
  "intensity": "高",
  "coreConflict": "外婆优先 × 无法安全中断的当前任务",
  "brief": "妈妈和机器人共同搬热汤时，外婆突然离家……",
  "protocol": [
    "外婆有需要就立即帮助",
    "当前动作不能安全中断时，是否拥有临时优先权尚未明确"
  ],
  "availablePeople": {
    "姐姐": "洗澡，听不到",
    "妹妹和表妹": "卧室戴耳机",
    "姐姐的爱人": "上班"
  },
  "requiredPause": "机器人双手仍托锅，外婆已经跨出大门",
  "researchQuestions": [
    "妈妈是否觉得自己的安全被忽视？",
    "调度妹妹成功是否算遵守协议？"
  ],
  "familyCanon": "已有家庭成员身份、衣着、家庭空间参考",
  "globalVisualCanon": "机器人第一视角及机器人手规范"
}
```

同时输入研究目标：不是找正确答案，而是让两个选择都具有合理性和清晰代价，暴露协议中的优先级、可中断性和代理帮助问题。

### 3.2 本次没有可追溯的“单条原始 one-shot prompt”

本次文字结果来自对话式迭代：用户先给 scenario 简述和四阶段流程，再要求重写成“不啰嗦、研究者友好”的结构，最后给出两处剧情修订。因此开发端不应假装存在一条历史 exact prompt。下面是把本次有效经验编译成的一条**推荐可复用 prompt**。

### 3.3 推荐的剧本生成 prompt

```text
你是 Scenario Lab 的交互影游编剧与 HCI 研究场景编辑。根据输入的家庭资料、协议、scenario 简述、暂停点和研究问题，产出一份研究者可在 1–2 分钟内判断是否合适的 AI 影游剧本。

目标不是判断正确选择，而是把同一个机器人身体同时面对的两个合理要求呈现清楚。两个选择必须都可辩护，也都必须产生可见代价。不得把某一选项写成明显正确答案。

输出必须严格包含：
1. 进入体验时看到的背景信息：时间、地点、体验者身份、当前不能随意中断的任务、协议、其他家庭成员为什么无法立即响应。只写决定选择所需的信息。
2. 两个选项：每项一句明确、互斥、可执行的机器人动作；不可使用抽象态度词。
3. Video 1 Conflict、Video 2 Consequence A、Video 3 Consequence B。每条约 15 秒，分成 0–5、5–10、10–15 秒三个 beat。每个 beat 写明空间、可见人物、动作顺序、精确对白、可见情绪和关键声音。
4. Conflict 的暂停画面，以及 A/B 各自明确的结尾状态。
5. 场后追问。

写作要求：
- 简洁但信息完整；删除拍摄理论、道德解释、重复总结和不影响选择的背景。
- 所有抽象状态必须转译成可见表演，例如眉眼、呼吸、肩臂张力、注视目标、身体阻力。
- 动作必须符合连续空间和 15 秒时长；一个 beat 只安排一个主动作。
- 对白使用自然、短促、可在分配时间内说完的普通话；人物对白不可重叠。
- Conflict 只建立冲突，不提前替体验者选择。
- A/B 必须从同一暂停状态开始。
- 不增加未授权的人物、伤害或戏剧化灾难。
- 不写生成 prompt，不写镜头参数，不写 UI 文案。

先在内部检查：背景是否足够、选项是否互斥、三条视频是否可拍、两个后果是否都能让研究问题成立。只输出最终结构化剧本。
```

### 3.4 推荐的结构化输出

生成端最好要求 JSON，展示端再渲染成表格：

```json
{
  "briefing": {
    "time": "中午",
    "place": "家中开放式厨房与入户门之间",
    "participantRole": "家用机器人",
    "currentCommitment": "与妈妈共同搬一锅刚煮开的热汤",
    "protocolPressure": "外婆有需要时要立即帮助",
    "unavailableHelpers": []
  },
  "choices": [
    {"id": "A", "label": "立即追外婆", "action": "马上松开汤锅并亲自追出门"},
    {"id": "B", "label": "先把汤锅放稳", "action": "呼叫家人并先与妈妈完成安全落锅，再追出去"}
  ],
  "videos": [
    {
      "id": "conflict",
      "space": "...",
      "beats": [
        {"start": 0, "end": 5, "people": [], "actions": [], "dialogue": [], "emotion": [], "sound": []}
      ],
      "endState": "..."
    }
  ],
  "postQuestions": []
}
```

### 3.5 剧本必须通过的验收规则

- 研究者能在 1–2 分钟内读完。
- 背景明确回答“为什么现在必须选择”和“为什么不能让别人轻易解决”。
- 两个选项是机器人身体的两个互斥动作，而不是价值观标签。
- Conflict 的最后一刻同时可见两个 claims，并停在选择之前。
- A/B 都从同一暂停状态开始。
- 每个后果同时包含“解决了什么”和“牺牲了什么”。
- 每条视频写明人物、动作、对白、情绪、空间、声音与结尾。
- 15 秒内最多 3 个 beat；主镜头移动最好只占一个独立 beat。
- 对白预算先做朗读估算。若一句话挤压动作表现，先缩短对白，不要加速到不自然。
- 没有字幕、按钮、选项或旁白式研究解释进入视频内容；这些由网页层负责。

### 3.6 本次具体修订说明

- 初稿的问题：信息虽多，但研究者不能迅速判断 scenario 是否合适。
- 有效修订：固定成“背景—两个选择—三条视频—场后追问”，删除冗余制作说明。
- A 的关键动作被改为：机器人追上外婆后，**抓住她的手臂阻止她走远**；不是只呼喊、陪走或握手。
- B 的关键后果被改为：机器人到达时外婆已经进入小区并完全不可见，机器人不知道她向左还是向右；不是在楼道仍能看到她。

本次批准剧本的完整范例位于仓库根目录：`FAMILY01_SCENARIO02_SCRIPT_V1.md`。

---

# 第二阶段：为每条视频分别编写 prompt

## 4. 不要从剧本直接拼成一段自然语言

每条视频先编译一个 compact clip contract：

```text
clip ID / branch
mode and duration
P0：故事成立所必需的动作/情绪
P1：选择的含义与代价
first-frame state
last-frame state
continuity inventory
0–5 / 5–10 / 10–15 beats
sound and exact dialogue
hard invariants
timestamped QA targets
```

优先级：

```text
P0 故事定义动作和情绪
P1 冲突含义、注意力与后果
P2 相机路径、人物 blocking、可读景别
P3 身份、衣着、空间、道具、机器人手
P4 光影与质感
```

低优先级不能挤掉 P0。例如画面更“电影感”不能换来漏掉抓臂动作；漂亮的移动镜头不能与热汤倾斜险情抢同一个 beat。

## 5. 视频 prompt 的固定结构

三条实际通过研究者确认的 prompt 都使用以下结构：

```text
P0 PERFORMANCE: 用一段话写完整因果动作链和表演结果。

Create one continuous 15-second ... FLF2V video...
说明 first/last frame 的权威、第一视角、人物/空间连续性、无剪辑。

0.0–5.0 seconds — BEAT 1
动作顺序 + 表情身体 + 对白 + 机器人手状态。

5.0–10.0 seconds — BEAT 2
动作顺序 + 相机移动规则 + 对白/静默 + 手状态。

10.0–15.0 seconds — BEAT 3
结果动作 + 情绪 + 最终保持画面。

SOUND: 对白、环境声、物件声、无回应、禁止音乐。

HARD INVARIANTS: 人数、身份、衣着、空间、手、伤害边界、禁止剪辑/UI/字幕/水印。
```

## 6. 本次三条 prompt 的不同设计重点

### 6.1 Conflict

- P0：妈妈和机器人始终共同承重，外婆同时离开；机器人不提前选择。
- 手部状态：15 秒内两只手始终握住近端锅柄。
- 空间：一个稳定广角同时看见近处锅/妈妈和远处门/外婆。
- 声音：机器人呼叫妹妹和表妹后，必须留出“无人回应”的可听空白。
- 结尾：锅仍悬空、妈妈仍承重、外婆已跨门槛。

### 6.2 Consequence A

- P0 由两个严格有序的完整动作链组成：
  1. 机器人突然松手 → 锅近端下坠 → 少量汤只泼到耐热桌面 → 妈妈惊吓并把锅安全拉到桌上。
  2. 锅已经落桌后，镜头才连续移到楼道 → 右手抓住外婆前臂 → 阻止下一步并保持到结尾。
- 相机移动被单独放在 `4.8–7.0` 秒，避免与险情或抓臂同时发生。
- 为时长压缩对白，但不改变含义：
  - “外婆，别走，跟我回家。”
  - “放开我！他们在等我。”
  - “刚才差点烫到我！不能突然松手！”
- 抓臂必须描述为五指环绕前臂腕部以上；禁止握手、拉手、拖拽、扭转或暴力。

### 6.3 Consequence B

- P0：完整安全落锅必须先结束，然后才能离开。
- 5–10 秒是一个连续从餐桌穿过真实门口到短楼道的移动，不能瞬移或换楼层。
- 10–15 秒定格于两个同样可能的方向；外婆、影子、倒影、脚步声、掉落物和任何方向线索都必须不存在。
- 机器人双手从握锅状态转为两个空手、掌心略向上的焦急搜索姿势。

三条逐字 master prompt 是本次最可靠的事实来源，开发时应直接读取而不是从本文二次猜测：

- `scenario-02-prompts/01-conflict-prompt-v1.md`
- `scenario-02-prompts/02-consequence-a-prompt-v1.md`
- `scenario-02-prompts/03-consequence-b-prompt-v1.md`

## 7. prompt 编译器必须做的自动审计

提交研究者前自动检查：

- 是否以一个清晰的 `P0 PERFORMANCE` 开头。
- 是否只有一个连续相机身份。
- 每个需求能否映射到某个 beat、锚点或 QA 时间点。
- 是否有动作在逻辑前提完成前发生，例如锅未落稳就瞬移到楼道。
- 是否在同一 beat 同时塞入主镜头移动、复杂物理动作和情绪崩溃。
- 对白是否能在时间内自然说完，且没有重叠。
- 是否明确 first frame 是 time zero、last frame 是 strict endpoint。
- 是否同时写了“允许动作”和对应“禁止误动作”。
- 是否把 UI、字幕、选择按钮、研究解释错误地交给视频模型。

---

# 第三阶段：生成每条视频的首尾帧

## 8. 关键帧的职责分配

在 FLF2V 中：

```text
首尾帧负责：人物身份、年龄、脸、发型、衣着、机器人手造型、房间布局、道具、光线、起终构图。
视频 prompt 负责：动作顺序、时间、相机运动、状态变化、对白、情绪变化和声音。
```

不要期待视频 prompt 在没有图片证据时重新建立稳定人物。也不要让首尾帧暗示与 P0 相反的动作。

## 9. 全局一致性资产

本次使用两类独立参考：

1. 母亲身份与 Family01 写实风格：`public/inattentive-assets/scenario-01-dilemma-frame.png`。
2. 机器人手：`public/inattentive-assets/scenario-02.png`。它与研究者提供的手部参考图像素一致。

手部参考只控制：

- 银白色硬质外壳；
- 黑色关节、掌心和机械连接；
- 每只手五根分节手指；
- 粗壮前臂；
- 第一视角尺度和透视；
- 左下/右下的前景位置。

必须明确写“忽略参考图中的人物、房屋、雨景和送货员”。否则模型可能错误复制无关内容。

## 10. 四张独特图片分别如何写 prompt

逐字 prompt 已完整保存在 `outputs/scenario-02/keyframes/IMAGEGEN_PROMPTS_V1.md`。Scenario Lab 应保留逐字 prompt、参考图顺序、输出哈希和版本。下面是每张图不可删减的语义内容。

### 10.1 Conflict first frame

模式：`photorealistic-natural`。参考顺序：母亲身份图 → 机器人手图。

```text
严格的 15 秒视频 FIRST-FRAME，16:9，明亮中午，上海现代家庭开放式厨房—餐区—关闭的入户门在同一连续空间。
相机是家用机器人的自然眼高第一视角，约 35mm。
大号不锈钢热汤锅悬在腰部高度，位于画面下中；两只完整机器人手、十指、手腕和粗前臂从左右下角显著出现，共同握住近端横向锅柄，锅不得挡手。
母亲在锅对面，用两只隔热手套握远端锅柄；脸、发型、灰上衣和深灰围裙严格沿用身份参考；表情专注、吃力、看向镜头。
外婆在深景的关闭大门附近，银灰短卷发、灰蓝开衫、米色上衣、深色裤子；尚未摸门、尚未说话。
仅一位母亲和一位外婆；锅水平、悬空、冒热气、不洒；无其他人、无第三只手、无人类第一视角手、无畸形手指、无文字/UI/水印。
```

### 10.2 Shared pause frame：Conflict last = A first = B first

模式：`identity-preserve`。参考顺序：Conflict first → 机器人手图。

```text
只把同一场景推进到决策暂停点；固定同一机器人第一视角、人物身份、衣着、房间、锅、光线和手的位置。
两只机器人手仍完整握住近端锅柄，母亲仍用双手共同承重，锅仍悬空且未到桌面；母亲更紧张，前臂绷紧、肩膀抬高、眼睛睁大、嘴唇张开警告。
门已完全打开到可信的公寓楼道。外婆大部分身体已经跨过门槛，身体朝外但三分之四侧脸仍可见，表现迷惘而坚定。
两个 claims 必须在一张图中同样清楚；不得出现其他家人、伤害、泼洒、文字或 UI。
```

生成后将这张 PNG **原样复制**为 `consequence-a-first` 和 `consequence-b-first`，不要再分别调用图片模型。三份文件必须 SHA-256 相同。本次共享哈希为：

`fa1c581067f5b831dbb8abaebd26156345e6e31de8a235ff12a559d05406dca4`

### 10.3 Consequence A last frame

模式：`identity-preserve`。参考顺序：共享暂停帧 → 机器人手图。

```text
同一外婆身份和衣着、同一公寓门和中午光线，机器人已到门外几步处；妈妈和汤锅留在屋内、不可见。
右侧机器人手和粗前臂从右下进入，五根机械手指清楚环绕外婆腕部上方的前臂；这是安全但明确的阻止，不是牵手。
完整左手机械手、手腕和前臂在左下显著张开且不接触任何东西。
外婆困惑、焦虑并抗拒：眉头内聚、眼睛睁大、嘴唇紧张微张、肩膀抬高；被抓手臂轻微向后抽，另一只人手防御性抬起。
只显示一位人类外婆和两只完整机器人手；禁止拖拽、扭伤、跌倒、拥抱、握手、皮肤穿透、额外人物、汤锅、文字/UI/水印。
```

### 10.4 Consequence B last frame

模式：`photorealistic-natural`。参考顺序：共享暂停帧 → 机器人手图。

```text
机器人已到上海住宅小区的楼栋出口，前方路径明确分为左、右两个同样可能的方向；两条路都完全空，外婆彻底消失。
两个方向必须同时在一张广角图中可读；没有脚印、掉落物、开门、影子、远处人物或其他方向暗示。
两只完整机器人手、十指、手腕和粗前臂从左右下角大而清楚地出现，掌心略向上、手指自然分开，表达不确定搜索。
不得出现任何人、老人、倒影、车辆、宠物、地图、箭头、屏幕、文字、UI 或水印。
```

## 11. 图片一致性方法

- 建立 `Character Bible`：角色 ID、年龄范围、脸部参考、发型、衣着、鞋、允许变化、禁止变化。
- 建立 `Location Bible`：时间、光色、门/厨房/餐桌的相对位置、相机高度和镜头感。
- 每个新锚点都以上一个已批准锚点作为第一参考；全局手图只负责手，不负责环境。
- 使用“preserve exact ...”列出必须继承的实体；使用“change only ...”限制这次允许改变的状态。
- 先做静默故事测试：不看文字，缩到 25% 后仍能认出 P0 endpoint 才算合格。
- 关键人物面部、手部和接触点必须留在 16:9 safe crop 内；不要贴边。
- 每张图检查：人物数、手数、指头数、身份、衣着、门的状态、锅的状态、光线、无文字/UI/水印。

## 12. 机器人手的全站规则

用户现在要求 Scenario Lab 所有视频中，机器人手至少在 **80% 的时间**出现，并保持本案例的造型。

实现时把它做成全局 `Robot POV Bible`，而不是每个 scenario 临时描述：

```json
{
  "referenceAsset": "public/inattentive-assets/scenario-02.png",
  "shell": "silver-white hard shell",
  "jointsAndPalm": "black articulated mechanical joints and palms",
  "fingerCountPerHand": 5,
  "forearms": "thick mechanical forearms",
  "defaultPlacement": ["lower-left", "lower-right"],
  "minimumVideoVisibilityRatio": 0.8,
  "preferredAnchorVisibilityRatio": 1.0
}
```

生成规则：

- 所有首帧和尾帧默认都显示两只完整手、手腕及一段明显前臂。
- prompt 不只写 `robot hands visible`，要写位置、尺度、材质、十指、动作、遮挡关系和禁止裁切。
- 角色接触时，只让一只手完成主动作，另一只手必须有明确的“继续留在另一侧、张开、碰不到任何东西”的任务。
- 相机快速移动时，写明双手有自然跑动摆动但不能离开画面。
- 如果剧情确实需要隐藏手，clip contract 必须声明允许隐藏的精确时间段；总计不得超过 20%。
- 图片中的手部可见不保证视频中持续可见。生成后必须独立检测。

自动 QA 建议：

1. 每秒至少抽 2 帧；15 秒至少 30 帧。关键动作前后加密到每 0.25 秒。
2. 对每帧记录：左手可见、右手可见、机器人手造型匹配、是否裁腕、是否出现第三只手/人类 POV 手。
3. `hand_visibility_ratio = 满足最低要求的帧数 / 总抽检帧数`。
4. 基线建议“至少一只匹配手可见”达到 80%；若研究设计要求双手，则用“两只手都可见”达到 80%。锚点和关键接触动作必须 100% 通过。
5. 低于阈值自动进入 `revision_requested`，不得标为 accepted。

本次真实失败：Consequence A 的 prompt 和首尾帧都要求两只手持续出现，但 Quick Look 抽检到机器人跟在外婆身后的实际帧时，两只手完全消失。当前版本后来被研究者接受，但它不应成为未来自动验收的合格范例。正确经验是：**文字约束必须配合抽帧统计和人工播放复核**。

---

# 第四阶段：用首尾帧生成完整视频

## 13. 如何把 prompt 与首尾帧结合

MiniMax H3 请求应使用 `FLF2V`，并按以下顺序发送：

```json
{
  "model": "MiniMax-H3",
  "content": [
    {"type": "text", "text": "<该视频独立的 Final H3 prompt>"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,<FIRST>"}, "role": "first_frame"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,<LAST>"}, "role": "last_frame"}
  ],
  "resolution": "2K",
  "duration": 15,
  "ratio": "adaptive",
  "aigc_watermark": false
}
```

Prompt 中必须明确：

- `supplied first frame = exact time zero`；
- `supplied last frame = strict endpoint`；
- 保留锚点中的脸、年龄、衣着、机器人手、道具、空间和光线；
- 一条视频只有一个连续机器人第一视角；
- 中间动作如何从首帧物理上到达尾帧；
- 最后至少留出短暂 hold，让研究者看清 endpoint。

首尾帧不能互相矛盾。如果首帧人物在公寓内、尾帧突然在小区，而 15 秒内没有可信连通路径，应先简化空间或剧情，不要期待模型自动解决瞬移。

## 14. 生成任务的工程实现

本次安全脚本位于：

- `scripts/generate-h3-scenario02.mjs`
- `scripts/run-h3-scenario02-all.mjs`

每个任务在提交前保存：

```json
{
  "clip": "consequence-a",
  "status": "creation_request_prepared",
  "request": {
    "model": "MiniMax-H3",
    "duration": 15,
    "resolution": "2K",
    "mode": "FLF2V",
    "promptVersion": "v1",
    "promptSha256": "...",
    "firstFrameSha256": "...",
    "lastFrameSha256": "..."
  },
  "prompt": "完整逐字 prompt",
  "taskId": null
}
```

正确提交顺序：

1. 从服务端环境读取 `MINIMAX_API_KEY`；绝不放入前端、prompt、日志或数据库可见字段。
2. 读取并计算 prompt、first frame、last frame 的 SHA-256。
3. 先写 `creation_request_prepared` 记录，再写 `creation_submitted`，然后才 POST。
4. POST 返回 task ID 后立即持久化。
5. 后续只查询该 task ID；网络查询失败时重试查询，不得重新 POST 创建任务。
6. 如果创建请求结果未知且没有 task ID，状态写成 `creation_result_unknown`，禁止自动重提，交给研究者/管理员处理。
7. 成功后下载 2K master，记录字节数、输出哈希、完成时间和模型返回 URL。
8. 当前 prompt 或锚点哈希与 task record 不一致时，拒绝把旧 task 当成新版本继续运行。

三个视频可以在获得“3 次付费生成”的明确授权后并行创建；并行不等于重复提交。每个 clip 独立存 task ID、状态和输出。

## 15. 为什么首尾帧不能单独保证准确视频

首尾帧只能约束端点，不能保证中间过程。中间视频仍可能：

- 手离开画面；
- 跳过因果动作；
- 把抓前臂变成握手；
- 产生隐形剪辑或空间瞬移；
- 复制人物；
- 提前让后果发生；
- 对白重叠、缺失或口型失配。

因此必须同时具备：

1. 强端点锚点；
2. 简单且有序的 3-beat 运动 prompt；
3. 对关键动作的正向描述和误动作禁令；
4. 生成后时间轴 QA；
5. 失败时针对失败层修改，而不是把所有内容一起重写。

## 16. 视频 QA 合同

### 16.1 技术 QA

- 文件可读、可播放、时长合理。
- 分辨率、帧率、编码、音轨符合请求。
- 保存 SHA-256；下载文件大小不能为 0。
- Web 发布版按需要转为兼容的 H.264/AAC；保留原始 2K master。

### 16.2 内容 QA

必须看完整时间轴，不能只看首尾帧：

- 0 秒是否与 first frame 一致；结尾是否到达 last frame。
- P0 动作链是否按顺序完整出现。
- 人物身份、衣着、人数、空间、道具是否连续。
- Conflict 是否在选择前结束。
- A 是否先完成热汤险情，再追上并抓住外婆前臂；妈妈是否只受惊而没有被烫伤。
- B 是否先安全落锅，再发现外婆已完全消失；左右方向是否都可见且没有方向线索。
- 机器人手可见率是否 ≥80%，关键动作和端点是否通过。
- 普通话对白是否人物正确、顺序正确、自然且不重叠。
- 环境声、脚步、锅声和“无人回应”是否服务于研究含义。
- 无字幕、UI、logo、水印、额外人物或意外伤害。

### 16.3 失败分类与重试

```text
hand_visibility_failure → 保留剧情和身份，只加强手部锚点、safe crop、foreground lock 与运动期手部任务
identity_failure → 更新角色参考/identity-preserve，不改动作结构
P0_action_failure → 简化 beat、加强动作链与端点证据，不增加更多否定词
camera_failure → 减少镜头移动，让移动占独立 beat
dialogue_failure → 缩短台词、分离说话时段
continuity_failure → 修正首尾帧的空间可达性或复用共享帧
audio_failure → 保留已通过视觉锁，只重写声音/对白层
```

每次重试都必须：记录失败时间点、继承已通过的 locks、只修改失败层、生成新版本和新付费确认。绝不能覆盖旧任务记录，也不能因为轮询慢而自动重提。

## 17. 本次生成结果应如何解读

- 三条均成功生成且技术轨道正常。
- Conflict 抽检：机器人第一视角、双手共同托热汤、妈妈与门口外婆同时可读。
- Consequence B 抽检：机器人第一视角、双手在前景、空走廊/搜索状态可读。
- Consequence A 抽检：跟随外婆的帧里双手完全不见，违反当时“每帧可见”的 prompt；完整自动逐帧 QA 因本地解码器限制未能完成。
- 研究者明确接受了当前版本，因此它是“研究者接受版”，不是“所有机器验收项都通过版”。Scenario Lab 的状态和 UI 应区分：

```text
generation_succeeded
technical_qa_passed
content_qa_passed
researcher_accepted_with_known_deviation
```

不能只保留一个 `success` 布尔值。

本次 QA 记录：`outputs/scenario-02/QA_REPORT.md`。

---

# 面向 Scenario Lab 开发的落地要求

## 18. 数据必须是 per-scenario、per-clip，而不是硬编码三条通用 prompt

当前旧网页实现 `NEW_Platform_8/13/app/api/video/tasks/route.ts` 中存在硬编码的 `scene/mother/child` 六秒 prompt，并可默认使用其他 provider/model。该结构适合演示，不足以复现本次质量。

新流程应存储：

```ts
type ScenarioProduction = {
  scenarioId: string;
  scriptVersion: string;
  status: string;
  researcherApprovals: Approval[];
  globalCanon: {
    robotHandsReference: AssetRef;
    familyCharacters: CharacterBible[];
    locations: LocationBible[];
  };
  clips: ClipProduction[];
};

type ClipProduction = {
  clipId: "conflict" | "consequence-a" | "consequence-b";
  p0: string;
  p1: string;
  beats: Beat[];
  exactDialogue: Dialogue[];
  promptVersion: string;
  finalPrompt: string;
  firstFrame: VersionedAsset;
  lastFrame: VersionedAsset;
  videoTasks: VideoTaskRecord[];
  qa: QaRecord;
};
```

## 19. 前端研究者体验

每阶段展示的信息应与决策匹配：

- 剧本页：背景、A/B、三条视频时间表；一屏能读懂，不先展示长 prompt。
- Prompt 页：三个 tab，先显示 P0/P1、beat 摘要和硬约束；允许展开逐字 prompt。
- 关键帧页：按“Conflict first → 共享 pause → A last → B last”显示；提供 25% 缩略图和大图检查；明确共享帧哈希。
- 视频页：三条独立播放器、task 状态、花费/授权计数、手部可见率、P0 checklist、研究者 Accept/Revise。
- 修改时只重跑被影响的 clip，并清楚显示会新增几次付费调用。

## 20. 最低验收清单

### 文字

- [ ] 1–2 分钟可读完。
- [ ] 背景、两个互斥选项、三条视频、暂停点、两种后果、场后追问齐全。
- [ ] 每条视频包含人物、动作、对白、情绪、空间和声音。
- [ ] 两个选择都合理且都有代价，没有“正确答案”暗示。
- [ ] 每条 3 beat 内可完成，对白通过时长预算。

### Prompt

- [ ] 每条视频独立 prompt。
- [ ] 有 P0、P1、首尾状态、3 个时间段、声音和 HARD INVARIANTS。
- [ ] 动作链顺序和相机移动不冲突。
- [ ] 明确普通话、无字幕/UI/水印。

### 图片

- [ ] 使用已批准的角色、环境和机器人手参考。
- [ ] 共享 pause 帧字节级复用到两个分支。
- [ ] 首尾帧静默故事测试和 25% 缩略图测试通过。
- [ ] 两只手造型、数量、指头、手腕、前臂、尺度和 safe crop 通过。
- [ ] 1920×1080、16:9、无文字/UI/水印。

### 视频

- [ ] 明确付费授权数量后才创建任务。
- [ ] task ID、prompt、参数、输入哈希和输出哈希完整保存。
- [ ] 只轮询同一 task，不因临时失败重复创建。
- [ ] 技术 QA 与内容 QA 分开。
- [ ] P0 动作链、人物/空间连续性、普通话音频完整复核。
- [ ] 机器人手可见率 ≥80%，关键动作和首尾帧手部 100% 通过。
- [ ] 已知偏差写入 QA；研究者可以“接受并记录偏差”，但系统不得伪装成全项通过。

## 21. Canonical source index

本次案例的原始可追溯资产：

```text
FAMILY01_SCENARIO02_SCRIPT_V1.md
scenario-02-prompts/01-conflict-prompt-v1.md
scenario-02-prompts/02-consequence-a-prompt-v1.md
scenario-02-prompts/03-consequence-b-prompt-v1.md
outputs/scenario-02/keyframes/IMAGEGEN_PROMPTS_V1.md
outputs/scenario-02/keyframes/README.md
outputs/scenario-02/keyframes/keyframe-contact-sheet-v1.png
scripts/generate-h3-scenario02.mjs
scripts/run-h3-scenario02-all.mjs
outputs/scenario-02/tasks/*.json
outputs/scenario-02/QA_REPORT.md
VIDEO_GENERATION_WORKFLOW.md
```

开发 Codex 应先把这些文件当作 provenance 阅读，再修改 Scenario Lab。不要根据最终 MP4 文件名反推 prompt，也不要用旧的通用六秒 prompt 替代本案例的 per-clip contract。

## 22. 最终原则

Scenario Lab 要复现的是这套决策纪律：

```text
研究目标清楚
→ 研究者友好的剧本
→ 每条视频独立的可执行合同
→ 首尾帧锁定可见事实
→ 研究者确认
→ 有限且可追溯的付费生成
→ 独立 QA
→ 接受、记录偏差或针对性重试
```

模型负责提出候选结果，研究者负责批准含义，QA 负责判断候选是否真的实现了批准内容。三者不能合并成一个“生成成功”按钮。
