// Reviewed campus-resource prompts. These are intent examples, not generated
// training data. Keep each entry tied to one official resource card and source.
export type ResourcePromptProfile = {
  id: string;
  broad?: "food" | "period" | "safer-sex" | "hygiene";
  aliases: string[];
  phrases: string[];
  zh?: string[];
};

export const additionalResourcePrompts: ResourcePromptProfile[] = [
  { id: "mobile-pantry-scc", broad: "food", aliases: ["mobile pantry scc", "mobile pantry student community center"], phrases: ["free groceries at scc", "food at student community center on monday", "monday mobile pantry"], zh: ["学生社区中心移动食品储藏室", "周一移动食物车"] },
  { id: "mobile-pantry-arc", broad: "food", aliases: ["mobile pantry arc", "mobile pantry recreation center"], phrases: ["free groceries at arc", "food at arc on wednesday", "wednesday mobile pantry"], zh: ["arc移动食品储藏室", "周三移动食物车"] },
  { id: "fruit-veggie-compass", broad: "food", aliases: ["fruit and veggie up aggie compass"], phrases: ["free produce on wednesday", "free fruit at aggie compass", "fresh vegetables at memorial union"], zh: ["周三免费蔬菜", "aggie compass免费水果"] },
  { id: "fruit-veggie-coho", broad: "food", aliases: ["fruit and veggie up south coho"], phrases: ["free produce on friday", "free fruit at south coho", "fresh vegetables at coffee house"], zh: ["周五免费蔬菜", "coho免费水果"] },
  { id: "satellite-hart", broad: "food", aliases: ["hart hall satellite pantry", "african american studies pantry"], phrases: ["food in hart hall", "pantry near hart hall", "canned food at hart hall"], zh: ["hart hall食物储藏室"] },
  { id: "satellite-cadss", broad: "food", aliases: ["cadss satellite pantry", "silo cadss pantry"], phrases: ["food in cadss", "pantry at the silo", "canned food at cadss"], zh: ["cadss食物储藏室", "silo免费食物"] },
  { id: "satellite-el-centro", broad: "food", aliases: ["el centro satellite pantry"], phrases: ["food at el centro", "pantry on mu patio", "el centro canned food"], zh: ["el centro食物储藏室"] },
  { id: "satellite-eop", broad: "food", aliases: ["eop satellite pantry"], phrases: ["food at eop", "pantry by south hall", "eop canned food"], zh: ["eop食物储藏室"] },
  { id: "satellite-gsa", broad: "food", aliases: ["gsa satellite pantry", "walker hall pantry"], phrases: ["food at walker hall", "graduate student pantry", "canned food at gsa"], zh: ["walker hall食物储藏室", "研究生食品储藏室"] },
  { id: "satellite-lgbtq", broad: "food", aliases: ["qt pantry", "lgbtqia satellite pantry"], phrases: ["food at lgbtqia resource center", "pantry at student community center", "qt pantry food"], zh: ["lgbtqia食物储藏室", "qt食品储藏室"] },
  { id: "satellite-nest", broad: "food", aliases: ["the nest satellite pantry"], phrases: ["food at the nest", "pantry by university house", "canned food at the nest"], zh: ["the nest食物储藏室"] },
  { id: "satellite-sdc", broad: "food", aliases: ["student disability center pantry", "sdc satellite pantry"], phrases: ["food at sdc", "pantry at cowell building", "canned food at disability center"], zh: ["学生残障中心食品储藏室"] },
  { id: "satellite-srrc", broad: "food", aliases: ["srrc satellite pantry", "student recruitment retention pantry"], phrases: ["food at srrc", "srrc pantry at scc"], zh: ["srrc食物储藏室"] },
  { id: "satellite-undocumented", broad: "food", aliases: ["undocumented student resource center pantry", "usrc satellite pantry"], phrases: ["food at undocumented student center", "usrc pantry at scc"], zh: ["无证学生资源中心食品储藏室"] },
  { id: "wrrc-pharmacy", broad: "hygiene", aliases: ["wrrc feminist pharmacy", "wrrc resource room"], phrases: ["free toiletries at north hall", "need razors or heating pads", "free period supplies at wrrc", "feminist pharmacy"], zh: ["女性资源中心免费卫生用品", "north hall免费卫生巾"] },
  { id: "wrrc-referral", aliases: ["wrrc student referral", "wrrc drop in referral", "wrrc confidential referral"], phrases: ["need a safe space at north hall", "wrrc violence support referral", "talk to wrrc staff about interpersonal violence"], zh: ["女性资源中心求助转介", "north hall保密求助空间"] },
  { id: "lgbtq-closet", aliases: ["gender affirmation closet", "lgbtqia clothing closet"], phrases: ["free gender affirming clothes", "free binder on campus", "need gender affirming clothing", "free shapewear at lgbtq center"], zh: ["免费性别肯定服装", "免费束胸", "性别肯定衣橱"] },
  { id: "aggie-reuse", aliases: ["aggie reuse store", "free thrift store at memorial union"], phrases: ["need free clothes", "need a free jacket", "free school supplies at aggie reuse"], zh: ["免费二手衣物", "aggie reuse免费商店"] },
  { id: "lsa-professional-closet", aliases: ["lsa professional closet", "king hall professional closet"], phrases: ["need interview clothes", "free business attire at king hall", "professional shoes for an interview"], zh: ["king hall免费面试服装"] },
  { id: "bike-barn-checkup", aliases: ["bike barn checkup", "bike barn free air"], phrases: ["my bike has a flat tire", "need free bike diagnostics", "bike brakes need adjustment"], zh: ["bike barn免费检查", "自行车免费打气"] },
  { id: "student-parent-space", aliases: ["student parent space", "student parent pantry"], phrases: ["student parent needs snacks", "food for my kids on campus", "free toys for student parents", "place to change my baby on campus"], zh: ["学生家长空间", "学生家长免费玩具", "学生家长零食"] },
  { id: "love-lab-bag", broad: "safer-sex", aliases: ["love lab bag at student health"], phrases: ["condoms when health promotion is closed", "free condoms at student health center", "premade love lab bag"], zh: ["学生健康中心免费安全套", "love lab关门后安全套"] },
  { id: "wrrc-academic", aliases: ["wrrc free printing and scantrons"], phrases: ["need a free scantron", "where can i print for free", "need a blue book for my exam"], zh: ["免费打印", "免费考试答题卡", "免费蓝皮考试本"] },
  { id: "eop-academic", aliases: ["eop student academic supplies"], phrases: ["eop student needs scantrons", "free school supplies at eop", "eop blue books"], zh: ["eop免费学习用品", "eop答题卡"] },
  { id: "eop-snack-shack", aliases: ["eop student snack shack"], phrases: ["free snacks at eop", "eop snack shack", "eop student needs a snack"], zh: ["eop免费零食", "eop零食站"] },
  { id: "eop-produce", broad: "food", aliases: ["eop student free produce", "all people eat free produce", "eop weekly produce"], phrases: ["free vegetables for eop students", "where can eop students get fresh fruit", "eop produce giveaway"], zh: ["eop免费蔬果", "eop每周免费水果"] },
  { id: "eop-restroom-supplies", aliases: ["eop student restroom supplies", "eop restroom period supplies"], phrases: ["need a free pad at eop", "free tampons in eop restroom", "condoms in eop center restroom"], zh: ["eop洗手间免费卫生巾", "eop免费安全套"] },
  { id: "eop-hair-closet", aliases: ["eop student hair closet"], phrases: ["hair care products for black students", "eop hair closet", "where can i find hair care products on campus"], zh: ["eop护发用品", "黑人学生护发用品"] },
  { id: "aggie-compass-diapers", aliases: ["diaper closet"], phrases: ["need free diapers for my baby", "baby wipes on campus", "student parent needs formula"], zh: ["免费尿布", "婴儿湿巾", "学生家长奶粉"] },
];
