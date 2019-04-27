// Message constants.
const GET_SHARED_DATA = 'GET_SHARED_DATA';

// Fired when a message is sent from either an extension process
// (by runtime.sendMessage) or a content script (by tabs.sendMessage).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === GET_SHARED_DATA) {
    window.addEventListener(`${chrome.runtime.id}-config`, (event) => {
      sendResponse(event.detail);
    }, { once: true });
    window.dispatchEvent(new Event(chrome.runtime.id));
  }
});

/**
 * Extracts Instagram shared data.
 * @param {String} runtimeId
 */
const sharedDataExtractor = (runtimeId) => {
  window.addEventListener(runtimeId, () => {
    window.dispatchEvent(new CustomEvent(`${runtimeId}-config`, {
      // eslint-disable-next-line no-underscore-dangle
      detail: window._sharedData,
    }));
  });
};

/**
 * Inject script on Instagram page.
 * @param fn
 */
const injectScript = (fn) => {
  const script = document.createElement('script');
  script.setAttribute('id', 'socialpod-extension');
  document.head.appendChild(script).text = `((...args) => (${fn})(...args))(${JSON.stringify(chrome.runtime.id)})`;
  script.remove();
};

injectScript(sharedDataExtractor);
