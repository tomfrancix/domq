import { Window } from 'happy-dom';

export function createDom(html = '<!doctype html><html><head></head><body></body></html>') {
  const win = new Window({ url: 'https://example.test/' });
  const doc = win.document;

  doc.write(html);
  doc.close();

  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    Node: globalThis.Node,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    ShadowRoot: globalThis.ShadowRoot,
    HTMLSlotElement: globalThis.HTMLSlotElement,
    getComputedStyle: globalThis.getComputedStyle,
  };

  globalThis.window = win;
  globalThis.document = doc;
  globalThis.Node = win.Node;
  globalThis.Element = win.Element;
  globalThis.HTMLElement = win.HTMLElement;
  globalThis.ShadowRoot = win.ShadowRoot;
  globalThis.HTMLSlotElement = win.HTMLSlotElement;
  globalThis.getComputedStyle = win.getComputedStyle.bind(win);

  return {
    window: win,
    document: doc,
    cleanup() {
      globalThis.window = prev.window;
      globalThis.document = prev.document;
      globalThis.Node = prev.Node;
      globalThis.Element = prev.Element;
      globalThis.HTMLElement = prev.HTMLElement;
      globalThis.ShadowRoot = prev.ShadowRoot;
      globalThis.HTMLSlotElement = prev.HTMLSlotElement;
      globalThis.getComputedStyle = prev.getComputedStyle;
    }
  };
}
