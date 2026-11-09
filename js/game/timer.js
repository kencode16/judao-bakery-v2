// 「中」限時關的倒數計時（v2，2026-11-09）。只有 levelDef 有 timeLimit 時才會用到；「易」完全不經過這裡。
// 時間一律用 now()（performance.now() 為底）重新算「已經用掉多少」，不靠 setInterval 一秒一秒累加。
// 暫停用「理由」記：暫停選單、今日菜單、切到背景、自動重排動畫…只要還有一個理由在，時間就不走。

export const LOW_RATIO = 0.3;    // 剩不到三成：轉金色、熄一顆星
export const FINAL_SEC = 10;     // 最後 10 秒：粉紅脈動、每秒滴答

/** 毫秒 → m:ss（無條件進位：還剩 0.3 秒顯示 0:01，到 0 才是 0:00） */
export function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000 - 1e-6));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 純邏輯倒數（不碰 DOM）：start、hold/release、stop、update() 每一幀呼叫 */
export class Countdown {
  /**
   * @param limitSec 限時（秒）
   * @param opts { now(): 毫秒, onLow(rem), onSecond(sec, rem), onTimeUp() }
   */
  constructor(limitSec, opts = {}) {
    this.limit = Math.max(1, Number(limitSec) || 0) * 1000;
    this.now = opts.now || (() => performance.now());
    this.cb = opts;
    this.used = 0;          // 之前幾段已經用掉的毫秒
    this.since = null;      // 目前這一段從什麼時候開始走（null＝停著）
    this.started = false;
    this.done = false;      // 時間到，或過關後凍結
    this.holds = new Map(); // 暫停理由 → 次數
    this.low = false;
    this.lastSec = null;
  }
  get running() { return this.started && !this.done && this.holds.size === 0; }
  elapsed() { return this.used + (this.since != null ? this.now() - this.since : 0); }
  remaining() { return Math.max(0, this.limit - this.elapsed()); }
  ratio() { return this.remaining() / this.limit; }

  /** 依目前狀態，開始或結束「這一段」 */
  _sync() {
    const run = this.running;
    if (run && this.since == null) this.since = this.now();
    else if (!run && this.since != null) { this.used += this.now() - this.since; this.since = null; }
  }
  start() { if (this.started) return; this.started = true; this._sync(); this.update(); }
  hold(reason) { this.holds.set(reason, (this.holds.get(reason) || 0) + 1); this._sync(); }
  release(reason) {
    const n = (this.holds.get(reason) || 0) - 1;
    if (n > 0) this.holds.set(reason, n); else this.holds.delete(reason);
    this._sync();
  }
  /** 開關型的理由（例如切到背景）：on＝暫停 */
  setHeld(reason, on) { if (on) this.holds.set(reason, 1); else this.holds.delete(reason); this._sync(); }
  isHeld(reason) { return reason ? this.holds.has(reason) : this.holds.size > 0; }
  /** 正在走的這一段跳過 ms（裝置睡著、沒收到 visibilitychange 時的保險）。
   *  最多跳到「現在」：這一段如果是剛剛才開始的（例如剛從背景回來），不會反而多送時間 */
  skip(ms) { if (this.since != null && ms > 0) this.since = Math.min(this.now(), this.since + ms); }
  /** 過關：把時間凍結在這一刻 */
  stop() { if (this.done) return; this.update(); this.done = true; this._sync(); }
  /** 測試用：直接把剩餘時間設成 sec 秒 */
  setRemaining(sec) {
    this.used = this.limit - Math.max(0, sec) * 1000;
    if (this.since != null) this.since = this.now();
    if (sec * 1000 >= this.limit * LOW_RATIO) this.low = false;
    return this.update();
  }

  /** 每一幀呼叫：回傳剩餘毫秒；越過三成、換秒、時間到時通知 */
  update() {
    const rem = this.remaining();
    if (this.done) return rem;
    if (!this.low && rem < this.limit * LOW_RATIO) { this.low = true; this.cb.onLow && this.cb.onLow(rem); }
    const sec = Math.max(0, Math.ceil(rem / 1000 - 1e-6));
    if (sec !== this.lastSec) {
      const first = this.lastSec == null;
      this.lastSec = sec;
      if (!first && this.started) this.cb.onSecond && this.cb.onSecond(sec, rem);
    }
    if (rem <= 0 && this.started) {
      this.done = true; this._sync();
      this.cb.onTimeUp && this.cb.onTimeUp();
    }
    return rem;
  }
}

/** 倒數條的 HTML（HUD 和教學卡的示意圖共用） */
export function timerBarHTML(ratio = 1, text = '') {
  return `<span class="g-tbar"><i style="width:${Math.max(0, Math.min(1, ratio)) * 100}%"></i>` +
    `<em class="g-tmark" style="left:${LOW_RATIO * 100}%">★</em></span><span class="g-ttime">${text}</span>`;
}

/** HUD 上的倒數：細長條＋m:ss。剩三成以下金色、最後 10 秒粉紅脈動 */
export class TimerHud {
  constructor(el, limitSec) {
    this.el = el;
    this.limit = limitSec * 1000;
    el.innerHTML = timerBarHTML(1, fmtTime(this.limit));
    el.setAttribute('role', 'timer');
    this.fill = el.querySelector('.g-tbar i');
    this.mark = el.querySelector('.g-tmark');
    this.text = el.querySelector('.g-ttime');
    this.last = { p: -1, t: '', st: '' };
  }
  render(rem) {
    const p = Math.round(Math.max(0, Math.min(1, rem / this.limit)) * 1000) / 1000;
    if (p !== this.last.p) { this.last.p = p; this.fill.style.width = `${p * 100}%`; }   // 用寬度不用 scaleX：圓頭才不會被壓扁
    const t = fmtTime(rem);
    if (t !== this.last.t) { this.last.t = t; this.text.textContent = t; this.el.setAttribute('aria-label', `剩下 ${t}`); }
    const st = rem <= 0 ? 'out' : rem <= FINAL_SEC * 1000 + 1e-6 ? 'final' : rem < this.limit * LOW_RATIO ? 'low' : 'ok';
    if (st !== this.last.st) {
      this.last.st = st;
      this.el.classList.toggle('g-low', st !== 'ok');
      this.el.classList.toggle('g-final', st === 'final');
      this.el.classList.toggle('g-out', st === 'out');
    }
  }
  /** 最後 10 秒每秒輕輕跳一下（跟滴答聲同步） */
  pulse() {
    try {
      this.text.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)', offset: 0.3 }, { transform: 'scale(1)' }],
        { duration: 450, easing: 'ease-out' });
    } catch (e) { /* 不支援動畫就算了 */ }
  }
  /** 熄星那一刻，倒數條上的小星星也暗下來 */
  dropMark() {
    try {
      this.mark.animate([{ transform: 'translate(-50%,-50%) scale(1.5)' }, { transform: 'translate(-50%,-50%) scale(1)' }],
        { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    } catch (e) { /* 忽略 */ }
  }
}
