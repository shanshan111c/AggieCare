export type ResourceCopy = { short: string; description: string; cost?: string };

// Official service names and addresses stay in English so students can find
// the same wording on campus signs and in external navigation.
const zh: Record<string, ResourceCopy> = {
  "aggie-eats": { short: "热餐", description: "现做餐食按能力付费，也可以付 $0；地图会指向当天的站点。", cost: "自定价格，可付 $0" },
  pantry: { short: "免费杂货", description: "提供免费食品、新鲜农产品、卫生用品及其他生活必需品，可直接前往。", cost: "免费 · 需 UC Davis 身份证件" },
  "aggie-compass": { short: "食品与日用品", description: "提供常温食品、调料、日用品和 CalFresh 申请帮助。AggieFresh 申请目前暂停，请查看官方页面更新。", cost: "UC Davis 学生免费" },
  freedge: { short: "社区冰箱", description: "户外共享冰箱提供捐赠的蔬果、罐头和独立包装食品；库存随时变化。", cost: "免费 · 库存不固定" },
  "acute-care": { short: "当日就诊", description: "处理突发疾病或受伤，并提供护士建议和当日心理危机咨询；不是急诊室。", cost: "急性诊疗：UC SHIP $0／无 UC SHIP $40；心理危机咨询 $0" },
  "health-34": { short: "上门支持", description: "在 Davis 校园内提供免费的非紧急医疗及心理健康支持；请先致电，团队会前来。", cost: "免费 · 全天候" },
  counseling: { short: "心理危机支持", description: "营业时间可到诊所寻求当日危机咨询；非营业时间请致电获取支持。", cost: "免费" },
  "love-lab": { short: "安全性行为与经期用品", description: "免费提供安全套、口腔膜、润滑剂、卫生巾和卫生棉条等用品。", cost: "UC Davis 学生免费" },
  "hp-narcan": { short: "过量用药急救", description: "通过 Health Promotion 获取免费纳洛酮及药物过量应对信息。", cost: "免费" },
  "fentanyl-strips": { short: "药物检测试纸", description: "通过 Health Promotion 获取免费芬太尼检测试纸和安全使用教育。", cost: "免费" },
  "free-helmet": { short: "免费头盔", description: "完成简短的头盔安全培训后，可到 Health Promotion 或 Bike Barn 领取。", cost: "完成培训后免费" },
  care: { short: "保密支持", description: "为遭受性侵、骚扰、跟踪或亲密伴侣暴力的人提供免费保密支持。", cost: "免费 · 保密" },
  "mobile-pantry-scc": { short: "周一流动食品站", description: "在 Student Community Center 领取免费食品；出发前请核对本学期时间。", cost: "免费 · 需 UC Davis 身份证件" },
  "mobile-pantry-arc": { short: "周三流动食品站", description: "在 ARC 领取免费食品；出发前请核对本学期时间。", cost: "免费 · 需 UC Davis 身份证件" },
  "fruit-veggie-compass": { short: "免费新鲜蔬果", description: "可领取当季免费蔬果；请自带袋子，供应和时间可能变化。", cost: "免费 · 送完即止" },
  "fruit-veggie-coho": { short: "免费新鲜蔬果", description: "可领取当季免费蔬果；请自带袋子，供应和时间可能变化。", cost: "免费 · 送完即止" },
  "wrrc-pharmacy": { short: "免费个人用品", description: "提供经期用品、安全性行为用品、洗漱用品等；库存请向工作人员确认。", cost: "免费" },
  "wrrc-referral": { short: "保密转介空间", description: "为经历性暴力或亲密关系暴力的人提供可直接前往的支持空间，并协助联系适当服务；不是心理咨询，保密也有例外。紧急倡导支持请联系 CARE。", cost: "官网未列收费 · 请先确认开放时间" },
  "lgbtq-closet": { short: "免费服装", description: "提供性别肯定服装及束胸衣；请在资源中心开放时间前往，尺码不固定。", cost: "免费" },
  "aggie-reuse": { short: "免费二手衣物", description: "学生运营的免费商店，提供二手衣物、学习用品和少量生活用品；库存不固定，学校假日关闭。", cost: "免费" },
  "lsa-professional-closet": { short: "免费面试服装", description: "King Hall 学生休息室后方提供捐赠的职业服装和鞋；出发前请确认库存与进入方式。", cost: "免费" },
  "bike-barn-checkup": { short: "免费自行车检查与打气", description: "Silo 的 Bike Barn 可免费检查、诊断、打气并做少量调整；正式维修或零件可能收费，请先询价。", cost: "检查与打气免费 · 维修可能收费" },
  "student-parent-space": { short: "学生家长空间", description: "有食品、零食、玩具和换尿布台；具体用品随时变化。", cost: "学生家长免费" },
  "love-lab-bag": { short: "非工作时间安全套", description: "Health Promotion 关闭时，可到 Student Health & Wellness Center 正门询问预装的 Love Lab 用品袋。", cost: "免费" },
  "wrrc-academic": { short: "免费打印与考试用品", description: "Joy Fergoda Library 每天可免费打印 10 页；期中及期末考试期间提供答题卡和考试本。", cost: "免费 · 考试用品仅考试期间" },
  "eop-academic": { short: "EOP 学习用品", description: "符合 EOP 资格的学生每天可领取两张答题卡和两本考试本，也可领取限量文具；需出示 AggieCard。打印不免费。", cost: "EOP 学生免费 · 打印收费" },
  "eop-snack-shack": { short: "EOP 零食站", description: "EOP Community Room 为 EOP 学生提供零食与饮料；库存会变化。", cost: "EOP 学生免费 · 库存不固定" },
  "eop-produce": { short: "每周免费蔬果", description: "EOP 学生在学年期间每周可到 EOP Center 外领取免费蔬果；日期和时间会变，请先查官方更新。", cost: "EOP 学生免费 · 时间不固定" },
  "eop-restroom-supplies": { short: "免费经期与安全性行为用品", description: "EOP Center 洗手间可匿名领取免费经期和安全性行为用品；仅在中心开放时可进入，库存不固定。", cost: "免费 · 库存不固定" },
  "eop-hair-closet": { short: "EOP 护发用品", description: "EOP Hair Closet 帮助黑人学生获取护发用品；官网未公布库存、领取方式或是否免费，请先联系确认。", cost: "需确认费用和库存" },
  "aggie-compass-diapers": { short: "尿布与婴儿用品", description: "Aggie Compass Diaper Closet 提供尿布、湿巾和配方奶；已从 WRRC 迁至 Aggie Compass，先向前台确认库存。", cost: "免费 · 库存不固定" },
};

export function resourceCopy(id: string, language: string, fallback: ResourceCopy): ResourceCopy {
  if (language !== "zh") return fallback;
  if (id.startsWith("satellite-")) return { short: "卫星食品储藏点", description: "Aggie Compass 提供的免费常温食品；库存及进入方式依所在建筑而定，请出发前核对。", cost: "免费 · 库存不固定" };
  return zh[id] || fallback;
}

export function resourceCategory(category: string, language: string) {
  if (language !== "zh") return category;
  return ({ Food: "食物", "Basic needs": "基本需求", Medical: "医疗", "Mental health": "心理健康", Supplies: "免费用品", Safety: "安全支持" } as Record<string, string>)[category] || category;
}
