"use strict";

const LANGS = {
  es: { name: "Spanish", glyph: "Ñ", speech: "es-ES" },
  zh: { name: "Chinese", glyph: "中", speech: "zh-CN" },
  pl: { name: "Polish", glyph: "Ł", speech: "pl-PL" },
  ru: { name: "Russian", glyph: "Я", speech: "ru-RU" }
};
const WORDS = [
  { pic: "🐱", en: "cat", es: "gato", zh: "猫", py: "māo", pl: "kot", ru: "кошка" },
  { pic: "🐶", en: "dog", es: "perro", zh: "狗", py: "gǒu", pl: "pies", ru: "собака" },
  { pic: "🍎", en: "apple", es: "manzana", zh: "苹果", py: "píngguǒ", pl: "jabłko", ru: "яблоко" },
  { pic: "🍞", en: "bread", es: "pan", zh: "面包", py: "miànbāo", pl: "chleb", ru: "хлеб" },
  { pic: "💧", en: "water", es: "agua", zh: "水", py: "shuǐ", pl: "woda", ru: "вода" },
  { pic: "☀️", en: "sun", es: "sol", zh: "太阳", py: "tàiyáng", pl: "słońce", ru: "солнце" },
  { pic: "🌙", en: "moon", es: "luna", zh: "月亮", py: "yuèliang", pl: "księżyc", ru: "луна" },
  { pic: "🏠", en: "house", es: "casa", zh: "房子", py: "fángzi", pl: "dom", ru: "дом" },
  { pic: "🚗", en: "car", es: "coche", zh: "汽车", py: "qìchē", pl: "samochód", ru: "машина" },
  { pic: "📖", en: "book", es: "libro", zh: "书", py: "shū", pl: "książka", ru: "книга" },
  { pic: "🌳", en: "tree", es: "árbol", zh: "树", py: "shù", pl: "drzewo", ru: "дерево" },
  { pic: "🌸", en: "flower", es: "flor", zh: "花", py: "huā", pl: "kwiat", ru: "цветок" },
  { pic: "🐟", en: "fish", es: "pez", zh: "鱼", py: "yú", pl: "ryba", ru: "рыба" },
  { pic: "🥛", en: "milk", es: "leche", zh: "牛奶", py: "niúnǎi", pl: "mleko", ru: "молоко" },
  { pic: "🍌", en: "banana", es: "plátano", zh: "香蕉", py: "xiāngjiāo", pl: "banan", ru: "банан" },
  { pic: "🥚", en: "egg", es: "huevo", zh: "鸡蛋", py: "jīdàn", pl: "jajko", ru: "яйцо" },
  { pic: "⚽", en: "ball", es: "pelota", zh: "球", py: "qiú", pl: "piłka", ru: "мяч" },
  { pic: "🔑", en: "key", es: "llave", zh: "钥匙", py: "yàoshi", pl: "klucz", ru: "ключ" },
  { pic: "📱", en: "phone", es: "teléfono", zh: "手机", py: "shǒujī", pl: "telefon", ru: "телефон" },
  { pic: "⏰", en: "clock", es: "reloj", zh: "钟", py: "zhōng", pl: "zegar", ru: "часы" },
  { pic: "👟", en: "shoe", es: "zapato", zh: "鞋", py: "xié", pl: "but", ru: "ботинок" },
  { pic: "🍰", en: "cake", es: "pastel", zh: "蛋糕", py: "dàngāo", pl: "ciasto", ru: "торт" },
  { pic: "❤️", en: "heart", es: "corazón", zh: "心", py: "xīn", pl: "serce", ru: "сердце" },
  { pic: "⭐", en: "star", es: "estrella", zh: "星星", py: "xīngxing", pl: "gwiazda", ru: "звезда" }
];
