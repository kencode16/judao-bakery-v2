// C 測試用關卡（不是正式關卡）：index.html?screen=level&test=<名稱>&nosw
// 每種機制一關，方便截圖檢查；過關時不寫存檔，解鎖卡直接用 unlocks 示範。
import { DESSERTS } from '../data/desserts.js';
const SIX = ['croissant', 'macaron', 'pineapplecake', 'eggtart', 'donut', 'shortcake'];
const base = { cols: 7, mask: null, counts: null, newDessert: null, unlocks: [], slide: 'none', icing: [], jam: [], gifts: [], orders: null, pairing: false, tip: null };

export const TEST_LEVELS = {
  // 基本＋開店禮 6 張解鎖卡
  basic: { ...base, id: 1, region: 'fr', rows: 4, kinds: SIX, unlocks: SIX, tip: 'basic', seed: 1001 },
  // B 造型盤面＋新甜點
  mask: { ...base, id: 3, region: 'fr', rows: 6, kinds: ['croissant', 'macaron', 'eggtart', 'donut', 'shortcake', 'eclair'],
    mask: ['#.....#', '.......', '.......', '#.....#', '##...##', '###.###'], newDessert: 'eclair', unlocks: ['eclair'], tip: 'shape', shapeName: '愛心盤', seed: 31 },
  // A 滑動補位（往下）
  slide: { ...base, id: 12, region: 'tw', rows: 5, kinds: ['croissant', 'macaron', 'pineapplecake', 'eggtart', 'donut', 'shortcake'],
    slide: 'down', tip: 'slide', newDessert: 'suncake', unlocks: ['suncake'], seed: 1201 },
  slideleft: { ...base, id: 13, region: 'tw', rows: 6, kinds: SIX, slide: 'left', tip: 'slide', seed: 1301,
    mask: ['.......', '...#...', '.......', '.......', '...#...', '.......'] },
  // C 糖霜磚
  icing: { ...base, id: 21, region: 'se', rows: 5, kinds: SIX, icing: [[1, 1], [1, 5], [3, 3]], tip: 'icing', seed: 2101 },
  // C 果醬
  jam: { ...base, id: 22, region: 'se', rows: 6, kinds: SIX, jam: [[0, 0], [0, 6], [2, 3], [3, 3], [5, 1], [5, 5]], tip: 'jam', seed: 2201 },
  // C 禮盒＋鑰匙
  gift: { ...base, id: 23, region: 'se', rows: 6, kinds: SIX, gifts: [[0, 3], [2, 1], [2, 5], [5, 3]], tip: 'gift', seed: 2301 },
  // E 點單
  order: { ...base, id: 31, region: 'us', rows: 6, kinds: SIX, tip: 'order', seed: 3101,
    orders: [[{ kind: 'croissant', n: 2 }, { kind: 'macaron', n: 1 }], [{ kind: 'eggtart', n: 2 }], [{ kind: 'donut', n: 1 }, { kind: 'shortcake', n: 1 }]] },
  // D 甜點配飲品
  pairing: { ...base, id: 10, region: 'fr', rows: 4, kinds: ['croissant', 'macaron', 'eggtart', 'donut'], pairing: true, tip: 'pairing', seed: 1010 },
  // 最大盤面 8 列（版面檢查）
  big: { ...base, id: 48, region: 'jp', rows: 8, kinds: ['croissant', 'macaron', 'pineapplecake', 'eggtart', 'donut', 'shortcake', 'matcharoll', 'baguette'],
    slide: 'up', seed: 4801, orders: null },
  // 種類很多、很容易卡死（測自動重排）
  stuck: { ...base, id: 49, region: 'jp', rows: 8, seed: 4901, kinds: DESSERTS.slice(0, 28).map(d => d.id) },
  // v2「中」：限時（9 列、往下掉）、限時點單、往中間、輪流換方向（後兩種要等引擎支援 center／cycle）
  timed: { ...base, id: 12, region: 'tw', rows: 9, kinds: SIX, slide: 'down', tip: 'slide', timeLimit: 90, seed: 1202 },
  timedorder: { ...base, id: 32, region: 'us', rows: 8, kinds: SIX, tip: 'order', timeLimit: 60, seed: 3201,
    orders: [[{ kind: 'croissant', n: 2 }, { kind: 'macaron', n: 1 }], [{ kind: 'eggtart', n: 2 }], [{ kind: 'donut', n: 1 }]] },
  center: { ...base, id: 33, region: 'us', rows: 9, kinds: SIX, slide: 'center', tip: 'center', timeLimit: 120, seed: 3301 },
  cycle: { ...base, id: 41, region: 'jp', rows: 9, kinds: SIX, slide: 'cycle', tip: 'cycle', timeLimit: 120, seed: 4101 },
};
