/* ============ custom-mode.js — 個人自訂模式 ============
 * 個人練習／休閒用的數值與抽卡券設定。自訂數值只在單人遊戲套用，
 * 並由 game.js 標成非排行榜場次；抽卡券仍是帳號目前持有的券數。
 */
G.Custom = (() => {
  const DEFAULT = Object.freeze({ on: false, hp: 1, atk: 1, spd: 1, reduction: 0 });
  const LIMITS = Object.freeze({ hp: [0.5, 10], atk: [0.5, 10], spd: [0.5, 3], reduction: [0, 80], tickets: [0, 99999] });

  const number = (value, fallback, min, max) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  /** 讀取時永遠回傳安全值，不會偷偷改掉尚未儲存的舊存檔。 */
  function read(save) {
    const raw = save && save.custom && typeof save.custom === 'object' ? save.custom : {};
    return {
      on: !!raw.on,
      hp: number(raw.hp, DEFAULT.hp, ...LIMITS.hp),
      atk: number(raw.atk, DEFAULT.atk, ...LIMITS.atk),
      spd: number(raw.spd, DEFAULT.spd, ...LIMITS.spd),
      reduction: number(raw.reduction, DEFAULT.reduction, ...LIMITS.reduction)
    };
  }

  /** 將表單資料正規化後寫入存檔。 */
  function update(save, values) {
    if (!save) return DEFAULT;
    const prev = read(save);
    const next = {
      on: values.on == null ? prev.on : !!values.on,
      hp: number(values.hp, prev.hp, ...LIMITS.hp),
      atk: number(values.atk, prev.atk, ...LIMITS.atk),
      spd: number(values.spd, prev.spd, ...LIMITS.spd),
      reduction: number(values.reduction, prev.reduction, ...LIMITS.reduction)
    };
    save.custom = next;
    return next;
  }

  /** 直接設定目前的單抽與十連券數量，限定合理上限。 */
  function setTickets(save, t1, t10) {
    if (!save) return;
    save.tickets = save.tickets || {};
    save.tickets.t1 = Math.round(number(t1, 0, ...LIMITS.tickets));
    save.tickets.t10 = Math.round(number(t10, 0, ...LIMITS.tickets));
  }

  /** 將自訂值疊加在原本的寶可夢、永久升級與局內升級上。 */
  function apply(player, config) {
    if (!player || !config || !config.on) return false;
    player.maxHp *= config.hp;
    player.hp = player.maxHp;
    player.atkMul *= config.atk;
    player.spdMul *= config.spd;
    player.dmgReduce = Math.min(0.8, player.dmgReduce + config.reduction / 100);
    player.customMode = true;
    return true;
  }

  return { DEFAULT, LIMITS, read, update, setTickets, apply, active: save => read(save).on };
})();
