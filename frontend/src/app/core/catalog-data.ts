export interface ProductSummary {
  readonly slug: string; readonly name: string; readonly category: string; readonly code: string;
  readonly description: string; readonly accent: string;
  readonly specifications: ReadonlyArray<readonly [string, string]>;
  readonly features: ReadonlyArray<string>;
}

export const products: ReadonlyArray<ProductSummary> = [
  { slug:'luna-linear', name:'چراغ خطی لونا', category:'چراغ‌های خطی', code:'MZ-LN-120', description:'خطی مینیمال با نور یکنواخت برای فضاهای اداری و معماری معاصر.', accent:'#8bd4ff', specifications:[['توان','۳۶ وات'],['شار نوری','۳۸۰۰ لومن'],['دمای رنگ','۳۰۰۰ تا ۴۰۰۰ کلوین'],['درجه حفاظت','IP40']], features:['پخش نور یکنواخت','نصب توکار یا روکار','بدنه آلومینیومی'] },
  { slug:'nova-downlight', name:'دان‌لایت نوا', category:'چراغ‌های توکار', code:'MZ-NV-24', description:'دان‌لایت حرفه‌ای با کنترل خیرگی برای پروژه‌های فروشگاهی و هتلی.', accent:'#b7e4ff', specifications:[['توان','۲۴ وات'],['زاویه تابش','۳۶ درجه'],['شاخص نمود رنگ','بیش از ۹۰'],['درجه حفاظت','IP44']], features:['کنترل خیرگی','رنگ نور دقیق','درایور باکیفیت'] },
  { slug:'axis-projector', name:'پروژکتور اکسس', category:'نورپردازی فضای باز', code:'MZ-AX-80', description:'پروژکتور مقاوم برای تأکید بر نما و عناصر شاخص معماری.', accent:'#67bdf3', specifications:[['توان','۸۰ وات'],['زاویه تابش','۲۴ درجه'],['دمای رنگ','۳۰۰۰ کلوین'],['درجه حفاظت','IP66']], features:['مقاوم در برابر شرایط محیطی','تنظیم دقیق زاویه','اپتیک حرفه‌ای'] },
  { slug:'halo-pendant', name:'چراغ آویز هاله', category:'چراغ‌های دکوراتیو', code:'MZ-HL-60', description:'فرم حلقوی سبک برای لابی‌ها، فضاهای پذیرایی و نقاط کانونی.', accent:'#d5f0ff', specifications:[['توان','۶۰ وات'],['قطر','۹۰ سانتی‌متر'],['کنترل','دیمرپذیر'],['نصب','آویز']], features:['نور غیرمستقیم','ارتفاع قابل تنظیم','فرم معماری ظریف'] },
];

export const categories = [
  ['چراغ‌های خطی','راهکارهای پیوسته برای خطوط معماری','۱۲ محصول'],
  ['چراغ‌های توکار','نور دقیق با حضور بصری حداقلی','۱۸ محصول'],
  ['نورپردازی فضای باز','تأکید مطمئن بر نما و محوطه','۹ محصول'],
  ['چراغ‌های دکوراتیو','نقطه کانونی برای فضاهای شاخص','۷ محصول'],
] as const;
