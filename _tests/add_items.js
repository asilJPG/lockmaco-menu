const fs = require("fs");
const path = require("path");

const MENU_PATH = path.join(__dirname, "../data/menu.json");

// Загружаем существующее меню
const menu = JSON.parse(fs.readFileSync(MENU_PATH, "utf8"));

// Новые секции, которые нужно добавить
const newSections = [
  {
    id: "breakfasts",
    name: {
      ru: "Завтраки",
      uz: "Nonushtalar",
      en: "Breakfasts"
    },
    items: [
      { id: "bliny-maslo", name: { ru: "Блины с маслом", uz: "Sariyog'li quymoqlar", en: "Pancakes with Butter" }, description: { ru: "", uz: "", en: "" }, price: 21000, imageUrl: "", available: true },
      { id: "bliny-myaso", name: { ru: "Блины с мясом", uz: "Go'shtli quymoqlar", en: "Pancakes with Meat" }, description: { ru: "", uz: "", en: "" }, price: 32000, imageUrl: "", available: true },
      { id: "bliny-nutella", name: { ru: "Блины с Нутеллой", uz: "Nutellali quymoqlar", en: "Pancakes with Nutella" }, description: { ru: "", uz: "", en: "" }, price: 30000, imageUrl: "", available: true },
      { id: "bliny-tvorog", name: { ru: "Блины с творогом", uz: "Tvorogli quymoqlar", en: "Pancakes with Cottage Cheese" }, description: { ru: "", uz: "", en: "" }, price: 30000, imageUrl: "", available: true },
      { id: "bliny-apple", name: { ru: "Блины с Яблочным джемом", uz: "Olmali murabboli quymoqlar", en: "Pancakes with Apple Jam" }, description: { ru: "", uz: "", en: "" }, price: 30000, imageUrl: "", available: true },
      { id: "dop-med", name: { ru: "Мед 50г", uz: "Asal 50g", en: "Honey 50g" }, description: { ru: "", uz: "", en: "" }, price: 5000, imageUrl: "", available: true },
      { id: "dop-sgushenka", name: { ru: "Сгущенка 50г", uz: "Quyultirilgan sut 50g", en: "Condensed Milk 50g" }, description: { ru: "", uz: "", en: "" }, price: 5000, imageUrl: "", available: true },
      { id: "dop-smetana", name: { ru: "Сметана 50г", uz: "Smetana 50g", en: "Sour Cream 50g" }, description: { ru: "", uz: "", en: "" }, price: 5000, imageUrl: "", available: true },
      { id: "kasha-mannaya", name: { ru: "Каша манная", uz: "Manna bo'tqasi", en: "Semolina Porridge" }, description: { ru: "", uz: "", en: "" }, price: 33000, imageUrl: "", available: true },
      { id: "kasha-ovsyanaya", name: { ru: "Каша овсяная", uz: "Suli bo'tqasi", en: "Oat Porridge" }, description: { ru: "", uz: "", en: "" }, price: 33000, imageUrl: "", available: true },
      { id: "kasha-risovaya", name: { ru: "Каша рисовая", uz: "Guruchli bo'tqa", en: "Rice Porridge" }, description: { ru: "", uz: "", en: "" }, price: 33000, imageUrl: "", available: true },
      { id: "croissant-vetchina", name: { ru: "Круассан с ветчиной", uz: "Vetchinali kruassan", en: "Croissant with Ham" }, description: { ru: "", uz: "", en: "" }, price: 40000, imageUrl: "", available: true },
      { id: "croissant-losos", name: { ru: "Круассан с лососем", uz: "Lososli kruassan", en: "Croissant with Salmon" }, description: { ru: "", uz: "", en: "" }, price: 45000, imageUrl: "", available: true },
      { id: "croissant-skrembl", name: { ru: "Круассан Скрембл", uz: "Skrembl kruassan", en: "Croissant Scramble" }, description: { ru: "", uz: "", en: "" }, price: 40000, imageUrl: "", available: true },
      { id: "omlet-farsh", name: { ru: "Фаршированный омлет", uz: "Qiymali omlet", en: "Stuffed Omelette" }, description: { ru: "", uz: "", en: "" }, price: 58000, imageUrl: "", available: true },
      { id: "omlet-yaichnica", name: { ru: "Яичница", uz: "Qovurilgan tuxum", en: "Fried Eggs" }, description: { ru: "", uz: "", en: "" }, price: 30000, imageUrl: "", available: true },
      { id: "omlet-turkey", name: { ru: "Яичница с индейкой", uz: "Kurkali qovurilgan tuxum", en: "Fried Eggs with Turkey" }, description: { ru: "", uz: "", en: "" }, price: 35000, imageUrl: "", available: true },
      { id: "hleb-borodinsky", name: { ru: "Бородинский хлеб", uz: "Borodino noni", en: "Borodinsky Bread" }, description: { ru: "", uz: "", en: "" }, price: 15000, imageUrl: "", available: true },
      { id: "hleb-french", name: { ru: "Французский хлеб", uz: "Fransuz noni", en: "French Bread" }, description: { ru: "", uz: "", en: "" }, price: 15000, imageUrl: "", available: true },
      { id: "hleb-assorti", name: { ru: "Хлебный ассорти", uz: "Non assortisi", en: "Bread Assortment" }, description: { ru: "", uz: "", en: "" }, price: 30000, imageUrl: "", available: true },
      { id: "breakfast-english", name: { ru: "Английский завтрак", uz: "Inglizcha nonushta", en: "English Breakfast" }, description: { ru: "", uz: "", en: "" }, price: 68000, imageUrl: "", available: true },
      { id: "breakfast-cottage", name: { ru: "Деревенский творог", uz: "Qishloqcha tvorog", en: "Country Cottage Cheese" }, description: { ru: "", uz: "", en: "" }, price: 28000, imageUrl: "", available: true },
      { id: "breakfast-croquet", name: { ru: "Картофельный крокет с яйцом пашот", uz: "Kartoshkali kroket pashot tuxum bilan", en: "Potato Croquette with Poached Egg" }, description: { ru: "", uz: "", en: "" }, price: 42000, imageUrl: "", available: true },
      { id: "breakfast-syrniki", name: { ru: "Фирменные сырники", uz: "Fermercha tvoroglar", en: "Signature Syrniki" }, description: { ru: "", uz: "", en: "" }, price: 44000, imageUrl: "", available: true },
      { id: "breakfast-shakshuka", name: { ru: "Шакшука", uz: "Shakshuka", en: "Shakshuka" }, description: { ru: "", uz: "", en: "" }, price: 55000, imageUrl: "", available: true }
    ]
  },
  {
    id: "meat-dishes",
    name: {
      ru: "Горячие блюда",
      uz: "Issiq taomlar",
      en: "Hot Dishes"
    },
    items: [
      { id: "meat-befstroganov", name: { ru: "Бефстроганов С Пюре", uz: "Pyureli befstroganov", en: "Beef Stroganoff with Mashed Potatoes" }, description: { ru: "", uz: "", en: "" }, price: 90000, imageUrl: "", available: true },
      { id: "meat-lamb-shank", name: { ru: "Голень ягненка с овощами", uz: "Sabzavotli qo'zichoq boldiri", en: "Lamb Shank with Vegetables" }, description: { ru: "", uz: "", en: "" }, price: 173000, imageUrl: "", available: true },
      { id: "meat-lamb-rack", name: { ru: "Каре Ягненка с картофелем", uz: "Kartoshkali qo'zichoq qovurg'asi", en: "Rack of Lamb with Potatoes" }, description: { ru: "", uz: "", en: "" }, price: 135000, imageUrl: "", available: true },
      { id: "meat-wings", name: { ru: "Крылья Терияки", uz: "Teriyaki qanotchalari", en: "Teriyaki Wings" }, description: { ru: "", uz: "", en: "" }, price: 52000, imageUrl: "", available: true },
      { id: "meat-cutlet", name: { ru: "Куриная котлета", uz: "Tovuqli kotlet", en: "Chicken Cutlet" }, description: { ru: "", uz: "", en: "" }, price: 47000, imageUrl: "", available: true },
      { id: "meat-cordon-bleu", name: { ru: "Куриный кордон блю", uz: "Tovuqli kordon blyu", en: "Chicken Cordon Bleu" }, description: { ru: "", uz: "", en: "" }, price: 89000, imageUrl: "", available: true },
      { id: "meat-roll", name: { ru: "Куриный рулет", uz: "Tovuqli rulet", en: "Chicken Roll" }, description: { ru: "", uz: "", en: "" }, price: 65000, imageUrl: "", available: true },
      { id: "meat-salmon-rice", name: { ru: "Лосось с диким рисом", uz: "Yovvoyi guruchli losos", en: "Salmon with Wild Rice" }, description: { ru: "", uz: "", en: "" }, price: 95000, imageUrl: "", available: true },
      { id: "meat-medallions", name: { ru: "Медальоны из говядины", uz: "Mol go'shtidan medalonlar", en: "Beef Medallions" }, description: { ru: "", uz: "", en: "" }, price: 128000, imageUrl: "", available: true },
      { id: "meat-drumstick", name: { ru: "Окорочок цыпленка", uz: "Tovuq soni", en: "Chicken Leg" }, description: { ru: "", uz: "", en: "" }, price: 69000, imageUrl: "", available: true },
      { id: "meat-lamb-shoulder", name: { ru: "Томленая Лопатка Ягненка", uz: "Dimlangan qo'zichoq kuragi", en: "Stewed Lamb Shoulder" }, description: { ru: "", uz: "", en: "" }, price: 120000, imageUrl: "", available: true },
      { id: "meat-beef-cheeks", name: { ru: "Томленые говяжьи щечки", uz: "Dimlangan mol yonoqlari", en: "Stewed Beef Cheeks" }, description: { ru: "", uz: "", en: "" }, price: 113000, imageUrl: "", available: true },
      { id: "meat-duck-breast", name: { ru: "Утиная грудка с ягодным соусом", uz: "Rezavor qaylali o'rdak ko'kragi", en: "Duck Breast with Berry Sauce" }, description: { ru: "", uz: "", en: "" }, price: 76000, imageUrl: "", available: true },
      { id: "meat-schnitzel", name: { ru: "Шницель", uz: "Shnitsel", en: "Schnitzel" }, description: { ru: "", uz: "", en: "" }, price: 49000, imageUrl: "", available: true }
    ]
  },
  {
    id: "pasta",
    name: {
      ru: "Паста",
      uz: "Pasta",
      en: "Pasta"
    },
    items: [
      { id: "pasta-alfredo", name: { ru: "Альфредо паста куриный", uz: "Tovuqli Alfredo pastasi", en: "Chicken Alfredo Pasta" }, description: { ru: "", uz: "", en: "" }, price: 62000, imageUrl: "", available: true },
      { id: "pasta-pomodoro", name: { ru: "Паста Аль помидоро", uz: "Al pomodoro pastasi", en: "Pasta al Pomodoro" }, description: { ru: "", uz: "", en: "" }, price: 59000, imageUrl: "", available: true },
      { id: "pasta-bolognese", name: { ru: "Паста Болоньезе", uz: "Bolonyeze pastasi", en: "Pasta Bolognese" }, description: { ru: "", uz: "", en: "" }, price: 65000, imageUrl: "", available: true },
      { id: "pasta-arrabbiata", name: { ru: "Пене Арабиата", uz: "Penne Arabiata", en: "Penne Arrabbiata" }, description: { ru: "", uz: "", en: "" }, price: 61000, imageUrl: "", available: true }
    ]
  },
  {
    id: "pizza",
    name: {
      ru: "Пицца",
      uz: "Pitsa",
      en: "Pizza"
    },
    items: [
      { id: "pizza-four-cheeses", name: { ru: "Пицца 4 сыра", uz: "4 xil pishloqli pitsa", en: "Pizza 4 Cheeses" }, description: { ru: "", uz: "", en: "" }, price: 60000, imageUrl: "", available: true },
      { id: "pizza-lokmaco", name: { ru: "Пицца The Lokmaco", uz: "The Lokmaco pitsasi", en: "Pizza The Lokmaco" }, description: { ru: "", uz: "", en: "" }, price: 85000, imageUrl: "", available: true },
      { id: "pizza-pear", name: { ru: "Пицца Груша", uz: "Nokli pitsa", en: "Pizza Pear" }, description: { ru: "", uz: "", en: "" }, price: 95000, imageUrl: "", available: true },
      { id: "pizza-margherita", name: { ru: "Пицца Маргарита", uz: "Margarita pitsasi", en: "Pizza Margherita" }, description: { ru: "", uz: "", en: "" }, price: 52000, imageUrl: "", available: true },
      { id: "pizza-mozzarella", name: { ru: "Пицца Моцарелла", uz: "Motsarella pitsasi", en: "Pizza Mozzarella" }, description: { ru: "", uz: "", en: "" }, price: 80000, imageUrl: "", available: true },
      { id: "pizza-meat", name: { ru: "Пицца Мясная", uz: "Go'shtli pitsa", en: "Pizza Meat" }, description: { ru: "", uz: "", en: "" }, price: 105000, imageUrl: "", available: true },
      { id: "pizza-pepperoni", name: { ru: "Пицца Пеперони", uz: "Peperoni pitsasi", en: "Pizza Pepperoni" }, description: { ru: "", uz: "", en: "" }, price: 90000, imageUrl: "", available: true },
      { id: "pizza-stracciatella", name: { ru: "Пицца Страчателла", uz: "Strachatella pitsasi", en: "Pizza Stracciatella" }, description: { ru: "", uz: "", en: "" }, price: 125000, imageUrl: "", available: true },
      { id: "pizza-caesar", name: { ru: "Пицца Цезарь", uz: "Sezar pitsasi", en: "Pizza Caesar" }, description: { ru: "", uz: "", en: "" }, price: 95000, imageUrl: "", available: true }
    ]
  },
  {
    id: "salads",
    name: {
      ru: "Салаты",
      uz: "Salatlar",
      en: "Salads"
    },
    items: [
      { id: "salad-achichuk", name: { ru: "Ачучук", uz: "Achichuk", en: "Achichuk Salad" }, description: { ru: "", uz: "", en: "" }, price: 19000, imageUrl: "", available: true },
      { id: "salad-watermelon", name: { ru: "Салат Арбузный", uz: "Tarvuzli salat", en: "Watermelon Salad" }, description: { ru: "", uz: "", en: "" }, price: 35000, imageUrl: "", available: true },
      { id: "salad-eggplant", name: { ru: "Салат Баклажанный", uz: "Baqlajonli salat", en: "Eggplant Salad" }, description: { ru: "", uz: "", en: "" }, price: 48000, imageUrl: "", available: true },
      { id: "salad-vitamin", name: { ru: "Салат Витаминный", uz: "Vitaminli salat", en: "Vitamin Salad" }, description: { ru: "", uz: "", en: "" }, price: 45000, imageUrl: "", available: true },
      { id: "salad-greek", name: { ru: "Салат Греческий", uz: "Grekcha salat", en: "Greek Salad" }, description: { ru: "", uz: "", en: "" }, price: 45000, imageUrl: "", available: true },
      { id: "salad-tuna", name: { ru: "Салат С Тунцом", uz: "Tunesli salat", en: "Tuna Salad" }, description: { ru: "", uz: "", en: "" }, price: 49000, imageUrl: "", available: true },
      { id: "salad-duck", name: { ru: "Салат Утиный", uz: "O'rdakli salat", en: "Duck Salad" }, description: { ru: "", uz: "", en: "" }, price: 47000, imageUrl: "", available: true },
      { id: "salad-caesar", name: { ru: "Салат Цезарь", uz: "Sezar salati", en: "Caesar Salad" }, description: { ru: "", uz: "", en: "" }, price: 44000, imageUrl: "", available: true }
    ]
  },
  {
    id: "soups",
    name: {
      ru: "Супы",
      uz: "Sho'rvalar",
      en: "Soups"
    },
    items: [
      { id: "soup-borsch", name: { ru: "Борщ", uz: "Borsh", en: "Borsch" }, description: { ru: "", uz: "", en: "" }, price: 42000, imageUrl: "", available: true },
      { id: "soup-noodle", name: { ru: "Лапша куриная", uz: "Tovuqli ugra", en: "Chicken Noodle Soup" }, description: { ru: "", uz: "", en: "" }, price: 28000, imageUrl: "", available: true },
      { id: "soup-mastava", name: { ru: "Мастава", uz: "Mastava", en: "Mastava" }, description: { ru: "", uz: "", en: "" }, price: 36000, imageUrl: "", available: true },
      { id: "soup-okroshka", name: { ru: "Окрошка", uz: "Okroshka", en: "Okroshka" }, description: { ru: "", uz: "", en: "" }, price: 37000, imageUrl: "", available: true }
    ]
  }
];

// Добавляем новые секции в food
menu.sections.food.push(...newSections);

// Записываем обратно
fs.writeFileSync(MENU_PATH, JSON.stringify(menu, null, 2) + "\n", "utf8");
console.log("Successfully added all new sections to menu.json!");
