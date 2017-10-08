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
 /* global firebase, $ */
/* eslint-env browser */
/* eslint max-len: [0, 150, 4] */
/* eslint new-cap: [2, {capIsNew: false}] */
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
  var rooms = [];
  var currentActiveCard = null;
  var tmpData = {};
  var filterMode = 'linkShowAll';

  var addToDataModel = function(floorNo, roomNo, details) {
    roomModel.push({
      floor: floorNo,
      room: roomNo,
      price: details.price === undefined ? 0 : details.price,
      status: details.status,
      paymentMethod: details.paymentMethod,
      payDate: details.payDate
    });
  };
  var clearDataModel = function() {
    roomModel.length = 0;
  };
  var showOverlay = function() {
    document.getElementById('overlay-container').style.height = '100%';
    document.getElementById('overlay-container').style.zIndex = '10';
  };
  var closeOverlay = function() {
    document.getElementById('overlay-container').style.height = '0%';
  };
  var updateNavigationDrawerView = function(element) {
    var previousActiveElement = document.querySelector('.mdl-navigation__link--current');
    if (previousActiveElement !== null) {
      previousActiveElement.classList.remove('mdl-navigation__link--current');
    }
    element.classList.add('mdl-navigation__link--current');
  };
  var closeDrawer = function() {
    var drawer = document.querySelector('.mdl-layout');
    drawer.MaterialLayout.toggleDrawer();
  };
  var parseHTML = function(str) {
    var tmp = document.implementation.createHTMLDocument();
    tmp.body.innerHTML = str;
    return tmp.body.children;
  };
  var copyToTempModel = function() {
    tmpData.room = currentActiveCard.room;
    tmpData.floor = currentActiveCard.floor;
    tmpData.price = currentActiveCard.price;
    tmpData.status = currentActiveCard.status;
    tmpData.paymentMethod = currentActiveCard.paymentMethod;
    tmpData.payDate = currentActiveCard.payDate;
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
    currentActiveCard = filteredModel[0];
    copyToTempModel();
    var roomPrice = filteredModel[0].price.toFixed(2);
    var roomStatus = filteredModel[0].status;
    var roomPaymentMethod = filteredModel[0].paymentMethod;
    var roomPayDate = filteredModel[0].payDate;

    var roomCardHeader = document.getElementById('room-card-header');
    var roomPriceContainer = document.getElementById('room-price-container');
    roomCardHeader.innerHTML = 'Room ' + roomNo;

    // fill in the price
    // https://github.com/google/material-design-lite/issues/1287
    roomPriceContainer.MaterialTextfield.change(roomPrice);

    // https://stackoverflow.com/questions/35783797/set-material-design-lite-radio-button-option-with-jquery
    var paymentMethodContainer = document.querySelector('.payment-method-container');
    var datePaidContainer = document.getElementById('date-paid-container');

    var today = new Date();
    var todayString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    datePaidContainer.MaterialTextfield.change(todayString);

    if (roomStatus === 'unpaid') {
      var unpaidRadio = document.getElementById('option-unpaid');
      unpaidRadio.parentNode.MaterialRadio.check();

      paymentMethodContainer.style.display = 'none';
      datePaidContainer.style.display = 'none';
    } else if (roomStatus === 'paid') {
      var paidRadio = document.getElementById('option-paid');
      paidRadio.parentNode.MaterialRadio.check();

      paymentMethodContainer.style.display = 'block';
      datePaidContainer.style.display = 'block';
      // map payment method
      document.getElementById('scb').classList.add('grayscale');
      document.getElementById('bbl').classList.add('grayscale');
      document.getElementById('kbank').classList.add('grayscale');
      document.getElementById('cash').classList.add('grayscale');
      if (roomPaymentMethod === undefined) {
        document.getElementById('scb').classList.add('grayscale');
        document.getElementById('bbl').classList.add('grayscale');
        document.getElementById('kbank').classList.add('grayscale');
        document.getElementById('cash').classList.remove('grayscale');
      } else {
        document.getElementById(roomPaymentMethod).classList.remove('grayscale');
      }
      // map pay date
      if (roomPayDate !== undefined) {
        datePaidContainer.MaterialTextfield.change(roomPayDate);
      }
    } else if (roomStatus === 'unbilled') {
      var unbilledRadio = document.getElementById('option-unbilled');
      unbilledRadio.parentNode.MaterialRadio.check();

      paymentMethodContainer.style.display = 'none';
      datePaidContainer.style.display = 'none';
    }
  };
  var addCardOnClickEventListener = function(cardId) {
    var card = document.querySelector('#' + cardId);
    if (card !== null) {
      card.addEventListener('click', function() {
        renderRoomCardDom(cardId);
        showOverlay();
      });
    }
  };
  var renderFloorHeaderDom = function(numFloors) {
    var rootContainer = document.querySelector('.mdl-layout__content');
    rootContainer.innerHTML = '';
    for (var i = 0; i < numFloors; i++) {
      var floorDom = parseHTML(
        '<div id="floor' + (i + 1) + '-header" class="mdl-grid">' +
          '<div class="mdl-cell mdl-cell--12-col mdl-color--indigo">' +
            '<h2 class="mdl-color-text--blue-grey-50 mdl-typography--title mdl-typography--text-center">Floor ' + (i + 1) + '</h2>' +
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
  var renderCardDom = function(floorNumber, cardName, roomInfo) {
    var cardClassName = 'unbilled-background';
    var iconClassName = 'icon mdi mdi-email mdl-color-text--light-blue-A400';
    var priceIconName = 'icon mdi mdi-cash-usd';
    var cardId = 'room-' + cardName + '-card';
    var price = 2500;
    if (typeof roomInfo !== 'undefined') {
      price = roomInfo.price;
      switch (roomInfo.status) {
        case 'unpaid':
          // cardClassName = 'mdl-color--red-100';
          cardClassName = 'unpaid-background';
          iconClassName = 'icon mdi mdi-email-alert mdl-color-text--red-600';
          break;
        case 'paid':
          // cardClassName = 'mdl-color--green-100';
          cardClassName = 'paid-background';
          iconClassName = 'icon mdi mdi-email-secure mdl-color-text--green-400';
          break;
        case 'unbilled':
          // cardClassName = 'mdl-color--light-blue-100';
          cardClassName = 'unbilled-background';
          iconClassName = 'icon mdi mdi-email mdl-color-text--light-blue-A400';
          break;
        default: break;
      }
    }
    price = price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    var cardContainer = document.querySelector('#floor' + floorNumber + '-card-container');
    var cardDom = parseHTML(
      '<div id="' + cardId + '" class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--2-col-phone mdl-card mdl-shadow--2dp ' + cardClassName + '">' +
        '<div class="mdl-color-text--blue-grey-900 mdl-card__title">' +
          '<h4>-' + cardName + '-</h4>' +
        '</div>' +
        '<div class="mdl-card__supporting-text" style="padding-left: 5px;">' +
          '<div class="mdl-typography--text-center">' +
            '<i class="' + priceIconName + '"></i>' +
            '<h4>' + price + '</h4>' +
          '</div>' +
        '</div>' +
        '<div class="mdl-card__menu">' +
          '<i class="' + iconClassName + '"></i>' +
        '</div>' +
      '</div>'
    );
    cardContainer.appendChild(cardDom[0]);
    addCardOnClickEventListener(cardId);
  };
  var linkHandler = function(element) {
    updateNavigationDrawerView(element);
    var filterId = element.id;
    var filteredStatusModel = [];
    var filteredFloors = [];
    if (filterId === 'linkPaid') {
      filteredStatusModel = roomModel.filter(function(obj) {
        return obj.status === 'paid';
      });
    } else if (filterId === 'linkShowAll') {
      filteredStatusModel = roomModel;
    } else if (filterId === 'linkUnpaid') {
      filteredStatusModel = roomModel.filter(function(obj) {
        return obj.status === 'unpaid';
      });
    } else if (filterId === 'linkUnbilled') {
      filteredStatusModel = roomModel.filter(function(obj) {
        return obj.status === 'unbilled';
      });
    }
    var i;
    for (i = 0; i < filteredStatusModel.length; i++) {
      if (filteredFloors.indexOf(filteredStatusModel[i].floor) < 0) {
        filteredFloors.push(filteredStatusModel[i].floor);
      }
    }
    renderFloorHeaderDom(5);
    for (i = 0; i < filteredStatusModel.length; i++) {
      var roomNumber = filteredStatusModel[i].room;
      var floorNumber = filteredStatusModel[i].floor;
      renderCardDom(floorNumber, roomNumber, filteredStatusModel[i]);
    }

    // after click, close drawer
    closeDrawer();
  };
  var renderLedgerTable = function() {
    var filteredStatusModel = [];
    var rootContainer = document.querySelector('.mdl-layout__content');
    rootContainer.innerHTML = '';
    var tableDom = parseHTML(
      '<div id="ledger-table-container">' +
        '<table id="ledgerTable" class="mdl-data-table" cellspacing="0" width="100%">' +
        '</table>' +
      '</div>'
    );
    rootContainer.appendChild(tableDom[0]);

    filteredStatusModel = roomModel.filter(function(obj) {
      return obj.status === 'paid';
    });

    $('#ledgerTable').DataTable({
      data: filteredStatusModel,
      columns: [
        {
          title: 'Room',
          data: 'room'
        },
        {
          title: 'Price (Baht)',
          data: 'price',
          render: $.fn.dataTable.render.number(',', '.', 2)
        },
        {
          title: 'Pay Date',
          data: 'payDate',
          render: $.fn.dataTable.render.moment('ll')
        },
        {
          title: 'Pay Method',
          data: 'paymentMethod',
          orderable: false,
          render: function(data) {
            if (data === 'cash') {
              return '<img src="images/cash.png" width="30" height="30">';
            } else if (data === 'scb') {
              return '<img src="images/SCB.png" width="30" height="30">';
            } else if (data === 'kbank') {
              return '<img src="images/kbank.png" width="30" height="30">';
            } else if (data === 'bbl') {
              return '<img src="images/BBL.png" width="30" height="30">';
            }
          }
        }
      ]
    });
  };
  var switchToLedgerView = function(element) {
    updateNavigationDrawerView(element);
    renderLedgerTable();
    closeDrawer();
  };
  var radioHandler = function(event) {
    var changedValue = event.currentTarget.value;
    var paymentMethodContainer = document.querySelector('.payment-method-container');
    var datePaidContainer = document.getElementById('date-paid-container');
    var paymentMethod = tmpData.paymentMethod;
    var payDate = tmpData.payDate;
    tmpData.status = changedValue;
    if (changedValue === 'paid') {
      paymentMethodContainer.style.display = 'block';
      datePaidContainer.style.display = 'block';
      if (payDate === undefined) {
        var today = new Date();
        var todayString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
        tmpData.payDate = todayString;
      }
      if (paymentMethod === undefined) {
        tmpData.paymentMethod = 'cash';
        document.getElementById('scb').classList.add('grayscale');
        document.getElementById('bbl').classList.add('grayscale');
        document.getElementById('kbank').classList.add('grayscale');
        document.getElementById('cash').classList.remove('grayscale');
      } else {
        document.getElementById(paymentMethod).classList.remove('grayscale');
      }
    } else {
      paymentMethodContainer.style.display = 'none';
      datePaidContainer.style.display = 'none';
    }
  };
  var paymentMethodClickHandler = function(event) {
    var paymentMethodId = event.currentTarget.id;
    document.getElementById(paymentMethodId).classList.remove('grayscale');
    if (paymentMethodId === 'scb') {
      tmpData.paymentMethod = 'scb';
      document.getElementById('bbl').classList.add('grayscale');
      document.getElementById('kbank').classList.add('grayscale');
      document.getElementById('cash').classList.add('grayscale');
    } else if (paymentMethodId === 'bbl') {
      tmpData.paymentMethod = 'bbl';
      document.getElementById('scb').classList.add('grayscale');
      document.getElementById('kbank').classList.add('grayscale');
      document.getElementById('cash').classList.add('grayscale');
    } else if (paymentMethodId === 'kbank') {
      tmpData.paymentMethod = 'kbank';
      document.getElementById('bbl').classList.add('grayscale');
      document.getElementById('scb').classList.add('grayscale');
      document.getElementById('cash').classList.add('grayscale');
    } else if (paymentMethodId === 'cash') {
      tmpData.paymentMethod = 'cash';
      document.getElementById('bbl').classList.add('grayscale');
      document.getElementById('kbank').classList.add('grayscale');
      document.getElementById('scb').classList.add('grayscale');
    }
  };
  var saveToFirebase = function() {
    var roomNo = tmpData.room;
    var price = tmpData.price;
    var status = tmpData.status;
    var paymentMethod = status === 'paid' ? tmpData.paymentMethod : null;
    var payDate = status === 'paid' ? tmpData.payDate : null;
    var firebaseRef = firebase.database().ref('rooms/' + roomNo);
    firebaseRef.set({
      price: price,
      status: status,
      paymentMethod: paymentMethod,
      payDate: payDate
    });
    closeOverlay();
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
        clearDataModel();
        for (var i = 0; i < numFloors; i++) {
          var floorDataObj = floorsObj['floor' + (i + 1)];
          for (var prop in floorDataObj) {
            if (floorDataObj.hasOwnProperty(prop)) {
              rooms.push(prop);
              addToDataModel(i + 1, prop, roomsObj[prop]);
              renderCardDom(i + 1, prop, roomsObj[prop]);
            }
          }
        }
        // Code which is listening to firebase database change
        roomsRef.on('value', function(snapshot) {
          var filteredStatusModel = [];
          var roomsObj = snapshot.val();
          renderFloorHeaderDom(5);
          clearDataModel();
          var i;
          for (i = 0; i < rooms.length; i++) {
            var floorNo = parseInt(rooms[i].charAt(0), 10);
            addToDataModel(floorNo, rooms[i], roomsObj[rooms[i]]);
          }
          // filter based on selection
          if (filterMode === 'linkPaid') {
            filteredStatusModel = roomModel.filter(function(obj) {
              return obj.status === 'paid';
            });
          } else if (filterMode === 'linkShowAll') {
            filteredStatusModel = roomModel;
          } else if (filterMode === 'linkUnpaid') {
            filteredStatusModel = roomModel.filter(function(obj) {
              return obj.status === 'unpaid';
            });
          } else if (filterMode === 'linkUnbilled') {
            filteredStatusModel = roomModel.filter(function(obj) {
              return obj.status === 'unbilled';
            });
          }
          for (i = 0; i < filteredStatusModel.length; i++) {
            var roomNumber = filteredStatusModel[i].room;
            var floorNumber = filteredStatusModel[i].floor;
            renderCardDom(floorNumber, roomNumber, filteredStatusModel[i]);
          }
        });
      });
    },
    registerDomEvent: function() {
      var showAllElement = document.querySelector('#linkShowAll');
      var paidElement = document.querySelector('#linkPaid');
      var unpaidElement = document.querySelector('#linkUnpaid');
      var unbilledElement = document.querySelector('#linkUnbilled');
      var ledgerElement = document.querySelector('#linkLedger');

      var overlayCloseBtn = document.querySelector('#overlay-close-btn');

      var optionPaidElement = document.querySelector('#option-paid');
      var optionUnpaidElement = document.querySelector('#option-unpaid');
      var optionUnbilledElement = document.querySelector('#option-unbilled');

      var roomPriceInput = document.querySelector('#room-price');
      var datePaidInput = document.querySelector('#date-paid');

      var scbIcon = document.querySelector('#scb');
      var bblIcon = document.querySelector('#bbl');
      var kbankIcon = document.querySelector('#kbank');
      var cashIcon = document.querySelector('#cash');

      var saveBtn = document.querySelector('#save-btn');
      var cancelBtn = document.querySelector('#cancel-btn');

      // Drawer Event
      showAllElement.addEventListener('click', function() {
        filterMode = 'linkShowAll';
        linkHandler(this);
      });
      paidElement.addEventListener('click', function() {
        filterMode = 'linkPaid';
        linkHandler(this);
      });
      unpaidElement.addEventListener('click', function() {
        filterMode = 'linkUnpaid';
        linkHandler(this);
      });
      unbilledElement.addEventListener('click', function() {
        filterMode = 'linkUnbilled';
        linkHandler(this);
      });
      ledgerElement.addEventListener('click', function() {
        switchToLedgerView(this);
      });
      overlayCloseBtn.addEventListener('click', closeOverlay);
      cancelBtn.addEventListener('click', closeOverlay);
      saveBtn.addEventListener('click', saveToFirebase);
      roomPriceInput.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
          this.blur();
        }
      });
      roomPriceInput.addEventListener('blur', function() {
        var roomPriceContainer = document.getElementById('room-price-container');
        if (isNaN(this.valueAsNumber) || this.validity.valid === false) {
          roomPriceContainer.MaterialTextfield.change('0.00');
          tmpData.price = 0;
        } else {
          var formattedPrice = this.valueAsNumber.toFixed(2);
          roomPriceContainer.MaterialTextfield.change(formattedPrice);
          tmpData.price = this.valueAsNumber;
        }
      });
      datePaidInput.addEventListener('blur', function() {
        tmpData.payDate = this.value;
        if (this.value === '' || this.valueAsDate === null) {
          var today = new Date();
          var todayString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
          // date-paid-container
          this.parentElement.MaterialTextfield.change(todayString);
          tmpData.payDate = todayString;
        } else {
          tmpData.payDate = this.value;
        }
      });
      optionPaidElement.addEventListener('change', function(event) {
        radioHandler(event);
      });
      optionUnpaidElement.addEventListener('change', function(event) {
        radioHandler(event);
      });
      optionUnbilledElement.addEventListener('change', function(event) {
        radioHandler(event);
      });
      scbIcon.addEventListener('click', paymentMethodClickHandler);
      bblIcon.addEventListener('click', paymentMethodClickHandler);
      kbankIcon.addEventListener('click', paymentMethodClickHandler);
      cashIcon.addEventListener('click', paymentMethodClickHandler);
    }
  };
})();

$(document).ready(function() {
  App.initDatabase();
  App.registerDomEvent();
});

