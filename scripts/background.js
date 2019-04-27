// Message constants.
const GET_SHARED_DATA = 'GET_SHARED_DATA';

// Status constants.
const COMPLETE = 'complete';

// Request patterns.
const likePattern = /^https:\/\/www.instagram.com\/web\/likes\/(\w+)\/like\//;
const unlikePattern = /^https:\/\/www.instagram.com\/web\/likes\/(\w+)\/unlike\//;
const followPattern = /^https:\/\/www.instagram.com\/web\/friendships\/(\w+)\/follow\//;
const unfollowPattern = /^https:\/\/www.instagram.com\/web\/friendships\/(\w+)\/unfollow\//;

// Event names.
const LIKE = 'LIKE';
const UNLIKE = 'UNLIKE';
const FOLLOW = 'FOLLOW';
const UNFOLLOW = 'UNFOLLOW';

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
 * @param {Object} viewerData
 * @param {Object} requestDetails
 */
const makeRequest = (eventName, viewerData, requestDetails) => {
  // No viewer information
  if (!viewerData) {
    alert('Para que la extensión de Socialpod funcione recarga la página e inicia sesión.');

    return;
  }

  console.log('Make request to Soclalpod.');
  console.log(eventName, viewerData, requestDetails);
};

// Fired when a request is completed..
chrome.webRequest.onCompleted.addListener((details) => {
  const { url } = details;

  // The user likes the post.
  if (likePattern.test(url)) {
    makeRequest(LIKE, viewer, details);
  }
  // The user does not like the post.
  if (unlikePattern.test(url)) {
    makeRequest(UNLIKE, viewer, details);
  }
  // The user started to follow.
  if (followPattern.test(url)) {
    makeRequest(FOLLOW, viewer, details);
  }
  // The user stopped following.
  if (unfollowPattern.test(url)) {
    makeRequest(UNFOLLOW, viewer, details);
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
