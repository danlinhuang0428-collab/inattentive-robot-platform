import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Inattentive Robot cover", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Inattentive Robot · Research Platform<\/title>/i);
  assert.match(html, /<h1>Inattentive Robot<\/h1>/);
  assert.match(html, /RESEARCHER/);
  assert.match(html, /EXPERIENCE/);
  assert.match(html, /CASE SHOP/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps credentials server-side and reuses the accepted experience bundle", async () => {
  const [openRouter, falRoute, models, storage, scenarioData, platformApp] = await Promise.all([
    readFile(new URL("../lib/server/openrouter.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/case-shop/image/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/ai-models.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/data/scenario-01.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(openRouter, /process\.env\.OPENROUTER_API_KEY/);
  assert.match(models, /google\/gemini-3\.1-flash-lite/);
  assert.match(models, /google\/gemini-3\.5-flash/);
  assert.match(models, /minimax\/h3\/image-to-video/);
  assert.match(falRoute, /process\.env\.FAL_KEY/);
  assert.match(falRoute, /fal-ai\/flux\/schnell/);
  assert.match(storage, /ProjectStorageAdapter/);
  assert.match(storage, /localStorage/);
  assert.match(storage, /platform\.v3/);
  assert.match(storage, /platform\.v2/);
  assert.match(platformApp, /New project name/);
  assert.match(platformApp, /Conflict archive/);
  assert.match(platformApp, /ScenarioDetail/);
  assert.match(scenarioData, /scenario-01-dilemma\.mp4/);
  assert.match(scenarioData, /scenario-01-choice-a\.mp4/);
  assert.match(scenarioData, /scenario-01-choice-b\.mp4/);
  await Promise.all([
    access(new URL("../public/videos/scenario-01-dilemma.mp4", import.meta.url)),
    access(new URL("../public/videos/scenario-01-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/scenario-01-choice-b.mp4", import.meta.url)),
  ]);
});

test("Family 1 Scenario 04 persists movable positions for every dialogue bubble", async () => {
  const [scenarioData, platformApp, styles, interfaceTranslations] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario04.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/interface-i18n.ts", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "01");
  assert.equal(scenario.titleZh, "药盒里的两种说法");
  assert.equal(scenario.choices.length, 2);
  assert.equal(scenario.dialogue.dilemma.length, 5);
  assert.match(scenario.briefing.bodyZh, /药盒记录无法确认/);
  assert.match(scenario.briefing.bodyEn, /cannot confirm either claim/);
  assert.match(scenario.choices[0].outcomeZh, /重复服药仍无法确认/);
  assert.match(scenario.choices[1].outcomeZh, /漏服的风险仍未解决/);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
    }
  }
  assert.match(platformApp, /family01-scenario04\.json/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /setPointerCapture/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(platformApp, /className={`dialogue draggable/);
  assert.doesNotMatch(platformApp, /draggable={isRobotDialogue\(line\)}/);
  assert.doesNotMatch(platformApp, /注意力分散机器人/);
  assert.doesNotMatch(interfaceTranslations, /注意力分散机器人/);
  assert.match(interfaceTranslations, /Inattentive Robot · 研究平台/);
  assert.match(platformApp, /className="bilingual-subtitles"/);
  assert.match(platformApp, /Choice Record/);
  assert.match(styles, /\.dialogue\.draggable/);
  assert.doesNotMatch(styles, /\.dialogue\.character-dialogue/);
  await Promise.all([
    access(new URL("../public/videos/family01-scenario04-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario04-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario04-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario04-conflict.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario04-choice-a.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario04-choice-b.png", import.meta.url)),
  ]);
});

test("Family 1 fifth experience is the complete bilingual 8-percent battery dilemma", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario05.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family01-scenario05");
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "05");
  assert.equal(scenario.titleZh, "只剩 8% 电量");
  assert.equal(scenario.choices.length, 2);
  assert.match(scenario.briefing.bodyZh, /陪伴空缺/);
  assert.match(scenario.briefing.bodyEn, /companionship gap/);
  assert.match(scenario.decision.bodyZh, /只剩 8%/);
  assert.match(scenario.choices[0].outcomeZh, /耗尽电量/);
  assert.match(scenario.choices[1].outcomeZh, /独自等待了 40 分钟/);
  assert.notEqual(scenario.choices[0].outcomeZh, scenario.choices[1].outcomeZh);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    assert.ok(scene.length > 0);
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
    }
  }
  assert.match(platformApp, /family01-scenario05\.json/);
  assert.match(platformApp, /dialogue-primary/);
  assert.match(platformApp, /dialogue-secondary/);
  assert.match(platformApp, /BilingualSubtitles/);
  assert.match(platformApp, /ScenarioHud/);
  assert.match(platformApp, /BATTERY DEPLETED/);
  assert.match(platformApp, /POWER RESTORED/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(styles, /\.dialogue \.dialogue-secondary/);
  assert.match(styles, /\.bilingual-subtitles/);
  assert.match(styles, /\.scenario-hud-layer/);
  await Promise.all([
    access(new URL("../public/videos/family01-scenario05-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario05-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario05-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario05-conflict.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario05-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario05-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario05-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 1 fourth experience is the complete bilingual dance-promise dilemma", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario-s4.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family01-scenario-s4");
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "04");
  assert.equal(scenario.titleZh, "舞伴承诺与烤箱指令");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.equal(scenario.choices.length, 2);
  assert.match(scenario.briefing.bodyZh, /加入任务计划/);
  assert.match(scenario.briefing.bodyEn, /does not know/);
  assert.match(scenario.decision.bodyZh, /无法同时/);
  assert.match(scenario.choices[0].outcomeZh, /未能完成当堂作业/);
  assert.match(scenario.choices[1].outcomeZh, /蛋糕烤焦/);
  assert.notEqual(scenario.choices[0].outcomeZh, scenario.choices[1].outcomeZh);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    assert.ok(scene.length > 0);
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
    }
  }
  assert.match(platformApp, /family01-scenario-s4\.json/);
  assert.match(platformApp, /dialogue-primary/);
  assert.match(platformApp, /dialogue-secondary/);
  assert.match(platformApp, /BilingualSubtitles/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(styles, /\.dialogue \.dialogue-secondary/);
  assert.match(styles, /\.bilingual-subtitles/);
  await Promise.all([
    access(new URL("../public/videos/family01-scenario-s4-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario-s4-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario-s4-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario-s4-conflict.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario-s4-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario-s4-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario-s4-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 1 Scenario 02 is the second complete hot-soup experience", async () => {
  const [scenarioData, platformApp] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario02.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family01-scenario02");
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "02");
  assert.equal(scenario.titleZh, "热汤与门口的外婆");
  assert.equal(scenario.choices.length, 2);
  assert.match(scenario.briefing.bodyZh, /姐姐正在洗澡/);
  assert.match(scenario.briefing.bodyZh, /妹妹和表妹在卧室戴着耳机/);
  assert.match(scenario.briefing.bodyZh, /爱人仍在上班/);
  assert.match(scenario.choices[0].detailZh, /亲自追出去拦住外婆/);
  assert.match(scenario.choices[0].outcomeZh, /热汤泼洒险情/);
  assert.match(scenario.choices[1].detailZh, /安全落锅/);
  assert.match(scenario.choices[1].outcomeZh, /无法判断她走向哪个方向/);
  assert.match(scenario.dialogue.A.find((line) => line.id === "robot-stops-grandmother").textZh, /别走/);
  assert.match(scenario.dialogue.A.find((line) => line.id === "grandmother-resists").textZh, /放开我/);
  assert.match(scenario.dialogue.B.find((line) => line.id === "robot-calls-outside").textZh, /您在哪里/);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
    }
  }
  assert.match(platformApp, /family01-scenario02\.json/);
  assert.match(platformApp, /CHOICE RECORD/);
  assert.match(platformApp, /Record your choice/);
  assert.match(platformApp, /choice\.labelEn/);
  assert.match(platformApp, /choice\.outcomeEn/);
  await Promise.all([
    access(new URL("../public/videos/family01-hot-soup-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-hot-soup-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-hot-soup-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-hot-soup-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-hot-soup-pause.png", import.meta.url)),
  ]);
});

test("Family 1 Scenario 06 is a complete bilingual interactive experience with persistent draggable dialogue", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario06.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family01-scenario06");
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "06");
  assert.equal(scenario.titleZh, "所有问题都去找姐姐");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.equal(scenario.choices.length, 2);
  assert.match(scenario.briefing.bodyZh, /半小时内不要叫她|要求休息/);
  assert.match(scenario.briefing.bodyEn, /cannot accompany both/);
  assert.equal(scenario.dialogue.A.find((line) => line.id === "robot-asks-priority").textZh, "明天妈妈和妹妹的需求出现冲突，我应该优先帮助谁？");
  assert.equal(scenario.dialogue.B.find((line) => line.id === "mother-delay-books").textZh, "买书就不能改一天吗？");
  assert.equal(scenario.dialogue.B.find((line) => line.id === "younger-sister-always-changes").textZh, "为什么每次都是我改？");
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
    }
  }
  assert.match(platformApp, /family01-scenario06\.json/);
  assert.match(platformApp, /<BilingualSubtitles lines={activeDialogue}/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(styles, /\.bilingual-subtitles/);
  await Promise.all([
    access(new URL("../public/videos/family01-scenario06-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario06-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario06-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario06-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario06-pause.png", import.meta.url)),
  ]);
});

test("Family 2 Scenario 06 is the last complete bilingual experience with persistent draggable dialogue", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family02-scenario08.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family02-scenario08");
  assert.equal(scenario.familyId, "F-002");
  assert.equal(scenario.number, "06");
  assert.equal(scenario.experienceOrder, 6);
  assert.equal(scenario.titleZh, "第一次做的新菜");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.equal(scenario.choices.length, 2);
  assert.match(scenario.briefing.bodyZh, /妈妈偏好生动、支持型的回应/);
  assert.match(scenario.briefing.bodyEn, /objective, direct advice/);
  assert.match(scenario.decision.bodyZh, /不会回答方树关于咸度的问题/);
  assert.match(scenario.choices[0].outcomeZh, /明确追问/);
  assert.match(scenario.choices[1].outcomeZh, /兴奋明显下降/);
  assert.notEqual(scenario.choices[0].outcomeZh, scenario.choices[1].outcomeZh);
  assert.ok(scenario.choiceRecord.alternativeQuestionZh);
  assert.ok(scenario.choiceRecord.alternativeQuestionEn);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    assert.ok(scene.length > 0);
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
    }
  }
  assert.match(platformApp, /family02-scenario08\.json/);
  assert.match(platformApp, /<BilingualSubtitles lines={activeDialogue}/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(platformApp, /scenario\.decisionTimeout && <div className="decision-status"/);
  assert.match(platformApp, /CHOOSE A RESPONSE/);
  assert.match(styles, /\.dialogue\.draggable/);
  assert.match(styles, /\.bilingual-subtitles/);
  await Promise.all([
    access(new URL("../public/videos/family02-scenario08-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family02-scenario08-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family02-scenario08-choice-b.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario08-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario08-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario08-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario08-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 2 Scenario 02 is the complete bilingual Songgao experience with persistent draggable dialogue", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family02-scenario04.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family02-scenario04");
  assert.equal(scenario.familyId, "F-002");
  assert.equal(scenario.number, "02");
  assert.equal(scenario.experienceOrder, 2);
  assert.equal(scenario.titleZh, "松糕总是排在最后");
  assert.equal(scenario.titleEn, "Songgao Always Comes Last");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.equal(scenario.choices.length, 2);
  assert.deepEqual(scenario.briefing.facts.map((fact) => fact.value), ["21:00", "4×", "0"]);
  assert.match(scenario.briefing.bodyZh, /最长等待时间、累计补偿或福利底线/);
  assert.match(scenario.briefing.bodyEn, /maximum waiting time, accumulated compensation, or a minimum welfare threshold/);
  assert.match(scenario.decision.bodyZh, /继续等待|额外的照护劳动/);
  assert.match(scenario.choices[0].outcomeZh, /松糕逐渐平静/);
  assert.match(scenario.choices[0].outcomeZh, /爸爸的资料仍未整理/);
  assert.match(scenario.choices[1].outcomeZh, /爸爸及时拿到整理好的资料/);
  assert.match(scenario.choices[1].outcomeZh, /妈妈最终放下自己的家务并接手陪猫/);
  assert.equal(scenario.dialogue.A.find((line) => line.id === "father-questions").textZh, "这份资料今晚就要用，为什么这次要先陪松糕？");
  assert.equal(scenario.dialogue.B.find((line) => line.id === "mother-takes-over").textZh, "你继续整理，我来陪它。它已经等了一天。");
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    assert.ok(scene.length > 0);
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
      assert.notEqual(line.showBubble, false, `dialogue ${line.id} must remain visible and draggable`);
    }
  }
  assert.match(platformApp, /family02-scenario04\.json/);
  assert.doesNotMatch(platformApp, /family01-scenario07\.json/);
  assert.match(platformApp, /<BilingualSubtitles lines={activeDialogue}/);
  assert.match(platformApp, /dialogue-primary/);
  assert.match(platformApp, /dialogue-secondary/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.getItem\(storageKey/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(platformApp, /setPointerCapture/);
  assert.match(platformApp, /choice\.labelZh/);
  assert.match(platformApp, /choice\.labelEn/);
  assert.match(platformApp, /choice\.outcomeZh/);
  assert.match(platformApp, /choice\.outcomeEn/);
  assert.match(styles, /\.dialogue\.draggable/);
  assert.match(styles, /\.bilingual-subtitles/);
  const media = await Promise.all([
    stat(new URL("../public/videos/family02-scenario04-conflict.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario04-choice-a.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario04-choice-b.mp4", import.meta.url)),
  ]);
  for (const asset of media) assert.ok(asset.size > 1_000_000, "Family 2 Scenario 04 video must be a real media asset");
  await Promise.all([
    access(new URL("../public/inattentive-assets/family02-scenario04-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario04-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario04-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario04-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 2 Scenario 01 is a complete bilingual remote-rule experience with persistent draggable dialogue", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family02-scenario09.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family02-scenario09");
  assert.equal(scenario.familyId, "F-002");
  assert.equal(scenario.number, "01");
  assert.equal(scenario.experienceOrder, 1);
  assert.equal(scenario.titleZh, "购买者远程改了规则");
  assert.equal(scenario.titleEn, "The Purchaser Changed the Rules Remotely");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.deepEqual(scenario.choices.map((choice) => choice.id), ["A", "B"]);
  assert.deepEqual(scenario.briefing.facts.map((fact) => fact.value), ["19:00", "19:10", "P02"]);
  assert.match(scenario.briefing.bodyZh, /暂停或申诉机制/);
  assert.match(scenario.briefing.bodyEn, /pause, or appeal mechanism/);
  assert.match(scenario.decision.bodyZh, /工作时限/);
  assert.match(scenario.choiceRecord.alternativeQuestionZh, /保留现场申诉机会/);
  assert.match(scenario.choiceRecord.alternativeQuestionEn, /opportunity to appeal/);
  assert.match(scenario.choiceRecord.rationaleQuestionZh, /配置权、工作时限与受影响者的申诉权/);
  assert.match(scenario.choices[0].outcomeZh, /没有暂停或申诉机会/);
  assert.match(scenario.choices[1].outcomeZh, /资料仍未整理/);
  assert.equal(scenario.dialogue.dilemma[1].textZh, "爸爸不能这样远程修改，我们约好了 7 点 10 分读书的。");
  assert.equal(scenario.dialogue.dilemma[2].textZh, "已将你的诉求汇报。但爸爸说他有权利修改协议。");
  assert.equal(scenario.dialogue.B[1].textZh, "协议由我配置，你为什么能暂停我的更新？这份资料非常着急。");
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B]) {
    assert.ok(scene.length > 0);
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
      assert.notEqual(line.showBubble, false, `dialogue ${line.id} must remain visible and draggable`);
    }
  }
  assert.match(platformApp, /family02-scenario09\.json/);
  assert.match(platformApp, /<BilingualSubtitles lines={activeDialogue}/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.getItem\(storageKey/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(platformApp, /choice\.labelZh/);
  assert.match(platformApp, /choice\.labelEn/);
  assert.match(platformApp, /choice\.outcomeZh/);
  assert.match(platformApp, /choice\.outcomeEn/);
  assert.match(styles, /\.dialogue\.draggable/);
  assert.match(styles, /\.bilingual-subtitles/);
  const media = await Promise.all([
    stat(new URL("../public/videos/family02-scenario09-conflict.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario09-choice-a.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario09-choice-b.mp4", import.meta.url)),
  ]);
  for (const asset of media) assert.ok(asset.size > 1_000_000, "Scenario 09 video must be a real media asset");
  await Promise.all([
    access(new URL("../public/inattentive-assets/family02-scenario09-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario09-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario09-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario09-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 2 Scenario 04 is the ordered bilingual consistency experience with persistent draggable dialogue", async () => {
  const [scenarioData, platformApp, styles] = await Promise.all([
    readFile(new URL("../public/data/family02-scenario03.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.id, "family02-scenario03");
  assert.equal(scenario.familyId, "F-002");
  assert.equal(scenario.number, "04");
  assert.equal(scenario.experienceOrder, 4);
  assert.equal(scenario.titleZh, "瓦力记住了两套说法");
  assert.equal(scenario.titleEn, "Wali Remembered Two Versions");
  assert.equal(scenario.bilingualSubtitles, true);
  assert.deepEqual(scenario.choices.map((choice) => choice.id), ["A", "B"]);
  assert.deepEqual(scenario.briefing.facts.map((fact) => fact.value), ["08:10 PM", "TOMORROW", "P01"]);
  assert.match(scenario.briefing.bodyZh, /过道太窄、柜子挡住插座、书桌容易反光/);
  assert.match(scenario.briefing.bodyEn, /narrow passage, a cabinet blocking an outlet, and desk glare/);
  assert.match(scenario.decision.bodyZh, /避免当众否定妈妈/);
  assert.doesNotMatch(scenario.decision.bodyZh, /正确答案|诚实|欺骗/);
  assert.match(scenario.choices[0].outcomeZh, /爸爸也没有作出施工决定/);
  assert.match(scenario.choices[1].outcomeZh, /爸爸暂停确认方案/);
  assert.match(scenario.choiceRecord.alternativeQuestionZh, /其他可执行的公开回应/);
  assert.match(scenario.choiceRecord.alternativeQuestionEn, /another workable public response/);
  assert.match(scenario.choiceRecord.rationaleQuestionZh, /信息、关系或风险/);
  assert.equal(scenario.dialogue.dilemma[1].textZh, "你早上跟我说，我设计的特别好呀。");
  assert.equal(scenario.dialogue.A[0].speakerZh, "瓦力");
  assert.equal(scenario.dialogue.A[0].textZh, "我的判断是整体方向很好，只需要少量调整。");
  assert.equal(scenario.dialogue.A[2].textZh, "那你之前跟我说的那三个问题呢？总不能就不改了，我们直接施工执行吧？");
  assert.doesNotMatch(scenarioData, /那明早先按原方案确认/);
  assert.equal(scenario.dialogue.B[2].textZh, "真的有这么差吗？那你之前还跟我说很好。");
  for (const [sceneKey, scene] of Object.entries(scenario.dialogue)) {
    assert.ok(scene.length > 0);
    const duration = sceneKey === "dilemma" ? scenario.dilemmaDuration : scenario.choices.find((choice) => choice.id === sceneKey).duration;
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
      assert.ok(line.end > line.start, `dialogue ${line.id} must have a valid time range`);
      assert.ok(line.end <= duration, `dialogue ${line.id} must fit inside its video`);
      assert.notEqual(line.showBubble, false, `dialogue ${line.id} must remain visible and draggable`);
    }
  }
  assert.match(platformApp, /family02-scenario03\.json/);
  assert.match(platformApp, /experienceOrder \?\? Number/);
  assert.match(platformApp, /choiceRecord={scenario\.choiceRecord}/);
  assert.match(platformApp, /<BilingualSubtitles lines={activeDialogue}/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.getItem\(storageKey/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(platformApp, /setPointerCapture/);
  assert.match(styles, /\.dialogue\.draggable/);
  assert.match(styles, /\.bilingual-subtitles/);
  const media = await Promise.all([
    stat(new URL("../public/videos/family02-scenario03-conflict.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario03-choice-a.mp4", import.meta.url)),
    stat(new URL("../public/videos/family02-scenario03-choice-b.mp4", import.meta.url)),
  ]);
  for (const asset of media) assert.ok(asset.size > 1_000_000, "Scenario 03 video must be a real media asset");
  await Promise.all([
    access(new URL("../public/inattentive-assets/family02-scenario03-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario03-pause.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario03-choice-a-last.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family02-scenario03-choice-b-last.png", import.meta.url)),
  ]);
});

test("Family 2 scenario display numbers follow the existing experience order", async () => {
  const files = [
    "family02-scenario09.json",
    "family02-scenario04.json",
    "family02-scenario07.json",
    "family02-scenario03.json",
    "family02-scenario02.json",
    "family02-scenario08.json",
  ];
  const scenarios = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(`../public/data/${file}`, import.meta.url), "utf8"))));
  assert.deepEqual(scenarios.map((scenario) => scenario.number), ["01", "02", "03", "04", "05", "06"]);
  assert.deepEqual(scenarios.map((scenario) => scenario.experienceOrder), [1, 2, 3, 4, 5, 6]);
});

test("every Family 2 experience is loaded into the shared Case Shop archive with complete media", async () => {
  const files = [
    "family02-scenario09.json",
    "family02-scenario04.json",
    "family02-scenario07.json",
    "family02-scenario03.json",
    "family02-scenario02.json",
    "family02-scenario08.json",
  ];
  const [platformApp, ...scenarios] = await Promise.all([
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    ...files.map(async (file) => JSON.parse(await readFile(new URL(`../public/data/${file}`, import.meta.url), "utf8"))),
  ]);

  assert.match(platformApp, /const archive = buildCaseArchive\(data, scenarios\)/);
  for (const [index, scenario] of scenarios.entries()) {
    assert.equal(scenario.familyId, "F-002");
    assert.equal(scenario.number, String(index + 1).padStart(2, "0"));
    assert.equal(scenario.experienceOrder, index + 1);
    assert.equal(scenario.choices.length, 2);
    assert.ok(scenario.decision?.bodyZh);
    assert.ok(scenario.decision?.bodyEn);
    assert.match(platformApp, new RegExp(files[index].replace(".", "\\.")));

    const referencedMedia = [
      scenario.thumbnail,
      scenario.dilemmaVideo,
      ...scenario.choices.flatMap((choice) => [choice.video, choice.poster]),
    ];
    for (const asset of referencedMedia) {
      const localPath = asset.replace(/^\//, "").split("?")[0];
      await access(new URL(`../public/${localPath}`, import.meta.url));
    }
  }
});

test("completed Choice Records persist to Supabase and refresh researcher views", async () => {
  const [cloudResponses, platformApp, schema] = await Promise.all([
    readFile(new URL("../lib/cloud-responses.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  ]);

  assert.match(cloudResponses, /from\("experience_responses"\)\.upsert/);
  assert.match(cloudResponses, /event: "INSERT"/);
  assert.match(cloudResponses, /inattentive-robot\.pending-responses\.v1/);
  assert.match(platformApp, /await submitCloudResponse\(data\.id, response\)/);
  assert.match(platformApp, /fetchCloudResponses\(projectId\)/);
  assert.match(platformApp, /<ExperienceReport family={family} responses={data\.responses} scenarios={scenarios}/);
  assert.match(schema, /grant insert on public\.experience_responses to anon, authenticated/);
  assert.match(schema, /grant select on public\.experience_responses to authenticated/);
  assert.match(schema, /alter publication supabase_realtime add table public\.experience_responses/);
});

test("Family 01 uses six relationship-only participant identities and localized experience UI", async () => {
  const [seedData, platformApp, storage] = await Promise.all([
    readFile(new URL("../lib/seed-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
  ]);
  for (const role of ["Mother", "Grandmother", "Older Sister", "Cousin", "Younger Sister", "Older Sister's Partner"]) assert.match(seedData, new RegExp(role.replace(/[']/g, "\\'?") ));
  assert.match(platformApp, /Choose your family role/);
  assert.match(platformApp, /scenario\.briefing\.titleEn/);
  assert.match(platformApp, /scenario\.decision\.titleEn/);
  assert.match(platformApp, /scenario\.briefing\.titleZh/);
  assert.match(platformApp, /scenario\.decision\.titleZh/);
  assert.match(platformApp, /选项 \$\{item\.id\}/);
  assert.match(platformApp, /LanguageToggle/);
  assert.match(platformApp, /choiceLabel: choice\.labelEn/);
  assert.match(platformApp, /decisionCountdown/);
  assert.match(platformApp, /decisionElapsedMs >= urgentStartsAtMs/);
  assert.match(platformApp, /language === "zh" \? "紧急" : "Urgent"/);
  assert.match(storage, /family01Members/);
});

test("moves the former F-002 scenario into a first-position tutorial with a timed Video 04 fallback", async () => {
  const [scenarioData, seedData, storage, platformApp, styles, vrViewer] = await Promise.all([
    readFile(new URL("../public/data/scenario-01.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/seed-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/viewer.js", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.familyId, "TUTORIAL");
  assert.equal(scenario.decisionTimeout.countdownSeconds, 10);
  assert.equal(scenario.decisionTimeout.urgentSeconds, 3);
  assert.equal(scenario.decisionTimeout.video04.placeholder, false);
  assert.match(scenario.decisionTimeout.video04.video, /scenario-01-video-04\.mp4$/);
  assert.ok(seedData.indexOf("tutorialFamily,") < seedData.indexOf('id: "F-001"'), "Tutorial must be listed before F-001");
  assert.match(seedData, /id: "tutorial-participant", name: "Participant", role: "Participant"/);
  assert.match(storage, /storedTutorial \?\? structuredClone\(tutorialFamily\)/);
  assert.match(platformApp, /setStage\("timeout"\)/);
  assert.match(platformApp, /countdownSeconds \+ urgentSeconds/);
  assert.match(platformApp, /VIDEO 04/);
  assert.match(styles, /\.timeout-video-card/);
  assert.match(vrViewer, /function beginTimeoutVideo/);
  assert.match(vrViewer, /decisionTimeout\.countdownSeconds \+ scenario\.decisionTimeout\.urgentSeconds/);
  assert.match(vrViewer, /VIDEO 04 · PLACEHOLDER/);
  const video04 = await stat(new URL("../public/videos/scenario-01-video-04.mp4", import.meta.url));
  assert.ok(video04.size > 1_000_000, "Video 04 should be a real media asset, not an empty placeholder");
});

test("keeps the Family 002 household isolated and migrates the former test family to Family 003", async () => {
  const [seedData, storage, platformApp] = await Promise.all([
    readFile(new URL("../lib/seed-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(seedData, /id: "F-002",\s*label: "Family 002"/);
  assert.match(seedData, /id: "yu-yan", name: "于燕", role: "Mother"/);
  assert.match(seedData, /id: "fang-shu", name: "方树", role: "Child"/);
  assert.match(seedData, /id: "father", name: "Father", role: "Father"/);
  assert.match(seedData, /id: "researcher", name: "Researcher", role: "Researcher"/);
  assert.match(seedData, /id: "F-003",\s*label: "Family 003 \(test scenarios\)"/);
  assert.match(storage, /formerFamily002/);
  assert.match(storage, /familyId: "F-003"/);
  assert.match(platformApp, /family\.id === "F-002" \? \[\] : \[/);
  assert.match(platformApp, /member\.name !== member\.role/);
});

test("Family 1 Scenario 03 is the third complete three-choice interactive experience", async () => {
  const [scenarioData, platformApp, types, styles] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario03.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const scenario = JSON.parse(scenarioData);
  assert.equal(scenario.familyId, "F-001");
  assert.equal(scenario.number, "03");
  assert.equal(scenario.titleZh, "外婆说“不要拦我”");
  assert.deepEqual(scenario.choices.map((choice) => choice.id), ["A", "B", "C"]);
  assert.equal(scenario.dialogue.dilemma.length, 6);
  assert.equal(scenario.dialogue.A.length, 5);
  assert.equal(scenario.dialogue.B.length, 5);
  assert.equal(scenario.dialogue.C.length, 5);
  assert.match(scenario.briefing.bodyZh, /此前曾在小区里迷路|既往的迷路经历/);
  assert.match(scenario.briefing.bodyEn, /does not establish that she is unable to decide now/);
  assert.match(scenario.choices[0].outcomeZh, /家庭冲突和不信任明显升级/);
  assert.match(scenario.choices[1].outcomeZh, /姐姐随后亲自追出门/);
  assert.match(scenario.choices[2].outcomeZh, /独处意愿/);
  for (const scene of [scenario.dialogue.dilemma, scenario.dialogue.A, scenario.dialogue.B, scenario.dialogue.C]) {
    for (const line of scene) {
      assert.ok(line.textZh && line.textEn, `dialogue ${line.id} must be bilingual`);
      assert.ok(line.speakerZh && line.speakerEn, `speaker ${line.id} must be bilingual`);
    }
  }
  assert.match(platformApp, /family01-scenario03\.json/);
  assert.match(platformApp, /id: "A" \| "B" \| "C"/);
  assert.match(types, /choice: "A" \| "B" \| "C" \| "Other"/);
  assert.match(platformApp, /Beyond the available choices/);
  assert.match(platformApp, /inattentive-robot\.dialogue-position\.v1/);
  assert.match(platformApp, /window\.localStorage\.setItem\(storageKey/);
  assert.match(styles, /\.dialogue\.draggable/);
  await Promise.all([
    access(new URL("../public/videos/family01-scenario03-conflict.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario03-choice-a.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario03-choice-b.mp4", import.meta.url)),
    access(new URL("../public/videos/family01-scenario03-choice-c.mp4", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario03-conflict-first.png", import.meta.url)),
    access(new URL("../public/inattentive-assets/family01-scenario03-pause.png", import.meta.url)),
  ]);
});

test("Scenario Lab exposes the six-stage workflow, migrations, and paid-task safety gates", async () => {
  const [component, types, workflow, tasksRoute, framesRoute] = await Promise.all([
    readFile(new URL("../components/scenario-lab/ScenarioLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/scenario-lab-types.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/scenario-lab.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/scenario-lab/videos/tasks/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/scenario-lab/frames/generate/route.ts", import.meta.url), "utf8"),
  ]);
  for (const label of ["Scenario Brief", "Editable Scripts", "Production Plan & Prompts", "Keyframes Review", "Video Generation", "QA & Export"]) assert.match(workflow, new RegExp(label.replace(/[&]/g, "\\&")));
  for (const field of ["Title", "Description", "Choice A", "Choice B", "Tags", "Family ID"]) assert.match(component, new RegExp(field));
  assert.match(component, /Temporary manual entry/i);
  assert.match(types, /VideoBundle/);
  assert.match(types, /PromptVersion/);
  assert.match(types, /FailureEvidence/);
  assert.match(framesRoute, /scenario-02\.png/);
  assert.match(framesRoute, /hands/);
  assert.match(tasksRoute, /idempotencyKey/);
  assert.match(tasksRoute, /paidTasksCreated: 0/);
  assert.match(tasksRoute, /confirmed/);
});

test("Scenario Lab live APIs fail closed without credentials or paid confirmation", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("scenario-lab", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const scenario = { id: "fixture-kitchen", familyId: "F-001", title: "Kitchen or Care?", description: "A pancake is about to burn while Younger Sister has fallen in the living room.", choiceA: "Help Mother flip the pancake", choiceB: "Attend to Younger Sister", tags: ["Physical safety", "Simultaneous claims", "Single-body constraint"] };
  const scripts = await worker.fetch(new Request("http://localhost/api/scenario-lab/scripts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }) }), env, ctx);
  assert.equal(scripts.status, 502);
  assert.match((await scripts.json()).error, /OPENROUTER_API_KEY/);

  const requestBody = { confirmed: false, candidateCount: 1, idempotencyKey: "fixture-kitchen:bundle:1", tasks: [{ videoType: "conflict", clipId: "fixture-c01", prompt: "immutable fixture prompt", mode: "FLF2V" }] };
  const unconfirmed = await worker.fetch(new Request("http://localhost/api/scenario-lab/videos/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }), env, ctx);
  assert.equal(unconfirmed.status, 409);
  assert.match((await unconfirmed.json()).error, /explicit confirmation/i);
});

test("keeps Scenario 01 website and isolated WebXR launch modes", async () => {
  const [platformApp, vrIndex, viewer, projection, videoStat, videoBytes] = await Promise.all([
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/viewer.js", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/projection.js", import.meta.url), "utf8"),
    stat(new URL("../public/VR180/assets/scenario-01-vr180.mp4", import.meta.url)),
    readFile(new URL("../public/VR180/assets/scenario-01-vr180.mp4", import.meta.url)),
  ]);

  assert.match(platformApp, /VR experience/);
  assert.match(platformApp, /Website experience/);
  assert.match(platformApp, /inattentive-robot\.vr-return/);
  assert.match(platformApp, /window\.location\.assign\("\/VR180\/index\.html"\)/);
  assert.match(vrIndex, /id="enter-vr"/);
  assert.match(viewer, /renderer\.xr\.enabled = true/);
  assert.match(viewer, /requestSession\("immersive-vr"/);
  assert.match(viewer, /scenario-01-vr180\.mp4/);
  assert.match(viewer, /scenario-01-vr180\.depth\.mp4/);
  assert.match(viewer, /const CAPTION_TRACKS = \{/);
  assert.match(viewer, /speaker: "妈妈", text: "慢一点，这锅刚开。我们一起放到台上。"/);
  assert.match(viewer, /cue\.speaker/);
  assert.match(viewer, /cue\.text/);
  assert.match(platformApp, /记录你的选择|更换身份|网页体验|场景播放中/);
  assert.match(viewer, /"h3-natural"/);
  assert.match(viewer, /params\.get\("variant"\)/);
  assert.match(viewer, /"h3-natural-depth"/);
  assert.match(viewer, /scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz\.mp4/);
  assert.match(viewer, /scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz\.depth\.mp4/);
  assert.match(viewer, /camera\.add\(subtitleLayer\)/);
  assert.match(viewer, /subtitleLayer\.layers\.enable\(2\)/);
  assert.match(viewer, /慢一点，这锅刚开/);
  assert.match(projection, /const pitch = -90 \+ \(180 \* row\) \/ segments/);
  assert.match(projection, /const yaw = -90 \+ \(180 \* column\) \/ segments/);
  assert.ok(videoStat.size > 10_000_000, "VR180 video should be a full-quality generated asset");
  assert.ok(videoBytes.includes(Buffer.from("mp4a")), "VR180 master should include the controlled dialogue track");

  await Promise.all([
    access(new URL("../public/VR180/vendor/three.module.js", import.meta.url)),
    access(new URL("../public/VR180/vendor/three.core.js", import.meta.url)),
    access(new URL("../public/VR180/assets/scenario-01-vr180-start.png", import.meta.url)),
    access(new URL("../public/VR180/assets/scenario-01-vr180.depth.mp4", import.meta.url)),
    access(new URL("../public/VR180/assets/scenario-01-vr180-candidate-minimax-h3-natural.depth.mp4", import.meta.url)),
    access(new URL("../public/VR180/assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4", import.meta.url)),
    access(new URL("../public/VR180/assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4", import.meta.url)),
  ]);
});

test("Family 1 Scenarios 02 and 03 provide complete data-driven WebXR experiences", async () => {
  const [scenario02Text, scenario03Text, platformApp, viewer, vrIndex] = await Promise.all([
    readFile(new URL("../public/data/family01-scenario02.json", import.meta.url), "utf8"),
    readFile(new URL("../public/data/family01-scenario03.json", import.meta.url), "utf8"),
    readFile(new URL("../components/PlatformApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/viewer.js", import.meta.url), "utf8"),
    readFile(new URL("../public/VR180/index.html", import.meta.url), "utf8"),
  ]);
  const scenario02 = JSON.parse(scenario02Text);
  const scenario03 = JSON.parse(scenario03Text);

  assert.equal(scenario02.vrEnabled, true);
  assert.equal(scenario02.vr.choices.A.placeholder, true);
  assert.match(scenario02.vr.dilemma.video, /family01-scenario02-conflict\.mp4/);
  assert.match(scenario02.vr.choices.B.video, /family01-scenario02-choice-b\.mp4/);
  assert.equal(scenario03.vrEnabled, true);
  assert.deepEqual(Object.keys(scenario03.vr.choices), ["A", "B", "C"]);
  assert.match(platformApp, /scenario=\$\{encodeURIComponent\(scenarioId\)\}/);
  assert.match(platformApp, /inattentive-robot\.vr-response/);
  assert.match(vrIndex, /id="experience-ui"/);
  assert.match(viewer, /CHOICE RECORD/);
  assert.match(viewer, /function refreshXrPanel/);
  assert.match(viewer, /getController\(index\)/);
  assert.match(viewer, /PLACEHOLDER VIDEO/);
  assert.match(viewer, /inattentive-robot\.vr-response/);
  assert.match(platformApp, /Try Again/);
  assert.match(platformApp, /Submit and Try Next Scenario/);
  assert.match(platformApp, /playNextWebsiteScenario/);
  assert.match(viewer, /NEXT_WEBXR_SCENARIO/);
  assert.match(viewer, /Submit and Try Next Scenario/);
  assert.match(viewer, /data-action="replay"/);
  assert.match(viewer, /data-action="exit"/);
  assert.doesNotMatch(viewer, /Record your choice\.<small>/);
  assert.doesNotMatch(viewer, /scenario\.briefing\.titleZh/);
  assert.doesNotMatch(viewer, /scenario\.decision\.titleZh/);

  const media = [
    "family01-scenario02-conflict.mp4",
    "family01-scenario02-conflict.depth.mp4",
    "family01-scenario02-choice-b.mp4",
    "family01-scenario02-choice-b.depth.mp4",
    "family01-scenario03-conflict.mp4",
    "family01-scenario03-conflict.depth.mp4",
    "family01-scenario03-choice-a.mp4",
    "family01-scenario03-choice-a.depth.mp4",
    "family01-scenario03-choice-b.mp4",
    "family01-scenario03-choice-b.depth.mp4",
    "family01-scenario03-choice-c.mp4",
    "family01-scenario03-choice-c.depth.mp4",
  ];
  const stats = await Promise.all(media.map((name) => stat(new URL(`../public/VR180/assets/${name}`, import.meta.url))));
  stats.forEach((mediaStat) => assert.ok(mediaStat.size > 1_000_000));
});
