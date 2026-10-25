# DeepSeekCode

[English](README.md) · [简体中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [Bahasa Indonesia](README.id.md)

<div dir="rtl" align="right">

**وكيل برمجة بالذكاء الاصطناعي يعمل محليًا: بيئة تشغيل واحدة على جهازك، تقودها أيّ نماذج متوافقة مع OpenAI.**

يعمل DeepSeekCode على جهازك أنت، ويعرض النواة نفسها للوكيل عبر عدة واجهات: واجهة طرفية تفاعلية، ومساحة عمل ويب على `http://localhost:8080`، وواجهة HTTP/WebSocket، ووضع دفعي بصيغة JSONL للـ CI. كل استدعاء أداة يمرّ عبر طبقة أذونات تتحكّم أنت فيها، والواجهة مترجمة إلى 12 لغة.

هذا المستودع هو **نقطة التوزيع العامة**: صفحة التنزيل (GitHub Pages) وحِزَم التثبيت لسطح المكتب. أما مستودع الشيفرة المصدرية فخاص.

| | |
| --- | --- |
| صفحة التنزيل | <https://deepseekcode.github.io/deepseekwork/> |
| حِزَم التثبيت (Releases) | <https://github.com/deepseekcode/deepseekwork/releases> |
| حزمة npm | <https://www.npmjs.com/package/@deepseekcode/cli> |
| ملخّص مقروء آليًا | <https://deepseekcode.github.io/deepseekwork/llms.txt> |

![واجهة DeepSeekCode الطرفية](website/assets/screenshots/cli.png)

## أبرز المزايا

- **بيئة تشغيل واحدة، عدة واجهات** — واجهة طرفية TUI، وواجهة ويب، وواجهة HTTP + WebSocket، و`dscode exec` بصيغة JSONL للسكربتات والـ CI. لا حاجة لتثبيت خادم خلفي منفصل.
- **طبقة أذونات على كل استدعاء أداة** — نطاقات `system > project > user > local > session` (الأضيق يفوز)، وسياسات `auto` / `ask` / `deny`، ومصنّف ذكاء اصطناعي اختياري للمنطقة الرمادية، وانتهاء المهلة يعني الرفض.
- **وضع خطّة للقراءة فقط بصرامة** — يولّد `/plan` قائمة مهام؛ ولا يُنفَّذ شيء قبل موافقتك، وحلقة التشغيل تتبنّى تلك القائمة بدل تبديل المحرّك.
- **أوضاع قابلة للتبديل أثناء التشغيل** — `act` و`auto-act` و`goal` و`auto-goal` و`chat` (يدور بينها `Shift+Tab`).
- **نحو 70 أداة مدمجة** — الملفات والبحث وgit وLSP وفهم الشيفرة والمتصفّح والوكلاء الفرعيين والخطط والذاكرة وMCP.
- **أدوات طرفية داخل صندوق رمل** — bwrap على Linux، وSBPL على macOS، وMXC / Docker على Windows؛ وإذا لم تتوفّر سياسة صالحة يرفض التنفيذ بدل الرجوع إلى طرفية مضيف بلا صندوق رمل.
- **قابل للتوسّع** — خوادم MCP والمهارات والإضافات والوكلاء الفرعيون والعمل في الخلفية وسيول العمل وقنوات المراسلة (LINE وSlack وWhatsApp وQQ وDingTalk وFeishu) مع التحقّق من توقيع الطلبات الواردة.
- **متين** — ذاكرة تبقى بين الجلسات، وحارس اختياري يستطيع استئناف تشغيل انقطع لسبب غير إيقاف صريح من المستخدم.
- **السمات** — dark وlight وnord وdracula وmonokai وone-dark وtokyo-night.

![مساحة عمل DeepSeekCode على الويب](website/assets/screenshots/tools.png)

## التثبيت

### npm (Node.js >= 18)

```bash
npm install -g @deepseekcode/cli
dscode
```

يُثبَّت أمران: `dscode` و`deepseekcode`.

### حِزَم التثبيت لسطح المكتب

| المنصّة | الصيغ |
| --- | --- |
| Windows x64 | `.exe` (NSIS)، `.msi` |
| macOS (Apple Silicon + Intel) | `.dmg` شامل |
| Linux x64 | `.deb`، `.rpm`، `.AppImage` |

نزّلها من [Releases](https://github.com/deepseekcode/deepseekwork/releases). ويرافق كل ملف توقيع `.sig` بالاسم نفسه.

## التشغيل الأول

1. شغّل `dscode` — فتبدأ نواة الوكيل وخادم HTTP/WebSocket في العملية نفسها.
2. افتح `http://localhost:8080/#models` واضبط نقطة نهاية متوافقة مع OpenAI. يصلح أي خادم يتحدّث هذه الواجهة، بما في ذلك خادم يعمل على `localhost`.
3. عُد إلى الطرفية واشرح المهمة. كل ما يكتب ملفات أو ينفّذ أوامر يمرّ عبر طبقة الأذونات.

## السكربتات والـ CI

```bash
dscode exec "fix the failing test in src/utils"   # مهمة واحدة، الإخراج JSONL
dscode exec --file ./task.txt --text              # المهمة من ملف، الإخراج نصّ عادي
```

يُخرج `exec` كائن JSON واحدًا في كل سطر، فيمكن استهلاك الناتج برمجيًا؛ كما أن إدخال stdin غير المرتبط بـ TTY يختار الوضع غير التفاعلي أيضًا.

## ما يضمّه هذا المستودع

| المسار | المحتوى |
| --- | --- |
| `website/` | صفحة التنزيل — ملف `index.html` ثابت واحد، منسوخ من مستودع الشيفرة المصدرية |
| `website/llms.txt` | ملخّص مقروء آليًا لزواحف الذكاء الاصطناعي (اصطلاح llmstxt.org) |
| `website/zh/ ja/ ko/ es/ fr/` | صفحات لكل لغة — **مولّدة، لا تُحرَّر يدويًا** |
| `website/tools/gen-locales.mjs` | مولّد الصفحات لكل لغة |
| `website/sitemap.xml`، `website/robots.txt` | بيانات وصفية للزحف |
| `.github/workflows/pages-deploy.yml` | ينشر `website/` إلى GitHub Pages عند كل دفع |
| `.github/workflows/release-stats.yml` | لقطة يومية لعدد التنزيلات تُسجَّل في `.gh-stats/downloads.csv` |
| `scripts/gh-download-stats.ps1` | أخذ اللقطة أو عرض الفروقات الأخيرة (`-Report 7`) |
| `docs/` | ملاحظات تصميم التعريب ومواد لقطات الشاشة |
| `_promo/` | سلسلة أدوات تسجيل المواد الترويجية |

## كيف يُدار هذا المستودع

**إصدار نسخة جديدة — دون أي تعديل على الكود**

1. أنشئ وسمًا `desktop-v*` في مستودع الشيفرة المصدرية؛ سيبني سير عمل `desktop-release` حِزَم التثبيت للمنصّات الثلاث ويرفعها إلى Releases في هذا المستودع.
2. عند التحميل تستعلم الصفحة من GitHub عبر `/releases/latest` عن أحدث وسم `desktop-v*` — فتتبع شارة الإصدار وروابط التنزيل ورابط الإصدار ذلك تلقائيًا.

`CONFIG.version` و`CONFIG.cliVersion` قيمتان احتياطيتان فقط، تُستخدمان حين تُقيّد واجهة GitHub عدد الطلبات أو ينقطع الشبكة.

**تعديل الصفحة نفسها (النصوص والتنسيق والبنية)**

1. حرّر `website/index.html` في مستودع الشيفرة المصدرية. النصوص في قاموسَي `EN` / `OV`: والنصوص الثابتة الثمانية والخمسون في الصفحة هي لقطة معروضة مسبقًا يعيد `render()` كتابتها في المتصفّح من القاموس نفسه، فلا ينفصل الجانبان أبدًا.
2. إن غيّرت النصوص فأعد توليد صفحات اللغات: `node website/tools/gen-locales.mjs` (يعيد استخدام قاموس التعريب نفسه، والمفاتيح غير المترجمة تعود إلى الإنجليزية).
3. زامن `website/` هنا ثم ادفع → تتحدّث GitHub Pages تلقائيًا.

**إحصاءات التنزيل** — لا يعرض GitHub إلا `download_count` تراكميًا لكل ملف، لذا يسجّل `release-stats.yml` هذه القيمة التراكمية مرة يوميًا في `.gh-stats/downloads.csv`، ومن هذا التسلسل تُحسب «التنزيلات الجديدة خلال آخر N يومًا» بالأمر `powershell -File scripts\gh-download-stats.ps1 -Report 7`.

**إعداد GitHub Pages لمرة واحدة** — Settings → Pages → Source: اختر **GitHub Actions**. سير العمل هو من ينشر الموقع، ولا حاجة لاختيار فرع أو مجلد.

## اللغات

تأتي واجهة المنتج بـ 12 لغة؛ وتنشر صفحة التنزيل 6 لغات، لكل منها عنوان URL ثابت خاص بها حتى يقرأ الزاحف الذي لا ينفّذ JavaScript المحتوى بتلك اللغة:

| اللغة | العنوان |
| --- | --- |
| English (الافتراضية) | <https://deepseekcode.github.io/deepseekwork/> |
| 简体中文 | <https://deepseekcode.github.io/deepseekwork/zh/> |
| 日本語 | <https://deepseekcode.github.io/deepseekwork/ja/> |
| 한국어 | <https://deepseekcode.github.io/deepseekwork/ko/> |
| Español | <https://deepseekcode.github.io/deepseekwork/es/> |
| Français | <https://deepseekcode.github.io/deepseekwork/fr/> |

## الترخيص

برنامج مملوك ومغلق المصدر — وليس برنامجًا مفتوح المصدر. يتطلّب النسخ أو التعديل أو التوزيع أو الترخيص من الباطن أو البيع موافقةً كتابية مسبقة من صاحب حقوق النشر. © 2026 DeepSeekCode. جميع الحقوق محفوظة.

DeepSeekCode مشروع مستقل. لا صلة له بـ DeepSeek (深度求索) ولا بأي مورّد نماذج أو أدوات آخر، ولا رعاية أو تأييد من أيٍّ منها. يشير الاسم إلى بيئة تشغيل للعميل لا إلى عائلة نماذج، والمنتج لا يتضمّن نموذجًا خاصًا به، بل يقود فقط نقطة النهاية المتوافقة مع OpenAI التي تضبطها.

</div>
