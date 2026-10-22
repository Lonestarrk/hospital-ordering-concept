// Innehållsförteckning för rätterna – syntetiska exempel för demon, inte köksrecept.
// Ingredienser som är allergener är märkta, så att de kan visas i fetstil, och de stämmer med
// rättens allergener i data.ts – allergensFromIngredients ska ge samma lista som dish.allergens.

type Lang = "sv" | "en" | "ar";
type Ingredient = Record<Lang, string> & { allergen?: string };

const I = {
  vetemjol: { sv: "vetemjöl", en: "wheat flour", ar: "دقيق القمح", allergen: "Gluten" },
  strobrod: { sv: "ströbröd (vete)", en: "breadcrumbs (wheat)", ar: "فتات الخبز (قمح)", allergen: "Gluten" },
  pasta: { sv: "pasta (durumvete)", en: "pasta (durum wheat)", ar: "معكرونة (قمح قاسٍ)", allergen: "Gluten" },
  brod: { sv: "bröd (vete, råg)", en: "bread (wheat, rye)", ar: "خبز (قمح، جاودار)", allergen: "Gluten" },
  agg: { sv: "ägg", en: "egg", ar: "بيض", allergen: "Ägg" },
  mjolk: { sv: "mjölk", en: "milk", ar: "حليب", allergen: "Mjölk" },
  gradde: { sv: "grädde", en: "cream", ar: "قشدة", allergen: "Mjölk" },
  ost: { sv: "ost", en: "cheese", ar: "جبن", allergen: "Mjölk" },
  smor: { sv: "smör", en: "butter", ar: "زبدة", allergen: "Mjölk" },
  senap: { sv: "senap", en: "mustard", ar: "خردل", allergen: "Senap" },
  selleri: { sv: "selleri", en: "celery", ar: "كرفس", allergen: "Selleri" },
  rotselleri: { sv: "rotselleri", en: "celeriac", ar: "جذر الكرفس", allergen: "Selleri" },
  lax: { sv: "lax", en: "salmon", ar: "سلمون", allergen: "Fisk" },
  sej: { sv: "sej", en: "saithe", ar: "سمك البلوق", allergen: "Fisk" },
  torsk: { sv: "torsk", en: "cod", ar: "سمك القد", allergen: "Fisk" },
  kalv: { sv: "kalvkött", en: "veal", ar: "لحم العجل" },
  notkott: { sv: "nötkött", en: "beef", ar: "لحم البقر" },
  notfars: { sv: "nötfärs", en: "minced beef", ar: "لحم بقري مفروم" },
  flask: { sv: "rimmat fläsk", en: "salted pork", ar: "لحم خنزير مملح" },
  kyckling: { sv: "kyckling", en: "chicken", ar: "دجاج" },
  potatis: { sv: "potatis", en: "potatoes", ar: "بطاطس" },
  ris: { sv: "ris", en: "rice", ar: "أرز" },
  morot: { sv: "morot", en: "carrot", ar: "جزر" },
  lok: { sv: "lök", en: "onion", ar: "بصل" },
  vitlok: { sv: "vitlök", en: "garlic", ar: "ثوم" },
  paprika: { sv: "paprika", en: "bell pepper", ar: "فلفل حلو" },
  zucchini: { sv: "zucchini", en: "courgette", ar: "كوسة" },
  tomat: { sv: "tomat", en: "tomato", ar: "طماطم" },
  gulaartor: { sv: "gula ärtor", en: "yellow peas", ar: "بازلاء صفراء" },
  grontaartor: { sv: "gröna ärtor", en: "green peas", ar: "بازلاء خضراء" },
  bonor: { sv: "bönor", en: "beans", ar: "فاصوليا" },
  kokosmjolk: { sv: "kokosmjölk", en: "coconut milk", ar: "حليب جوز الهند" },
  palsternacka: { sv: "palsternacka", en: "parsnip", ar: "جزر أبيض" },
  rodbetor: { sv: "inlagda rödbetor", en: "pickled beetroot", ar: "شمندر مخلل" },
  inlagdgurka: { sv: "inlagd gurka", en: "pickled gherkin", ar: "خيار مخلل" },
  sallad: { sv: "sallad", en: "lettuce", ar: "خس" },
  gurka: { sv: "gurka", en: "cucumber", ar: "خيار" },
  citron: { sv: "citron", en: "lemon", ar: "ليمون" },
  dill: { sv: "dill", en: "dill", ar: "شبت" },
  kalvfond: { sv: "kalvfond", en: "veal stock", ar: "مرق العجل" },
  majsstarkelse: { sv: "majsstärkelse", en: "cornflour", ar: "نشا الذرة" },
  mjolkfrittfett: { sv: "mjölkfritt matfett", en: "dairy-free spread", ar: "دهن نباتي خالٍ من الحليب" },
  rapsolja: { sv: "rapsolja", en: "rapeseed oil", ar: "زيت الكانولا" },
  vatten: { sv: "vatten", en: "water", ar: "ماء" },
  vinager: { sv: "vinäger", en: "vinegar", ar: "خل" },
  socker: { sv: "socker", en: "sugar", ar: "سكر" },
  sylt: { sv: "jordgubbssylt", en: "strawberry jam", ar: "مربى الفراولة" },
  artprotein: { sv: "ärtprotein", en: "pea protein", ar: "بروتين البازلاء" },
  maltodextrin: { sv: "maltodextrin (majs)", en: "maltodextrin (maize)", ar: "مالتوديكسترين (ذرة)" },
  salt: { sv: "salt", en: "salt", ar: "ملح" },
  peppar: { sv: "svartpeppar", en: "black pepper", ar: "فلفل أسود" },
  kryddpeppar: { sv: "kryddpeppar", en: "allspice", ar: "بهار حلو" },
  lagerblad: { sv: "lagerblad", en: "bay leaf", ar: "ورق الغار" },
  mejram: { sv: "mejram", en: "marjoram", ar: "مردقوش" },
  curry: { sv: "currykrydda", en: "curry powder", ar: "مسحوق الكاري" },
  ingefara: { sv: "ingefära", en: "ginger", ar: "زنجبيل" },
  chili: { sv: "chili", en: "chilli", ar: "فلفل حار" },
  spiskummin: { sv: "spiskummin", en: "cumin", ar: "كمون" },
  paprikapulver: { sv: "paprikapulver", en: "paprika powder", ar: "بابريكا مطحونة" },
  oregano: { sv: "oregano", en: "oregano", ar: "أوريغانو" },
  muskot: { sv: "muskot", en: "nutmeg", ar: "جوزة الطيب" },
} satisfies Record<string, Ingredient>;

type IngredientId = keyof typeof I;

/** Ingredienserna i varje rätt, störst mängd först – som på en förpackning. */
const recipes: Record<string, IngredientId[]> = {
  kalvspett: ["kalv", "potatis", "zucchini", "paprika", "lok", "kalvfond", "mjolkfrittfett", "majsstarkelse", "rapsolja", "salt", "peppar"],
  lax: ["lax", "potatis", "morot", "mjolkfrittfett", "dill", "majsstarkelse", "citron", "salt", "peppar"],
  soppa: ["morot", "potatis", "vatten", "lok", "palsternacka", "tomat", "brod", "rapsolja", "salt"],
  artsoppa: ["gulaartor", "vatten", "flask", "lok", "mejram", "salt", "senap"],
  kycklingcurry: ["kyckling", "ris", "kokosmjolk", "paprika", "morot", "lok", "curry", "ingefara", "vitlok", "rapsolja", "salt"],
  kalops: ["notkott", "potatis", "morot", "lok", "rodbetor", "majsstarkelse", "kryddpeppar", "lagerblad", "salt"],
  sejfile: ["sej", "potatis", "grontaartor", "rapsolja", "citron", "salt", "peppar"],
  pannbiff: ["notfars", "potatis", "lok", "agg", "sallad", "gurka", "majsstarkelse", "rapsolja", "salt", "peppar"],
  gulasch: ["notkott", "potatis", "vatten", "paprika", "tomat", "lok", "paprikapulver", "vitlok", "spiskummin", "salt"],
  bonchili: ["bonor", "tomat", "lok", "paprika", "morot", "rapsolja", "vitlok", "chili", "spiskummin", "salt"],
  kycklinggryta: ["kyckling", "ris", "paprika", "morot", "selleri", "lok", "majsstarkelse", "rapsolja", "salt"],
  spaghetti: ["pasta", "notfars", "tomat", "morot", "selleri", "lok", "rapsolja", "vitlok", "oregano", "salt"],
  ugnskyckling: ["kyckling", "morot", "palsternacka", "rotselleri", "rapsolja", "salt", "peppar"],
  pannkakor: ["mjolk", "vetemjol", "agg", "sylt", "gradde", "smor", "socker", "salt"],
  paneradfisk: ["torsk", "potatis", "strobrod", "rapsolja", "agg", "vetemjol", "inlagdgurka", "senap", "vinager", "salt"],
  fiskgratang: ["torsk", "potatis", "mjolk", "ost", "smor", "majsstarkelse", "dill", "salt"],
  lasagne: ["pasta", "notfars", "tomat", "mjolk", "ost", "lok", "vetemjol", "oregano", "salt"],
  schnitzel: ["kyckling", "potatis", "strobrod", "mjolk", "agg", "vetemjol", "smor", "salt", "peppar"],
  timbal: ["notfars", "potatis", "morot", "agg", "mjolkfrittfett", "muskot", "salt"],
  naringssoppa: ["potatis", "vatten", "morot", "palsternacka", "lok", "artprotein", "maltodextrin", "rapsolja", "salt"],
};

/** Rättens ingredienser på valt språk, med allergenerna markerade. */
export function ingredientsFor(dishId: string, lang: Lang): { name: string; allergen: boolean }[] | undefined {
  return recipes[dishId]?.map((id) => {
    const item: Ingredient = I[id];
    return { name: item[lang], allergen: !!item.allergen };
  });
}

/** Allergenerna som ingredienserna ger – för kontrollen mot data.ts. */
export function allergensFromIngredients(dishId: string): string[] {
  const found = new Set<string>();
  for (const id of recipes[dishId] ?? []) {
    const allergen = (I[id] as Ingredient).allergen;
    if (allergen) found.add(allergen);
  }
  return [...found].sort();
}

export const ingredientDishes = Object.keys(recipes);
