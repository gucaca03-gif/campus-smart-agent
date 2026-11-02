// 逐个加载模块，定位语法错误所在文件
const files = [
  "api.js", "ui.js", "views/home.js", "views/home-detail.js", "views/work.js",
  "views/life.js", "views/self.js", "views/self-control.js", "views/assistant.js",
  "views/me.js", "views/admin.js", "views/office.js",
];
const els = {};
function makeEl() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, appendChild() {}, remove() {}, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, focus() {}, files: [],
    setAttribute() {}, getAttribute: () => null, querySelectorAll: () => [], querySelector: () => null, dispatchEvent() {},
  };
}
globalThis.document = { getElementById: (id) => (els[id] ||= makeEl()), querySelector: () => makeEl(), querySelectorAll: () => [], createElement: () => makeEl(), body: makeEl(), title: "" };
globalThis.window = { addEventListener() {}, location: { hash: "#/home" }, open() {} };
globalThis.location = window.location;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true, data: {} }), text: async () => "" });

for (const f of files) {
  try {
    await import("file:///" + process.cwd().replaceAll("\\", "/") + "/" + f);
    console.log("OK  ", f);
  } catch (e) {
    console.log("FAIL", f, "->", e.message.slice(0, 90));
  }
}