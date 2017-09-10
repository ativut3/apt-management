/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
 /* global firebase */
/* eslint-env browser */
/* eslint max-len: [0, 150, 4] */
var App = (function() {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  }

  // Your custom JavaScript goes here
  var parseHTML = function(str) {
    var tmp = document.implementation.createHTMLDocument();
    tmp.body.innerHTML = str;
    return tmp.body.children;
  };
  var linkHandler = function(element) {
    var previousActiveElement = document.querySelector('.mdl-navigation__link--current');
    if (previousActiveElement !== null) {
      previousActiveElement.classList.remove('mdl-navigation__link--current');
    }
    element.classList.add('mdl-navigation__link--current');
  };

  var renderFloorHeaderDom = function(numFloors) {
    var rootContainer = document.querySelector('.mdl-layout__content');
    rootContainer.innerHTML = '';
    for (var i = 0; i < numFloors; i++) {
      var floorDom = parseHTML(
        '<div id="floor' + (i + 1) + '-header" class="mdl-grid">' +
          '<div class="mdl-cell mdl-cell--12-col mdl-color--grey">' +
            '<h2 class="mdl-typography--title mdl-typography--text-center">Floor ' + (i + 1) + '</h2>' +
          '</div>' +
        '</div>' +
        '<div id="floor' + (i + 1) + '-card-container" class="mdl-grid">' +
        '</div>'
      );
      var cnt = 0;
      while (floorDom.length > 0) {
        rootContainer.appendChild(floorDom[cnt]);
      }
    }
  };
  var renderCardDom = function(cardName) {
    console.log(cardName);
  };

  return {
    initDatabase: function() {
      var firebaseRef = firebase.database().ref();
      var roomsRef = firebaseRef.child('rooms');
      var floorsRef = firebaseRef.child('floors');

      roomsRef.on('value', function(snapshot) {
        console.log(snapshot.val());
      });

      floorsRef.once('value', function(snapshot) {
        var floorsObj = snapshot.val();
        var numFloors = Object.keys(floorsObj).length;

        renderFloorHeaderDom(numFloors);
        for (var i = 0; i < numFloors; i++) {
          var floorDataObj = floorsObj['floor' + (i + 1)];
          for (var prop in floorDataObj) {
            if (floorDataObj.hasOwnProperty(prop)) {
              renderCardDom(prop);
            }
          }
        }
      });
    },
    registerDomEvent: function() {
      var showAllElement = document.querySelector('#linkShowAll');
      var paidElement = document.querySelector('#linkPaid');
      var unpaidElement = document.querySelector('#linkUnpaid');
      var unbilledElement = document.querySelector('#linkUnbilled');

      showAllElement.addEventListener('click', function() {
        linkHandler(showAllElement);
      });
      paidElement.addEventListener('click', function() {
        linkHandler(paidElement);
      });
      unpaidElement.addEventListener('click', function() {
        linkHandler(unpaidElement);
      });
      unbilledElement.addEventListener('click', function() {
        linkHandler(unbilledElement);
      });
    }
  };
})();

App.initDatabase();
App.registerDomEvent();
