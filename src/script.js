var TWMarketScanner = {
    SCRIPT_NAME: 'TW Market Scanner',
    VERSION: '@@scriptVersion', // grunt will import version from package.json
    TIMER: 600000, // in miliseconds
    MAX_OFFERS: 10, // count of items to find in the market
    NO_LIMIT: 9999999, // max price if set 0 or empty string
    language: {
        cs: {
            ajaxErrorMessage: 'Problém komunikace se serverem.',
            windowHeadline: 'Nalezen produkt na trhu',
            closeButton: 'Zavřít',
            noLimit: 'bez limitu',
            limitCaption: 'max. cena:',
            alreadyInstalled: 'je již nainstalován',
            setting: 'Nastavení',
            itemLabel: 'Předmět č.',
            limitLabel: 'Max. cena',
            saveButton: 'Ulož',
            itemCaption: 'Předmět',
            pricePerPieceCaption: 'Cena za kus',
            piecesCaption: 'Kusů',
            totalCaption: 'Celkem',
        },
        en: {
            ajaxErrorMessage: 'Connection problem with server.',
            windowHeadline: 'Product found in the market',
            closeButton: 'Close',
            noLimit: 'no limit',
            limitCaption: 'max price:',
            alreadyInstalled: 'is already installed',
            setting: 'Setting',
            itemLabel: 'Item #',
            limitLabel: 'Max price',
            saveButton: 'Save',
            itemCaption: 'Item',
            pricePerPieceCaption: 'PPP',
            piecesCaption: 'Pieces',
            totalCaption: 'Total',
        },
    },
};

TWMarketScanner.setStyle = function () {
    var style = '@@cssStyles'; // grunt will import real styles
    $('<style>').text(style).appendTo(document.head);
};

TWMarketScanner.getLanguage = function () {
    return Game.locale === 'cs_CZ' ? 'cs' : 'en';
};

TWMarketScanner.startTimer = function () {
    TWMarketScanner.timer = setTimeout(function () {
        TWMarketScanner.getAllScans();
        TWMarketScanner.startTimer();
    }, TWMarketScanner.TIMER);
};

TWMarketScanner.stopTimer = function () {
    clearTimeout(TWMarketScanner.timer);
};

TWMarketScanner.scanMarket = function (pattern) {
    if (typeof pattern !== 'string' || pattern === '') return null;

    var results = Ajax.remoteCall(
        'building_market',
        'search',
        { pattern },
        function (json) {
            if (json.error) {
                MessageError(
                    TWMarketScanner.language[TWMarketScanner.getLanguage()]
                        .ajaxErrorMessage
                ).show();
                return null;
            }
        }
    );
    return results;
};

TWMarketScanner.getAllScans = function () {
    var savedData = JSON.parse(localStorage.getItem('twms_settings'));
    if (!savedData) return null;

    $.when(
        TWMarketScanner.scanMarket(savedData[0].searchText),
        TWMarketScanner.scanMarket(savedData[1].searchText),
        TWMarketScanner.scanMarket(savedData[2].searchText),
        TWMarketScanner.scanMarket(savedData[3].searchText),
        TWMarketScanner.scanMarket(savedData[4].searchText),
        TWMarketScanner.scanMarket(savedData[5].searchText),
        TWMarketScanner.scanMarket(savedData[6].searchText),
        TWMarketScanner.scanMarket(savedData[7].searchText),
        TWMarketScanner.scanMarket(savedData[8].searchText),
        TWMarketScanner.scanMarket(savedData[9].searchText)
    ).done(function (...results) {
        var data = [],
            undefinedCount;

        for (let i = 0; i < results.length; i += 1) {
            if (results[i]) {
                data.push(
                    results[i][0].msg.search_result.length > 0
                        ? results[i][0].msg.search_result
                        : null
                );
            } else data.push(null);
        }

        // if all results are null, go back
        undefinedCount = data.filter(function (value) {
            return value === null;
        }).length;

        if (undefinedCount === TWMarketScanner.MAX_OFFERS) return null;

        var content = $("<div class='twms-table-wrapper' />");

        for (let i = 0; i < data.length; i += 1) {
            content.append(
                TWMarketScanner.generateTable(
                    data[i],
                    savedData[i].searchText,
                    savedData[i].limit
                )
            );
        }

        var resultWindow = new west.gui.Dialog(
            TWMarketScanner.language[
                TWMarketScanner.getLanguage()
            ].windowHeadline
        );
        resultWindow.setText(content);
        resultWindow.addButton(
            TWMarketScanner.language[TWMarketScanner.getLanguage()].closeButton
        );
        resultWindow.show();
    });
};

TWMarketScanner.getItemName = function (itemId) {
    var result = ItemManager.get(String(itemId));

    return { name: result.name, imageUrl: result.image };
};

TWMarketScanner.generateTable = function (data, searchText, limit) {
    // eslint-disable-next-line no-param-reassign
    if (!searchText) searchText = '';
    if (!data) return '';
    // eslint-disable-next-line no-param-reassign
    if (limit === '0' || limit === '') limit = TWMarketScanner.NO_LIMIT;

    var auctionPrice,
        itemId,
        maxPrice,
        itemCount,
        auctionPricePerPiece,
        maxPricePerPiece,
        table,
        row,
        pricePerPiece,
        sum,
        thead,
        item,
        cells,
        caption,
        foundAnything,
        limitText;

    table = $("<table class='twms-table' />");

    limitText =
        limit === TWMarketScanner.NO_LIMIT
            ? TWMarketScanner.language[TWMarketScanner.getLanguage()].noLimit
            : format_money(limit);

    caption = $(
        "<caption class='twms-caption'>" +
            searchText +
            ' (' +
            TWMarketScanner.language[TWMarketScanner.getLanguage()]
                .limitCaption +
            ' ' +
            limitText +
            ')' +
            '</caption>'
    );
    thead = $(
        "<thead><tr><th class='twms-th-image'></th><th class='twms-th-item'>" +
            TWMarketScanner.language[TWMarketScanner.getLanguage()]
                .itemCaption +
            "<th class='twms-th-ppp'>" +
            TWMarketScanner.language[TWMarketScanner.getLanguage()]
                .pricePerPieceCaption +
            "</th><th class='twms-th-pieces'>" +
            TWMarketScanner.language[TWMarketScanner.getLanguage()]
                .piecesCaption +
            "</th><th class='twms-th-sum'>" +
            TWMarketScanner.language[TWMarketScanner.getLanguage()]
                .totalCaption +
            '</th></tr></thead>'
    );

    table.append(caption);
    table.append(thead);

    foundAnything = false;
    for (let i = 0; i < data.length; i += 1) {
        auctionPrice = data[i].auction_price;
        maxPrice = data[i].max_price;
        itemCount = data[i].item_count;
        itemId = data[i].item_id;
        auctionPricePerPiece = auctionPrice / itemCount;
        maxPricePerPiece = maxPrice / itemCount;
        item = TWMarketScanner.getItemName(itemId);

        pricePerPiece = auctionPricePerPiece || maxPricePerPiece;

        sum = auctionPrice || maxPrice;

        row = $('<tr/>');

        if (Number(limit) >= Number(pricePerPiece)) {
            cells = $(
                "<td><img class='twms-item-image' src='" +
                    item.imageUrl +
                    "' /></td><td class='twms-text-left'>" +
                    item.name +
                    "<td class='twms-text-right'>$" +
                    format_money(pricePerPiece) +
                    "</td><td class='twms-text-center'>" +
                    format_number(itemCount) +
                    "</td><td class='twms-text-right'>$" +
                    format_money(sum) +
                    '</td>'
            );
            foundAnything = true;
            row.append(cells);
            table.append(row);
        }
    }
    if (!foundAnything) table = '';
    return table;
};

TWMarketScanner.init = function () {
    // test if script already exists
    if ($('#TWMS-menuLink').length) {
        MessageError(
            TWMarketScanner.SCRIPT_NAME +
                ' ' +
                TWMarketScanner.language[TWMarketScanner.getLanguage()]
                    .alreadyInstalled
        ).show();
        return;
    }

    TWMarketScanner.setStyle();
    var div = $('<div class="ui_menucontainer">/');
    var link = $(
        '<div id="TWMS-menuLink" class="menulink"><svg viewBox="0 0 24 24"><path fill="lightgray" d="M19.74 18.33C21.15 16.6 22 14.4 22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c2.4 0 4.6-.85 6.33-2.26.27-.22.53-.46.78-.71.03-.03.05-.06.07-.08.2-.2.39-.41.56-.62zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 1.85-.63 3.54-1.69 4.9l-1.43-1.43c.69-.98 1.1-2.17 1.1-3.46 0-3.31-2.69-6-6-6s-6 2.69-6 6 2.69 6 6 6c1.3 0 2.51-.42 3.49-1.13l1.42 1.42C15.54 19.37 13.85 20 12 20zm1.92-7.49c.17-.66.02-1.38-.49-1.9l-.02-.02c-.77-.77-2-.78-2.78-.04-.01.01-.03.02-.05.04-.78.78-.78 2.05 0 2.83l.02.02c.52.51 1.25.67 1.91.49l1.51 1.51c-.6.36-1.29.58-2.04.58-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4c0 .73-.21 1.41-.56 2l-1.5-1.51z"></path></svg></div>'
    );
    link.click(function () {
        TWMarketScanner.showSetting();
    });
    var linkBottom = $('<div class="menucontainer_bottom">/');
    div.append(link);
    div.append(linkBottom);

    $('#ui_menubar').append(div);

    TWMarketScanner.getAllScans();
    TWMarketScanner.startTimer();
};

TWMarketScanner.showSetting = function () {
    var savedData,
        settingWindow,
        form,
        row,
        inputItem,
        inputLimit,
        buttonsWrapper,
        saveBtn,
        cancelBtn,
        info,
        searchText,
        limit,
        scrollPane;

    savedData = JSON.parse(localStorage.getItem('twms_settings'));

    settingWindow = wman
        .open('twms-setting', null)
        .setMiniTitle(
            TWMarketScanner.language[TWMarketScanner.getLanguage()].setting
        )
        .setTitle(
            TWMarketScanner.language[TWMarketScanner.getLanguage()].setting
        )
        .setMinSize(550, 458)
        .setSize(550, 458);

    form = $('<div />');
    for (let i = 0; i < 10; i += 1) {
        row = $("<div class='twms-form-row'/>");
        inputItem = new west.gui.Textfield('item-' + (i + 1));
        inputItem.setLabel(
            TWMarketScanner.language[TWMarketScanner.getLanguage()].itemLabel +
                (i + 1)
        );
        inputItem.setId('twms-item-' + (i + 1));
        inputItem.setSize(20);
        inputItem.maxlength(50);
        if (savedData) inputItem.setValue(savedData[i].searchText);
        row.append(inputItem.getMainDiv());

        inputLimit = new west.gui.Textfield('limit-' + (i + 1));
        inputLimit.setLabel(
            TWMarketScanner.language[TWMarketScanner.getLanguage()].limitLabel
        );
        inputLimit.setSize(9);
        inputLimit.maxlength(9);
        inputLimit.onlyNumeric();
        inputLimit.setId('twms-limit-' + (i + 1));
        if (savedData) inputLimit.setValue(savedData[i].limit);
        row.append(inputLimit.getMainDiv());

        form.append(row);
    }
    buttonsWrapper = $("<div class='twsm-buttonsWrapper' />");
    saveBtn = new west.gui.Button(
        TWMarketScanner.language[TWMarketScanner.getLanguage()].saveButton,
        function () {
            var dataToSave = [];

            for (let i = 0; i < 10; i += 1) {
                searchText = $('#twms-item-' + (i + 1))
                    .val()
                    .trim();
                limit = $('#twms-limit-' + (i + 1))
                    .val()
                    .trim();

                dataToSave.push({ searchText, limit });
            }

            localStorage.setItem('twms_settings', JSON.stringify(dataToSave));

            TWMarketScanner.stopTimer();
            TWMarketScanner.getAllScans();
            TWMarketScanner.startTimer();

            settingWindow.destroy();
        }
    );
    cancelBtn = new west.gui.Button(
        TWMarketScanner.language[TWMarketScanner.getLanguage()].closeButton,
        function () {
            settingWindow.destroy();
        }
    );

    buttonsWrapper.append(saveBtn.getMainDiv(), cancelBtn.getMainDiv());

    info = $(
        "<span class='twsm-infoText'>" +
            TWMarketScanner.SCRIPT_NAME +
            ' v. ' +
            TWMarketScanner.VERSION +
            '</span>'
    );

    scrollPane = new west.gui.Scrollpane();
    scrollPane.appendContent(form);
    scrollPane.appendContent(buttonsWrapper);
    scrollPane.appendContent(info);
    settingWindow.appendToContentPane(scrollPane.getMainDiv());
};

$(document).ready(function () {
    try {
        TWMarketScanner.init();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e.stack);
    }
});
