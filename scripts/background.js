// API key.
const API_KEY = 'sZzAS6Bh4AyxlhXkVpw8iymVXzTd9yxy';

// Message constants.
const GET_SHARED_DATA = 'GET_SHARED_DATA';
// eslint-disable-next-line no-underscore-dangle
const SHARE_ = 'SHARE_';

// Status constants.
const COMPLETE = 'complete';

// Request patterns.
const likePattern = /^https:\/\/www.instagram.com\/web\/likes\/(\w+)\/like\//;
const unlikePattern = /^https:\/\/www.instagram.com\/web\/likes\/(\w+)\/unlike\//;
const followPattern = /^https:\/\/www.instagram.com\/web\/friendships\/(\w+)\/follow\//;
const unfollowPattern = /^https:\/\/www.instagram.com\/web\/friendships\/(\w+)\/unfollow\//;
const savePattern = /^https:\/\/www.instagram.com\/web\/save\/(\w+)\/save\//;
const unsavePattern = /^https:\/\/www.instagram.com\/web\/save\/(\w+)\/unsave\//;

// Event names.
const LIKE = 'LIKE';
const UNLIKE = 'UNLIKE';
const FOLLOW = 'FOLLOW';
const UNFOLLOW = 'UNFOLLOW';
const SAVE = 'SAVE';
const UNSAVE = 'UNSAVE';

// Instagram URL.
const INSTAGRAM_URL = 'https://www.instagram.com/';
// API endpoint.
const CREATE_IG_LOG_ROUTE = 'https://administration.willinagency.com/api/v3/instagram-logs';
const CHECK_FOLLOWER_ROUTE = 'https://administration.willinagency.com/api/v3/drop-collectors/check-follower';

// Network filter for listen web request.
const networkFilter = {
  urls: ['https://www.instagram.com/*'],
};

// Instagram viewer data.
let viewer;
// Instagram post data.
let post;
// Instagram profile data.
let profile;

/**
 * Make request to Socialpod server.
 * @param {String} eventName
 * @param {Object} requestDetails
 */
const makeRequest = (eventName, requestDetails) => {
  let target;
  let targetId;

  // No viewer information
  if (!viewer) {
    alert('Para que la extensión de Socialpod funcione recarga la página e inicia sesión.');

    return;
  }

  // No post data.
  if (eventName !== FOLLOW && eventName !== UNFOLLOW && !post) {
    alert('Hubo un error, por favor recarga la página y vuelve a realizar la acción.');

    return;
  }
  // No profile data.
  if ((eventName === FOLLOW || eventName === UNFOLLOW) && !profile) {
    alert('Hubo un error, por favor recarga la página y vuelve a realizar la acción.');

    return;
  }

  // Determine target and target ID.
  if (eventName === FOLLOW || eventName === UNFOLLOW) {
    target = 'username';
    targetId = profile.username;
  } else {
    target = 'shortcode';
    targetId = post.shortcode;
  }

  fetch(CREATE_IG_LOG_ROUTE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: API_KEY,
      target,
      targetId,
      username: viewer.username,
      fullName: viewer.full_name,
      ip: requestDetails.ip,
      event: eventName,
    }),
  }).then(res => res.json())
    .then((instagramLog) => {
      // eslint-disable-next-line no-console
      console.log(instagramLog);
    });
};

// Fired when a request is completed..
chrome.webRequest.onCompleted.addListener((details) => {
  const { url } = details;

  // The user likes the post.
  if (likePattern.test(url)) {
    makeRequest(LIKE, details);
  }
  // The user does not like the post.
  if (unlikePattern.test(url)) {
    makeRequest(UNLIKE, details);
  }
  // The user started to follow.
  if (followPattern.test(url)) {
    makeRequest(FOLLOW, details);
  }
  // The user stopped following.
  if (unfollowPattern.test(url)) {
    makeRequest(UNFOLLOW, details);
  }
  // the user saved.
  if (savePattern.test(url)) {
    makeRequest(SAVE, details);
  }
  // The user unsaved.
  if (unsavePattern.test(url)) {
    makeRequest(UNSAVE, details);
  }
}, networkFilter);

// Fired when a message is sent from either an extension process
// (by runtime.sendMessage) or a content script (by tabs.sendMessage).
chrome.runtime.onMessage.addListener((request) => {
  const { event } = request;
  if (event.indexOf(SHARE_) !== -1) {
    makeRequest(event, {});
  }

  if (event === 'check-follower') {
    fetch(CHECK_FOLLOWER_ROUTE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        followsViewer: request.followsViewer,
        id: request.id,
        owner: request.owner,
        user: request.user,
      }),
    }).then(res => res.json())
      .then((dropCollector) => {
        // eslint-disable-next-line no-console
        console.log(dropCollector);
      });
  }
});

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const { url } = tab;
  const { status } = changeInfo;

  if (url.indexOf(INSTAGRAM_URL) !== -1 && status === COMPLETE) {
    // Get Instagram shared data.
    chrome.tabs.sendMessage(tabId, GET_SHARED_DATA, (sharedData) => {
      if (!sharedData) {
        return;
      }

      if (!sharedData.config.viewer) {
        viewer = null;

        return;
      }

      // Set post data.
      if (sharedData.entry_data.PostPage) {
        post = sharedData.entry_data.PostPage[0].graphql.shortcode_media;
      }
      // Set profile data.
      if (sharedData.entry_data.ProfilePage) {
        profile = sharedData.entry_data.ProfilePage[0].graphql.user;
      }

      const { viewer: viewerData } = sharedData.config;
      // Set viewer data.
      viewer = viewerData;
    });
  }
});
