export interface SwitchLabelItem {
  id: number;
  label_code: string;
  description: string;
  status: string;
}

export type SwitchCategory = "SWREC" | "SWMT" | "SWBAS";

export const SWITCH_CATEGORIES: { key: SwitchCategory; label: string; description: string }[] = [
  { key: "SWREC", label: "SWREC (الريسبشن)", description: "مفاتيح إضاءة منطقة الاستقبال والريسبشن والمناطق الخارجية" },
  { key: "SWMT", label: "SWMT (عمال النظافة)", description: "مفاتيح إضاءة منطقة المعمل والممرات والسلم وغرفة VR" },
  { key: "SWBAS", label: "SWBAS (مكاتب التيم)", description: "مفاتيح إضاءة مكاتب الموظفين والشركاء والخدمات" }
];

export const switchLabelsData: Record<SwitchCategory, SwitchLabelItem[]> = {
  "SWREC": [
    {"id": 1, "label_code": "SWREC 001(1)", "description": "إضاءات  L", "status": "جاهز"},
    {"id": 2, "label_code": "SWREC 001(2)", "description": "إضاءات  L", "status": "جاهز"},
    {"id": 3, "label_code": "SWREC 002", "description": "ليد حائط  L", "status": "جاهز"},
    {"id": 4, "label_code": "SWREC 003(1)", "description": "ليد حائط (وش الباب)", "status": "جاهز"},
    {"id": 5, "label_code": "SWREC 003(2)", "description": "ليد سقف (وش الباب)", "status": "جاهز"},
    {"id": 6, "label_code": "SWREC 004", "description": "ليد سقف", "status": "جاهز"},
    {"id": 7, "label_code": "SWREC 005", "description": "اللمبة المدورة", "status": "جاهز"},
    {"id": 8, "label_code": "SWREC 006(1)", "description": "ليد السقف", "status": "جاهز"},
    {"id": 9, "label_code": "SWREC 006(2)", "description": "ليد السقف", "status": "جاهز"},
    {"id": 10, "label_code": "SWREC 007", "description": "ليد مكاتب خلفي ", "status": "جاهز"},
    {"id": 11, "label_code": "SWREC 008", "description": "ليد تجليدة وش الباب", "status": "جاهز"},
    {"id": 12, "label_code": "SWREC 009", "description": "إضاءة (خارجي)", "status": "جاهز"},
    {"id": 13, "label_code": "SWREC 010", "description": "ليد الكنبة", "status": "جاهز"},
    {"id": 14, "label_code": "SWREC 011", "description": "إضاءة (خارجي)", "status": "جاهز"},
    {"id": 15, "label_code": "SWREC 012", "description": "إضاءة رقم العمارة (خارجي)", "status": "جاهز"},
    {"id": 16, "label_code": "SWREC 013", "description": "ليد وش النافورة (خارجي)", "status": "جاهز"},
    {"id": 17, "label_code": "SWREC 014", "description": "إضاءة خارجية", "status": "جاهز"},
    {"id": 18, "label_code": "SWREC 015", "description": "سبوتات (خارجي)", "status": "جاهز"},
    {"id": 19, "label_code": "SWREC 016", "description": "لمبة سقف (خارجي)", "status": "جاهز"},
    {"id": 20, "label_code": "SWREC 017", "description": "ليد الزرع (خارجي)", "status": "جاهز"},
    {"id": 21, "label_code": "SWREC 018", "description": "ليد مرايات (خارجي)", "status": "جاهز"},
    {"id": 22, "label_code": "SWREC 019", "description": "إضاءة (خارجي)", "status": "جاهز"},
    {"id": 23, "label_code": "SWREC 020", "description": "إضاءة (خارجي)", "status": "جاهز"},
    {"id": 24, "label_code": "SWREC 021", "description": "إضاءة (خارجي) ", "status": "جاهز"},
    {"id": 25, "label_code": "SWREC 022", "description": "سبوتات شمال (خارجي) ", "status": "جاهز"},
    {"id": 26, "label_code": "SWREC 023", "description": "لمبات الكور (خارجي)", "status": "جاهز"},
    {"id": 27, "label_code": "SWREC 024", "description": "سبوتات يمين (خارجي)", "status": "جاهز"}
  ],
  "SWMT": [
    {"id": 1, "label_code": "SWMT 001", "description": "ليد سقف المفاتيح", "status": "جاهز"},
    {"id": 2, "label_code": "SWMT 002", "description": "لمبات مدخل الحمام", "status": "جاهز"},
    {"id": 3, "label_code": "SWMT 003", "description": "ليد ماتريال لاب", "status": "جاهز"},
    {"id": 4, "label_code": "SWMT 004", "description": "ليد سقف ماتريال لاب", "status": "جاهز"},
    {"id": 5, "label_code": "SWMT 005", "description": "ليد سقف ماتريال لاب", "status": "جاهز"},
    {"id": 6, "label_code": "SWMT 006", "description": "ليد سقف المكتبين", "status": "جاهز"},
    {"id": 7, "label_code": "SWMT 007", "description": "لمبات سقف البوفيه", "status": "جاهز"},
    {"id": 8, "label_code": "SWMT 008", "description": "لمبات سقف البوفيه", "status": "جاهز"},
    {"id": 9, "label_code": "SWMT 009", "description": "لمبات سقف السلم", "status": "جاهز"},
    {"id": 10, "label_code": "SWMT 010", "description": "ليد أزرق VR", "status": "جاهز"},
    {"id": 11, "label_code": "SWMT 011", "description": "ليد أحمر VR", "status": "جاهز"},
    {"id": 12, "label_code": "SWMT 012", "description": "ليد التجاليد", "status": "جاهز"},
    {"id": 14, "label_code": "SWMT 014", "description": "سبوت السلم ", "status": "جاهز"},
    {"id": 15, "label_code": "SWMT 015", "description": "ليد السلم العلوي", "status": "جاهز"},
    {"id": 16, "label_code": "SWMT 016(1)", "description": "ليد سقف المكتبين", "status": "جاهز"},
    {"id": 17, "label_code": "SWMT 016(2)", "description": "ليد سقف المكتبين", "status": "جاهز"},
    {"id": 18, "label_code": "SWMT 017", "description": "سبوتات Bult-In ", "status": "جاهز"},
    {"id": 19, "label_code": "SWMT 018(1)", "description": "ليد سقف Bult-In ", "status": "جاهز"},
    {"id": 20, "label_code": "SWMT 018(2)", "description": "ليد داخلي Bult-In ", "status": "جاهز"}
  ],
  "SWBAS": [
    {"id": 1, "label_code": "SWBAS 001", "description": "ليد تجاليد", "status": "جاهز"},
    {"id": 2, "label_code": "SWBAS 002", "description": "لمبات سقف مكاتب", "status": "جاهز"},
    {"id": 3, "label_code": "SWBAS 003", "description": "لمبات سقف مكاتب", "status": "جاهز"},
    {"id": 4, "label_code": "SWBAS 004", "description": "ليد التجاليد", "status": "جاهز"},
    {"id": 5, "label_code": "SWBAS 005", "description": "ليد سقف أصفر", "status": "جاهز"},
    {"id": 6, "label_code": "SWBAS 006", "description": "ليد سقف أبيض", "status": "جاهز"},
    {"id": 7, "label_code": "SWBAS 007", "description": "ليد داخل بروكسيسوري", "status": "جاهز"},
    {"id": 8, "label_code": "SWBAS 008", "description": "لوجو بروكسيسوري", "status": "جاهز"},
    {"id": 10, "label_code": "SWBAS 010", "description": "ليد أصفر جزيرة", "status": "جاهز"},
    {"id": 11, "label_code": "SWBAS 011", "description": "لمبات سقف جزيرة", "status": "جاهز"},
    {"id": 12, "label_code": "SWBAS 012", "description": "لمبات سقف جزيرة", "status": "جاهز"},
    {"id": 13, "label_code": "SWBAS 013", "description": "نور بروكسيسوري", "status": "جاهز"},
    {"id": 14, "label_code": "SWBAS 014", "description": "نور بروكسيسوري", "status": "جاهز"},
    {"id": 15, "label_code": "SWBAS 015", "description": "نور بروكسيسوري", "status": "جاهز"},
    {"id": 16, "label_code": "SWBAS 016", "description": "شفاط", "status": "جاهز"},
    {"id": 17, "label_code": "SWBAS 017", "description": "مفتاح التكييف", "status": "جاهز"}
  ]
};
