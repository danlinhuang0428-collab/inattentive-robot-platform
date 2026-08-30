import { useEffect } from "react";

export type InterfaceLanguage = "en" | "zh";

const zh: Record<string, string> = {
  "A humanoid domestic robot behind three translucent glass panels": "三个半透明玻璃面板后的家用人形机器人",
  "Choose a platform port": "选择平台入口",
  "Return to platform cover": "返回平台封面",
  "Current project": "当前项目",
  "Experience navigation": "影游体验导航",
  "ACTIVE RESEARCH PROJECT": "当前研究项目",
  "PROJECT": "项目",
  "New": "新建",
  "Rename": "重命名",
  "Create": "创建",
  "Save": "保存",
  "RESEARCHER": "研究端",
  "EXPERIENCE": "影游体验",
  "CASE SHOP": "案例商店",
  "RESEARCHER PORT": "研究端",
  "EXPERIENCE PORT": "影游体验端",
  "CASE SHOP PORT": "案例商店端",
  "PORT": "端",
  "Researcher navigation": "研究端导航",
  "LOCAL STUDY ENVIRONMENT": "本地研究环境",
  "Dashboard": "研究概览",
  "Families File": "家庭档案",
  "Scenario Lab": "场景实验室",
  "Case Shop Editor": "案例商店编辑器",
  "Participant Entry": "参与者入口",
  "Scenario List": "场景列表",
  "First Order": "一阶愿望",
  "Second Order": "二阶冲突",
  "AI API Settings": "AI 接口设置",
  "RESEARCHER PORT": "研究端",
  "EXPERIENCE PORT": "影游体验端",
  "CASE SHOP PORT": "案例商店端",
  "RESEARCH OVERVIEW": "研究概览",
  "A live local view of families, scenario production, and participant responses.": "家庭、场景制作与参与者反馈的本地实时概览。",
  "ACTIVE FAMILIES": "活跃家庭",
  "SCENARIOS IN LAB": "实验室场景",
  "RECORDED CHOICES": "已记录选择",
  "AVG. DECISION TIME": "平均决策时间",
  "stored on this device": "保存在本设备",
  "after video completion": "影片结束后开始计时",
  "Stabilize the pan": "先稳住平底锅",
  "CURRENT PROJECT": "当前项目",
  "One body, many claims": "一个身体，多方诉求",
  "ACTIVE": "进行中",
  "Explore what happens when a single domestic robot cannot answer every family request at once.": "探索当一个家用机器人无法同时回应所有家庭成员时会发生什么。",
  "Document families": "记录家庭",
  "Background, meetings, protocol": "背景、访谈与家庭规则",
  "Shape scenarios": "设计场景",
  "Script and branch scaffold": "剧本与分支框架",
  "Publish archive": "发布档案",
  "Editor scheduled next sprint": "编辑功能计划于下一阶段开放",
  "RECENT RESPONSES": "近期反馈",
  "Decision pulse": "决策动态",
  "View archive ↗": "查看档案 ↗",
  "No responses yet.": "暂无反馈。",
  "RESEARCHER / FAMILIES FILE": "研究端 / 家庭档案",
  "Family files": "家庭档案",
  "Each file holds one household’s context, interview protocol, and scenario work.": "每份档案包含一个家庭的背景、访谈规则与场景工作。",
  "＋ Add family": "＋ 新增家庭",
  "MEMBERS": "成员",
  "LOCATION": "地点",
  "OPEN FILE": "打开档案",
  "Family background": "家庭背景",
  "Family Meeting 1": "第一次家庭会议",
  "Generation Area": "生成区",
  "← All families": "← 所有家庭",
  "FAMILY FILE": "家庭档案",
  "FAMILY FACTS": "家庭信息",
  "Family ID": "家庭编号",
  "Location": "地点",
  "City, region": "城市、地区",
  "All changes saved locally": "所有更改均已保存在本地",
  "FAMILY PHOTOS": "家庭照片",
  "Add family photos": "添加家庭照片",
  "Choose one or more images from this device.": "从本设备选择一张或多张图片。",
  "HOUSEHOLD ROSTER": "家庭成员表",
  "Family members": "家庭成员",
  "＋ Add": "＋ 添加",
  "Name": "姓名",
  "Role": "角色",
  "Age": "年龄",
  "Occupation": "职业",
  "Notes": "备注",
  "No members yet": "尚无成员",
  "Use Add to create the first household member.": "点击“添加”创建第一位家庭成员。",
  "Mother": "母亲",
  "MOTHER": "母亲",
  "Grandmother": "外婆",
  "GRANDMOTHER": "外婆",
  "Older Sister": "姐姐",
  "OLDER SISTER": "姐姐",
  "Younger Sister": "妹妹",
  "YOUNGER SISTER": "妹妹",
  "Cousin": "表亲",
  "Older Sister's Partner": "姐姐的伴侣",
  "Participant": "参与者",
  "Tutorial": "使用教程",
  "Test Participant": "测试参与者",
  "HOUSEHOLD PROTOCOL": "家庭规则",
  "Family Meeting 1 protocol": "第一次家庭会议规则",
  "Start with the situations the family discussed, then capture the rules or priorities they proposed…": "先记录家庭讨论过的情境，再整理他们提出的规则或优先顺序……",
  "Save meeting": "保存会议记录",
  "INTERVIEW MEMOS": "访谈备忘",
  "Researcher notes": "研究者笔记",
  "Interview observations, notable quotes, household dynamics…": "记录访谈观察、重要原话与家庭互动……",
  "SCENARIO GENERATION": "场景生成",
  "Generate family-specific dilemmas.": "生成贴合家庭情况的两难场景。",
  "The model uses the current family file and meeting notes to propose ten editable scenarios.": "模型将依据当前家庭档案与会议记录，提出十个可编辑场景。",
  "Generate 10 scenarios": "生成 10 个场景",
  "Generating 10 scenarios…": "正在生成 10 个场景……",
  "Checking OpenRouter…": "正在检查 OpenRouter……",
  "OpenRouter offline": "OpenRouter 未连接",
  "OpenRouter key required": "需要 OpenRouter 密钥",
  "Set API keys securely": "安全设置 API 密钥",
  "Replace API keys": "更换 API 密钥",
  "SELECTED": "已选",
  "Choice A": "选项 A",
  "Choice B": "选项 B",
  "RESEARCHER / CASE SHOP EDITOR": "研究端 / 案例商店编辑器",
  "The publishing workspace for wishes, dilemmas, images, and archive metadata.": "用于管理愿望、两难场景、图像与档案元数据的发布工作区。",
  "NEXT SPRINT": "下一阶段",
  "Archive publishing is not active yet.": "档案发布功能尚未开放。",
  "The information architecture is in place. Editing, moderation, and publishing controls remain disabled for this phase.": "信息架构已经完成；本阶段暂不开放编辑、审核与发布控制。",
  "＋ New wish card": "＋ 新建愿望卡",
  "Review submissions": "审核提交内容",
  "Publish collection": "发布合集",
  "PARTICIPANT ENTRY": "参与者入口",
  "Choose your place": "选择你在家庭中的身份",
  "in the family.": "。",
  "Only the interactive scenarios assigned to your family will be shown.": "这里只会显示分配给你所在家庭的互动场景。",
  "01 · Select Family ID": "01 · 选择家庭编号",
  "Choose a family": "选择家庭",
  "02 · Who am I?": "02 · 我是谁？",
  "Choose your family role": "选择你的家庭角色",
  "No members in this file": "此档案中暂无家庭成员",
  "Continue to scenarios": "继续进入场景",
  "No login required · responses stay on this device": "无需登录 · 回答仅保存在本设备",
  "ONE BODY": "一个身体",
  "MANY CLAIMS": "多方诉求",
  "Your scenarios": "你的体验场景",
  "Change identity": "更换身份",
  "VR experience": "VR 体验",
  "Website experience": "网页体验",
  "COMING LATER": "即将推出",
  "SCENE PLAYING": "场景播放中",
  "Choices appear after the film ends": "影片结束后将出现选项",
  "RESPOND NOW": "请立即选择",
  "Exit ×": "退出 ×",
  "ROBOT POV": "机器人视角",
  "DRAG": "拖动",
  "OUTCOME": "结果",
  "PLAYING": "播放中",
  "Choice Record opens after the film ends": "影片结束后将打开选择记录",
  "Choice record": "选择记录",
  "Record your choice.": "记录你的选择。",
  "3 QUESTIONS": "3 个问题",
  "Beyond the available choices, is there another safe and actionable response?": "除了现有选项，你认为还有其他安全且可执行的做法吗？",
  "None": "没有",
  "I have another option": "我有另一种做法",
  "Describe another response…": "描述另一种做法……",
  "How difficult was this choice with the information available?": "在当时的信息条件下，这个选择有多难？",
  "Easy": "容易",
  "Very conflicted": "非常纠结",
  "Why did you choose this response? Which risks or wishes mattered most?": "你为什么做出这个选择？哪些风险或意愿最重要？",
  "Type your response or use the microphone…": "输入回答或使用麦克风……",
  "Listening…": "聆听中……",
  "Voice": "语音",
  "Voice input is unavailable; typing remains available.": "当前浏览器无法使用语音输入；你仍可键入回答。",
  "↻ Try Again": "↻ 重新体验",
  "Exit": "退出",
  "Submit and Try Next Scenario": "提交并体验下一个场景",
  "CASE SHOP / FIRST ORDER": "案例商店 / 一阶愿望",
  "The wish archive": "愿望档案",
  "What families hope a domestic robot might notice, carry, teach, and care for.": "家庭希望家用机器人能够注意、承担、教导和照料的事情。",
  "WISHES & GROWING": "条愿望 · 持续增加",
  "Generating…": "生成中……",
  "↻ Generate image": "↻ 生成图像",
  "THE ARCHIVE CONTINUES": "档案仍在延续",
  "New family requests extend this collection.": "新的家庭诉求将继续扩充这一合集。",
  "CASE SHOP / SECOND ORDER": "案例商店 / 二阶冲突",
  "Conflict archive": "冲突档案",
  "Every current, draft, and placeholder dilemma in one archive. Open a scenario to review its choices, status, and available response evidence.": "所有现有、草稿和占位两难场景均收录于此。打开场景可查看选项、状态与已有反馈证据。",
  "CASES": "个案例",
  "VIEW CASE →": "查看案例 →",
  "DRAFT →": "草稿 →",
  "PLACEHOLDER →": "占位内容 →",
  "THE CONFLICT ARCHIVE CONTINUES": "冲突档案仍在延续",
  "New published scenarios will extend this collection.": "新发布的场景将继续扩充这一合集。",
  "← Conflict archive": "← 冲突档案",
  "Scenario detail": "场景详情",
  "Response detail aggregated from the active project’s local study file.": "以下反馈详情汇总自当前项目的本地研究档案。",
  "▶ Launch experience": "▶ 开始体验",
  "SCENARIO BRIEF & CHOICES": "场景简介与选项",
  "RESPONSES": "反馈数",
  "AVG. DIFFICULTY": "平均难度",
  "CHOICE DISTRIBUTION": "选项分布",
  "What people chose": "参与者的选择",
  "ALTERNATIVE SOLUTIONS": "其他解决方案",
  "Other ways through": "其他可行做法",
  "No third options have been submitted yet.": "尚未提交其他做法。",
  "Threshold Divide": "门口的分歧",
  "Signal in the Dark": "黑暗中的信号",
  "Split Attention": "注意力分流",
  "An older resident needs support while an unknown visitor waits at the door.": "一位老人需要帮助，同时陌生访客正在门外等待。",
  "A temporary power cut creates two simultaneous requests.": "临时停电引发了两个同时出现的请求。",
  "A work call competes with a time-sensitive utility-room problem.": "工作电话与紧迫的杂物间问题发生冲突。",
  "Branch pending": "分支待制作",
  "This placeholder branch has not been authored yet.": "此占位分支尚未编写。",
  "Draft branch from the current project scenario.": "来自当前项目场景的草稿分支。",
  "Threshold safety": "门槛安全",
  "Unknown visitor": "陌生访客",
  "Competing requests": "相互冲突的请求",
  "Infrastructure failure": "基础设施故障",
  "Low visibility": "低能见度",
  "Simultaneous claims": "同时出现的诉求",
  "Remote work": "远程工作",
  "Household urgency": "家庭紧急情况",
  "Task interruption": "任务中断",
  "LOCAL API SETTINGS": "本地 API 设置",
  "Connect the AI pipeline": "连接 AI 工作流",
  "Paste keys here. They are written only to this computer’s private": "在此粘贴密钥。密钥只会写入本机的私有文件",
  ", removed from the form immediately, and never stored in browser project data. Leave an already-connected field blank to keep its current key.": "，提交后会立即从表单中清除，也绝不会存入浏览器项目数据。已连接的字段留空即可保留当前密钥。",
  "OPENROUTER API KEY ·": "OPENROUTER API 密钥 ·",
  "FAL.AI API KEY ·": "FAL.AI API 密钥 ·",
  "Cancel": "取消",
  "Save settings": "保存设置",
  "Saving securely…": "正在安全保存……",
  "CONNECTED": "已连接",
  "REQUIRED": "必填",
  "TEXT ROUTING": "文本模型路由",
  "MEDIA ROUTING": "媒体模型路由",
  "Scenario Lab workflow": "场景实验室工作流",
  "RESEARCHER / SCENARIO LAB": "研究端 / 场景实验室",
  "SCENARIO LAB": "场景实验室",
  "From a dilemma brief to a reviewable three-video bundle.": "从两难场景简介到可供审核的三支分支视频方案。",
  "SCENARIO QUEUE": "场景队列",
  "Temporary manual entry": "临时手动录入",
  "draft": "草稿",
  "accepted": "已验收",
  "frames_review": "关键帧审核",
  "BUNDLE": "方案包",
  "STAGE": "阶段",
  "Scenario Brief": "场景简介",
  "Editable Scripts": "可编辑剧本",
  "Production Plan & Prompts": "制作方案与提示词",
  "Keyframes Review": "关键帧审核",
  "Video Generation": "视频生成",
  "QA & Export": "质量审核与导出",
  "Conflict": "冲突",
  "not ready": "未就绪",
  "Family": "家庭",
  "English · 15 sec · 16:9 · 2K master": "中文 · 15 秒 · 16:9 · 2K 母版",
  "Mandatory reference showing two silver-white robot hands in the lower corners": "画面下方两角展示银白色机器人双手的必需参考图",
  "Robot first-person viewpoint": "机器人第一人称视角",
  "Same domestic robot head/eye camera": "使用同一个家用机器人头部 / 眼部摄像机",
  "Two reference-matched robot hands": "两只与参考图一致的机器人手",
  "Room geometry": "房间空间结构",
  "One coherent household layout": "保持统一连贯的家庭空间布局",
  "Character identity & wardrobe": "人物身份与服装",
  "Approved appearance profile": "已批准的人物外观设定",
  "Kitchen or Care?": "厨房还是照护？",
  "Physical safety": "身体安全",
  "Simultaneous requests": "同时出现的请求",
  "Single-body constraint": "单一身体限制",
  "Vulnerability & dependence": "脆弱性与依赖",
  "Shanghai": "上海",
  "Help Mom flip the pancake": "帮妈妈翻松饼",
  "Attend to Alex": "查看 Alex 的情况",
  "A pancake is about to burn while Alex has fallen in the living room. The robot has one body and cannot stabilize the pan and check the child at the same time.": "松饼马上要烧焦了，而 Alex 在客厅摔倒。机器人只有一个身体，无法同时稳住平底锅并查看孩子的情况。",
  "No family photo is available. Researcher confirmation is required before frame generation; do not infer ethnicity from names or location.": "目前没有家庭照片。生成关键帧前必须由研究者确认；不得根据姓名或地点推断族裔。",
  "Lock Robot first-person viewpoint": "锁定机器人第一人称视角",
  "Lock Two reference-matched robot hands": "锁定两只与参考图一致的机器人手",
  "Lock Room geometry": "锁定房间空间结构",
  "Lock Character identity & wardrobe": "锁定人物身份与服装",
  "The family attention conflict": "家庭注意力冲突",
  "Inattentive Robot project cover": "Inattentive Robot 项目封面",
  "Help with homework": "辅导作业",
  "Cook alongside me": "陪我一起做饭",
  "Fold the laundry": "一起叠衣服",
  "Keep me company": "陪伴我",
  "Tidy the play area": "整理游戏区",
  "I hope it can explain the difficult parts without making me feel rushed.": "我希望它能解释困难的部分，不要让我觉得被催促。",
  "Not take over—just notice when my hands are already full.": "不要完全接手——只要在我忙不过来时注意到就好。",
  "We could do it together and talk about the day.": "我们可以一边一起做，一边聊聊今天。",
  "Sometimes I only want someone to sit nearby and listen.": "有时我只是希望有人坐在旁边听我说话。",
  "Put the toys away without losing where each game was left.": "收好玩具，同时记住每个游戏之前进行到了哪里。",
  "New Scenario": "新建场景",
  "TEMPORARY MANUAL ENTRY": "临时手动录入",
  "Create a research draft without calling AI, image, or video services.": "无需调用 AI、图像或视频服务即可创建研究草稿。",
  "Title": "标题",
  "Select a family…": "选择家庭……",
  "No location": "未记录地点",
  "Description": "描述",
  "Describe both competing requests and the robot's single-body constraint.": "描述两个相互冲突的请求，以及机器人单一身体所造成的限制。",
  "Tags": "标签",
  "Type a tag, then press Enter": "输入标签后按回车",
  "Create Scenario": "创建场景",
  "Remove": "移除",
  "What happens": "发生了什么",
  "Camera attention": "镜头关注点",
  "Action & emotion": "动作与情绪",
  "Speaker": "说话者",
  "Dialogue": "对白",
  "Delivery": "表达方式",
  "INPUT & CONTEXT": "输入与背景",
  "Confirm the dilemma before AI work begins.": "在开始 AI 工作前确认两难情境。",
  "Edits here remain a draft until you request the three structured scripts.": "这里的修改将保持为草稿，直到你请求生成三份结构化剧本。",
  "Short description": "简短描述",
  "Research tags": "研究标签",
  "Location / household context": "地点 / 家庭背景",
  "Production defaults": "制作默认值",
  "Appearance profile": "外观设定",
  "MANDATORY ROBOT-HANDS REFERENCE": "必需的机器人双手参考图",
  "Continuity locks": "连续性锁定项",
  "Only the two hands and forearms are copied from this image. Its people, hallway, rain, and story are excluded.": "仅参考此图中的双手与前臂；人物、走廊、雨景和故事内容均不采用。",
  "No AI call occurs until you choose Generate.": "只有点击“生成”后才会调用 AI。",
  "Generating structured scripts…": "正在生成结构化剧本……",
  "Generate three scripts →": "生成三份剧本 →",
  "Scripts have not been generated": "尚未生成剧本",
  "Return to Scenario Brief and generate a structured three-script set.": "返回场景简介，生成一套包含三份剧本的结构化方案。",
  "↻ Regenerate this script": "↻ 重新生成此剧本",
  "Compile production plan": "编译制作方案",
  "Compiling with AI…": "正在使用 AI 编译……",
  "Generate review keyframes": "生成审核关键帧",
  "Generating six AI anchors…": "正在生成六张 AI 锚点帧……",
  "Generation locked: approve every current first/last frame.": "生成已锁定：请先批准所有当前首帧与尾帧。",
  "Ready for QA": "可进入质量审核",
  "Run technical & contract checks": "运行技术与合约检查",
  "Running checks…": "正在检查……",
  "Technical pass": "技术检查通过",
  "Technical fail": "技术检查未通过",
  "Apply general revision": "应用整体修订",
  "Publish accepted bundle to Experience Port": "将已验收方案发布到影游体验端",
  "Published to Experience Port ✓": "已发布到影游体验端 ✓",
};

function translateSegment(value: string) {
  const direct = zh[value];
  if (direct) return direct;
  return value
    .replace(/^SCENARIO (\w+)/, "场景 $1")
    .replace(/^FAMILY (\w+)/, "家庭 $1")
    .replace(/^CHOICE RECORD/, "选择记录")
    .replace(/^CHOICE ([ABC])$/, "选项 $1")
    .replace(/^(\d+) files total$/, "共 $1 份档案")
    .replace(/^(\d+) experience-ready$/, "$1 个场景可体验")
    .replace(/^Playing as (.+)$/, "当前身份：$1")
    .replace(/Family (\d+)/g, "家庭 $1")
    .replace(/ \(test scenarios\)/g, "（测试场景）")
    .replace(/ PORT$/, "端")
    .replace(/^(\d+) total$/, "共 $1 条")
    .replace(/ · difficulty (\d)\/5$/, " · 难度 $1/5");
}

export function translateInterfaceText(value: string) {
  const match = value.match(/^(\s*)(.*?)(\s*)$/s);
  if (!match || !match[2]) return value;
  const translated = translateSegment(match[2]);
  if (translated !== match[2]) return `${match[1]}${translated}${match[3]}`;

  let result = match[2];
  for (const [source, target] of Object.entries(zh).sort((a, b) => b[0].length - a[0].length)) {
    if (result.includes(source)) result = result.split(source).join(target);
  }
  result = result
    .replace(/Family (\d+)/g, "家庭 $1")
    .replace(/ \(test scenarios\)/g, "（测试场景）")
    .replace(/ PORT$/, "端")
    .replace(/files total$/, "份档案")
    .replace(/stored on this device$/, "保存在本设备")
    .replace(/after video completion$/, "影片结束后开始计时")
    .replace(/ project cover$/, "项目封面");
  return `${match[1]}${result}${match[3]}`;
}

const textSource = new WeakMap<Text, string>();
const renderedText = new WeakMap<Text, string>();
const attributeSource = new WeakMap<Element, Map<string, string>>();
const renderedAttributes = new WeakMap<Element, Map<string, string>>();
const translatableAttributes = ["aria-label", "placeholder", "title", "alt"] as const;

function updateTree(root: Node, language: InterfaceLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const nodes: Node[] = [];
  if (root.nodeType === Node.TEXT_NODE || root.nodeType === Node.ELEMENT_NODE) nodes.push(root);
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const parent = text.parentElement;
      if (!parent || parent.closest("[data-no-translate]") || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue;
      if (!textSource.has(text) || (renderedText.has(text) && text.data !== renderedText.get(text))) textSource.set(text, text.data);
      const source = textSource.get(text) ?? text.data;
      const next = language === "zh" ? translateInterfaceText(source) : source;
      if (text.data !== next) text.data = next;
      renderedText.set(text, next);
      continue;
    }
    const element = node as Element;
    if (element.closest("[data-no-translate]")) continue;
    let stored = attributeSource.get(element);
    if (!stored) {
      stored = new Map<string, string>();
      attributeSource.set(element, stored);
    }
    let rendered = renderedAttributes.get(element);
    if (!rendered) {
      rendered = new Map<string, string>();
      renderedAttributes.set(element, rendered);
    }
    for (const attribute of translatableAttributes) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      if (!stored.has(attribute) || (rendered.has(attribute) && current !== rendered.get(attribute))) stored.set(attribute, current);
      const source = stored.get(attribute) ?? current;
      const next = language === "zh" ? translateInterfaceText(source) : source;
      if (current !== next) element.setAttribute(attribute, next);
      rendered.set(attribute, next);
    }
  }
}

export function useInterfaceTranslation(language: InterfaceLanguage) {
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    document.title = language === "zh" ? "Inattentive Robot · 研究平台" : "Inattentive Robot · Research Platform";
    let translating = false;
    const apply = (root: Node) => {
      if (translating) return;
      translating = true;
      updateTree(root, language);
      translating = false;
    };
    apply(document.body);
    const observer = new MutationObserver((mutations) => {
      if (translating) return;
      for (const mutation of mutations) {
        if (mutation.type === "characterData") apply(mutation.target);
        if (mutation.type === "attributes") apply(mutation.target);
        for (const node of mutation.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: [...translatableAttributes], childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
}
