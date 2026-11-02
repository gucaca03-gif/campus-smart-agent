// 模拟浏览器环境，动态加载 app.js 模块链，定位白屏根因
const els = {};
function makeEl() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    remove() {},
    setAttribute() {},
    getAttribute: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
    innerHTML: "",
    textContent: "",
    value: "",
    style: {},
    dataset: {},
    hidden: false,
    focus() {},
    files: [],
    dispatchEvent() {},
  };
}
globalThis.document = {
  getElementById: (id) => (els[id] ||= makeEl()),
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  createElement: () => makeEl(),
  body: makeEl(),
  title: "",
};
globalThis.window = {
  addEventListener() {},
  location: { hash: "#/home", origin: "http://127.0.0.1:5600" },
  open() {},
};
globalThis.location = window.location;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({ ok: true, data: {} }),
  text: async () => "",
});

const base = "file:///" + process.cwd().replaceAll("\\", "/") + "/app.js";
try {
  await import(base);
  console.log("PASS: app.js 模块链加载成功，无顶层错误");
} catch (e) {
  console.error("FAIL: 模块链加载错误 ->", e.message);
  console.error("堆栈:", (e.stack || "").split("\n").slice(0, 6).join("\n"));
  process.exitCode = 1;
}