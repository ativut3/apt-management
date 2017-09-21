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
  var roomModel = [];

  var addToDataModel = function(floorNo, roomNo, details) {
    roomModel.push({
      floor: floorNo,
      room: roomNo,
      price: details.price === undefined ? 0 : details.price,
      status: details.status
    });
  };
  var showOverlay = function() {
    document.getElementById('overlay-container').style.height = '100%';
    document.getElementById('overlay-container').style.zIndex = '10';
  };
  var closeOverlay = function() {
    document.getElementById('overlay-container').style.height = '0%';
  };
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
  var renderRoomCardDom = function(cardId) {
    // select from data model
    var roomNo = cardId.match('-([^;]+)-')[1];
    var filteredModel = roomModel.filter(function(obj) {
      return obj.room === roomNo;
    });
    if (filteredModel.length <= 0) {
      console.log('Something is wrong with the data model.');
      return;
    }
    // we are certain that the result will be just one card
    var roomPrice = filteredModel[0].price.toFixed(2);
    var roomStatus = filteredModel[0].status;

    var roomCardHeader = document.getElementById('room-card-header');
    var roomPriceContainer = document.getElementById('room-price-container');
    //var roomPriceInput = document.getElementById('room-price');
    roomCardHeader.innerHTML = 'Room ' + roomNo;

    // fill in the price
    // https://github.com/google/material-design-lite/issues/1287
    //roomPriceInput.value = roomPrice;
    roomPriceContainer.MaterialTextfield.change(roomPrice);

    // https://stackoverflow.com/questions/35783797/set-material-design-lite-radio-button-option-with-jquery
    if (roomStatus === 'unpaid') {
      var unpaidRadio = document.getElementById('option-unpaid');
      unpaidRadio.parentNode.MaterialRadio.check();
    }
  };
  var addCardOnClickEventListener = function(cardId) {
    var card = document.querySelector('#' + cardId);
    if (card !== null) {
      card.addEventListener('click', function() {
        console.log('Clicked: ' + cardId);
        renderRoomCardDom(cardId);
        showOverlay();
      });
    }
  };
  var renderCardDom = function(floorNumber, cardName, roomInfo) {
    var cardClassName = 'mdl-color--blue-grey-100';
    var cardId = 'room-' + cardName + '-card';
    var price = 2500;
    if (typeof roomInfo !== 'undefined') {
      price = roomInfo.price;
      switch (roomInfo.status) {
        case 'unpaid':
          cardClassName = 'mdl-color--red-100';
          break;
        case 'paid':
          cardClassName = 'mdl-color--green-A200';
          break;
        default: break;
      }
    }
    price = price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    var cardContainer = document.querySelector('#floor' + floorNumber + '-card-container');
    var cardDom = parseHTML(
      '<div id="' + cardId + '" class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp ' + cardClassName + '">' +
        '<div class="mdl-card__title">' +
          '<h3>-' + cardName + '-</h3>' +
        '</div>' +
        '<div class="mdl-card__supporting-text">' +
          '<h2>' + price + ' Baht</h2>' +
        '</div>' +
      '</div>'
    );
    cardContainer.appendChild(cardDom[0]);
    addCardOnClickEventListener(cardId);
  };

  return {
    initDatabase: function() {
      var firebaseRef = firebase.database().ref();
      var roomsRef = firebaseRef.child('rooms');
      var floorsRef = firebaseRef.child('floors');

      Promise.all([
        roomsRef.once('value'),
        floorsRef.once('value')
      ]).then(function(snapshots) {
        var roomsObj = snapshots[0].val();
        var floorsObj = snapshots[1].val();
        var numFloors = Object.keys(floorsObj).length;

        renderFloorHeaderDom(numFloors);
        for (var i = 0; i < numFloors; i++) {
          var floorDataObj = floorsObj['floor' + (i + 1)];
          for (var prop in floorDataObj) {
            if (floorDataObj.hasOwnProperty(prop)) {
              addToDataModel(i + 1, prop, roomsObj[prop]);
              renderCardDom(i + 1, prop, roomsObj[prop]);
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
      var overlayCloseBtn = document.querySelector('#overlay-close-btn');

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
      overlayCloseBtn.addEventListener('click', function() {
        closeOverlay();
      });
    }
  };
})();

App.initDatabase();
App.registerDomEvent();
