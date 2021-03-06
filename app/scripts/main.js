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
 /* global firebase, $, componentHandler, XLSX */
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
  var provider = new firebase.auth.GoogleAuthProvider();
  var userDisplayName = null;
  var userEmail = null;

  var roomModel = [];
  var rooms = [];
  var currentActiveCard = null;
  var tmpData = {};
  var filterMode = 'linkShowAll';

  var getNowString = function() {
    return new Date().toLocaleString();
  };

  var addToDataModel = function(floorNo, roomNo, details) {
    roomModel.push({
      floor: floorNo,
      room: roomNo,
      price: details.price === undefined ? 0 : details.price,
      status: details.status,
      paymentMethod: details.paymentMethod,
      payDate: details.payDate,
      notes: details.notes,
      lastModifiedBy: details.lastModifiedBy,
      lastModifiedAt: details.lastModifiedAt
    });
  };
  var clearDataModel = function() {
    roomModel.length = 0;
  };
  var showLoginOverlay = function() {
    document.getElementById('login-container').style.height = '100%';
    document.getElementById('login-container').style.zIndex = '10';
  };
  var closeLoginOverlay = function() {
    document.getElementById('login-container').style.height = '0%';
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
    tmpData.notes = currentActiveCard.notes;
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
    var roomNotes = filteredModel[0].notes;
    var roomModifiedBy = filteredModel[0].lastModifiedBy === undefined ? '-' : filteredModel[0].lastModifiedBy;
    var roomModifiedAt = filteredModel[0].lastModifiedAt === undefined ? '-' : filteredModel[0].lastModifiedAt;

    var roomCardHeader = document.getElementById('room-card-header');
    var roomPriceContainer = document.getElementById('room-price-container');
    var roomModifiedByContainer = document.getElementById('modified-by-container');
    roomCardHeader.innerHTML = 'Room ' + roomNo;

    // fill in the price
    // https://github.com/google/material-design-lite/issues/1287
    roomPriceContainer.MaterialTextfield.change(roomPrice);

    // https://stackoverflow.com/questions/35783797/set-material-design-lite-radio-button-option-with-jquery
    var paymentMethodContainer = document.querySelector('.payment-method-container');
    var datePaidContainer = document.getElementById('date-paid-container');
    var notesContainer = document.getElementById('notes-container');

    var today = new Date();
    var todayString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    datePaidContainer.MaterialTextfield.change(todayString);
    notesContainer.MaterialTextfield.change(roomNotes);

    // fill in last modified info
    roomModifiedByContainer.innerHTML = '';
    var roomModifiedDom = parseHTML(
      '<span class="modified-text">Last modified by: ' + roomModifiedBy + '</span><br>' +
      '<span class="modified-text">@' + roomModifiedAt + '</span>'
    );
    while (roomModifiedDom.length > 0) {
      roomModifiedByContainer.appendChild(roomModifiedDom[0]);
    }

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
  var showResetConfirmationDialog = function() {
    document.getElementById('confirmation-container').style.height = '100%';
    document.getElementById('confirmation-container').style.zIndex = '10';
  };
  var closeResetConfirmationDialog = function() {
    document.getElementById('confirmation-container').style.height = '0%';
  };
  var resetToUnpaid = function() {
    closeDrawer();
    // show confirmation dialog before proceed
    showResetConfirmationDialog();
  };
  var renderExportToExcelButton = function() {
    var rootContainer = document.querySelector('.mdl-layout__content');
    rootContainer.innerHTML = '';
    var exportDom = parseHTML(
      '<div id="export-to-excel-container" class="mdl-grid">' +
        '<div class="mdl-cell mdl-cell--12-col">' +
          '<button id="export-to-excel-btn" class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect right">' +
            '<i class="icon mdi mdi-file-excel"></i>' +
          '</button>' +
          '<div class="mdl-tooltip" data-mdl-for="export-to-excel-btn">' +
            'Export to Excel' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    rootContainer.appendChild(exportDom[0]);
    componentHandler.upgradeElements(rootContainer);
  };
  var renderLedgerTable = function() {
    var filteredStatusModel = [];
    var rootContainer = document.querySelector('.mdl-layout__content');
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
          render: function(data) {
            if (data === 'cash') {
              return 'Cash';
            } else if (data === 'scb') {
              return 'SCB';
            } else if (data === 'kbank') {
              return 'KBANK';
            } else if (data === 'bbl') {
              return 'BBL';
            }
          }
        },
        {
          title: '',
          width: '5vw',
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
    renderExportToExcelButton();
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
  var updateFromExcelToFirebase = function(roomNo, price, notes) {
    var now = getNowString();
    if (roomNo !== null) {
      var firebaseRef = firebase.database().ref('rooms/' + roomNo);
      // update both price and notes
      if (price !== null && notes !== null) {
        if (price === 0) {
          firebaseRef.update({
            price: price,
            status: 'unbilled',
            paymentMethod: null,
            payDate: null,
            notes: notes,
            lastModifiedBy: userDisplayName,
            lastModifiedAt: now
          });
        } else {
          firebaseRef.update({
            price: price,
            notes: notes,
            lastModifiedBy: userDisplayName,
            lastModifiedAt: now
          });
        }
      // update only notes
      } else if (notes !== null) {
        firebaseRef.update({
          notes: notes,
          lastModifiedBy: userDisplayName,
          lastModifiedAt: now
        });
      // update only price
      } else if (price !== null) {
        if (price === 0) {
          firebaseRef.update({
            price: price,
            status: 'unbilled',
            paymentMethod: null,
            payDate: null,
            lastModifiedBy: userDisplayName,
            lastModifiedAt: now
          });
        } else {
          firebaseRef.update({
            price: price,
            lastModifiedBy: userDisplayName,
            lastModifiedAt: now
          });
        }
      }
    }
  };
  var saveToFirebase = function() {
    var roomNo = tmpData.room;
    var price = tmpData.price;
    var status = tmpData.status;
    var paymentMethod = status === 'paid' ? tmpData.paymentMethod : null;
    var payDate = status === 'paid' ? tmpData.payDate : null;
    var notes = tmpData.notes;
    var now = getNowString();
    var firebaseRef = firebase.database().ref('rooms/' + roomNo);
    firebaseRef.set({
      price: price,
      status: status,
      paymentMethod: paymentMethod,
      payDate: payDate,
      notes: notes,
      lastModifiedBy: userDisplayName,
      lastModifiedAt: now
    });
    closeOverlay();
  };
  var saveMonthToFirebase = function(val) {
    var firebaseRef = firebase.database().ref('month');
    firebaseRef.set(val);
  };
  var resetToFirebase = function() {
    var now = getNowString();
    var tmpRoomModel = JSON.parse(JSON.stringify(roomModel));
    tmpRoomModel.forEach(function(obj) {
      var roomNo = obj.room;
      var firebaseRef = firebase.database().ref('rooms/' + roomNo);
      firebaseRef.update({
        status: 'unpaid',
        paymentMethod: null,
        payDate: null,
        notes: null,
        lastModifiedBy: userDisplayName,
        lastModifiedAt: now
      });
    });
    closeResetConfirmationDialog();
  };
  var showPermissionDeniedDialog = function() {
    document.getElementById('permission-denied-container').style.height = '100%';
    document.getElementById('permission-denied-container').style.zIndex = '10';
  };
  var closePermissionDeniedDialog = function() {
    document.getElementById('permission-denied-container').style.height = '0%';
  };
  var initDatabase = function() {
    var firebaseRef = firebase.database().ref();
    var roomsRef = firebaseRef.child('rooms');
    var floorsRef = firebaseRef.child('floors');
    var monthRef = firebase.database().ref('month');

    Promise.all([
      roomsRef.once('value'),
      floorsRef.once('value'),
      monthRef.once('value')
    ]).then(function(snapshots) {
      var roomsObj = snapshots[0].val();
      var floorsObj = snapshots[1].val();
      var monthValue = snapshots[2].val();

      if (monthValue !== null) {
        var monthContainer = document.getElementById('month-input-container');
        monthContainer.MaterialTextfield.change(monthValue);
      }
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
      monthRef.on('value', function(snapshot) {
        var monthValue = snapshot.val();
        var monthContainer = document.getElementById('month-input-container');
        monthContainer.MaterialTextfield.change(monthValue);
      });
    });
  };
  var registerDomEvent = function() {
    var showAllElement = document.querySelector('#linkShowAll');
    var paidElement = document.querySelector('#linkPaid');
    var unpaidElement = document.querySelector('#linkUnpaid');
    var unbilledElement = document.querySelector('#linkUnbilled');
    var resetElement = document.querySelector('#linkReset');
    var ledgerElement = document.querySelector('#linkLedger');

    var overlayCloseBtn = document.querySelector('#overlay-close-btn');

    var optionPaidElement = document.querySelector('#option-paid');
    var optionUnpaidElement = document.querySelector('#option-unpaid');
    var optionUnbilledElement = document.querySelector('#option-unbilled');

    var roomPriceInput = document.querySelector('#room-price');
    var datePaidInput = document.querySelector('#date-paid');
    var notesInput = document.querySelector('#notes-input');

    var monthHeaderInput = document.querySelector('#month-header-input');
    var importExcelEntry = document.querySelector('#import-excel-entry');
    var excelFileInput = document.querySelector('#excel-input');

    var scbIcon = document.querySelector('#scb');
    var bblIcon = document.querySelector('#bbl');
    var kbankIcon = document.querySelector('#kbank');
    var cashIcon = document.querySelector('#cash');

    var saveBtn = document.querySelector('#save-btn');
    var cancelBtn = document.querySelector('#cancel-btn');

    // Reset confirmation dialog
    var yesResetBtn = document.querySelector('#yes-reset-btn');
    var cancelResetBtn = document.querySelector('#cancel-reset-btn');

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
    resetElement.addEventListener('click', function() {
      resetToUnpaid();
    });
    ledgerElement.addEventListener('click', function() {
      switchToLedgerView(this);
    });
    overlayCloseBtn.addEventListener('click', closeOverlay);
    cancelBtn.addEventListener('click', closeOverlay);
    saveBtn.addEventListener('click', saveToFirebase);
    yesResetBtn.addEventListener('click', resetToFirebase);
    cancelResetBtn.addEventListener('click', closeResetConfirmationDialog);
    monthHeaderInput.addEventListener('keyup', function(event) {
      if (event.keyCode === 13) {
        this.blur();
      }
    });
    monthHeaderInput.addEventListener('blur', function() {
      saveMonthToFirebase(this.value);
    });
    importExcelEntry.addEventListener('click', function() {
      excelFileInput.click();
    });
    excelFileInput.addEventListener('change', function(event) {
      var files = event.target.files;
      var file = files[0];

      if (files && file) {
        var fileReader = new FileReader();

        fileReader.onload = function(event) {
          var data = event.target.result;
          var workbook = XLSX.read(data, {type: 'binary'});
          // read from the first worksheet only
          var sheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[sheetName];
          var jsonSheet = XLSX.utils.sheet_to_json(worksheet, {raw: true});
          // we get the array of info
          jsonSheet.forEach(function(obj) {
            var roomNo = obj.Room ? obj.Room : null;
            var price = obj.Price ? obj.Price : null;
            var notes = obj.Notes ? obj.Notes : null;

            updateFromExcelToFirebase(roomNo, price, notes);
          });
        };

        if (fileReader.readAsBinaryString) {
          fileReader.readAsBinaryString(file);
        } else {
          fileReader.readAsArrayBuffer(file);
        }
        this.value = '';
      }
    });
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
    notesInput.addEventListener('blur', function() {
      tmpData.notes = this.value;
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
  };
  var checkUserPermission = function() {
    var userRef = firebase.database().ref('authorization/users');
    var whitelisted = false;
    userRef.once('value').then(function(snapshot) {
      var usersObj = snapshot.val();
      for (var user in usersObj) {
        if (usersObj.hasOwnProperty(user)) {
          if (userEmail === usersObj[user].email) {
            whitelisted = true;
            break;
          }
        }
      }
      if (whitelisted) {
        // app main workflow
        initDatabase();
        registerDomEvent();
      } else {
        showPermissionDeniedDialog();
      }
    });
  };
  return {
    /* initDatabase: function() {
      var firebaseRef = firebase.database().ref();
      var roomsRef = firebaseRef.child('rooms');
      var floorsRef = firebaseRef.child('floors');
      var monthRef = firebase.database().ref('month');

      Promise.all([
        roomsRef.once('value'),
        floorsRef.once('value'),
        monthRef.once('value')
      ]).then(function(snapshots) {
        var roomsObj = snapshots[0].val();
        var floorsObj = snapshots[1].val();
        var monthValue = snapshots[2].val();

        if (monthValue !== null) {
          var monthContainer = document.getElementById('month-input-container');
          monthContainer.MaterialTextfield.change(monthValue);
        }
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
        monthRef.on('value', function(snapshot) {
          var monthValue = snapshot.val();
          var monthContainer = document.getElementById('month-input-container');
          monthContainer.MaterialTextfield.change(monthValue);
        });
      });
    },
    registerDomEvent: function() {
      var showAllElement = document.querySelector('#linkShowAll');
      var paidElement = document.querySelector('#linkPaid');
      var unpaidElement = document.querySelector('#linkUnpaid');
      var unbilledElement = document.querySelector('#linkUnbilled');
      var resetElement = document.querySelector('#linkReset');
      var ledgerElement = document.querySelector('#linkLedger');

      var overlayCloseBtn = document.querySelector('#overlay-close-btn');

      var optionPaidElement = document.querySelector('#option-paid');
      var optionUnpaidElement = document.querySelector('#option-unpaid');
      var optionUnbilledElement = document.querySelector('#option-unbilled');

      var roomPriceInput = document.querySelector('#room-price');
      var datePaidInput = document.querySelector('#date-paid');
      var notesInput = document.querySelector('#notes-input');

      var monthHeaderInput = document.querySelector('#month-header-input');
      var importExcelEntry = document.querySelector('#import-excel-entry');
      var excelFileInput = document.querySelector('#excel-input');

      var scbIcon = document.querySelector('#scb');
      var bblIcon = document.querySelector('#bbl');
      var kbankIcon = document.querySelector('#kbank');
      var cashIcon = document.querySelector('#cash');

      var saveBtn = document.querySelector('#save-btn');
      var cancelBtn = document.querySelector('#cancel-btn');

      // Reset confirmation dialog
      var yesResetBtn = document.querySelector('#yes-reset-btn');
      var cancelResetBtn = document.querySelector('#cancel-reset-btn');

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
      resetElement.addEventListener('click', function() {
        resetToUnpaid();
      });
      ledgerElement.addEventListener('click', function() {
        switchToLedgerView(this);
      });
      overlayCloseBtn.addEventListener('click', closeOverlay);
      cancelBtn.addEventListener('click', closeOverlay);
      saveBtn.addEventListener('click', saveToFirebase);
      yesResetBtn.addEventListener('click', resetToFirebase);
      cancelResetBtn.addEventListener('click', closeResetConfirmationDialog);
      monthHeaderInput.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
          this.blur();
        }
      });
      monthHeaderInput.addEventListener('blur', function() {
        saveMonthToFirebase(this.value);
      });
      importExcelEntry.addEventListener('click', function() {
        excelFileInput.click();
      });
      excelFileInput.addEventListener('change', function(event) {
        var files = event.target.files;
        var file = files[0];

        if (files && file) {
          var fileReader = new FileReader();

          fileReader.onload = function(event) {
            var data = event.target.result;
            var workbook = XLSX.read(data, {type: 'binary'});
            // read from the first worksheet only
            var sheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[sheetName];
            var jsonSheet = XLSX.utils.sheet_to_json(worksheet, {raw: true});
            // we get the array of info
            jsonSheet.forEach(function(obj) {
              var roomNo = obj.Room ? obj.Room : null;
              var price = obj.Price ? obj.Price : null;
              var notes = obj.Notes ? obj.Notes : null;

              updateFromExcelToFirebase(roomNo, price, notes);
            });
          };

          if (fileReader.readAsBinaryString) {
            fileReader.readAsBinaryString(file);
          } else {
            fileReader.readAsArrayBuffer(file);
          }
          this.value = '';
        }
      });
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
      notesInput.addEventListener('blur', function() {
        tmpData.notes = this.value;
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
    },*/
    handleLoginProcess: function() {
      // register dom event for login process first
      var signInBtn = document.querySelector('#google-sign-in-btn');
      var signOutBtn = document.querySelector('#google-sign-out-btn');

      signInBtn.addEventListener('click', function() {
        firebase.auth().signInWithPopup(provider).then(function() {
          console.log('sign in clicked.');
          closeLoginOverlay();
        }, function(error) {
          console.log(error);
        });
      });

      signOutBtn.addEventListener('click', function() {
        firebase.auth().signOut().then(function() {
          console.log('sign out clicked.');
          closePermissionDeniedDialog();
        });
      });

      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          console.log('logged in.');
          userDisplayName = firebase.auth().currentUser.displayName;
          userEmail = firebase.auth().currentUser.email;
          checkUserPermission();
        } else {
          console.log('not logged in.');
          showLoginOverlay();
        }
      });

      /* // otherwise show login popup
      if (firebase.auth().currentUser === null) {
        showLoginOverlay();
      // if sign in already, check the permission of that user
      } else {
        userDisplayName = firebase.auth().currentUser.displayName;
        userEmail = firebase.auth().currentUser.email;
        checkUserPermission();
      }*/
    }
  };
})();

$(document).ready(function() {
  App.handleLoginProcess();
  // App.initDatabase();
  // App.registerDomEvent();
});

