"use client";

import { FormEvent, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { mapPoints, type MapCategory, type MapPoint } from "./map-data";
import { classifyEnglishRisk, englishCrisisQuery, searchEnglish } from "./english-search";
import { additionalResourcePrompts } from "./resource-prompts.ts";
import { isFreeFoodMapPoint, isMentalCrisisQuery } from "./resource-patches.ts";
import { resourceCategory, resourceCopy } from "./resource-localization.ts";
import siteContent from "./site-content.json";

type ScheduleBlock = { days: number[]; open: number; close: number; note?: string; label?: string };
type Schedule = ScheduleBlock | ScheduleBlock[] | "always" | "varies";
type Resource = {
  id: string;
  name: string;
  short: string;
  category: "Food" | "Basic needs" | "Medical" | "Mental health" | "Supplies" | "Safety";
  description: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  hours: Schedule;
  cost: string;
  phone?: string;
  phoneLabel?: string;
  url: string;
  keywords: string[];
  icon: string;
  navigationQuery?: string;
  scheduleValidThrough?: string;
  phoneAlways?: boolean;
};

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type AppLanguage = "en" | "zh" | "es" | "ko" | "ja" | "hi" | "fr";
type LocationStatus = "useMyLocation" | "locating" | "locationOn" | "locationOff" | "locationUnavailable" | "nearestFirstLabel" | "locationNotShared";
type CopyKey =
  "live" | "offline" | "titleA" | "titleB" | "subtitle" | "placeholder" | "search" | "language" | "languageNote" | "results" | "useful" | "openFirst" | "install" | "addHome" |
  "emergency" | "call911" | "call988" | "resourcesNav" | "exploreNav" | "programsNav" | "mapLabel" | "mapTitle" | "all" | "allCategories" | "everyLocation" | "places" | "mapCount" | "chooseMarker" | "mappedTo" | "indoorResource" | "navigate" | "appleMaps" | "officialMapSource" | "you" |
  "settings" | "app" | "location" | "locationNote" | "installDevices" | "newUpdates" | "campusResourceMap" | "campusResourceMapNote" | "crossPlatformNavigation" | "crossPlatformNavigationNote" | "about" | "officialResourceInformation" | "officialResourceNote" | "campusDetails" | "healthPromotionPrograms" | "healthPromotionTopic" |
  "basicNeeds" | "basicNeedsText" | "mentalHealth" | "mentalHealthText" | "urgentAssistance" | "urgentAssistanceText" | "freeFoodNow" | "freeFoodNowText" | "walkInHelp" | "walkInHelpText" | "nearestFirst" |
  "mentalCrisis" | "mentalCrisisText" | "call" | "text988" | "ucDavisCrisis" | "showingPlaces" | "relatedTo" | "resultsConsider" | "andDistance" | "callAction" | "officialInfo" | "relatedGuide" | "noExactMatch" | "topicGuideHint" | "searchHint" | "openSettings" | "clearSearch" | "dataNote" |
  "browseInstead" | "categories" | "goodMorning" | "whatNeed" | "searchCampus" | "freeGroceries" | "installable" | "promoTitle" | "promoText" | "installAggieCare" | "moreFromHp" | "programsTitle" | "programsText" | "viewOfficialSite" | "officialCampusInformation" | "detailsFromUcDavis" | "detailsText" | "footerNote" | "reviewed" |
  "installTitle" | "iphoneInstall" | "iphoneInstallText" | "androidInstall" | "androidInstallText" | "gotIt" | "announcementPoster" | "closePoster" |
  "useMyLocation" | "locating" | "locationOn" | "locationOff" | "locationUnavailable" | "nearestFirstLabel" | "locationNotShared" |
  "openNow" | "closedNow" | "open24" | "weekdayAccess" | "today" | "nextServiceDay" | "checkOfficialSchedule" | "miAway" | "open" | "closed" |
  "freePantry" | "freeFood" | "foodTruck" | "campusGarden" | "foodAccess" | "indoorPoint";

const languageOptions: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" }, { code: "zh", label: "中文" }, { code: "es", label: "Español" }, { code: "ko", label: "한국어" }, { code: "ja", label: "日本語" }, { code: "hi", label: "हिन्दी" }, { code: "fr", label: "Français" },
];
const enText: Record<CopyKey, string> = {
  live: "Live campus resource guide", offline: "Offline mode", titleA: "What do you need", titleB: "right now?", subtitle: "Fast access to free food, basic needs, health, safety, and mental-health support at UC Davis.", placeholder: "Try “free food open now”", search: "Search", language: "Language", languageNote: "Display language only. Search is normalized to English; map and navigation stay English.", results: "Smart results", useful: "Useful right now", openFirst: "Open now first", install: "Install app", addHome: "Add to Home Screen",
  emergency: "Emergency?", call911: "Call 911", call988: "Call or text 988", resourcesNav: "Resources", exploreNav: "Explore", programsNav: "Programs", mapLabel: "Campus resource map", mapTitle: "Find it nearby.", all: "All", allCategories: "All categories", everyLocation: "Every location", places: "places", mapCount: "building-level campus pins · tap a numbered point", chooseMarker: "Choose a numbered marker or location below.", mappedTo: "Mapped to", indoorResource: "Indoor resource", navigate: "Navigate", appleMaps: "Apple Maps", officialMapSource: "Locations imported from official UC Davis Narcan, Nap, Food Access, and Hydration maps.", you: "You",
  settings: "Settings", app: "App", location: "Location", locationNote: "used only on this device", installDevices: "iPhone, iPad, Android, and desktop", newUpdates: "New updates", campusResourceMap: "Campus resource map", campusResourceMapNote: "Narcan, rest, food, and water locations are now built in.", crossPlatformNavigation: "Cross-platform navigation", crossPlatformNavigationNote: "Choose universal navigation or Apple Maps.", about: "About", officialResourceInformation: "Official resource information", officialResourceNote: "UC Davis Student Health and Counseling Services", campusDetails: "Campus details", healthPromotionPrograms: "Health Promotion programs", healthPromotionTopic: "UC Davis Health Promotion topic",
  basicNeeds: "Basic Needs", basicNeedsText: "Food, housing & financial support", mentalHealth: "Mental Health", mentalHealthText: "Counseling and support options", urgentAssistance: "Urgent Assistance", urgentAssistanceText: "Emergency and after-hours campus help", freeFoodNow: "Free Food Now", freeFoodNowText: "Open campus food resources", walkInHelp: "Walk-in Help", walkInHelpText: "Medical and crisis care", nearestFirst: "nearest first",
  mentalCrisis: "Mental health crisis?", mentalCrisisText: "If you may hurt yourself or someone else, call 911. For immediate emotional crisis support, call or text 988.", call: "Call", text988: "Text 988", ucDavisCrisis: "UC Davis Crisis", showingPlaces: "Showing places", relatedTo: "related to", resultsConsider: "Results consider relevance, live hours", andDistance: ", and your distance", callAction: "Call", officialInfo: "Official info", relatedGuide: "We found a related guide", noExactMatch: "No exact match yet", topicGuideHint: "This looks more like a topic than a walk-in service. The official guide links are now in Settings.", searchHint: "Try describing the outcome you want, like “I need food,” “I feel sick,” or “I need someone to talk to.”", openSettings: "Open Settings", clearSearch: "Clear search", dataNote: "Hours and stock can change. Live status is calculated from published schedules; always check official information when timing is critical.",
  browseInstead: "Browse instead", categories: "Categories", goodMorning: "Good morning", whatNeed: "What do you need?", searchCampus: "Search campus", freeGroceries: "Free groceries", installable: "Installable, not another tab", promoTitle: "Your campus guide belongs on your Home Screen.", promoText: "Install Aggie Care like an app. It launches full-screen, keeps the resource directory available offline, and stays fast on campus Wi‑Fi.", installAggieCare: "Install Aggie Care", moreFromHp: "More from Health Promotion", programsTitle: "Programs & learning tools.", programsText: "Browse UC Davis Health Promotion workshops, trainings, and practical student guides. These details stay on the website and in Settings for the app.", viewOfficialSite: "View official site", officialCampusInformation: "Official campus information", detailsFromUcDavis: "Details from UC Davis.", detailsText: "Topic guides and official campus pages are collected here for the website and mirrored inside Settings for the app.", footerNote: "An independent interface for public UC Davis resources. Not an official emergency service.", reviewed: "Resource details reviewed September 30, 2026.",
  installTitle: "Install Aggie Care", iphoneInstall: "On iPhone / iPad", iphoneInstallText: "Tap the Share button in Safari, then choose Add to Home Screen.", androidInstall: "On Android / Chrome", androidInstallText: "Open the browser menu and choose Install app or Add to Home screen.", gotIt: "Got it", announcementPoster: "Announcement poster", closePoster: "Close poster",
  useMyLocation: "Use my location", locating: "Locating…", locationOn: "Location on", locationOff: "Location off", locationUnavailable: "Location unavailable", nearestFirstLabel: "Nearest first", locationNotShared: "Location not shared",
  openNow: "Open now", closedNow: "Closed now", open24: "Open 24 hours", weekdayAccess: "Weekday access", today: "Today", nextServiceDay: "Next service day", checkOfficialSchedule: "check official schedule", miAway: "mi away", open: "Open", closed: "Closed",
  freePantry: "Free pantry", freeFood: "Free food", foodTruck: "Food truck", campusGarden: "Campus garden", foodAccess: "Food access", indoorPoint: "Indoor point · exact placement pending field verification",
};
const uiText: Record<AppLanguage, Record<CopyKey, string>> = {
  en: enText,
  zh: { ...enText, live: "校园资源实时指南", offline: "离线模式", titleA: "你现在需要", titleB: "什么？", subtitle: "快速找到 UC Davis 免费食物、基本需求、健康、安全和心理支持资源。", placeholder: "试试“现在有免费食物吗”", search: "搜索", language: "显示语言", languageNote: "仅调整显示语言。搜索会先转成英文；地图和导航保持英文。", results: "智能结果", useful: "现在可用", openFirst: "营业中优先", install: "安装应用", addHome: "添加到主屏幕", emergency: "紧急情况？", call911: "拨打 911", call988: "拨打或短信 988", resourcesNav: "资源", exploreNav: "浏览", programsNav: "项目", mapLabel: "校园资源地图", mapTitle: "就在附近找找。", all: "全部", allCategories: "全部分类", everyLocation: "所有地点", places: "个地点", mapCount: "个建筑级校园点位 · 点击数字查看", chooseMarker: "请选择地图数字标点或下方地点。", mappedTo: "定位到", indoorResource: "室内资源", navigate: "导航", officialMapSource: "点位来自 UC Davis 官方 Narcan、休息、食物和饮水地图。", you: "你", settings: "设置", app: "应用", location: "位置", locationNote: "仅在本设备使用", installDevices: "iPhone、iPad、Android 和电脑", newUpdates: "新更新", campusResourceMap: "校园资源地图", campusResourceMapNote: "已内置 Narcan、休息、食物和饮水地点。", crossPlatformNavigation: "跨平台导航", crossPlatformNavigationNote: "可选择通用导航或 Apple Maps。", about: "关于", officialResourceInformation: "官方资源信息", campusDetails: "校园细则", healthPromotionPrograms: "Health Promotion 项目", healthPromotionTopic: "UC Davis Health Promotion 主题", basicNeeds: "基本需求", basicNeedsText: "食物、住房和经济支持", mentalHealth: "心理健康", mentalHealthText: "咨询和支持选项", urgentAssistance: "紧急协助", urgentAssistanceText: "紧急和非工作时间校园帮助", freeFoodNow: "现在免费食物", freeFoodNowText: "正在开放的校园食物资源", walkInHelp: "Walk-in 帮助", walkInHelpText: "医疗和危机护理", nearestFirst: "距离优先", mentalCrisis: "心理危机？", mentalCrisisText: "如果你可能伤害自己或他人，请拨打 911。需要即时情绪危机支持，请拨打或短信 988。", call: "拨打", text988: "短信 988", ucDavisCrisis: "UC Davis 危机支持", showingPlaces: "正在显示", relatedTo: "相关地点：", resultsConsider: "结果会考虑相关性、实时营业时间", andDistance: "，以及你的距离", callAction: "拨打", officialInfo: "官方信息", relatedGuide: "找到相关指南", noExactMatch: "暂时没有精确匹配", topicGuideHint: "这更像是主题信息，不是即时 walk-in 服务。官方指南已放在设置里。", searchHint: "可以试试描述你的目标，比如“我需要食物”“我生病了”“我想找人聊聊”。", openSettings: "打开设置", clearSearch: "清空搜索", dataNote: "营业时间和库存可能变化。实时状态根据公开时间计算；时间紧急时请查看官方信息。", browseInstead: "换成浏览", categories: "分类", goodMorning: "早上好", whatNeed: "你需要什么？", searchCampus: "搜索校园", freeGroceries: "免费食品", installable: "可安装，不只是网页", promoTitle: "你的校园指南应该在主屏幕上。", promoText: "像应用一样安装 Aggie Care。全屏打开，可离线保留资源目录，在校园 Wi‑Fi 下保持快速。", installAggieCare: "安装 Aggie Care", moreFromHp: "更多 Health Promotion", programsTitle: "项目和学习工具。", programsText: "浏览 UC Davis Health Promotion 工作坊、培训和学生指南。网站和 App 设置里都会保留这些细则。", viewOfficialSite: "查看官方网站", officialCampusInformation: "官方校园信息", detailsFromUcDavis: "来自 UC Davis 的细则。", detailsText: "主题指南和官方校园页面会收集在这里，并同步到 App 设置里。", footerNote: "这是公共 UC Davis 资源的独立界面，不是官方紧急服务。", reviewed: "资源细则审核于 2026 年 9 月 30 日。", useMyLocation: "使用我的位置", locating: "定位中…", locationOn: "已开启定位", locationOff: "定位关闭", locationUnavailable: "无法使用定位", nearestFirstLabel: "最近优先", locationNotShared: "未共享位置", openNow: "正在营业", closedNow: "已关闭", open24: "24 小时开放", weekdayAccess: "工作日可用", today: "今天", nextServiceDay: "下个服务日", checkOfficialSchedule: "请查看官方时间", miAway: "英里", freePantry: "免费食品储藏", freeFood: "免费食物", foodTruck: "餐车", campusGarden: "校园花园", foodAccess: "食物资源", indoorPoint: "室内点位 · 精确位置待实地核实" },
  es: { ...enText, live: "Guía de recursos del campus", offline: "Modo sin conexión", titleA: "¿Qué necesitas", titleB: "ahora?", subtitle: "Acceso rápido a comida gratis, necesidades básicas, salud, seguridad y apoyo mental en UC Davis.", placeholder: "Prueba “comida gratis abierta”", search: "Buscar", language: "Idioma", languageNote: "Solo cambia el idioma visual. La búsqueda se normaliza a inglés; mapa y navegación siguen en inglés.", results: "Resultados", useful: "Disponible ahora", openFirst: "Abierto primero", install: "Instalar app", addHome: "Añadir a inicio", emergency: "¿Emergencia?", settings: "Ajustes", mapTitle: "Encuéntralo cerca.", all: "Todo", categories: "Categorías", location: "Ubicación", navigate: "Navegar", officialInfo: "Info oficial", openNow: "Abierto ahora", closedNow: "Cerrado ahora", useMyLocation: "Usar mi ubicación", locating: "Ubicando…", mentalHealth: "Salud mental", basicNeeds: "Necesidades básicas", freeFoodNow: "Comida gratis ahora", walkInHelp: "Ayuda sin cita", gotIt: "Entendido" },
  ko: { ...enText, live: "캠퍼스 리소스 가이드", offline: "오프라인 모드", titleA: "지금 무엇이", titleB: "필요한가요?", subtitle: "UC Davis의 무료 음식, 기본 필요, 건강, 안전, 정신건강 지원을 빠르게 찾습니다.", placeholder: "“무료 음식 지금” 검색", search: "검색", language: "언어", languageNote: "표시 언어만 바뀝니다. 검색은 영어로 정규화되고 지도/내비게이션은 영어로 유지됩니다.", results: "검색 결과", useful: "지금 이용 가능", openFirst: "운영 중 우선", install: "앱 설치", addHome: "홈 화면에 추가", emergency: "긴급 상황?", settings: "설정", mapTitle: "근처에서 찾기.", all: "전체", categories: "카테고리", location: "위치", navigate: "길찾기", officialInfo: "공식 정보", openNow: "운영 중", closedNow: "닫힘", useMyLocation: "내 위치 사용", locating: "위치 확인 중…", mentalHealth: "정신건강", basicNeeds: "기본 필요", freeFoodNow: "무료 음식", walkInHelp: "방문 도움", gotIt: "확인" },
  ja: { ...enText, live: "キャンパス資源ガイド", offline: "オフライン", titleA: "今なにが", titleB: "必要ですか？", subtitle: "UC Davis の無料食料、基本支援、健康、安全、メンタルヘルス資源を素早く探せます。", placeholder: "「無料 食べ物 今」で検索", search: "検索", language: "言語", languageNote: "表示言語のみ変更します。検索は英語に正規化され、地図とナビは英語のままです。", results: "検索結果", useful: "今使えるもの", openFirst: "営業中を優先", install: "アプリをインストール", addHome: "ホーム画面に追加", emergency: "緊急ですか？", settings: "設定", mapTitle: "近くで探す。", all: "すべて", categories: "カテゴリ", location: "位置", navigate: "ナビ", officialInfo: "公式情報", openNow: "営業中", closedNow: "閉店中", useMyLocation: "現在地を使う", locating: "位置取得中…", mentalHealth: "メンタルヘルス", basicNeeds: "基本支援", freeFoodNow: "無料食料", walkInHelp: "予約なしの支援", gotIt: "了解" },
  hi: { ...enText, live: "कैंपस संसाधन गाइड", offline: "ऑफ़लाइन मोड", titleA: "आपको अभी", titleB: "क्या चाहिए?", subtitle: "UC Davis में मुफ्त भोजन, बुनियादी ज़रूरत, स्वास्थ्य, सुरक्षा और मानसिक सहायता जल्दी खोजें।", placeholder: "“free food open now” खोजें", search: "खोजें", language: "भाषा", languageNote: "यह केवल डिस्प्ले भाषा बदलता है। खोज अंग्रेज़ी में सामान्यीकृत होती है; नक्शा और नेविगेशन अंग्रेज़ी में रहेंगे।", results: "परिणाम", useful: "अभी उपलब्ध", openFirst: "खुला पहले", install: "ऐप इंस्टॉल करें", addHome: "होम स्क्रीन में जोड़ें", emergency: "आपातकाल?", settings: "सेटिंग्स", mapTitle: "पास में खोजें।", all: "सब", categories: "श्रेणियाँ", location: "स्थान", navigate: "नेविगेट", officialInfo: "आधिकारिक जानकारी", openNow: "अभी खुला", closedNow: "बंद", useMyLocation: "मेरा स्थान उपयोग करें", locating: "स्थान ढूँढ रहे हैं…", mentalHealth: "मानसिक स्वास्थ्य", basicNeeds: "बुनियादी ज़रूरतें", freeFoodNow: "मुफ्त भोजन", walkInHelp: "वॉक-इन सहायता", gotIt: "ठीक है" },
  fr: { ...enText, live: "Guide des ressources campus", offline: "Mode hors ligne", titleA: "De quoi as-tu", titleB: "besoin maintenant ?", subtitle: "Accès rapide à la nourriture gratuite, besoins essentiels, santé, sécurité et soutien mental à UC Davis.", placeholder: "Essayez « nourriture gratuite ouverte »", search: "Rechercher", language: "Langue", languageNote: "Change seulement la langue affichée. La recherche est normalisée en anglais; la carte et la navigation restent en anglais.", results: "Résultats", useful: "Disponible maintenant", openFirst: "Ouvert en premier", install: "Installer", addHome: "Ajouter à l’accueil", emergency: "Urgence ?", settings: "Réglages", mapTitle: "Trouver près d’ici.", all: "Tout", categories: "Catégories", location: "Position", navigate: "Itinéraire", officialInfo: "Info officielle", openNow: "Ouvert", closedNow: "Fermé", useMyLocation: "Utiliser ma position", locating: "Localisation…", mentalHealth: "Santé mentale", basicNeeds: "Besoins essentiels", freeFoodNow: "Repas gratuit", walkInHelp: "Aide sans rendez-vous", gotIt: "Compris" },
};

const languageResourceSeeds: Record<Exclude<AppLanguage, "en">, Partial<Record<string, string[]>>> = {
  zh: {
    "aggie-eats": ["饿", "餓", "想吃饭", "吃饭", "热饭", "免费饭", "免费午餐", "餐车", "饭车", "没钱吃饭", "现在吃的", "哪里有饭", "饿了"],
    pantry: ["食物", "食品", "零食", "蔬菜", "水果", "食品储藏室", "pantry", "免费食品", "免费食物", "日用品", "厕纸", "洗漱用品"],
    "aggie-compass": ["基本需求", "基础需求", "没钱", "沒錢", "住房", "房租", "福利", "食物券", "食品券", "CalFresh", "经济困难", "生活困难"],
    freedge: ["冰箱", "社区冰箱", "免费冰箱", "下班后食物", "晚上食物", "捐赠食物", "随时拿食物"],
    "acute-care": ["吐", "呕吐", "嘔吐", "恶心", "噁心", "发烧", "發燒", "生病", "感冒", "流感", "腹泻", "腹瀉", "肚子疼", "疼", "受伤", "受傷", "诊所", "診所", "医生", "醫生", "护士", "急诊", "walk in"],
    "health-34": ["晚上不舒服", "半夜生病", "来找我", "上门帮助", "校园医疗", "非紧急", "现在需要帮助", "有人来帮我"],
    counseling: ["心理", "焦虑", "焦慮", "抑郁", "憂鬱", "难过", "難過", "哭", "崩溃", "崩潰", "想死", "自杀", "自殺", "活不下去", "恐慌", "没人说话", "想找人聊", "心理危机"],
    "love-lab": ["安全套", "避孕套", "卫生巾", "衛生巾", "月经", "月經", "经期", "經期", "棉条", "性病", "润滑", "避孕", "免费套"],
    "hp-narcan": ["纳洛酮", "納洛酮", "narcan", "阿片", "过量", "過量", "芬太尼", "解毒", "急救药"],
    "fentanyl-strips": ["芬太尼试纸", "芬太尼測試", "试纸", "測試紙", "验毒", "药物检测"],
    "free-helmet": ["头盔", "頭盔", "安全帽", "自行车", "自行車", "脚踏车", "腳踏車", "滑板车", "头盔坏了", "頭盔壞了", "免费头盔"],
    care: ["不安全", "安全", "骚扰", "騷擾", "跟踪", "暴力", "侵犯", "强奸", "強姦", "性侵", "家暴", "关系暴力", "保密支持", "CARE"],
  },
  es: {
    "aggie-eats": ["hambre", "tengo hambre", "comida caliente", "almuerzo gratis", "camión de comida", "pagar lo que pueda", "sin dinero para comer"],
    pantry: ["comida", "alimentos", "despensa", "comestibles", "verduras", "fruta", "snacks", "artículos de higiene", "gratis"],
    "aggie-compass": ["necesidades básicas", "vivienda", "sin dinero", "calfresh", "snap", "ebt", "ayuda financiera", "recursos"],
    freedge: ["refrigerador comunitario", "comida después de horas", "comida donada", "fridge gratis"],
    "acute-care": ["vomitar", "vómito", "vomito", "náusea", "nausea", "fiebre", "enfermo", "gripe", "dolor", "diarrea", "clínica", "clinica", "doctor", "enfermera", "urgente"],
    "health-34": ["ayuda de noche", "vienen a mí", "respuesta campus", "no emergencia", "necesito ayuda ahora"],
    counseling: ["ansiedad", "depresión", "depresion", "llorar", "pánico", "panico", "suicidio", "quiero morir", "crisis mental", "terapia", "consejería"],
    "love-lab": ["condón", "condon", "condones", "lubricante", "tampones", "toallas", "menstruación", "periodo", "ets", "vih"],
    "hp-narcan": ["narcan", "naloxona", "sobredosis", "opioide", "fentanilo"],
    "fentanyl-strips": ["tiras de fentanilo", "prueba de drogas", "fentanilo", "tiras reactivas"],
    "free-helmet": ["casco", "bicicleta", "patineta", "scooter", "casco roto", "casco gratis"],
    care: ["seguro", "inseguro", "acoso", "violencia", "asalto", "violación", "abuso", "confidencial", "defensor"],
  },
  ko: {
    "aggie-eats": ["배고파", "밥", "무료 밥", "따뜻한 음식", "점심", "푸드트럭", "돈 없어서 밥"],
    pantry: ["음식", "식료품", "무료 음식", "간식", "채소", "과일", "팬트리", "생활용품"],
    "aggie-compass": ["기본 필요", "생활 지원", "돈 없음", "주거", "calfresh", "재정 지원", "복지"],
    freedge: ["커뮤니티 냉장고", "무료 냉장고", "밤 음식", "기부 음식"],
    "acute-care": ["토", "구토", "메스꺼움", "열", "아파", "감기", "설사", "복통", "다침", "병원", "진료", "의사", "간호사"],
    "health-34": ["밤에 아픔", "도움 와줘", "캠퍼스 도움", "비응급", "지금 도움"],
    counseling: ["불안", "우울", "울고", "공황", "자살", "죽고 싶", "위기", "상담", "정신건강", "무너짐"],
    "love-lab": ["콘돔", "윤활제", "생리대", "탐폰", "생리", "성병", "피임"],
    "hp-narcan": ["나르칸", "날록손", "과다복용", "펜타닐"],
    "fentanyl-strips": ["펜타닐 테스트", "검사지", "약물 검사"],
    "free-helmet": ["헬멧", "자전거", "스쿠터", "헬멧 고장", "무료 헬멧"],
    care: ["안전", "위험", "괴롭힘", "스토킹", "폭력", "성폭력", "비밀 지원"],
  },
  ja: {
    "aggie-eats": ["お腹すいた", "食べ物", "無料ご飯", "温かい食事", "昼ごはん", "フードトラック", "お金がない"],
    pantry: ["食品", "食料", "無料食品", "野菜", "果物", "スナック", "パントリー", "日用品"],
    "aggie-compass": ["基本支援", "生活支援", "お金がない", "住居", "calfresh", "経済支援"],
    freedge: ["コミュニティ冷蔵庫", "無料冷蔵庫", "夜の食べ物", "寄付食品"],
    "acute-care": ["吐く", "吐き気", "熱", "病気", "風邪", "下痢", "腹痛", "痛い", "けが", "診療", "医者", "看護師"],
    "health-34": ["夜に具合悪い", "来てほしい", "キャンパス支援", "緊急ではない", "今助けて"],
    counseling: ["不安", "うつ", "泣く", "パニック", "自殺", "死にたい", "危機", "相談", "メンタル", "つらい"],
    "love-lab": ["コンドーム", "潤滑剤", "ナプキン", "タンポン", "生理", "性感染症", "避妊"],
    "hp-narcan": ["ナーカン", "ナロキソン", "過量摂取", "フェンタニル"],
    "fentanyl-strips": ["フェンタニル検査", "検査紙", "薬物検査"],
    "free-helmet": ["ヘルメット", "自転車", "スクーター", "ヘルメット壊れた", "無料ヘルメット"],
    care: ["安全", "危険", "ハラスメント", "ストーカー", "暴力", "性暴力", "秘密相談"],
  },
  hi: {
    "aggie-eats": ["भूख", "खाना चाहिए", "मुफ्त खाना", "गरम खाना", "लंच", "फूड ट्रक", "पैसे नहीं"],
    pantry: ["भोजन", "खाद्य सामग्री", "मुफ्त भोजन", "सब्ज़ी", "फल", "स्नैक", "पैंट्री", "स्वच्छता सामान"],
    "aggie-compass": ["बुनियादी ज़रूरत", "पैसे नहीं", "घर", "calfresh", "snap", "आर्थिक मदद", "संसाधन"],
    freedge: ["कम्युनिटी फ्रिज", "मुफ्त फ्रिज", "रात का खाना", "दान भोजन"],
    "acute-care": ["उल्टी", "मतली", "बुखार", "बीमार", "दर्द", "दस्त", "पेट दर्द", "चोट", "क्लिनिक", "डॉक्टर", "नर्स"],
    "health-34": ["रात में बीमार", "कोई आए", "कैंपस सहायता", "गैर आपात", "अभी मदद"],
    counseling: ["चिंता", "अवसाद", "रोना", "घबराहट", "आत्महत्या", "मरना चाहता", "संकट", "काउंसलिंग", "मानसिक"],
    "love-lab": ["कंडोम", "ल्यूब", "पैड", "टैम्पोन", "पीरियड", "माहवारी", "sti", "गर्भनिरोध"],
    "hp-narcan": ["नारकैन", "नालोक्सोन", "ओवरडोज", "फेंटानिल"],
    "fentanyl-strips": ["फेंटानिल टेस्ट", "टेस्ट स्ट्रिप", "ड्रग टेस्ट"],
    "free-helmet": ["हेलमेट", "साइकिल", "स्कूटर", "हेलमेट टूट गया", "मुफ्त हेलमेट"],
    care: ["सुरक्षा", "असुरक्षित", "उत्पीड़न", "हिंसा", "हमला", "गोपनीय सहायता"],
  },
  fr: {
    "aggie-eats": ["faim", "j'ai faim", "repas gratuit", "repas chaud", "déjeuner", "food truck", "pas d'argent pour manger"],
    pantry: ["nourriture", "épicerie", "epicerie", "aliments", "gratuit", "légumes", "fruits", "collations", "hygiène"],
    "aggie-compass": ["besoins essentiels", "pas d'argent", "logement", "calfresh", "snap", "aide financière", "ressources"],
    freedge: ["frigo communautaire", "frigo gratuit", "nourriture le soir", "nourriture donnée"],
    "acute-care": ["vomir", "nausée", "nausee", "fièvre", "fievre", "malade", "grippe", "douleur", "diarrhée", "diarrhee", "clinique", "médecin", "infirmière"],
    "health-34": ["aide la nuit", "venir m'aider", "réponse campus", "non urgence", "besoin d'aide maintenant"],
    counseling: ["anxiété", "anxiete", "dépression", "depression", "pleurer", "panique", "suicide", "envie de mourir", "crise", "thérapie", "santé mentale"],
    "love-lab": ["préservatif", "preservatif", "lubrifiant", "serviettes", "tampons", "règles", "regles", "ist", "contraception"],
    "hp-narcan": ["narcan", "naloxone", "surdose", "opioïde", "opioide", "fentanyl"],
    "fentanyl-strips": ["bandelettes fentanyl", "test drogue", "fentanyl", "bandelettes"],
    "free-helmet": ["casque", "vélo", "velo", "trottinette", "casque cassé", "casque gratuit"],
    care: ["sécurité", "securite", "pas en sécurité", "harcèlement", "violence", "agression", "viol", "confidentiel"],
  },
};

// Cowell publishes a midday closure and an extended Tuesday staff meeting.
// These are office access hours, not a guarantee that a specific item is stocked.
const cowellHealthPromotionHours: ScheduleBlock[] = [
  { days: [1, 3, 4, 5], open: 9, close: 12 },
  { days: [1, 3, 4, 5], open: 13, close: 16.5 },
  { days: [2], open: 9, close: 12 },
  { days: [2], open: 14.5, close: 16.5 },
];

const resources: Resource[] = [
  {
    id: "aggie-eats", name: "AggieEats Food Truck", short: "Hot meal", category: "Food",
    description: "A fresh prepared meal for any price—including $0. No one can see what you paid.",
    location: "MU East Quad (M/W/F) · Storer Hall (T/Th)", address: "1 Shields Ave, Davis, CA", lat: 38.54218, lng: -121.74934,
    hours: { days: [1, 2, 3, 4, 5], open: 11.5, close: 14, note: "or until sold out" }, cost: "Pay what you want",
    url: "https://aggiecompass.ucdavis.edu/aggieeats", keywords: ["food", "hungry", "meal", "lunch", "eat", "free food", "hot food", "cheap food", "no money", "food truck"], icon: "◒",
  },
  {
    id: "pantry", name: "ASUCD Pantry", short: "Groceries", category: "Food",
    description: "Free walk-in groceries, fresh produce, hygiene items, safer-sex products, and other basic necessities for UC Davis affiliates.",
    location: "Memorial Union · 1st floor, near ATMs", address: "177 East Quad Ave, Davis, CA", lat: 38.54234, lng: -121.74909,
    hours: [{ days: [1, 2, 3, 4, 5], open: 10.5, close: 16, label: "Mon–Fri" }, { days: [0, 6], open: 12.25, close: 14, label: "Sat–Sun" }], cost: "Free · UC Davis ID required",
    url: "https://thepantry.ucdavis.edu/", keywords: ["food", "hungry", "groceries", "grocery", "pantry", "produce", "fresh produce", "snacks", "free food", "walk in", "walk-in", "toiletries", "hygiene", "sex products", "basic needs", "period products"], icon: "▦",
  },
  {
    id: "aggie-compass", name: "Aggie Compass Essentials Pantries", short: "Food + toiletries", category: "Basic needs",
    description: "Shelf-stable food, spices, toiletries, and help applying for CalFresh. AggieFresh applications are currently closed; check its official page for updates.",
    location: "Memorial Union · Room 165, East Wing", address: "1 Shields Ave, Davis, CA", lat: 38.54246, lng: -121.74872,
    hours: { days: [1, 2, 3, 4, 5], open: 9, close: 17 }, cost: "Free for UC Davis students",
    phone: "5307529254", phoneLabel: "(530) 752-9254", url: "https://aggiecompass.ucdavis.edu/",
    keywords: ["food", "hungry", "groceries", "calfresh", "snap", "ebt", "aggiefresh", "money", "toiletries", "spices", "basic needs", "free"], icon: "⌂",
  },
  {
    id: "freedge", name: "MU Community Freedge", short: "Community fridge", category: "Food",
    description: "An outdoor community fridge for donated produce, canned goods, and individually wrapped food. Stock changes throughout the day.",
    location: "Between The Pantry and UC Davis Store", address: "177 East Quad Ave, Davis, CA", lat: 38.54208, lng: -121.74898,
    hours: "always", cost: "Free · stock varies", url: "https://aggiecompass.ucdavis.edu/food-security",
    keywords: ["food", "hungry", "fridge", "freedge", "free food", "produce", "canned food", "after hours", "community"], icon: "□",
  },
  {
    id: "acute-care", name: "Acute Care Clinic", short: "Walk-in care", category: "Medical",
    description: "Sudden illness or injury, advice nurse, and same-day crisis counseling on the first floor.",
    location: "Student Health & Wellness Center", address: "930 Blue Ridge Rd, Davis, CA", lat: 38.54162, lng: -121.75961,
    hours: [{ days: [1, 2, 4, 5], open: 8, close: 17.5 }, { days: [3], open: 9, close: 17 }], cost: "Acute care: $0 with UC SHIP / $40 without · crisis counseling: $0",
    phone: "5307522349", phoneLabel: "(530) 752-2349", url: "https://shcs.ucdavis.edu/services/acute-crisis-care",
    keywords: ["sick", "hurt", "injured", "pain", "doctor", "nurse", "medical", "urgent", "crisis", "walk in", "asthma", "infection"], icon: "+",
  },
  {
    id: "health-34", name: "Health 34", short: "Comes to you", category: "Medical",
    description: "Free non-emergency medical and mental-health support anywhere on the Davis campus.",
    location: "Mobile campus response", address: "Your on-campus location", lat: 38.53823, lng: -121.76171,
    hours: "always", cost: "Free · 24/7",
    phone: "5307543434", phoneLabel: "(530) 754-3434", url: "https://fire.ucdavis.edu/health34",
    keywords: ["sick", "hurt", "injured", "medical", "mental health", "crisis", "help now", "someone come", "support", "after hours", "night"], icon: "✦",
  },
  {
    id: "counseling", name: "Crisis Counseling", short: "Talk to someone", category: "Mental health",
    description: "Same-day crisis appointments during business hours and phone support after hours.",
    location: "Phone or Acute Care Clinic", address: "930 Blue Ridge Rd, Davis, CA", lat: 38.54162, lng: -121.75961,
    hours: [{ days: [1, 2, 4, 5], open: 8, close: 17.5 }, { days: [3], open: 9, close: 17 }], cost: "Free", phoneAlways: true,
    phone: "5307520871", phoneLabel: "(530) 752-0871", url: "https://shcs.ucdavis.edu/services/counseling-services",
    keywords: ["sad", "anxious", "anxiety", "depressed", "depression", "suicide", "panic", "stress", "counseling", "therapy", "talk to someone", "mental health", "crisis", "lonely", "overwhelmed", "cry", "crying", "dead", "death", "die", "dying", "kill", "killing", "self harm", "hurt myself", "want to die", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself"], icon: "♡",
  },
  {
    id: "love-lab", name: "The Love Lab", short: "Safer sex + period supplies", category: "Supplies",
    description: "Free condoms, dental dams, lubricant, pads, tampons, educational materials, buttons, and stickers.",
    location: "Health Promotion · Cowell Building, North Wing", address: "425 California Ave, Davis, CA", lat: 38.5448, lng: -121.75401,
    hours: cowellHealthPromotionHours, cost: "Free for UC Davis students · stock varies",
    url: "https://shcs.ucdavis.edu/health-and-wellness/sexual-health/love-lab",
    keywords: ["condom", "condoms", "protection", "safer sex", "safe sex", "sex", "fuck", "hookup", "hook up", "boyfriend", "girlfriend", "partner", "lube", "lubricant", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "pads", "tampons", "period", "menstrual", "free supplies"], icon: "◇",
  },
  {
    id: "hp-narcan", name: "Health Promotion Narcan", short: "Overdose reversal", category: "Supplies",
    description: "Confidential free Narcan access and overdose response information through Health Promotion's Safe Party resources.",
    location: "Health Promotion · Cowell Building, North Wing", address: "425 California Ave, Davis, CA", lat: 38.5448, lng: -121.75401,
    hours: cowellHealthPromotionHours, cost: "Free · stock varies",
    url: "https://shcs.ucdavis.edu/health-and-wellness/alcohol-tobacco-and-other-drugs/naloxonenarcan",
    keywords: ["narcan", "naloxone", "overdose", "opioid", "safe party", "drug", "fentanyl", "free", "harm reduction"], icon: "+",
  },
  {
    id: "fentanyl-strips", name: "Fentanyl Test Strips", short: "Drug checking", category: "Supplies",
    description: "Free fentanyl testing strips and safer-use education available through Health Promotion.",
    location: "Health Promotion · Cowell Building, North Wing", address: "425 California Ave, Davis, CA", lat: 38.5448, lng: -121.75401,
    hours: cowellHealthPromotionHours, cost: "Free · stock varies",
    url: "https://shcs.ucdavis.edu/health-and-wellness/health-promotion",
    keywords: ["fentanyl", "test strips", "drug test", "overdose", "safe party", "harm reduction", "free supplies"], icon: "▱",
  },
  {
    id: "free-helmet", name: "Free Helmet Pickup", short: "Bike safety", category: "Supplies",
    description: "Complete the short Helmet Hair Don't Care training, then pick up a free helmet from Health Promotion or Bike Barn.",
    location: "Health Promotion or Bike Barn", address: "425 California Ave, Davis, CA", lat: 38.5448, lng: -121.75401,
    hours: "varies", cost: "Free after pledge",
    url: "https://shcs.ucdavis.edu/health-and-wellness/food-movement/helmet-hair-dont-care",
    keywords: ["helmet", "bike", "bicycle", "scooter", "skateboard", "free", "safety", "health promotion"], icon: "◌",
  },
  {
    id: "care", name: "CARE Advocacy", short: "Confidential support", category: "Safety",
    description: "Free confidential support for sexual assault, harassment, stalking, intimate partner violence, and urgent survivor needs.",
    location: "CARE · Cowell Building, North Wing, Suite 1222", address: "425 California Ave, Davis, CA", lat: 38.5448, lng: -121.75401,
    hours: [{ days: [1, 2, 3, 4], open: 9, close: 12, label: "Mon–Thu" }, { days: [1, 2, 3, 4], open: 13, close: 16, label: "Mon–Thu" }], cost: "Free · confidential", phoneAlways: true,
    phone: "5307523299", phoneLabel: "(530) 752-3299", url: "https://care.ucdavis.edu/connect-advocate",
    keywords: ["safe", "safety", "care", "assault", "harassment", "stalking", "violence", "abuse", "unsafe", "consent", "rape", "confidential", "advocate", "relationship", "title ix", "survivor"], icon: "◉",
  },
  {
    id: "mobile-pantry-scc", name: "ASUCD Mobile Pantry · SCC", short: "Monday groceries", category: "Food",
    description: "Free groceries from The Pantry's mobile stop at the Student Community Center. Check the current quarter's schedule before going.",
    location: "Student Community Center · Monday", address: "Student Community Center, Davis, CA", lat: 38.53956, lng: -121.75160,
    hours: { days: [1], open: 13, close: 15 }, scheduleValidThrough: "2026-12-31", cost: "Free · UC Davis ID required", url: "https://thepantry.ucdavis.edu/mobile-pantry", keywords: ["food", "groceries", "pantry", "monday", "scc"], icon: "▦",
  },
  {
    id: "mobile-pantry-arc", name: "ASUCD Mobile Pantry · ARC", short: "Wednesday groceries", category: "Food",
    description: "Free groceries from The Pantry's mobile stop at the Activities and Recreation Center. Check the current quarter's schedule before going.",
    location: "Activities and Recreation Center · Wednesday", address: "Activities and Recreation Center, Davis, CA", lat: 38.54279, lng: -121.75917,
    hours: { days: [3], open: 12, close: 14 }, scheduleValidThrough: "2026-12-31", cost: "Free · UC Davis ID required", url: "https://thepantry.ucdavis.edu/mobile-pantry", keywords: ["food", "groceries", "pantry", "wednesday", "arc"], icon: "▦",
  },
  {
    id: "fruit-veggie-compass", name: "Fruit & Veggie Up · Aggie Compass", short: "Fresh produce", category: "Food",
    description: "Free seasonal fruits and vegetables; bring a bag. Published fall schedule may change or sell out.",
    location: "Aggie Compass · Memorial Union · Wednesday", address: "Memorial Union, Davis, CA", lat: 38.54246, lng: -121.74872,
    hours: { days: [3], open: 12, close: 14 }, scheduleValidThrough: "2026-12-31", cost: "Free · while supplies last", url: "https://aggiecompass.ucdavis.edu/news/fruit-and-veggie-up", keywords: ["food", "fruit", "vegetables", "produce", "wednesday"], icon: "◒",
  },
  {
    id: "fruit-veggie-coho", name: "Fruit & Veggie Up · South Coho", short: "Fresh produce", category: "Food",
    description: "Free seasonal fruits and vegetables; bring a bag. Published fall schedule may change or sell out.",
    location: "South Coffee House · Friday", address: "South Coffee House, Davis, CA", lat: 38.54196, lng: -121.75004,
    hours: { days: [5], open: 11, close: 13 }, scheduleValidThrough: "2026-12-31", cost: "Free · while supplies last", url: "https://aggiecompass.ucdavis.edu/news/fruit-and-veggie-up", keywords: ["food", "fruit", "vegetables", "produce", "friday"], icon: "◒",
  },
  ...[
    ["satellite-hart", "African American Studies Pantry", "Hart Hall · 2nd floor", "Hart Hall", 38.5406234, -121.7507298],
    ["satellite-cadss", "CADSS Satellite Pantry", "CADSS · Silo · 2nd floor", "Silo", 38.5387419, -121.7527467],
    ["satellite-el-centro", "El Centro Satellite Pantry", "El Centro · MU 2nd-floor patio", "Memorial Union", 38.54232, -121.74942],
    ["satellite-eop", "EOP Satellite Pantry", "EOP · between University House and South Hall", "Educational Opportunity Program", 38.540844, -121.7478651],
    ["satellite-gsa", "GSA Satellite Pantry", "Walker Hall · Room 1213", "Walker Hall", 38.5397461, -121.7507849],
    ["satellite-lgbtq", "QT Pantry · LGBTQIA Resource Center", "Student Community Center · 1st floor", "Student Community Center", 38.53956, -121.75160],
    ["satellite-nest", "The Nest Satellite Pantry", "The Nest · University House", "University House", 38.541017, -121.7474295],
    ["satellite-sdc", "Student Disability Center Pantry", "Student Disability Center · Cowell Building", "Cowell Building", 38.5443758, -121.7541534],
    ["satellite-srrc", "SRRC Satellite Pantry", "Student Community Center · 1st floor", "Student Community Center", 38.53956, -121.75160],
    ["satellite-undocumented", "Undocumented Student Resource Center Pantry", "Student Community Center · 1st floor", "Student Community Center", 38.53956, -121.75160],
  ].map(([id, name, location, building, lat, lng]) => ({
    id: id as string, name: name as string, short: "Satellite pantry", category: "Food" as const,
    description: "Free shelf-stable food from an Aggie Compass satellite pantry. Stock and access follow the host center or building; check before visiting.",
    location: location as string, address: `${building}, Davis, CA`, lat: lat as number, lng: lng as number,
    hours: "varies" as const, cost: "Free · stock varies", url: "https://aggiecompass.ucdavis.edu/aggieeats/satellite-pantries",
    keywords: ["food", "pantry", "groceries", "canned food", "shelf stable", "basic needs", String(building).toLowerCase()], icon: "▦", navigationQuery: `${building}, UC Davis, CA`,
  })),
  {
    id: "wrrc-pharmacy", name: "WRRC Feminist Pharmacy", short: "Free personal supplies", category: "Supplies",
    description: "Free menstrual and safer-sex supplies, toiletries, heating pads, and razors; pregnancy tests may be requested. Ask staff about current stock.",
    location: "Women's Resources and Research Center · North Hall", address: "North Hall, Davis, CA", lat: 38.5418, lng: -121.74828,
    hours: "varies", cost: "Free", url: "https://wrrc.ucdavis.edu/resources", keywords: ["period", "pads", "tampons", "toiletries", "hygiene", "razors", "pregnancy test"], icon: "◇", navigationQuery: "North Hall, UC Davis, CA",
  },
  {
    id: "wrrc-referral", name: "WRRC Drop-In & Referral", short: "Confidential referral space", category: "Safety",
    description: "A drop-in space for people affected by sexual or interpersonal violence. Staff can help connect you to support; this is not counseling, and confidentiality has exceptions. For urgent advocacy, contact CARE.",
    location: "Women's Resources and Research Center · North Hall", address: "North Hall, Davis, CA", lat: 38.5418, lng: -121.74828,
    hours: "varies", cost: "No fee listed · confirm hours", url: "https://wrrc.ucdavis.edu/resources", keywords: ["wrrc", "drop in", "referral", "sexual violence", "interpersonal violence", "safe space", "support"], icon: "◉", navigationQuery: "North Hall, UC Davis, CA",
  },
  {
    id: "lgbtq-closet", name: "Gender Affirmation Closet", short: "Free clothing", category: "Basic needs",
    description: "Free gender-affirming clothing, including binders. Visit during LGBTQIA Resource Center hours; size availability varies.",
    location: "LGBTQIA Resource Center · Student Community Center", address: "Student Community Center, Davis, CA", lat: 38.53956, lng: -121.75160,
    hours: "varies", cost: "Free", url: "https://lgbtqia.ucdavis.edu/gender-affirmation-closet", keywords: ["clothes", "clothing", "binder", "gender affirming", "closet"], icon: "⌂", navigationQuery: "Student Community Center, UC Davis, CA",
  },
  {
    id: "aggie-reuse", name: "Aggie Reuse Store", short: "Free second-hand clothing", category: "Basic needs",
    description: "Student-run free store for second-hand clothes, school supplies, and small household items. Stock varies; closed on university holidays.",
    location: "Memorial Union · first floor", address: "Memorial Union, Davis, CA", lat: 38.5423, lng: -121.7490,
    hours: [{ days: [1, 2, 4, 5], open: 10, close: 17 }, { days: [3], open: 10, close: 18 }], cost: "Free", url: "https://aggiereuse.ucdavis.edu/aggie-reuse-0", keywords: ["clothes", "clothing", "outfits", "shoes", "thrift", "free store", "reuse"], icon: "⌂", navigationQuery: "Aggie Reuse Store, Memorial Union, UC Davis, CA",
  },
  {
    id: "lsa-professional-closet", name: "LSA Professional Closet", short: "Free interview attire", category: "Basic needs",
    description: "Donated professional clothing and shoes for interviews and career events. In the back of the King Hall Student Lounge; check availability before visiting.",
    location: "King Hall · Student Lounge", address: "King Hall, Davis, CA", lat: 38.535972, lng: -121.749555,
    hours: "varies", cost: "Free", url: "https://lsa.law.ucdavis.edu/basic-needs", keywords: ["interview outfit", "professional clothing", "business attire", "suit", "dress shoes"], icon: "⌂", navigationQuery: "King Hall, UC Davis, CA",
  },
  {
    id: "bike-barn-checkup", name: "Bike Barn Free Checkup", short: "Free bike diagnostics + air", category: "Basic needs",
    description: "Bike Barn offers free diagnostics, checkups, air, and minor adjustments at the Silo. Repairs and parts may cost money; ask for a quote first.",
    location: "Bike Barn · Silo", address: "Silo, Davis, CA", lat: 38.5388174, lng: -121.7531115,
    hours: "varies", cost: "Checkup and air free · repairs may cost", url: "https://bikebarn.ucdavis.edu/frequently-asked-questions", keywords: ["bike checkup", "flat tire", "bike air", "bike repair", "bicycle problem", "bike diagnostics"], icon: "◌", navigationQuery: "Bike Barn, UC Davis, CA",
  },
  {
    id: "student-parent-space", name: "Student Parent Space", short: "Family essentials", category: "Basic needs",
    description: "A student-parent space with pantry food, snacks, toys, and a changing table. Services and supplies vary.",
    location: "University House Annex · 155 Shields Avenue", address: "155 Shields Ave, Davis, CA", lat: 38.541017, lng: -121.7474295,
    hours: [{ days: [1, 3], open: 10, close: 17 }, { days: [2, 4], open: 10, close: 18 }, { days: [5], open: 10, close: 16 }], cost: "Free for student parents", url: "https://studentparents.ucdavis.edu/about/our-space", keywords: ["student parent", "child", "baby", "snacks", "toys", "changing table", "family"], icon: "⌂", navigationQuery: "155 Shields Ave, Davis, CA",
  },
  {
    id: "love-lab-bag", name: "Love Lab Bag · Student Health", short: "Condoms when HP is closed", category: "Supplies",
    description: "When Health Promotion is closed, ask at the main Student Health & Wellness Center entrance for a premade Love Lab bag with condoms and lubricant.",
    location: "Student Health & Wellness Center · main entrance", address: "930 Blue Ridge Rd, Davis, CA", lat: 38.54162, lng: -121.75961,
    hours: "varies", cost: "Free", url: "https://shcs.ucdavis.edu/health-and-wellness/sexual-health/love-lab", keywords: ["condom", "condoms", "lube", "lubricant", "safer sex", "love lab", "after hours"], icon: "◇", navigationQuery: "Student Health and Wellness Center, UC Davis, CA",
  },
  {
    id: "wrrc-academic", name: "WRRC Free Printing & Exam Supplies", short: "Printing + scantrons", category: "Basic needs",
    description: "Free printing in the Joy Fergoda Library (up to 10 pages per day); free scantrons and blue books during midterms and finals. Friday printing starts at noon.",
    location: "Women's Resources and Research Center · North Hall", address: "North Hall, Davis, CA", lat: 38.5418, lng: -121.74828,
    hours: [{ days: [1, 2, 3, 4], open: 10, close: 17 }, { days: [5], open: 12, close: 16 }], cost: "Free · exam supplies seasonal", url: "https://wrrc.ucdavis.edu/resources", keywords: ["free printing", "print pages", "scantrons", "blue books", "exam supplies"], icon: "▦", navigationQuery: "North Hall, UC Davis, CA",
  },
  {
    id: "eop-academic", name: "EOP Free Academic Supplies", short: "Scantrons + school supplies", category: "Basic needs",
    description: "EOP students can pick up free scantrons, blue books, and limited school supplies at the EOP Center. Bring your AggieCard; printing there is not free.",
    location: "EOP Center · next to South Hall", address: "EOP Center, Davis, CA", lat: 38.540844, lng: -121.7478651,
    hours: [{ days: [1, 2, 3, 4], open: 9, close: 18 }, { days: [5], open: 10.5, close: 16 }], cost: "Free for EOP students · AggieCard required", url: "https://eop.ucdavis.edu/services/academic-support", keywords: ["scantron", "blue book", "school supplies", "notebooks", "folders", "pencils", "exam"], icon: "▦", navigationQuery: "EOP Center, UC Davis, CA",
  },
  {
    id: "eop-snack-shack", name: "EOP Snack Shack", short: "Free snacks + drinks", category: "Food",
    description: "Free snacks and drinks for EOP students in the EOP Center Community Room. Stock varies; the center also has a microwave and refrigerator.",
    location: "EOP Center · Community Room", address: "EOP Center, Davis, CA", lat: 38.540844, lng: -121.7478651,
    hours: [{ days: [1, 2, 3, 4], open: 9, close: 18 }, { days: [5], open: 10.5, close: 16 }], cost: "Free for EOP students · stock varies", url: "https://eop.ucdavis.edu/resources", keywords: ["free snacks", "snack shack", "free drinks", "eop food"], icon: "◒", navigationQuery: "EOP Center, UC Davis, CA",
  },
  {
    id: "eop-produce", name: "All pEOPle Eat Free Produce", short: "Weekly free produce", category: "Food",
    description: "Free produce for EOP students outside the EOP Center once a week during the academic year. The day and time change; check EOP's official updates before going.",
    location: "Outside EOP Center · next to South Hall", address: "EOP Center, Davis, CA", lat: 38.540844, lng: -121.7478651,
    hours: "varies", cost: "Free for EOP students · schedule varies", url: "https://eop.ucdavis.edu/resources", keywords: ["free produce", "vegetables", "fruit", "eop food", "all people eat"], icon: "◒", navigationQuery: "EOP Center, UC Davis, CA",
  },
  {
    id: "eop-restroom-supplies", name: "EOP Restroom Supplies", short: "Free period + safer-sex supplies", category: "Supplies",
    description: "Free safer-sex and menstrual products are available anonymously in EOP Center restrooms during center access hours; stock can change.",
    location: "EOP Center · restrooms", address: "EOP Center, Davis, CA", lat: 38.540844, lng: -121.7478651,
    hours: [{ days: [1, 2, 3, 4], open: 9, close: 18 }, { days: [5], open: 10.5, close: 16 }], cost: "Free · stock varies", url: "https://eop.ucdavis.edu/resources", keywords: ["pads", "tampons", "period", "condoms", "safer sex", "eop restroom"], icon: "◇", navigationQuery: "EOP Center, UC Davis, CA",
  },
  {
    id: "eop-hair-closet", name: "EOP Hair Closet", short: "Hair-care products", category: "Supplies",
    description: "EOP's Hair Closet helps Black students find hair-care products. Availability and access details are not published; ask the EOP Center before visiting.",
    location: "EOP Center · next to South Hall", address: "EOP Center, Davis, CA", lat: 38.540844, lng: -121.7478651,
    hours: "varies", cost: "Check availability", url: "https://eop.ucdavis.edu/resources", keywords: ["hair care", "hair products", "hair closet", "black hair"], icon: "◇", navigationQuery: "EOP Center, UC Davis, CA",
  },
  {
    id: "aggie-compass-diapers", name: "Aggie Compass Diaper Closet", short: "Diapers + baby supplies", category: "Basic needs",
    description: "Free diapers, wipes, and formula for student parents. The closet moved from WRRC to Aggie Compass; ask the front desk about current stock and access.",
    location: "Aggie Compass · Memorial Union East Wing", address: "Memorial Union, Davis, CA", lat: 38.54246, lng: -121.74872,
    hours: "varies", cost: "Free · stock varies", url: "https://studentparents.ucdavis.edu/expecting", keywords: ["diapers", "baby wipes", "formula", "student parent", "diaper closet"], icon: "⌂", navigationQuery: "Aggie Compass Basic Needs Center, UC Davis, CA",
  },
];

const guides = [
  { icon: "♥", title: "Mental health", text: "Stress, sleep, counseling, crisis care, and supporting a friend.", href: "https://mentalhealth.ucdavis.edu/", keywords: ["sleep", "stress", "friend", "mental", "anxiety", "wellbeing"] },
  { icon: "✦", title: "Sexual well-being", text: "Consent, birth control, STI/HIV care, and safer-sex resources.", href: "https://shcs.ucdavis.edu/health-and-wellness/sexual-well-being", keywords: ["sex", "sti", "hiv", "birth control", "pregnancy", "consent"] },
  { icon: "◌", title: "Alcohol & other drugs", text: "Safer partying, overdose response, Narcan, recovery, and tobacco support.", href: "https://safeparty.ucdavis.edu/", keywords: ["alcohol", "drugs", "weed", "cannabis", "overdose", "smoking", "recovery"] },
  { icon: "↗", title: "Food & movement", text: "Food access, nutrition, joyful movement, walking loops, and bike safety.", href: "https://shcs.ucdavis.edu/health-and-wellness/food-and-movement", keywords: ["food", "exercise", "movement", "nutrition", "bike", "walk"] },
  { icon: "☼", title: "Supportive campus", text: "Weight-inclusive care, nature, belonging, and thriving at UC Davis.", href: "https://shcs.ucdavis.edu/health-and-wellness/health-promotion", keywords: ["belong", "weight", "nature", "graduate", "campus"] },
  { icon: "＋", title: "A–Z health topics", text: "Plain-language guidance for common physical, mental, and sexual health questions.", href: "https://shcs.ucdavis.edu/health-topics", keywords: ["symptom", "condition", "health", "information"] },
];

const synonymGroups = [
  ["food", "hungry", "hunger", "meal", "eat", "eating", "groceries", "grocery", "pantry", "snack", "lunch"],
  ["basic needs", "needs", "free", "no money", "broke", "cheap", "zero cost", "$0", "housing", "calfresh", "snap", "ebt"],
  ["medical", "sick", "ill", "hurt", "injured", "doctor", "nurse", "clinic", "pain", "vomit", "vomiting", "throw up", "nausea", "nauseous", "fever", "flu", "covid", "infection", "diarrhea", "stomach", "migraine", "rash", "sprain", "bleeding", "asthma"],
  ["mental health", "sad", "anxious", "anxiety", "depressed", "depression", "panic", "overwhelmed", "therapy", "counseling", "cry", "crying", "dead", "death", "die", "dying", "kill", "killing", "suicide", "suicidal", "self harm", "self-harm", "hurt myself", "want to die", "end it", "no reason to live", "crisis", "breakdown", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "cant take it", "can't take it", "im done", "i'm done"],
  ["period", "menstrual", "pads", "tampons"],
  ["sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "condom", "condoms", "protection", "safe sex", "safer sex", "contraception", "birth control", "plan b", "sti", "std", "hiv", "pregnancy"],
  ["drugs", "substance", "overdose", "narcan", "naloxone", "fentanyl", "alcohol"],
  ["open", "open now", "right now", "today", "available"],
];
const searchStopWords = new Set(["a", "an", "and", "are", "can", "do", "for", "i", "in", "is", "it", "me", "my", "need", "of", "please", "some", "somewhere", "the", "to", "want", "where", "with"]);

const homeCategories = [
  { label: "All", query: "", icon: "✦", text: "Every walk-in resource" },
  { label: "Food", query: "food", icon: "◒", text: "Free meals and pantry" },
  { label: "Basic Needs", query: "basic needs", icon: "⌂", text: "Food, housing, CalFresh" },
  { label: "Medical", query: "medical", icon: "+", text: "Sick, clinic, urgent help" },
  { label: "Mental Health", query: "mental health", icon: "♡", text: "Talk, crisis, counseling" },
  { label: "Free Supplies", query: "free supplies", icon: "•", text: "Narcan, safer sex, period care" },
  { label: "Safety", query: "safety care", icon: "!", text: "CARE and confidential support" },
];

const resourceLexiconSeeds: Record<string, string[]> = {
  "aggie-eats": ["hungry", "need food", "free meal", "hot meal", "lunch", "food truck", "pay what you want", "pay what i can", "no money for lunch", "eat now", "cheap food", "warm food", "student meal", "today food", "where is aggie eats", "storer hall", "east quad"],
  pantry: ["groceries", "free groceries", "pantry", "produce", "snacks", "food insecurity", "need groceries", "student food", "basic food", "toiletries", "canned food", "fresh produce", "free snacks", "memorial union pantry", "aggiecard food"],
  "aggie-compass": ["basic needs", "calfresh", "snap", "ebt", "aggiefresh", "housing help", "financial support", "case management", "food insecurity", "no money", "broke", "need help paying", "resources", "toiletries", "spices", "essentials pantry"],
  freedge: ["community fridge", "free fridge", "after hours food", "food after hours", "donated food", "free produce", "canned food", "food now", "open fridge", "stock varies"],
  "acute-care": ["vomit", "vomiting", "throw up", "nausea", "nauseous", "fever", "flu", "covid", "infection", "diarrhea", "stomach pain", "migraine", "rash", "sprain", "bleeding", "asthma", "sick", "ill", "hurt", "injured", "doctor", "nurse", "clinic", "urgent care", "same day", "advice nurse", "pain", "sore throat", "ear pain", "chest pain", "allergic reaction", "uti", "burn"],
  "health-34": ["after hours", "night", "comes to you", "mobile help", "non emergency", "not emergency", "wellness check", "medical navigation", "mental health navigation", "campus response", "help now", "someone come", "free 24 7", "late night sick", "where can i get help now"],
  counseling: ["cry", "crying", "panic", "panic attack", "anxiety", "depression", "depressed", "suicidal", "suicide", "self harm", "hurt myself", "want to die", "dead", "death", "die", "kill", "killing", "breakdown", "overwhelmed", "stress", "grief", "lonely", "talk to someone", "therapy", "counseling", "mental crisis", "same day crisis", "i cannot do this", "i feel hopeless", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "i'm done"],
  "love-lab": ["condom", "condoms", "protection", "safe sex", "safer sex", "need condoms", "free condoms", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "make out", "boyfriend", "girlfriend", "partner", "date", "lube", "lubricant", "dental dam", "dental dams", "pads", "tampons", "period", "menstrual", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "unprotected sex", "free period products", "sex supplies"],
  "hp-narcan": ["narcan", "naloxone", "overdose", "opioid", "fentanyl", "harm reduction", "safe party", "drug safety", "reverse overdose", "free narcan"],
  "fentanyl-strips": ["fentanyl", "test strips", "drug checking", "harm reduction", "safe party", "overdose prevention", "testing strips", "check drugs", "free strips"],
  "free-helmet": ["helmet", "bike", "bicycle", "scooter", "skateboard", "bike safety", "free helmet", "helmet hair", "bike barn", "crash", "protect head"],
  care: ["care", "safe", "unsafe", "confidential", "survivor", "advocate", "sexual assault", "assault", "harassment", "stalking", "intimate partner violence", "dating violence", "relationship abuse", "consent", "rape", "title ix", "violence", "abuse", "someone hurt me", "need advocate"],
  ...Object.fromEntries(additionalResourcePrompts.map(({ id, aliases, phrases }) => [id, [...aliases, ...phrases]])),
};

let languageResourceLexicon: Record<Exclude<AppLanguage, "en">, Record<string, string[]>> | null = null;
function getLanguageResourceLexicon() {
  // Every former prefix/suffix variant contained its seed. Match the seed once
  // instead of materializing thousands of redundant strings on first search.
  const additionalZhSeeds = new Map(additionalResourcePrompts.map(({ id, zh }) => [id, zh || []]));
  return languageResourceLexicon ??= Object.fromEntries((Object.keys(languageResourceSeeds) as Exclude<AppLanguage, "en">[]).map((language) => [
    language,
    Object.fromEntries(resources.map((resource) => [resource.id, [...new Set([
      ...(languageResourceSeeds[language][resource.id] || []),
      ...(language === "zh" ? additionalZhSeeds.get(resource.id) || [] : []),
    ].map((seed) => seed.toLowerCase()).filter(Boolean))]])),
  ])) as Record<Exclude<AppLanguage, "en">, Record<string, string[]>>;
}

function languageExpansionForResource(resource: Resource) {
  return [resource.name, resource.short, resource.category, ...resource.keywords, ...(resourceLexiconSeeds[resource.id] || [])].join(" ");
}

const promptPrefixes = ["", "i need", "need", "where is", "where can i find", "help with", "free", "student", "campus", "uc davis", "near me", "open now", "walk in", "urgent", "quick", "today", "right now"];
const promptSuffixes = ["", "near me", "on campus", "at uc davis", "right now", "today", "open now", "free", "walk in", "for students", "please", "urgent", "nearby"];
const typoPairs: [string, string][] = [["mental", "mentl"], ["anxiety", "anxity"], ["depression", "depresion"], ["vomiting", "vomitting"], ["nausea", "nausa"], ["diarrhea", "diarea"], ["counseling", "counceling"], ["groceries", "grocieries"], ["narcan", "narccan"], ["fentanyl", "fentanil"], ["condom", "condom"], ["calfresh", "cal fresh"]];
const categoryIntentSignals: Record<Resource["category"], string[]> = {
  Food: ["food", "hungry", "hunger", "meal", "eat", "eating", "groceries", "grocery", "pantry", "produce", "snack", "lunch", "dinner", "free food", "hot meal", "community fridge", "饿", "餓", "吃", "饭", "食品", "食物", "comida", "hambre", "배고", "음식", "食べ物", "भूख", "भोजन", "faim", "nourriture"],
  "Basic needs": ["basic needs", "housing", "rent", "calfresh", "snap", "ebt", "aggiefresh", "financial", "no money", "broke", "toiletries", "benefits", "基本需求", "基础需求", "住房", "房租", "没钱", "生活困难", "necesidades", "vivienda", "재정", "住居", "logement"],
  Medical: ["medical", "sick", "ill", "clinic", "doctor", "nurse", "urgent", "pain", "vomit", "vomiting", "throw up", "nausea", "fever", "diarrhea", "stomach", "rash", "injury", "hurt", "生病", "肚子疼", "胃痛", "腹痛", "呕吐", "发烧", "诊所", "vomitar", "fiebre", "구토", "아파", "吐き気", "熱", "उल्टी", "बुखार", "clinique", "fièvre"],
  "Mental health": ["mental", "anxiety", "depression", "panic", "therapy", "counseling", "cry", "crisis", "suicide", "self harm", "want to die", "fuck up", "fucked up", "mess myself up", "ruin myself", "can't take it", "i'm done", "心理", "焦虑", "抑郁", "崩溃", "想死", "自杀", "상담", "불안", "うつ", "相談", "ansiedad", "depresión", "anxiété", "dépression"],
  Supplies: ["supplies", "condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "lube", "tampon", "pads", "period", "menstrual", "narcan", "naloxone", "fentanyl", "helmet", "bike", "free helmet", "安全套", "避孕套", "卫生巾", "月经", "纳洛酮", "头盔", "condón", "casco", "콘돔", "헬멧", "ナロキソン", "ヘルメット", "कंडोम", "हेलमेट", "préservatif", "casque"],
  Safety: ["safe", "safety", "unsafe", "care", "assault", "harassment", "stalking", "violence", "abuse", "rape", "advocate", "confidential", "不安全", "骚扰", "暴力", "性侵", "acoso", "violencia", "폭력", "ハラスメント", "हिंसा", "harcèlement"],
};
const categoryPriority: Resource["category"][] = ["Food", "Basic needs", "Medical", "Mental health", "Supplies", "Safety"];
const crisisPhrasePatterns = [
  /\b(i\s+)?(would\s+like|want|wanna|need|going|gonna|about)\s+to\s+fuck\s+(myself\s+)?up\b/i,
  /\bfuck\s+myself\s+up\b/i,
  /\bmess\s+myself\s+up\b/i,
  /\bruin\s+myself\b/i,
  /\bdestroy\s+myself\b/i,
  /\b(can'?t|cannot)\s+take\s+it\b/i,
  /\b(i'?m|i\s+am)\s+done\b/i,
  /\b(i\s+)?feel\s+hopeless\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
];
const sexualHealthPhrasePatterns = [
  /\b(fuck|sex|hook\s*up|hookup|sleep\s+with|make\s+out)\b.{0,28}\b(my\s+)?(boyfriend|girlfriend|partner|date|him|her|them|someone|bf|gf)\b/i,
  /\b(my\s+)?(boyfriend|girlfriend|partner|date|him|her|them|someone|bf|gf)\b.{0,28}\b(fuck|sex|hook\s*up|hookup|sleep\s+with|make\s+out)\b/i,
  /\b(have|having|had|want|need|wanna)\s+(safe\s+)?sex\b/i,
  /\b(unprotected\s+sex|safe\s+sex|safer\s+sex|birth\s+control|plan\s*b|sti|std|hiv|pregnan(?:t|cy)|condoms?|lube|lubricant|dental\s+dams?)\b/i,
];
type SemanticIntentRule = {
  category: Resource["category"];
  targetIds: string[];
  blocks?: Resource["category"][];
  patterns: RegExp[];
  terms: string[];
  boost: number;
};
const semanticIntentRules: SemanticIntentRule[] = [
  {
    category: "Food", targetIds: ["aggie-eats", "pantry", "aggie-compass", "freedge"], blocks: ["Mental health", "Medical", "Supplies", "Safety"], boost: 34,
    patterns: [/hungr|starv|need.*(food|meal|eat)|food.*(now|free|open)|no\s+money.*(eat|food)|饿|餓|好饿|吃饭|没饭|免費飯|免费饭|hambre|tengo hambre|comida gratis|배고|밥.*필요|お腹すいた|食べ物|भूख|खाना|j.ai faim|faim/i],
    terms: ["hungry", "starving", "food", "free food", "meal", "groceries", "pantry", "eat", "lunch", "dinner", "snack"],
  },
  {
    category: "Medical", targetIds: ["acute-care", "health-34"], blocks: ["Mental health", "Safety"], boost: 36,
    patterns: [/vomit|throw\s*up|nause|fever|diarrhea|stomach|abdominal|sick|clinic|doctor|nurse|injur|bleeding|rash|migraine|肚子疼|肚子痛|胃疼|胃痛|腹痛|呕吐|嘔吐|恶心|噁心|发烧|發燒|生病|腹泻|腹瀉|诊所|診所|토|구토|아파|腹痛|吐き気|熱|उल्टी|बुखार|vomitar|fiebre|fièvre|clinique/i],
    terms: ["medical", "sick", "clinic", "doctor", "nurse", "urgent care", "vomit", "nausea", "fever", "stomach pain", "diarrhea", "injury", "pain"],
  },
  {
    category: "Mental health", targetIds: ["counseling", "health-34"], boost: 44,
    patterns: [...crisisPhrasePatterns, /suicid|kill\s+myself|want\s+to\s+die|hurt\s+myself|self\s*harm|panic|crying|breakdown|depress|anxious|anxiety|can.?t\s+take\s+it|想死|自杀|自殺|活不下去|崩溃|崩潰|焦虑|焦慮|抑郁|憂鬱|자살|죽고\s*싶|불안|우울|死にたい|自殺|不安|うつ|आत्महत्या|मरना|ansiedad|depresi[oó]n|suicidio|anxiété|dépression/i],
    terms: ["mental health", "crisis", "counseling", "therapy", "panic", "crying", "depression", "anxiety", "suicide", "self harm", "want to die", "talk to someone"],
  },
  {
    category: "Supplies", targetIds: ["love-lab"], blocks: ["Mental health"], boost: 42,
    patterns: [...sexualHealthPhrasePatterns, /condoms?|safe\s+sex|safer\s+sex|birth\s+control|contracept|plan\s*b|sti|std|hiv|pregnan|period|tampons?|pads?|lube|lubricant|安全套|避孕套|卫生巾|衛生巾|月经|月經|性病|怀孕|懷孕|피임|콘돔|생리|コンドーム|避妊|生理|कंडोम|préservatif|contraception/i],
    terms: ["condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "period", "pads", "tampons", "lube"],
  },
  {
    category: "Supplies", targetIds: ["hp-narcan", "fentanyl-strips"], blocks: ["Mental health"], boost: 38,
    patterns: [/narcan|naloxone|overdose|opioid|fentanyl|test\s*strips?|drug\s*check|harm\s*reduction|纳洛酮|納洛酮|芬太尼|过量|過量|나르칸|펜타닐|ナロキソン|フェンタニル|naloxona|fentanilo|naloxone|surdose/i],
    terms: ["narcan", "naloxone", "overdose", "opioid", "fentanyl", "test strips", "drug checking", "harm reduction"],
  },
  {
    category: "Supplies", targetIds: ["free-helmet"], blocks: ["Mental health", "Basic needs"], boost: 36,
    patterns: [/helmet|bike\s+helmet|cracked\s+helmet|broken\s+helmet|bicycle|scooter|skateboard|头盔|頭盔|安全帽|自行车|自行車|헬멧|ヘルメット|हेलमेट|casco|casque/i],
    terms: ["helmet", "bike helmet", "free helmet", "bike", "bicycle", "scooter", "skateboard", "safety"],
  },
  {
    category: "Safety", targetIds: ["care"], blocks: ["Food", "Basic needs"], boost: 40,
    patterns: [/sexual\s+assault|assault|harass|stalking|rape|violence|abuse|unsafe|relationship\s+abuse|intimate\s+partner|consent|confidential|骚扰|騷擾|跟踪|暴力|侵犯|强奸|強姦|性侵|家暴|스토킹|폭력|ハラスメント|性暴力|acoso|violencia|agression|harcèlement/i],
    terms: ["care", "safety", "unsafe", "confidential", "advocate", "assault", "harassment", "stalking", "violence", "abuse", "consent"],
  },
  {
    category: "Basic needs", targetIds: ["aggie-compass", "pantry"], boost: 32,
    patterns: [/basic\s+needs|calfresh|snap|ebt|housing|rent|financial|broke|no\s+money|toiletries|基本需求|基础需求|住房|房租|没钱|沒錢|经济困难|生活困难|necesidades|vivienda|logement|주거|재정/i],
    terms: ["basic needs", "housing", "rent", "calfresh", "snap", "ebt", "financial support", "no money", "broke", "toiletries"],
  },
];
// Small, reviewed typo table for scripts where Latin edit-distance would be
// unsafe. Correct only unambiguous service phrases, not arbitrary characters.
const nonEnglishCorrections: [RegExp, string][] = [
  [/心里健康/g, "心理健康"], [/心里咨询/g, "心理咨询"], [/卫身巾/g, "卫生巾"],
  [/安圈套/g, "安全套"], [/避孕淘/g, "避孕套"], [/纳落酮|纳洛同/g, "纳洛酮"], [/吃反/g, "吃饭"],
  [/肚子滕|肚子藤/g, "肚子疼"], [/芳租/g, "房租"], [/食物劵/g, "食物券"],
  [/头亏/g, "头盔"], [/\bcomdia\b/gi, "comida"], [/\bansieda\b/gi, "ansiedad"],
];
function correctNonEnglishInput(value: string) {
  return nonEnglishCorrections.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}
// Chinese is not whitespace-delimited. Route only high-confidence, contextual
// phrases before the multilingual lexicon expands them into English keywords.
// A one-character homophone or a generic mood meme must never become a route.
function chineseSearchRoute(input: string): string[] | null {
  if (!/[\u3400-\u9fff]/.test(input)) return null;
  const q = correctNonEnglishInput(input).replace(/\s+/g, "").toLowerCase();
  const has = (pattern: RegExp) => pattern.test(q);
  if (has(/比赛.*破防线|写代码.*破防|社死.*手机|手机.*碎|emo表情包|emo文案|吐槽/) && !has(/(?:肚子疼|胃疼|发烧|生病|我想死|心理危机)/)) return [];
  if (has(/膝(?:盖|蓋)(?:护具|護具|护膝)|自行车.{0,4}(?:轮胎|车胎).{0,3}破了/)) return [];
  if (has(/干饭|乾飯|吃饭|吃飯|饿|餓/) && has(/(?:不是|不|没).{0,3}(?:找|要|想要)?心理咨询/)) return ["aggie-eats", "pantry", "freedge"];
  if (has(/(?:不|没|不是).{0,4}(?:想|要).{0,3}(?:自杀|想死)/) && has(/发烧|生病|肚子疼|胃疼|看医生/)) return ["acute-care"];
  if (has(/(?:不饿|不餓|不是想找饭|不是想找飯)/) && has(/肚子疼|胃疼|看医生|诊所/)) return ["acute-care"];
  if (has(/强迫.*(?:性关系|发生关系)|性侵|强奸|骚扰|跟踪|尾随|家暴|(?:男朋友|女朋友|伴侣|前任|前男友).{0,9}(?:打我|威胁我|控制我)|不安全.*(?:家|伴侣)/)) return ["care"];
  if (has(/(?:想死|自杀|自殘|自残|活不下去|不想活)/) && !has(/(?:不|没|没有).{0,4}(?:想死|自杀)/)) return ["counseling", "health-34"];
  if (has(/纳洛酮|纳洛同|narcan|阿片.*过量/)) return ["hp-narcan"];
  if (has(/芬太尼.{0,6}(?:试纸|检测|測試|测试)|(?:试纸|检测).{0,6}芬太尼/)) return ["fentanyl-strips"];
  if (has(/头盔|頭盔|安全帽/)) return ["free-helmet"];
  if (has(/卫生巾|衛生巾|棉条|棉條|避孕套|安全套|套套|月经|月經|姨妈|姨媽|润滑剂|潤滑劑/)) return ["love-lab", "love-lab-bag", "wrrc-pharmacy"];
  if (has(/(?:半夜|晚上|夜里|夜裡|凌晨).{0,14}(?:生病|不舒服|上门|上門|帮忙|幫忙)|(?:上门|上門).{0,8}(?:医疗|醫療|帮忙|幫忙)/)) return ["health-34"];
  if (has(/(?:膝盖|膝蓋|脚踝|腳踝|手腕|手臂|胳膊|腿|脚|腳|手肘).{0,2}(?:破了|擦伤|擦傷|流血|疼|痛|扭伤|扭傷|骨折|受伤|受傷)|(?:摔破|擦破|扭伤|扭傷|骨折).{0,3}(?:膝盖|膝蓋|脚踝|腳踝|手腕|腿|脚|腳)/)) return ["acute-care"];
  if (has(/肚子疼|肚子痛|胃疼|胃痛|腹痛|想吐(?!槽)|吐了|吐得|一直吐|呕吐|嘔吐|发烧|發燒|生病|看医生|看醫生|诊所|診所/)) return ["acute-care", "health-34"];
  if (has(/焦虑|焦慮|抑郁|抑鬱|心理咨询|心理諮詢|心理健康|压力.{0,6}(?:大|聊|说话)|(?:^|我|最近|今天|现在|現在|有点|有點|感觉|感覺)emo(?:了|啦|中|得|到|$)|(?:emo|破防).{0,12}(?:聊|说话|咨询|压力)|(?:^|我)破防了|(?:想找人|找个人).{0,6}(?:聊|说话)/)) return ["counseling", "health-34"];
  if (has(/房租|交不起租|没地方住|沒地方住|住房|无家可归|無家可歸|食物券|食物劵|calfresh|基本需求|穷到吃土|窮到吃土/)) return ["aggie-compass"];
  if (has(/(?:社区|社區|免费|免費).*冰箱|冰箱在哪里|冰箱在哪裡|(?:晚上|夜里|夜裡|下班后).{0,12}(?:食物|吃|饭|飯)/)) return ["freedge"];
  if (has(/蔬菜|水果|领菜|領菜|买菜|買菜|杂货|雜貨|罐头|罐頭|食品储藏|食品儲藏/)) return ["pantry", "fruit-veggie-compass", "fruit-veggie-coho", "freedge"];
  if (has(/热饭|熱飯|热餐|熱餐|热食|熱食|熟食|一顿饭|一頓飯|干饭|乾飯|午饭|午飯/)) return ["aggie-eats"];
  if (has(/(?:饿死|餓死|很饿|很餓|好饿|好餓|想吃饭|想吃飯|吃饭|吃飯|免费饭|免費飯|没钱买饭|没有钱买饭|哪里有饭|哪裡有飯|没饭吃|沒飯吃)/)) return ["aggie-eats", "pantry", "freedge", "aggie-compass"];
  return null;
}
function semanticAnalysis(query: string) {
  const corrected = correctNonEnglishInput(query);
  const raw = corrected.toLowerCase();
  const clean = normalize(corrected);
  const matches = semanticIntentRules
    .map((rule) => ({ rule, hit: rule.patterns.some((pattern) => pattern.test(raw)) || rule.terms.some((term) => clean.includes(normalize(term))) }))
    .filter((item) => item.hit);
  const scores = new Map<Resource["category"], number>();
  const targetIds = new Set<string>();
  const blockedCategories = new Set<Resource["category"]>();
  const expandedTerms = new Set<string>();
  for (const { rule } of matches) {
    scores.set(rule.category, (scores.get(rule.category) || 0) + rule.boost);
    rule.targetIds.forEach((id) => targetIds.add(id));
    rule.blocks?.forEach((category) => blockedCategories.add(category));
    rule.terms.forEach((term) => expandedTerms.add(term));
  }
  if (scores.has("Mental health")) blockedCategories.delete("Mental health");
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const primary = ranked[0]?.[0] || null;
  return { primary, targetIds, blockedCategories, expandedTerms, scores };
}

function typoVariants(value: string) {
  const clean = normalize(value);
  const variants = new Set<string>();
  typoPairs.forEach(([from, to]) => { if (clean.includes(from)) variants.add(clean.replaceAll(from, to)); });
  return [...variants];
}
function buildPromptLexicon(resource: Resource, limit = 800) {
  const base = [...new Set([resource.name, resource.short, resource.category, resource.description, resource.location, resource.cost, ...resource.keywords, ...(resourceLexiconSeeds[resource.id] || [])].map(normalize).filter(Boolean))];
  const phrases = new Set<string>(base);
  const shortBase = base.filter((item) => item.length <= 42);
  for (const term of shortBase) {
    for (const prefix of promptPrefixes) {
      for (const suffix of promptSuffixes) {
        const phrase = normalize(`${prefix} ${term} ${suffix}`);
        if (phrase) phrases.add(phrase);
        typoVariants(phrase).forEach((variant) => phrases.add(variant));
        if (phrases.size >= limit) return [...phrases];
      }
    }
  }
  for (const a of shortBase.slice(0, 80)) {
    for (const b of shortBase.slice(0, 80)) {
      if (a !== b) phrases.add(normalize(`${a} ${b}`));
      if (phrases.size >= limit) return [...phrases];
    }
  }
  return [...phrases].slice(0, limit);
}
let resourcePromptLexiconSet: Record<string, Set<string>> | null = null;
function getResourcePromptLexiconSet() {
  return resourcePromptLexiconSet ??= Object.fromEntries(resources.map((resource) => [resource.id, new Set(buildPromptLexicon(resource, additionalResourcePrompts.some((profile) => profile.id === resource.id) ? 120 : 800))])) as Record<string, Set<string>>;
}
const resourceSearchText = Object.fromEntries(resources.map((resource) => [resource.id, normalize([resource.name, resource.short, resource.category, resource.description, resource.location, resource.cost, ...resource.keywords, ...(resourceLexiconSeeds[resource.id] || [])].join(" "))])) as Record<string, string>;
const resourceSearchWords = Object.fromEntries(Object.entries(resourceSearchText).map(([id, text]) => [id, [...new Set(text.split(" ").filter((word) => word.length > 2))]])) as Record<string, string[]>;

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9\s$]/g, " ").replace(/\s+/g, " ").trim(); }
function asksForPreparedMeal(query: string) { return /热饭|熱飯|热餐|熱餐|热食|熱食|熟食|一顿饭|一頓飯|comida caliente|repas chaud/i.test(query); }
function asksForFoodImmediately(query: string) { return /(?:很|好|太|快|现在|現在|马上|馬上|立即)饿|(?:饿|餓)(?:了|死)|(?:现在|現在|马上|馬上).{0,8}(?:吃饭|吃飯|吃东西|吃東西)/.test(query); }
function isEnglishQuery(value: string, language: AppLanguage) {
  // Full-width punctuation from Chinese keyboards does not make an otherwise
  // Latin query multilingual; "emo？" must take the same path as "emo?".
  const withoutCjkPunctuation = value.replace(/[，。！？、；：…“”‘’（）【】《》—～·]/g, " ");
  return /^[\x00-\x7f]*$/.test(withoutCjkPunctuation) && (language === "en" || classifyEnglishRisk(value) !== null || searchEnglish(value).length > 0);
}
const normalizedInputCache = new Map<string, string>();
function normalizeSearchInput(value: string) {
  const cached = normalizedInputCache.get(value);
  if (cached !== undefined) return cached;
  const corrected = correctNonEnglishInput(value);
  const raw = corrected.toLowerCase();
  const semantic = semanticAnalysis(corrected);
  let expanded = `${corrected} ${[...semantic.expandedTerms].join(" ")}`;
  const lexicons = getLanguageResourceLexicon();
  for (const language of Object.keys(lexicons) as Exclude<AppLanguage, "en">[]) {
    const resourceLexicons = lexicons[language];
    for (const resource of resources) {
      const phrases = resourceLexicons[resource.id] || [];
      if (phrases.some((phrase) => phrase.length > 1 && raw.includes(phrase))) expanded += ` ${languageExpansionForResource(resource)}`;
    }
  }
  if (normalizedInputCache.size > 80) normalizedInputCache.clear();
  normalizedInputCache.set(value, expanded);
  return expanded;
}
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old;
    }
  }
  return row[b.length];
}
function queryTerms(query: string) {
  if (chineseSearchRoute(query) !== null) return [];
  const clean = normalize(normalizeSearchInput(query)); const words = clean.split(" ").filter((word) => word.length > 1 && !searchStopWords.has(word)); const expanded = new Set(words);
  if (words.length > 1) expanded.add(words.join(" "));
  synonymGroups.forEach((group) => { if (group.some((word) => clean.includes(word) || words.some((token) => editDistance(token, word) <= Math.max(1, Math.floor(word.length * .25))))) group.forEach((word) => expanded.add(word)); });
  return [...expanded];
}
function categorySignalScores(query: string) {
  const raw = query.toLowerCase();
  const clean = normalize(normalizeSearchInput(query));
  const scores = new Map<Resource["category"], number>();
  for (const category of categoryPriority) {
    let score = 0;
    for (const signal of categoryIntentSignals[category]) {
      const normalized = normalize(signal);
      if (normalized && clean.includes(normalized)) score += normalized.includes(" ") ? 7 : 4;
      else if (!normalized && raw.includes(signal.toLowerCase())) score += 4;
      else if (/[^\x00-\x7F]/.test(signal) && raw.includes(signal.toLowerCase())) score += 6;
    }
    scores.set(category, score);
  }
  return scores;
}
function dominantCategories(query: string) {
  const scores = categorySignalScores(query);
  const max = Math.max(...categoryPriority.map((category) => scores.get(category) || 0));
  if (max < 4) return new Set<Resource["category"]>();
  const keep = new Set<Resource["category"]>();
  for (const category of categoryPriority) if ((scores.get(category) || 0) >= Math.max(4, max - 3)) keep.add(category);
  if (keep.has("Food")) keep.add("Basic needs");
  if (keep.has("Mental health")) keep.add("Medical");
  return keep;
}
function queryIntents(query: string) {
  const primary = primaryIntent(query);
  if (primary === "Food") return new Set<Resource["category"]>(["Food", "Basic needs"]);
  if (primary === "Medical") return new Set<Resource["category"]>(["Medical"]);
  if (primary === "Mental health") return new Set<Resource["category"]>(["Mental health", "Medical"]);
  if (primary === "Supplies") return new Set<Resource["category"]>(["Supplies"]);
  if (primary === "Safety") return new Set<Resource["category"]>(["Safety"]);
  const clean = normalize(normalizeSearchInput(query)); const terms = queryTerms(query); const intents = new Set<Resource["category"]>();
  const hasAny = (words: string[]) => words.some((word) => clean.includes(word) || terms.includes(word));
  if (hasAny(["food", "hungry", "hunger", "meal", "eat", "groceries", "grocery", "pantry", "snack", "lunch"])) intents.add("Food");
  if (hasAny(["basic needs", "no money", "broke", "cheap", "$0", "calfresh", "snap", "ebt", "housing", "toiletries"])) { intents.add("Basic needs"); intents.add("Food"); }
  if (hasAny(["medical", "sick", "ill", "hurt", "injured", "doctor", "nurse", "clinic", "pain", "vomit", "vomiting", "throw up", "nausea", "nauseous", "fever", "flu", "covid", "infection", "diarrhea", "stomach", "migraine", "rash", "sprain", "bleeding", "asthma"])) intents.add("Medical");
  if (crisisPhrasePatterns.some((pattern) => pattern.test(query)) || hasAny(["mental health", "sad", "anxious", "anxiety", "depressed", "depression", "panic", "overwhelmed", "therapy", "counseling", "crisis", "cry", "crying", "dead", "death", "die", "dying", "kill", "killing", "suicide", "suicidal", "self harm", "self-harm", "hurt myself", "want to die", "end it", "no reason to live", "breakdown", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "cant take it", "i'm done", "im done"])) intents.add("Mental health");
  if (sexualHealthPhrasePatterns.some((pattern) => pattern.test(query)) || hasAny(["period", "menstrual", "pads", "tampons", "condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "narcan", "naloxone", "fentanyl", "helmet", "supplies"])) intents.add("Supplies");
  if (hasAny(["safe", "safety", "care", "assault", "harassment", "stalking", "violence", "abuse", "unsafe", "consent", "confidential", "advocate"])) intents.add("Safety");
  return intents;
}
function primaryIntent(query: string): Resource["category"] | null {
  const raw = query.toLowerCase();
  const clean = normalize(normalizeSearchInput(query));
  const hasClean = (words: string[]) => words.some((word) => clean.includes(word));
  const hasRaw = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(raw));
  const semantic = semanticAnalysis(query);
  if (semantic.primary) return semantic.primary;
  if (hasRaw(sexualHealthPhrasePatterns)) return "Supplies";
  if (hasRaw(crisisPhrasePatterns)) return "Mental health";
  if (hasClean(["suicide", "suicidal", "self harm", "hurt myself", "want to die", "kill myself", "no reason to live"]) || hasRaw([/自杀|自殺|想死|活不下去|죽고\s*싶|자살|死にたい|自殺|आत्महत्या|मरना\s*चाह|suicidio|envie de mourir/i])) return "Mental health";
  if (hasClean(["hungry", "hunger", "meal", "free food", "hot food", "groceries", "pantry", "food truck", "eat now"]) || hasRaw([/饿|餓|好饿|吃饭|吃的|食物|食品|免费饭|免費飯|hambre|comida|배고|밥|음식|お腹すいた|食べ物|食料|भूख|खाना|भोजन|faim|nourriture/i])) return "Food";
  if (hasClean(["vomit", "vomiting", "throw up", "nausea", "fever", "diarrhea", "sick", "clinic", "doctor", "nurse", "urgent care", "stomach pain", "abdominal pain"]) || hasRaw([/肚子疼|肚子痛|胃疼|胃痛|腹痛|肚子不舒服|肠胃|腸胃|呕吐|嘔吐|恶心|噁心|发烧|發燒|生病|腹泻|腹瀉|诊所|診所|토|구토|메스꺼|열|病気|吐き気|熱|उल्टी|बुखार|क्लिनिक|vomitar|fiebre|clinique|fièvre/i])) return "Medical";
  if (hasClean(["helmet", "condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "tampon", "pads", "period", "narcan", "naloxone", "fentanyl", "test strips"]) || hasRaw([/头盔|頭盔|安全帽|安全套|避孕套|卫生巾|衛生巾|月经|月經|纳洛酮|納洛酮|芬太尼|casco|cond[oó]n|나르칸|헬멧|ヘルメット|ナロキソン|हेलमेट|कंडोम|naloxone|préservatif|casque/i])) return "Supplies";
  if (hasClean(["assault", "harassment", "stalking", "violence", "abuse", "unsafe", "rape", "confidential", "advocate"]) || hasRaw([/骚扰|騷擾|跟踪|暴力|侵犯|强奸|強姦|性侵|家暴|acoso|violencia|스토킹|폭력|ハラスメント|性暴力|उत्पीड़न|हिंसा|harcèlement|agression/i])) return "Safety";
  if (hasClean(["anxiety", "depression", "panic", "crying", "therapy", "counseling", "mental health", "breakdown", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "cant take it", "i'm done", "im done"]) || hasRaw([/心理|焦虑|焦慮|抑郁|憂鬱|崩溃|崩潰|불안|우울|상담|不安|うつ|相談|चिंता|अवसाद|ansiedad|depresi[oó]n|anxiété|dépression/i])) return "Mental health";
  return null;
}
function queryProfile(query: string) {
  const chineseRoute = chineseSearchRoute(query);
  if (chineseRoute !== null) return {
    targetIds: new Set(chineseRoute), targetCategories: new Set<Resource["category"]>(),
    blockedCategories: new Set<Resource["category"]>(), strictCategories: new Set<Resource["category"]>(),
    primary: null, chineseRoute,
  };
  const clean = normalize(normalizeSearchInput(query));
  const has = (words: string[]) => words.some((word) => clean.includes(word));
  const semantic = semanticAnalysis(query);
  const sexualContext = sexualHealthPhrasePatterns.some((pattern) => pattern.test(query));
  const crisisContext = crisisPhrasePatterns.some((pattern) => pattern.test(query));
  const targetIds = new Set<string>();
  const blockedCategories = new Set<Resource["category"]>();
  const targetCategories = new Set<Resource["category"]>();
  const strictCategories = new Set<Resource["category"]>();
  const primary = primaryIntent(query);
  if (primary === "Food") { strictCategories.add("Food"); strictCategories.add("Basic needs"); }
  else if (primary) strictCategories.add(primary);
  semantic.targetIds.forEach((id) => targetIds.add(id));
  semantic.blockedCategories.forEach((category) => blockedCategories.add(category));
  semantic.scores.forEach((score, category) => { if (score >= 30) targetCategories.add(category); });
  if (semantic.primary === "Food") targetCategories.add("Basic needs");
  if (has(["helmet", "bike helmet", "bicycle helmet", "broken helmet", "helmet broken", "cracked helmet", "crash helmet"])) {
    targetIds.add("free-helmet"); targetCategories.add("Supplies"); blockedCategories.add("Mental health"); blockedCategories.add("Basic needs");
  }
  if (sexualContext || has(["condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy", "lube", "lubricant", "tampon", "tampons", "pads", "period", "menstrual"])) {
    targetIds.add("love-lab"); targetCategories.add("Supplies"); blockedCategories.add("Mental health");
  }
  if (has(["narcan", "naloxone", "overdose"])) {
    targetIds.add("hp-narcan"); targetCategories.add("Supplies"); blockedCategories.add("Mental health");
  }
  if (has(["fentanyl", "test strip", "test strips"])) {
    targetIds.add("fentanyl-strips"); targetCategories.add("Supplies"); blockedCategories.add("Mental health");
  }
  if (has(["vomit", "vomiting", "throw up", "nausea", "fever", "diarrhea", "rash", "sprain", "asthma", "infection"])) {
    targetIds.add("acute-care"); targetCategories.add("Medical"); blockedCategories.add("Mental health");
  }
  if (has(["hungry", "food", "meal", "groceries", "pantry", "snack"])) {
    targetIds.add("aggie-eats"); targetIds.add("pantry"); targetIds.add("aggie-compass"); targetIds.add("freedge");
    targetCategories.add("Food"); targetCategories.add("Basic needs");
    blockedCategories.add("Mental health"); blockedCategories.add("Medical"); blockedCategories.add("Supplies"); blockedCategories.add("Safety");
  }
  if (crisisContext || has(["cry", "crying", "panic", "suicide", "suicidal", "self harm", "want to die", "kill myself", "i feel broken", "mentally broken", "broken down", "breakdown", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "cant take it", "i'm done", "im done"])) {
    targetIds.add("counseling"); targetCategories.add("Mental health");
  }
  dominantCategories(query).forEach((category) => targetCategories.add(category));
  return { targetIds, targetCategories, blockedCategories, strictCategories, primary, chineseRoute };
}
function davisDate(now: Date) { return new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })); }
function scheduleBlocks(hours: Schedule): ScheduleBlock[] { return Array.isArray(hours) ? hours : typeof hours === "string" ? [] : [hours]; }
function dayLabel(days: number[]) {
  const key = [...days].sort((a, b) => a - b).join(",");
  if (key === "1,2,3,4,5") return "Mon–Fri";
  if (key === "0,6") return "Sat–Sun";
  if (key === "0,1,2,3,4,5,6") return "Daily";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((day) => names[day]).join("/");
}
function scheduleTime(value: number) {
  const whole = Math.floor(value);
  const minutes = Math.round((value - whole) * 60);
  const hour = whole > 12 ? whole - 12 : whole || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${value >= 12 ? "PM" : "AM"}`;
}
function statusFor(hours: Schedule, now: Date, text = enText) {
  if (hours === "always") return { open: true, label: text.open24, closing: "" };
  if (hours === "varies") return { open: false, label: text.checkOfficialSchedule, closing: "Check stock & access" };
  const local = davisDate(now); const hour = local.getHours() + local.getMinutes() / 60; const day = local.getDay();
  const blocks = scheduleBlocks(hours);
  const active = blocks.find((block) => block.days.includes(day) && hour >= block.open && hour < block.close);
  if (active) return { open: true, label: text.openNow, closing: `until ${scheduleTime(active.close)}${active.note ? ` · ${active.note}` : ""}` };
  const todayBlock = blocks.find((block) => block.days.includes(day));
  if (todayBlock && hour < todayBlock.open) return { open: false, label: text.closedNow, closing: `${text.today} · opens ${scheduleTime(todayBlock.open)}` };
  const note = blocks.map((block) => `${block.label || dayLabel(block.days)} ${scheduleTime(block.open)}–${scheduleTime(block.close)}`).join(" · ");
  return { open: false, label: text.closedNow, closing: note || text.weekdayAccess };
}
function scheduleText(hours: Schedule) {
  if (hours === "always") return "Open 24 hours";
  if (hours === "varies") return "Hours vary — check before going";
  return scheduleBlocks(hours).map((block) => `${block.label || dayLabel(block.days)} · ${scheduleTime(block.open)}–${scheduleTime(block.close)}${block.note ? ` · ${block.note}` : ""}`).join(" · ");
}
function displaySchedule(hours: Schedule, language: AppLanguage) {
  if (language !== "zh") return scheduleText(hours);
  if (hours === "always") return "24 小时可用";
  if (hours === "varies") return "时间不固定 · 出发前请核对";
  const day = (label: string) => label.replaceAll("Mon–Fri", "周一至周五").replaceAll("Mon–Thu", "周一至周四").replaceAll("Sat–Sun", "周六、周日").replaceAll("Daily", "每天").replaceAll("Mon", "周一").replaceAll("Tue", "周二").replaceAll("Wed", "周三").replaceAll("Thu", "周四").replaceAll("Fri", "周五");
  const time = (value: number) => `${String(Math.floor(value)).padStart(2, "0")}:${String(Math.round((value % 1) * 60)).padStart(2, "0")}`;
  return scheduleBlocks(hours).map((block) => `${day(block.label || dayLabel(block.days))} · ${time(block.open)}–${time(block.close)}${block.note ? " · 送完即止" : ""}`).join(" · ");
}
function mentalCrisisMatch(query: string) {
  return isMentalCrisisQuery(query);
}
function aggieEatsStop(now: Date) {
  const day = davisDate(now).getDay();
  const storer = { label: "Storer Hall", address: "475 Storer Mall, Davis, CA", lat: 38.54083, lng: -121.75458 };
  const mu = { label: "Memorial Union East Quad", address: "Memorial Union East Quad, Davis, CA", lat: 38.54218, lng: -121.74934 };
  return day === 2 || day === 4 ? { ...storer, schedule: "Today · Storer Hall · 11:30 AM–2:00 PM or until sold out" } : { ...mu, schedule: day >= 1 && day <= 5 ? "Today · MU East Quad · 11:30 AM–2:00 PM or until sold out" : "Next service day · check official schedule" };
}
function resolveResource(resource: Resource, now: Date): Resource {
  if (resource.scheduleValidThrough && davisDate(now).toISOString().slice(0, 10) > resource.scheduleValidThrough) return { ...resource, hours: "varies" };
  if (resource.id !== "aggie-eats") return resource;
  const stop = aggieEatsStop(now);
  return {
    ...resource,
    description: "A pay-what-you-want prepared meal, including $0. The app routes to today's published stop.",
    location: stop.schedule,
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    keywords: [...resource.keywords, stop.label.toLowerCase(), "storer hall", "memorial union", "east quad"],
  };
}
function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (n: number) => n * Math.PI / 180; const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
const buildingAnchors: { match: RegExp; label: string; lat: number; lng: number }[] = [
  { match: /health education|hep|cowell|student disability|free helmet|love lab|narcan|care advocacy/i, label: "Cowell Building", lat: 38.54438, lng: -121.75415 },
  { match: /student health|shcs teaching kitchen|wellness garden|acute care|crisis counseling/i, label: "Student Health and Wellness Center", lat: 38.54273, lng: -121.76163 },
  { match: /memorial union|aggie compass|the pantry|fruit and veggie|mu games|mu market|el centro/i, label: "Memorial Union", lat: 38.54232, lng: -121.74942 },
  { match: /coffee house|coho/i, label: "ASUCD Coffee House", lat: 38.54196, lng: -121.75004 },
  { match: /library|shields|24 hour study/i, label: "Peter J. Shields Library", lat: 38.53965, lng: -121.74952 },
  { match: /student community center|scc|cross cultural|ab540|undocumented|lgbtqia|chicanx|latinx|south coho/i, label: "Student Community Center", lat: 38.53960, lng: -121.75160 },
  { match: /activities and recreation|arc|pavilion|market at the arc/i, label: "Activities and Recreation Center", lat: 38.54279, lng: -121.75917 },
  { match: /silo|gunrock|spokes|crepe|food truck location- silo|center for african diaspora/i, label: "The Silo", lat: 38.53874, lng: -121.75275 },
  { match: /walker hall|graduate student association|freedge - walker|graduate center/i, label: "Walker Hall", lat: 38.53975, lng: -121.75078 },
  { match: /wellman|west quad/i, label: "Wellman Hall", lat: 38.54141, lng: -121.75153 },
  { match: /hutchison|kleiber/i, label: "Hutchison / Kleiber", lat: 38.54062, lng: -121.75457 },
  { match: /segundo/i, label: "Segundo", lat: 38.54494, lng: -121.75850 },
  { match: /tercero|latitude/i, label: "Tercero", lat: 38.53631, lng: -121.75746 },
  { match: /cuarto/i, label: "Cuarto", lat: 38.54725, lng: -121.76316 },
  { match: /vet[- ]?med|schalm|scrubs|gladys valley|genome and biomedical|medical sciences/i, label: "Health Sciences / Vet Med", lat: 38.53342, lng: -121.76401 },
  { match: /mondavi|vanderhoef|gateway|walter a\. buehler|gallagher/i, label: "Gateway / Mondavi Center", lat: 38.53450, lng: -121.74871 },
  { match: /king hall|king hall coffee/i, label: "King Hall", lat: 38.53620, lng: -121.74982 },
  { match: /international center/i, label: "International Center", lat: 38.54546, lng: -121.75462 },
  { match: /hart hall|robbins hall|rock hall/i, label: "Hart Hall / Robbins Hall", lat: 38.54062, lng: -121.75073 },
  { match: /quad hammocks/i, label: "Quad", lat: 38.54087, lng: -121.75009 },
  { match: /lake spafford|arboretum/i, label: "Arboretum", lat: 38.53815, lng: -121.74785 },
];
function buildingAnchor(point: MapPoint) {
  return buildingAnchors.find((anchor) => anchor.match.test(point.name));
}
function snapToBuilding(point: MapPoint): MapPoint {
  if (point.name === "Aggie Eats Food Truck") return point;
  const anchor = buildingAnchor(point);
  return anchor ? { ...point, name: point.name, lat: anchor.lat, lng: anchor.lng } : point;
}
function buildingLabel(point: MapPoint) {
  return buildingAnchor(point)?.label;
}
const CAMPUS_IMAGE_BOUNDS = { west: -121.7795, east: -121.7408, south: 38.5291, north: 38.5486 };
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function withinCampusMap(point: { lat: number; lng: number }) {
  return point.lat >= CAMPUS_IMAGE_BOUNDS.south && point.lat <= CAMPUS_IMAGE_BOUNDS.north && point.lng >= CAMPUS_IMAGE_BOUNDS.west && point.lng <= CAMPUS_IMAGE_BOUNDS.east;
}
function campusMapPosition(point: { lat: number; lng: number }) {
  // Calibrated to the actual 2021–22 campus-map image, including its left index panel and gold frame.
  // The coefficients were fit against visible anchors: Student Health, MU, Silo, ARC, Mondavi, and Vet Med.
  const left = 2078.4627 * point.lng + 160.3640 * point.lat + 246944.9825;
  const top = 163.1960 * point.lng - 4401.6574 * point.lat + 189547.57;
  return { left: `${clamp(left, 14.2, 97.2)}%`, top: `${clamp(top, 4.2, 95.6)}%` };
}
function matchScore(resource: Resource, terms: string[], profile = queryProfile("")) {
  if (profile.chineseRoute !== null) {
    const position = profile.chineseRoute.indexOf(resource.id);
    return position < 0 ? 0 : 1000 - position * 10;
  }
  const reviewDerivedKeywords: Record<string, string[]> = {
    "acute-care": ["vomit", "vomiting", "throw up", "nausea", "nauseous", "fever", "flu", "covid", "infection", "diarrhea", "stomach pain", "migraine", "rash", "sprain", "bleeding", "asthma", "same day", "advice nurse", "urgent care", "clinic", "student health"],
    "health-34": ["after hours", "night", "comes to you", "mobile", "non emergency", "not emergency", "wellness check", "medical navigation", "mental health navigation", "basic medical care", "campus response"],
    "counseling": ["panic attack", "panic", "anxiety", "depression", "depressed", "suicidal", "suicide", "self harm", "self-harm", "hurt myself", "want to die", "dead", "death", "die", "dying", "kill", "killing", "cry", "crying", "breakdown", "overwhelmed", "stress", "grief", "same day crisis", "talk now", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "i'm done"],
    "care": ["confidential", "survivor", "advocate", "sexual assault", "assault", "harassment", "stalking", "intimate partner violence", "dating violence", "relationship abuse", "unsafe", "consent", "title ix"],
    "pantry": ["food insecurity", "free groceries", "basic essentials", "walk in", "student run", "undergraduate run", "produce", "canned goods", "toiletries", "memorial union", "student id"],
    "aggie-compass": ["basic needs center", "calfresh", "aggiefresh", "snap", "ebt", "case management", "housing", "financial support", "food insecurity", "resource navigation"],
    "aggie-eats": ["pay what you can", "pay what you want", "free meal", "hot meal", "$0", "food truck", "lunch", "storer", "east quad"],
    "freedge": ["community fridge", "after hours food", "donated food", "free produce", "canned food", "stock varies"],
    "love-lab": ["condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "pregnancy", "lubricant", "lube", "dental dams", "pads", "tampons", "period", "sti", "std", "hiv"],
    "hp-narcan": ["narcan", "naloxone", "overdose", "opioid", "fentanyl", "harm reduction", "safe party"],
    "fentanyl-strips": ["fentanyl", "test strips", "drug checking", "harm reduction", "safe party", "overdose prevention"],
    "free-helmet": ["bike", "bicycle", "helmet", "scooter", "skateboard", "helmet hair", "bike barn"],
  };
  const generatedSet = getResourcePromptLexiconSet()[resource.id] || new Set<string>();
  const haystack = `${resourceSearchText[resource.id] || ""} ${normalize((reviewDerivedKeywords[resource.id] || []).join(" "))}`;
  const searchWords = resourceSearchWords[resource.id] || [];
  let score = 0;
  const semanticScore = profile.primary === resource.category ? 22 : 0;
  score += semanticScore;
  if (profile.targetIds.has(resource.id)) score += 90;
  if (profile.targetCategories.has(resource.category)) score += 24;
  if (profile.blockedCategories.has(resource.category) && !profile.targetIds.has(resource.id)) score -= 80;
  for (const term of terms) {
    if (!term) continue;
    if (generatedSet.has(term)) score += 18;
    if (haystack.includes(term)) score += term.includes(" ") ? 13 : 6;
    else if (term.length > 4 && searchWords.some((word) => Math.abs(word.length - term.length) <= 2 && editDistance(term, word) <= Math.max(1, Math.floor(term.length * .22)))) score += 3;
  }
  const medicalSymptom = ["vomit", "vomiting", "throw up", "nausea", "nauseous", "fever", "flu", "covid", "infection", "diarrhea", "stomach", "migraine", "rash", "sprain", "bleeding", "asthma"];
  if (resource.id === "acute-care" && terms.some((term) => medicalSymptom.includes(term))) score += 18;
  if (resource.id === "health-34" && terms.some((term) => ["after hours", "night", "comes to you", "mobile", "help now"].includes(term))) score += 16;
  const mentalCrisisTerms = ["cry", "crying", "dead", "death", "die", "dying", "kill", "killing", "suicide", "suicidal", "self harm", "self-harm", "hurt myself", "want to die", "end it", "no reason to live", "breakdown", "fuck up", "fucked up", "fuck myself up", "mess myself up", "ruin myself", "can't take it", "cant take it", "i'm done", "im done"];
  if (resource.id === "counseling" && terms.some((term) => mentalCrisisTerms.includes(term))) score += 24;
  if (resource.id === "health-34" && terms.some((term) => mentalCrisisTerms.includes(term))) score += 12;
  const sexualHealthTerms = ["condom", "condoms", "protection", "safe sex", "safer sex", "sex", "sexual", "fuck", "hookup", "hook up", "sleep with", "boyfriend", "girlfriend", "partner", "birth control", "contraception", "plan b", "sti", "std", "hiv", "pregnancy"];
  if (resource.id === "love-lab" && terms.some((term) => sexualHealthTerms.includes(term))) score += 28;
  return score;
}
function matchesSearchIntent(resource: Resource, query: string, relevance: number, profile = queryProfile(query)) {
  if (profile.chineseRoute !== null) return profile.chineseRoute.includes(resource.id);
  const clean = normalize(normalizeSearchInput(query)); if (!clean) return true;
  // Explicit requests for something ready to eat should not lead to a pantry
  // shelf or a referral office, even when those cards share food vocabulary.
  if (asksForPreparedMeal(query)) return resource.id === "aggie-eats";
  if (asksForFoodImmediately(query) && !["aggie-eats", "freedge", "pantry"].includes(resource.id)) return false;
  if (profile.strictCategories.size > 0 && !profile.strictCategories.has(resource.category)) return false;
  if (profile.targetIds.size > 0) return profile.targetIds.has(resource.id) || (profile.targetCategories.has(resource.category) && relevance >= 40);
  if (profile.blockedCategories.has(resource.category) && relevance < 40) return false;
  const intents = queryIntents(query);
  if (intents.size > 0 && !intents.has(resource.category)) return false;
  if (clean.includes(normalize(resource.name)) || normalize(resource.name).includes(clean)) return true;
  return relevance >= 12;
}
function canonicalPointName(point: MapPoint) {
  return normalize(point.name)
    .replace(/\b(1st|2nd|3rd|first|second|third|ground) floor\b/g, "")
    .replace(/\b(lobby|window seats|study room|market|pantry)\b/g, "")
    .replace(/\bfood truck location\b/g, "food truck")
    .replace(/\bmemorial union (east|south|west)\b/g, "memorial union")
    .replace(/\bcoffee house coho\b/g, "asucd coffee house coho")
    .replace(/\bscc\b/g, "student community center")
    .replace(/\s+/g, " ")
    .trim();
}
function dedupeMapPoints(points: MapPoint[]) {
  const seen = new Set<string>();
  return points.filter((point) => {
    const key = `${point.category}:${canonicalPointName(point)}:${point.lat.toFixed(3)}:${point.lng.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function pointType(point: MapPoint, text = enText) {
  const name = point.name.toLowerCase();
  if (point.category === "Narcan") return /activities|library|memorial union|student community/.test(name) ? "Extended-hours Narcan" : "Narcan pickup";
  if (point.category === "Rest") {
    if (/24 hour/.test(name)) return "24-hour rest";
    if (/courtyard|hammock|lake|arboretum|garden/.test(name)) return "Outdoor rest";
    return "Indoor rest";
  }
  if (point.category === "Water") return "Hydration station";
  if (/pantry|freedge/.test(name)) return text.freePantry;
  if (/aggie eats|fruit and veggie|all people eat|eat well|night market/.test(name)) return text.freeFood;
  if (/food truck/.test(name)) return text.foodTruck;
  if (/garden|fruit tree|orchard/.test(name)) return text.campusGarden;
  if (/dining|restaurant|coho|coffee|cafe|grill|bistro|peet/.test(name)) return "Dining & café";
  if (/market|grocery|safeway|target|trader joe|cvs|co-op|fruit stand/.test(name)) return "Market & grocery";
  return text.foodAccess;
}
function pointAvailability(point: MapPoint, now: Date, text = enText) {
  const local = davisDate(now); const day = local.getDay(); const hour = local.getHours() + local.getMinutes() / 60; const weekday = day >= 1 && day <= 5;
  const name = point.name.toLowerCase();
  let open: number | null = null; let close: number | null = null; let hours = "Hours vary — check location";
  if (point.name === "Aggie Eats Food Truck") {
    const isOpen = weekday && hour >= 11.5 && hour < 14;
    return { rank: isOpen ? 2 : 0, open: isOpen, label: isOpen ? text.openNow : text.closedNow, hours: "Mon–Fri · 11:30 AM–2:00 PM or until sold out" };
  }
  if (/24 hour/.test(name)) return { rank: 2, open: true, label: text.openNow, hours: text.open24 };
  if (point.category === "Narcan") {
    if (/activities|recreation center/.test(name)) { open = 5; close = 24; hours = "Daily · 5:00 AM–12:00 AM"; }
    else if (/library study/.test(name)) return { rank: 2, open: true, label: text.openNow, hours: text.open24 };
    else if (/memorial union/.test(name)) { open = 7; close = 23; hours = "Daily · 7:00 AM–11:00 PM"; }
    else if (/student community/.test(name)) { open = 7.5; close = 22; hours = "Daily · 7:30 AM–10:00 PM"; }
    else { open = 9; close = 16.5; hours = "Weekdays · usually 9:00 AM–4:30 PM"; }
  } else if (point.category === "Food" && /the pantry/.test(name)) {
    if (weekday) { open = 10.5; close = 16; hours = "Mon–Fri · 10:30 AM–4:00 PM"; }
    else { open = 12.25; close = 14; hours = "Sat–Sun · 12:15–2:00 PM"; }
  }
  else if (point.category === "Food" && /^aggie compass$/.test(name)) { open = 9; close = 17; hours = "Weekdays · 9:00 AM–5:00 PM"; }
  else if (point.category === "Rest" && /hammock|courtyard|lake|arboretum/.test(name)) return { rank: 1, open: true, label: "Outdoor access", hours: "Daylight / campus access" };
  else if (point.category === "Water" && /outdoor/.test(name)) return { rank: 2, open: true, label: text.openNow, hours: `Outdoor · ${text.open24}` };
  if (open !== null && close !== null) { const isOpen = (weekday || /daily/.test(hours.toLowerCase())) && hour >= open && hour < close; return { rank: isOpen ? 2 : 0, open: isOpen, label: isOpen ? text.openNow : text.closedNow, hours }; }
  return { rank: 1, open: null, label: "Check access", hours: point.category === "Water" ? "Available during building hours" : hours };
}
function pointVerification(point: MapPoint, text = enText) {
  const outdoor = /outdoor|courtyard|hammock|lake|arboretum|garden|orchard|quad/.test(point.name.toLowerCase());
  return !outdoor && ["Narcan", "Rest", "Water"].includes(point.category) ? text.indoorPoint : "";
}

type PixelIconKind = "all" | "narcan" | "rest" | "food" | "water" | "map" | "home" | "settings";
const pixelIconPaths: Record<PixelIconKind, string> = {
  all: "M7 1h2v2H7V1zM7 13h2v2H7v-2zM1 7h2v2H1V7zM13 7h2v2h-2V7zM6 6h4v4H6V6z",
  narcan: "M6 2h4v4h4v4h-4v4H6v-4H2V6h4V2z",
  rest: "M2 3h12v2L6 11h8v2H2v-2l8-6H2V3z",
  food: "M3 7h10v2h-1v2H4V9H3V7zm2 5h6v2H5v-2zM5 3h2v3H5V3zM9 3h2v3H9V3z",
  water: "M7 1h2v2h1v2h1v2h1v4h-1v2H5v-2H4V7h1V5h1V3h1V1zm0 7H6v3h1V8z",
  map: "M7 1h2v2h3v1h1v3h2v2h-2v3h-1v1H9v2H7v-2H4v-1H3V9H1V7h2V4h1V3h3V1zm0 4H5v2H5v2h2v2h2V9h2V7H9V5H7z",
  home: "M7 1h2v1h2v2h2v2h2v8h-5v-4H6v4H1V6h2V4h2V2h2V1zm0 3H5v2H3v6h1V8h8v4h1V6h-2V4H9V3H7v1z",
  settings: "M1 3h5v2H1V3zm9 0h5v2h-5V3zM6 2h4v4H6V2zM1 7h9v2H1V7zm13 0h1v2h-1V7zM10 6h4v4h-4V6zM1 11h3v2H1v-2zm7 0h7v2H8v-2zM4 10h4v4H4v-4z",
};
function PixelIcon({ kind }: { kind: PixelIconKind }) {
  return <svg className="pixel-icon" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><path d={pixelIconPaths[kind]} fill="currentColor" fillRule="evenodd"/></svg>;
}

export default function Home() {
  const [query, setQuery] = useState(""); const [submitted, setSubmitted] = useState(""); const [now, setNow] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); const [locationStatus, setLocationStatus] = useState<LocationStatus>("useMyLocation");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null); const [showInstallHelp, setShowInstallHelp] = useState(false); const [online, setOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "map" | "settings">("home");
  const [contactCopyState, setContactCopyState] = useState<"copied" | "failed" | null>(null);
  const contactToastTimer = useRef<number | null>(null);
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [showLanguageGate, setShowLanguageGate] = useState(false);
  const allMapCategories: MapCategory[] = ["Narcan", "Rest", "Food", "Water"];
  const [mapCategories, setMapCategories] = useState<MapCategory[]>(allMapCategories); const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null); const [mapZoom, setMapZoom] = useState(1); const [mapRotation, setMapRotation] = useState(0);
  const bannerText = siteContent.announcement.bannerText; const [showPoster, setShowPoster] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapCanvasRef = useRef<HTMLDivElement>(null);
  const rotateControlRef = useRef<HTMLButtonElement>(null);
  const rotateDrag = useRef<{ x: number; rotation: number } | null>(null);
  const pendingRotation = useRef(0);
  const rotationFrame = useRef<number | null>(null);
  const text = { ...uiText[language], ...siteContent.hero[language] };
  const locationLabel = text[locationStatus];

  useEffect(() => {
    setNow(new Date()); setOnline(navigator.onLine);
    const savedLanguage = localStorage.getItem("aggie-language") as AppLanguage | null;
    const browserLanguage = navigator.language?.slice(0, 2);
    const supportedBrowserLanguage = languageOptions.find((option) => option.code === browserLanguage)?.code;
    const hasSavedLanguage = Boolean(savedLanguage && uiText[savedLanguage]);
    const initialLanguage: AppLanguage = hasSavedLanguage ? savedLanguage as AppLanguage : supportedBrowserLanguage ?? "en";
    setLanguage(initialLanguage);
    if (!hasSavedLanguage) setShowLanguageGate(true);
    if (navigator.geolocation) {
      setLocationStatus("locating");
      navigator.geolocation.getCurrentPosition((p) => { setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocationStatus("locationOn"); }, () => setLocationStatus("locationOff"), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    }
    const sharedQuery = new URLSearchParams(window.location.search).get("q");
    if (sharedQuery) { setQuery(sharedQuery); setSubmitted(sharedQuery); }
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onOnline = () => setOnline(true); const onOffline = () => setOnline(false);
    window.addEventListener("beforeinstallprompt", onInstall); window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline);
    const onControllerChange = () => { if (!sessionStorage.getItem("aggie-sw-refreshed")) { sessionStorage.setItem("aggie-sw-refreshed", "1"); window.location.reload(); } };
    if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(window.location.hostname)) { navigator.serviceWorker.addEventListener("controllerchange", onControllerChange); navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => undefined); }
    return () => { window.clearInterval(timer); window.removeEventListener("beforeinstallprompt", onInstall); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange); };
  }, []);
  useEffect(() => {
    if (!submitted) return;
    const frame = window.requestAnimationFrame(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [submitted]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);
  function changeLanguage(next: AppLanguage) { setLanguage(next); localStorage.setItem("aggie-language", next); setShowLanguageGate(false); }
  async function copyContact() {
    const email = "shanshan11c@outlook.com";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setContactCopyState("copied");
    } catch {
      setContactCopyState("failed");
    }
    if (contactToastTimer.current !== null) window.clearTimeout(contactToastTimer.current);
    contactToastTimer.current = window.setTimeout(() => setContactCopyState(null), 2400);
  }

  const currentTime = now ?? new Date("2026-01-04T00:00:00");
  const englishRisk = useMemo(() => isEnglishQuery(submitted, language) ? classifyEnglishRisk(submitted) : null, [submitted, language]);
  const results = useMemo(() => {
    const searching = Boolean(submitted.trim());
    const englishHits = searching && isEnglishQuery(submitted, language) ? new Map(searchEnglish(submitted).map((hit) => [hit.id, hit.score])) : null;
    const terms = searching && !englishHits ? queryTerms(submitted) : [];
    const profile = searching && !englishHits ? queryProfile(submitted) : null;
    return resources.map((resource) => {
      const activeResource = resolveResource(resource, currentTime);
      const status = statusFor(activeResource.hours, currentTime, text); const distance = userLocation && resource.id !== "health-34" ? miles(userLocation, activeResource) : null;
      const relevance = searching ? englishHits ? (englishHits.get(resource.id) || 0) : matchScore(resource, terms, profile!) : 1;
      return { resource: activeResource, status, distance, relevance };
    }).filter((item) => !searching || (englishHits ? item.relevance > 0 : matchesSearchIntent(item.resource, submitted, item.relevance, profile!))).sort((a, b) => {
      // A materially stronger match wins even if a weaker card is open now.
      // For similarly relevant cards, preserve the open-now preference.
      if (searching && englishHits) {
        const relevanceGap = b.relevance - a.relevance;
        if (Math.abs(relevanceGap) >= 25) return relevanceGap;
      }
      return Number(b.status.open) - Number(a.status.open) || b.relevance - a.relevance || (a.distance ?? 999) - (b.distance ?? 999);
    });
  }, [submitted, userLocation, currentTime, text, language]);

  const guideResults = useMemo(() => {
    if (!submitted) return guides;
    const terms = isEnglishQuery(submitted, language) ? normalize(submitted).split(" ").filter((term) => term.length > 3 && !searchStopWords.has(term)) : queryTerms(submitted);
    return guides.filter((guide) => terms.some((term) => normalize([guide.title, guide.text, ...guide.keywords].join(" ")).includes(term))).slice(0, 3);
  }, [submitted, language]);

  const allVisibleMapPoints = useMemo(() => {
    const seen = new Set<string>();
    const stop = aggieEatsStop(currentTime);
    return dedupeMapPoints(mapPoints.filter(isFreeFoodMapPoint).map((point) => point.name === "Aggie Eats Food Truck" ? { ...point, lat: stop.lat, lng: stop.lng } : snapToBuilding(point)).filter(withinCampusMap)).filter((point) => { const key = `${point.category}:${buildingLabel(point) || canonicalPointName(point)}:${point.lat.toFixed(4)}:${point.lng.toFixed(4)}`; if (seen.has(key)) return false; seen.add(key); return true; });
  }, [currentTime]);
  const campusMapPoints = useMemo(() => allVisibleMapPoints.filter((point) => mapCategories.includes(point.category)), [allVisibleMapPoints, mapCategories]);
  const orderedMapPoints = useMemo(() => [...campusMapPoints].sort((a, b) => pointAvailability(b, currentTime, text).rank - pointAvailability(a, currentTime, text).rank || (userLocation ? miles(userLocation, a) - miles(userLocation, b) : a.name.localeCompare(b.name))), [campusMapPoints, userLocation, currentTime, text]);

  function recordUsage(kind: "search" | "click", target: string) {
    if (!navigator.onLine || navigator.doNotTrack === "1") return;
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, target }), keepalive: true }).catch(() => undefined);
  }
  function recordClick(event: MouseEvent<HTMLElement>) {
    const element = (event.target as Element).closest("a,button");
    if (!element) return;
    const explicit = element.getAttribute("data-track");
    const target = explicit || (element.closest(".mobile-nav") ? "navigation" : element.closest(".map-screen") ? "map" : element.closest(".settings-screen") ? "settings" : element.closest(".home-category-grid") ? "category" : element.closest(".app-promo") ? "install" : element.tagName === "A" ? "external" : "other");
    recordUsage("click", target);
  }
  function search(event?: FormEvent) { event?.preventDefault(); const next = query.trim(); if (next) recordUsage("search", "submitted"); if (isEnglishQuery(next, language)) setSubmitted(next); else startSearchTransition(() => setSubmitted(next)); }
  function runExample(value: string) { setQuery(value); recordUsage("search", "submitted"); if (isEnglishQuery(value, language)) setSubmitted(value); else startSearchTransition(() => setSubmitted(value)); }
  function locate() {
    if (!navigator.geolocation) return setLocationStatus("locationUnavailable"); setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition((p) => { setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocationStatus("nearestFirstLabel"); }, () => setLocationStatus("locationNotShared"), { timeout: 8000 });
  }
  async function install() { if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); } else setShowInstallHelp(true); }
  function toggleMapCategory(category: MapCategory) { setSelectedPoint(null); setMapCategories((current) => { if (current.length === 4) return [category]; const next = current.includes(category) ? current.filter((item) => item !== category) : [...current, category]; return next.length ? next : allMapCategories; }); }
  function resetMap() { setMapZoom(1); setMapRotation(0); pendingRotation.current = 0; mapRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" }); }
  function beginRotate(event: PointerEvent<HTMLButtonElement>) {
    rotateDrag.current = { x: event.clientX, rotation: mapRotation };
    pendingRotation.current = mapRotation;
    if (mapCanvasRef.current) mapCanvasRef.current.style.transition = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function rotateMap(event: PointerEvent<HTMLButtonElement>) {
    if (!rotateDrag.current) return;
    pendingRotation.current = Math.round(rotateDrag.current.rotation + (event.clientX - rotateDrag.current.x) * .7);
    if (rotationFrame.current !== null) return;
    rotationFrame.current = window.requestAnimationFrame(() => {
      mapCanvasRef.current?.style.setProperty("transform", `rotate(${pendingRotation.current}deg)`);
      rotateControlRef.current?.style.setProperty("transform", `rotate(${pendingRotation.current}deg)`);
      rotationFrame.current = null;
    });
  }
  function endRotate() {
    if (!rotateDrag.current) return;
    rotateDrag.current = null;
    if (rotationFrame.current !== null) { window.cancelAnimationFrame(rotationFrame.current); rotationFrame.current = null; }
    if (mapCanvasRef.current) { mapCanvasRef.current.style.transform = `rotate(${pendingRotation.current}deg)`; mapCanvasRef.current.style.transition = ""; }
    setMapRotation(pendingRotation.current);
  }

  return <main className={`app-root tab-${activeTab}`} onClickCapture={recordClick}>
    <div className="emergency"><span>{text.emergency}</span><a href="tel:911">{text.call911}</a><i/><a href="tel:988">{text.call988}</a></div>
    <header className="app-header">
      <a className="brand" href="#top"><span className="brand-mark">A</span><span>Aggie Care</span></a>
      <nav><a href="#results">{text.resourcesNav}</a><a href="#explore">{text.exploreNav}</a></nav>
      <button className="install-small" onClick={install}><span>↓</span> {text.install}</button>
    </header>

    {activeTab === "map" && <section className="map-screen" aria-label={text.mapLabel}>
      <div className="app-screen-head"><div><small>{text.mapLabel.toUpperCase()}</small><h1>{text.mapTitle}</h1></div><button onClick={locate}>⌖ {locationLabel}</button></div>
      <div className="map-filters"><button aria-pressed={mapCategories.length === 4} className={mapCategories.length === 4 ? "active all-filter" : "all-filter"} onClick={() => { setMapCategories(allMapCategories); setSelectedPoint(null); }}><i className="category-logo all"><PixelIcon kind="all"/></i><span>{text.all}<small>{allVisibleMapPoints.length}</small></span></button>{allMapCategories.map((category) => <button key={category} aria-pressed={mapCategories.length !== 4 && mapCategories.includes(category)} className={mapCategories.length !== 4 && mapCategories.includes(category) ? "active" : ""} onClick={() => toggleMapCategory(category)}><i className={`category-logo ${category.toLowerCase()}`}><PixelIcon kind={category.toLowerCase() as PixelIconKind}/></i><span>{category === "Food" ? text.freeFood : category}<small>{allVisibleMapPoints.filter((point) => point.category === category).length}</small></span></button>)}</div>
      <div className="map-viewport">
      <div className="campus-map" ref={mapRef}>
        <div ref={mapCanvasRef} className="map-canvas" style={{ width: `${mapZoom * 100}%`, aspectRatio: "3 / 2", transform: `rotate(${mapRotation}deg)` }}>
          <div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/><div className="map-water"/><span className="map-label mu">MEMORIAL UNION</span><span className="map-label silo">SILO</span><span className="map-label arc">ARC</span><span className="map-label arboretum">ARBORETUM</span>
          {campusMapPoints.map((point, index) => { const availability = pointAvailability(point, currentTime, text); return <button key={`${point.name}-${point.lat}-${index}`} className={`map-pin ${point.category.toLowerCase()} ${availability.rank === 0 ? "closed" : ""} ${selectedPoint === point ? "selected" : ""}`} style={campusMapPosition(point)} onClick={() => setSelectedPoint(point)} aria-label={`${index + 1}. ${point.name}, ${availability.label}, ${availability.hours}`}><span>{index + 1}</span></button>; })}
          {userLocation && withinCampusMap(userLocation) && <span className="you-pin" style={campusMapPosition(userLocation)}>{text.you}</span>}
        </div>
      </div>
      <div className="map-controls"><button onClick={() => setMapZoom((zoom) => Math.min(2.5, +(zoom + .25).toFixed(2)))} aria-label="Zoom in">＋</button><button onClick={() => setMapZoom((zoom) => Math.max(1, +(zoom - .25).toFixed(2)))} aria-label="Zoom out">−</button><button ref={rotateControlRef} className="rotate-control" onPointerDown={beginRotate} onPointerMove={rotateMap} onPointerUp={endRotate} onPointerCancel={endRotate} aria-label="Drag to rotate map" style={{ transform: `rotate(${mapRotation}deg)` }}>⌖</button><button onClick={resetMap} aria-label="Reset map">↺</button></div>
      </div>
      <p className="map-count">{campusMapPoints.length} {text.mapCount}</p>
      {selectedPoint ? (() => { const availability = pointAvailability(selectedPoint, currentTime, text); const verification = pointVerification(selectedPoint, text); const place = buildingLabel(selectedPoint); return <article className="map-place-card"><i className={`category-logo ${selectedPoint.category.toLowerCase()}`}>{selectedPoint.category === "Narcan" ? "+" : selectedPoint.category === "Rest" ? "zZ" : selectedPoint.category === "Food" ? "◒" : "●"}</i><div><small>{selectedPoint.category} · {pointType(selectedPoint, text)}</small><h2>{selectedPoint.name}</h2>{place && <p className="building-line">{text.mappedTo} {place}</p>}<p className={availability.rank === 0 ? "closed" : "open"}>{availability.label} · {availability.hours}{userLocation ? ` · ${miles(userLocation, selectedPoint).toFixed(1)} ${text.miAway}` : ""}</p>{verification && <p className="verification-note">{verification}</p>}</div><div className="map-place-actions"><a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=walking`} target="_blank" rel="noreferrer">{text.navigate}</a><a href={`https://maps.apple.com/directions?destination=${selectedPoint.lat}%2C${selectedPoint.lng}&mode=walking`} target="_blank" rel="noreferrer">{text.appleMaps}</a></div></article>; })() : <div className="map-empty">{text.chooseMarker}</div>}
      <div className="map-directory"><div className="map-directory-head"><div><small>{mapCategories.length === 4 ? text.allCategories.toUpperCase() : mapCategories.join(" + ").toUpperCase()}</small><h2>{text.everyLocation}</h2></div><span>{orderedMapPoints.length} {text.places}</span></div><div className="map-directory-list">{orderedMapPoints.map((point) => { const markerNumber = campusMapPoints.indexOf(point) + 1; const availability = pointAvailability(point, currentTime, text); const verification = pointVerification(point, text); const place = buildingLabel(point); return <article key={`list-${point.category}-${point.name}-${point.lat}-${point.lng}`} className={`${selectedPoint === point ? "active" : ""} ${availability.rank === 0 ? "closed" : ""}`}><button onClick={() => setSelectedPoint(point)}><span className={`directory-number ${point.category.toLowerCase()}`}>{markerNumber}</span><div><b>{point.name}</b><small><em>{pointType(point, text)}</em>{place ? ` · ${place}` : ""} · {availability.label}</small><small>{availability.hours}{userLocation ? ` · ${miles(userLocation, point).toFixed(1)} mi` : ""}{verification ? ` · ${text.indoorResource}` : ""}</small></div></button><a href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}&travelmode=walking`} target="_blank" rel="noreferrer" aria-label={`${text.navigate} ${point.name}`}>↗</a></article>; })}</div></div>
      <p className="map-source">{text.officialMapSource}</p>
    </section>}

    {activeTab === "settings" && <section className="settings-screen" aria-label={text.settings}>
      <div className="app-screen-head"><div><small>AGGIE CARE</small><h1>{text.settings}</h1></div><span className="settings-gear"><PixelIcon kind="settings"/></span></div>
      <div className="settings-banner-wrap"><button className="settings-banner" onClick={() => setShowPoster(true)}><span>{`${bannerText} · ${bannerText} · ${bannerText}`}</span></button></div>
      <div className="settings-group"><h2>{text.app}</h2><button onClick={locate}><span>⌖</span><div><b>{text.location}</b><small>{locationLabel} · {text.locationNote}</small></div><em>›</em></button><button onClick={install}><span>↓</span><div><b>{text.install}</b><small>{text.installDevices}</small></div><em>›</em></button></div>
      <div className="settings-group language-group"><h2>{text.language}</h2><div className="language-picker">{languageOptions.map((option) => <button key={option.code} className={language === option.code ? "active" : ""} onClick={() => changeLanguage(option.code)}><span>{option.code.toUpperCase()}</span><div><b>{option.label}</b>{language === option.code && <small>{text.languageNote}</small>}</div></button>)}</div></div>
      <div className="settings-group"><h2>{text.newUpdates}</h2><div className="update-row"><span className="update-dot">NEW</span><div><b>{text.campusResourceMap}</b><small>{text.campusResourceMapNote}</small></div></div><div className="update-row"><span>↗</span><div><b>{text.crossPlatformNavigation}</b><small>{text.crossPlatformNavigationNote}</small></div></div></div>
      <div className="settings-group"><h2>{text.about}</h2><button type="button" onClick={copyContact} aria-label={language === "zh" ? "复制联系邮箱" : "Copy contact email"}><span>i</span><div><b>{language === "zh" ? "联系 · 点击复制" : "Contact · tap to copy"}</b><small>shanshan11c@outlook.com</small></div><em>⧉</em></button></div>
      <div className="settings-group settings-details"><h2>{text.campusDetails}</h2>
        <a href="https://aggiecompass.ucdavis.edu/" target="_blank" rel="noreferrer"><span>⌂</span><div><b>{text.basicNeeds}</b><small>{text.basicNeedsText}</small></div><em>↗</em></a>
        <a href="https://mentalhealth.ucdavis.edu/" target="_blank" rel="noreferrer"><span>♡</span><div><b>{text.mentalHealth}</b><small>{text.mentalHealthText}</small></div><em>↗</em></a>
        <a href="https://www.ucdavis.edu/about/student-safety/urgent-assistance" target="_blank" rel="noreferrer"><span>!</span><div><b>{text.urgentAssistance}</b><small>{text.urgentAssistanceText}</small></div><em>↗</em></a>
        {guideResults.map((guide) => <a key={guide.title} href={guide.href} target="_blank" rel="noreferrer"><span>{guide.icon}</span><div><b>{guide.title}</b><small>{guide.text}</small></div><em>↗</em></a>)}
      </div>
      <p className="usage-disclosure">{language === "zh" ? "本站仅统计匿名搜索和点击次数，不保存搜索内容、身份或位置。" : "Anonymous search and click counts only. Search text, identity, and location are not stored."}</p>
    </section>}

    <section className="search-hero" id="top">
      <div className="hero-status"><span className={online ? "online" : "offline"}/>{online ? text.live : text.offline}</div>
      <h1>{text.titleA}<br/> <em>{text.titleB}</em></h1>
      <p>{text.subtitle}</p>
      <form className="smart-search" onSubmit={search} role="search">
        <span className="search-icon">⌕</span><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={text.placeholder} aria-label="Search campus resources" autoComplete="off"/><button type="submit" aria-busy={isSearching}>{isSearching ? "…" : text.search}</button>
      </form>
      <div className="hero-tools web-only"><button onClick={locate}><span className="locate-ring">⌖</span>{locationLabel}</button><button onClick={install}><span>↓</span>{text.addHome}</button></div>
      <div className="priority-links web-only" aria-label="Most-used student resources">
        <a href="https://aggiecompass.ucdavis.edu/" target="_blank" rel="noreferrer"><span>{text.basicNeeds}</span><small>{text.basicNeedsText}</small><b>↗</b></a>
        <a href="https://mentalhealth.ucdavis.edu/" target="_blank" rel="noreferrer"><span>{text.mentalHealth}</span><small>{text.mentalHealthText}</small><b>↗</b></a>
        <button onClick={() => runExample("free food open now")}><span>{text.freeFoodNow}</span><small>{text.freeFoodNowText}</small><b>→</b></button>
        <button onClick={() => runExample("walk in medical mental health")}><span>{text.walkInHelp}</span><small>{text.walkInHelpText}</small><b>→</b></button>
      </div>
    </section>

    {submitted && <section className="results-section" id="results">
      <div className="results-heading"><div><span className="kicker">{englishRisk === "harm-to-others" ? text.emergency : submitted ? text.results : text.useful}</span><h2>{englishRisk === "harm-to-others" ? (language === "zh" ? "请先确认安全" : "Safety first") : submitted ? `${text.results} “${submitted}”` : text.useful}</h2></div>{!englishRisk && <div className="ranking-note"><span>●</span> {text.openFirst} {userLocation && `· ${text.nearestFirst}`}</div>}</div>
      {englishRisk === "harm-to-others" && <div className="crisis-banner danger-banner" role="alert"><span>!</span><div><b>{language === "zh" ? "这句话可能涉及现实中的伤害" : "This may describe harm to someone"}</b><p>{language === "zh" ? "如果有人正面临危险，或你可能马上伤害他人，请立即拨打 911，并告诉接线员你的所在地。这款应用无法判断紧急程度。若你指的是游戏或故事，请补充上下文重新搜索。" : "If this involves a real person in danger, or you may act soon, call 911 now and tell dispatch where you are. This app cannot assess an emergency. If you meant a game or story, add that context to your search."}</p></div><div><a href="tel:911">{text.call911}</a><a href="https://www.ucdavis.edu/about/student-safety/urgent-assistance" target="_blank" rel="noreferrer">{text.urgentAssistance} ↗</a></div></div>}
      {englishRisk === "threatened-by-other" && <div className="crisis-banner danger-banner" role="alert" lang="en"><span>!</span><div><b>Are you or someone else in immediate danger?</b><p>Call 911 now if anyone may be hurt. CARE can provide confidential support for survivors; its contact details are below.</p></div><div><a href="tel:911">Call 911</a><a href="tel:5307523299">Call CARE</a></div></div>}
      {englishRisk === "harm-concern" && <div className="crisis-banner danger-banner" role="alert" lang="en"><span>!</span><div><b>Worried you might hurt someone?</b><p>If you may act soon or anyone is in danger, call 911. For immediate support, contact UC Davis Counseling Services.</p></div><div><a href="tel:911">Call 911</a><a href="tel:5307520871">Call Counseling</a></div></div>}
      {!englishRisk || englishRisk === "self-harm" ? (isEnglishQuery(submitted, language) ? englishCrisisQuery(submitted) : mentalCrisisMatch(submitted)) && <div className="crisis-banner" role="alert"><span>!</span><div><b>{text.mentalCrisis}</b><p>{text.mentalCrisisText}</p></div><div><a href="tel:988">{text.call} 988</a><a href="sms:988">{text.text988}</a><a href="tel:5307520871">{text.ucDavisCrisis}</a></div></div> : null}
      {submitted && results.length > 0 && <div className="interpretation"><span>✦</span><p>{text.showingPlaces} {text.relatedTo} <strong>{isEnglishQuery(submitted, language) ? normalize(submitted).split(" ").filter((t) => t.length > 2 && !searchStopWords.has(t)).slice(0, 5).join(", ") : submitted}</strong>. {text.resultsConsider}{userLocation ? text.andDistance : ""}.</p></div>}
      {results.length ? <div className="result-list">{results.map(({ resource, status, distance }) => {
        const walkUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(resource.navigationQuery || `${resource.lat},${resource.lng}`)}&travelmode=walking`;
        const copy = resourceCopy(resource.id, language, resource);
        return <article className="result-card" key={resource.id}>
          <div className={`result-icon ${resource.category.toLowerCase().replace(" ", "-")}`}>{resource.icon}</div>
          <div className="result-main"><div className="result-meta"><span>{resourceCategory(resource.category, language)}</span><b>·</b><span>{copy.short}</span></div><h3>{resource.name}</h3><p>{copy.description}</p><div className="result-facts"><span className={status.open ? "open" : "closed"}><i/>{status.label}</span><span>{displaySchedule(resource.hours, language)}</span>{resource.phoneAlways && <span>{language === "zh" ? "电话支持 24 小时可用" : "Phone support 24/7"}</span>}<span>•</span><span>{copy.cost ?? resource.cost}</span></div><div className="result-location"><span>⌖</span><div><strong>{resource.location}</strong><small>{distance !== null ? `${distance < .1 ? "<0.1" : distance.toFixed(1)} ${text.miAway}` : resource.address}</small></div></div></div>
          <div className="result-actions">{resource.phone && <a className="call-action" data-track="resource_call" href={`tel:${resource.phone}`}>{text.callAction} <span>{resource.phoneLabel}</span></a>}{resource.id !== "health-34" && <a data-track="resource_directions" href={walkUrl} target="_blank" rel="noreferrer">{text.navigate} ↗</a>}<a data-track="resource_official" href={resource.url} target="_blank" rel="noreferrer">{text.officialInfo} ↗</a></div>
        </article>;
      })}</div> : englishRisk !== "harm-to-others" && <div className="empty-state"><span>⌕</span><h3>{guideResults.length ? text.relatedGuide : text.noExactMatch}</h3><p>{guideResults.length ? text.topicGuideHint : text.searchHint}</p><button onClick={() => guideResults.length ? setActiveTab("settings") : (() => { setQuery(""); setSubmitted(""); searchRef.current?.focus(); })()}>{guideResults.length ? text.openSettings : text.clearSearch}</button></div>}
      {englishRisk !== "harm-to-others" && <p className="data-note">{text.dataNote}</p>}
    </section>}

    <section className="home-category-fold" aria-label="Browse resource categories">
      <div className="fold-hint" aria-hidden="true"><i>⌄</i></div>
      <div className="fold-panel">
        <div><small>{text.browseInstead}</small><h2>{text.categories}</h2></div>
        <div className="home-category-grid">{homeCategories.map((category) => <button key={category.label} onClick={() => category.query ? runExample(category.query) : (() => { setQuery(""); setSubmitted(""); searchRef.current?.focus(); })()}><span>{category.icon}</span><b>{language === "zh" ? ({ All: "全部", Food: "食物", "Basic Needs": "基本需求", Medical: "医疗", "Mental Health": "心理健康", "Free Supplies": "免费用品", Safety: "安全支持" } as Record<string, string>)[category.label] : category.label}</b><small>{language === "zh" ? ({ All: "所有可直接前往的资源", Food: "免费餐食与食品储藏", "Basic Needs": "食品、住房与 CalFresh", Medical: "生病、诊所与紧急帮助", "Mental Health": "倾诉、危机与咨询", "Free Supplies": "纳洛酮、安全性行为与经期用品", Safety: "CARE 与保密支持" } as Record<string, string>)[category.label] : category.text}</small></button>)}</div>
      </div>
    </section>

    <section className="app-promo web-only">
      <div className="phone-shell"><div className="phone-top"/><div className="mini-app"><span className="brand-mark">A</span><small>{text.goodMorning.toUpperCase()}</small><h3>{text.whatNeed}</h3><div className="mini-search">⌕&nbsp;&nbsp; {text.searchCampus}</div><div className="mini-result"><i/><div><b>AggieEats</b><span>{text.openNow} · 0.2 mi</span></div></div><div className="mini-result"><i/><div><b>The Pantry</b><span>{text.freeGroceries}</span></div></div></div></div>
      <div className="promo-copy"><span className="kicker">{text.installable}</span><h2>{text.promoTitle}</h2><p>{text.promoText}</p><button className="install-large" onClick={install}>{text.installAggieCare} <span>↓</span></button></div>
    </section>

    <section className="explore-section web-only" id="explore">
      <div className="section-title"><span className="kicker">{text.officialCampusInformation}</span><h2>{text.detailsFromUcDavis}</h2><p>{text.detailsText}</p></div>
      <div className="guide-grid">{guideResults.map((guide) => <a key={guide.title} href={guide.href} target="_blank" rel="noreferrer"><span className="guide-icon">{guide.icon}</span><div><h3>{guide.title}</h3><p>{guide.text}</p></div><b>↗</b></a>)}</div>
    </section>

    <footer className="web-only"><div><a className="brand" href="#top"><span className="brand-mark">A</span><span>Aggie Care</span></a><p>{text.footerNote}</p></div><div><a href="https://shcs.ucdavis.edu/health-and-wellness/health-promotion" target="_blank" rel="noreferrer">Health Promotion ↗</a><a href="https://aggiecompass.ucdavis.edu/" target="_blank" rel="noreferrer">Aggie Compass ↗</a><a href="https://www.ucdavis.edu/about/student-safety/urgent-assistance" target="_blank" rel="noreferrer">{text.urgentAssistance} ↗</a></div><small>{language === "zh" ? "新增资源核查于 2026 年 11 月 6 日。旧有资源请以官方页面为准。" : "New resources reviewed November 6, 2026. Verify older entries with their official pages."}</small></footer>

    <div className="mobile-nav" aria-label="App navigation"><button aria-label={text.mapLabel} aria-current={activeTab === "map" ? "page" : undefined} className={activeTab === "map" ? "active" : ""} onClick={() => { setActiveTab("map"); window.scrollTo({ top: 0, behavior: "auto" }); }}><span><PixelIcon kind="map"/></span></button><button aria-label="Home" aria-current={activeTab === "home" ? "page" : undefined} className={`home-tab ${activeTab === "home" ? "active" : ""}`} onClick={() => { setActiveTab("home"); window.scrollTo({ top: 0, behavior: "auto" }); }}><span><PixelIcon kind="home"/></span></button><button aria-label={text.settings} aria-current={activeTab === "settings" ? "page" : undefined} className={activeTab === "settings" ? "active" : ""} onClick={() => { setActiveTab("settings"); window.scrollTo({ top: 0, behavior: "auto" }); }}><span><PixelIcon kind="settings"/></span></button></div>
    {contactCopyState && <div key={contactCopyState} className="contact-copy-toast" role="status" aria-live="polite"><span>{contactCopyState === "copied" ? "✓" : "!"}</span>{contactCopyState === "copied" ? (language === "zh" ? "邮箱已复制" : "Email copied") : (language === "zh" ? "无法自动复制，请手动复制邮箱" : "Couldn’t copy; please copy the email manually")}</div>}

    {showLanguageGate && <div className="language-gate-backdrop"><section className="language-gate" role="dialog" aria-modal="true" aria-labelledby="language-gate-title"><span className="modal-app-icon">A</span><small>Choose your language</small><h2 id="language-gate-title">Choose your language</h2><p>选择显示语言。You can change this later in Settings. Search can still match supported languages, and map navigation stays in English.</p><div className="language-gate-grid">{languageOptions.map((option) => <button key={option.code} className={language === option.code ? "active" : ""} onClick={() => changeLanguage(option.code)}><span>{option.code.toUpperCase()}</span><b>{option.label}</b></button>)}</div></section></div>}
    {showInstallHelp && <div className="modal-backdrop" onClick={() => setShowInstallHelp(false)}><div className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowInstallHelp(false)}>×</button><span className="modal-app-icon">A</span><h2 id="install-title">{text.installTitle}</h2><div><strong>{text.iphoneInstall}</strong><p>{text.iphoneInstallText}</p></div><div><strong>{text.androidInstall}</strong><p>{text.androidInstallText}</p></div><button className="modal-done" onClick={() => setShowInstallHelp(false)}>{text.gotIt}</button></div></div>}
    {showPoster && <div className="poster-backdrop"><article className="poster-card image-poster" role="dialog" aria-modal="true" aria-label={text.announcementPoster}><button className="poster-delete" onClick={() => setShowPoster(false)} aria-label={text.closePoster}>×</button><img src={siteContent.announcement.posterImage} alt={siteContent.announcement.posterLabel}/><div><small>{siteContent.announcement.posterLabel}</small><h2>{bannerText}</h2></div></article></div>}
  </main>;
}
