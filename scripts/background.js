// Message constants.
const GET_SHARED_DATA = 'GET_SHARED_DATA';

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
  // No viewer information
  if (!viewer) {
    alert('Para que la extensión de Socialpod funcione recarga la página e inicia sesión.');

    return;
  }

  console.log('Make request to Soclalpod.');
  console.log(eventName, viewer, requestDetails);
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
