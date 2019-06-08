// Message constants.

const GET_SHARED_DATA = 'GET_SHARED_DATA';

// Share event names.

const SHARE_FACEBOOK = 'SHARE_FACEBOOK';
const SHARE_MESSENGER = 'SHARE_MESSENGER';
const SHARE_TWITTER = 'SHARE_TWITTER';
const SHARE_MAIL = 'SHARE_MAIL';
const SHARE_LINK = 'SHARE_LINK';

/**
 * Emit share event.
 * @param {String} shareEvent
 */
const emitShare = (shareEvent) => {
  chrome.runtime.sendMessage({ event: shareEvent });
};

// Capture share button element.

const shareIcon = document.querySelector('[class^="glyphsSpriteShare"]');
if (shareIcon) {
  const shareButton = shareIcon.parentElement;

  shareButton.addEventListener('click', () => {
    setTimeout(() => {
      // Set share buttons.

      const facebookIcon = document.querySelector('[class^="glyphsSpriteFacebook"]');
      const facebookButton = facebookIcon.parentElement.parentElement.parentElement;
      const messengerIcon = document.querySelector('[class^="glyphsSpriteApp_messenger"]');
      const messengerButton = messengerIcon.parentElement.parentElement.parentElement;
      const twitterIcon = document.querySelector('[class^="glyphsSpriteApp_twitter"]');
      const twitterButton = twitterIcon.parentElement.parentElement.parentElement;
      const mailIcon = document.querySelector('[class^="glyphsSpriteMail"]');
      const mailButton = mailIcon.parentElement.parentElement.parentElement;
      const linkIcon = document.querySelector('[class^="glyphsSpriteLink"]');
      const linkButton = linkIcon.parentElement.parentElement.parentElement;

      facebookButton.addEventListener('click', () => {
        emitShare(SHARE_FACEBOOK);
      });
      messengerButton.addEventListener('click', () => {
        emitShare(SHARE_MESSENGER);
      });
      twitterButton.addEventListener('click', () => {
        emitShare(SHARE_TWITTER);
      });
      mailButton.addEventListener('click', () => {
        emitShare(SHARE_MAIL);
      });
      linkButton.addEventListener('click', () => {
        emitShare(SHARE_LINK);
      });
    }, 500);
  });
}

/**
 * Check follower.
 */
const checkFollower = (sharedData) => {
  const urlParams = new URLSearchParams(window.location.search);
  const dropCollector = urlParams.get('dropCollector');

  if (!dropCollector || !sharedData) {
    return;
  }

  // Extract viewer and owner.
  const { viewer } = sharedData.config;
  const profilePage = sharedData.entry_data.ProfilePage[0].graphql.user;

  chrome.runtime.sendMessage({
    event: 'check-follower',
    id: dropCollector,
    owner: viewer.username,
    user: profilePage.username,
    followsViewer: profilePage.follows_viewer,
  });

  window.close();
};

// Fired when a message is sent from either an extension process
// (by runtime.sendMessage) or a content script (by tabs.sendMessage).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === GET_SHARED_DATA) {
    window.addEventListener(`${chrome.runtime.id}-config`, (event) => {
      checkFollower(event.detail);
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
