var TWMarketScanner = {
    SCRIPT_NAME: 'TW Market Scanner',
    VERSION: '@@scriptVersion', // grunt will import version from package.json
    TIMER: 600000, // in miliseconds
    MAX_OFFERS: 10, // count of items to find in the market
    NO_LIMIT: 9999999, // max price if set 0 or empty string
    SETTING_PREFIX: 'twms_settings_' + Game.worldName,
    setting: {
        data: undefined, // setting for this world
        power: undefined, // boolean  - if timer is off or on
        sound: undefined, // boolean - sound setting (on/off)
    },
    languagePrefix: Game.locale === 'cs_CZ' ? 'cs' : 'en',

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
            saveButton: 'Uložit',
            itemCaption: 'Předmět',
            pricePerPieceCaption: 'Cena za kus',
            piecesCaption: 'Kusů',
            totalCaption: 'Celkem',
            worldError: 'Problém s detekcí světa',
            checkboxPowerLabel: 'Skenování trhu je aktivní',
            checkboxPowerTooltip:
                'Zapne/vypne automatické skenování trhu podle požadovaného nastavení',
            checkboxSoundLabel: 'Zapnout zvuk',
            checkboxSoundTooltip:
                'Zapne/vypne zvukové upozornění při nalezení produktu na trhu',
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
            worldError: 'Problem with world name',
            checkboxPowerLabel: 'Market scanner is active',
            checkboxPowerTooltip: 'Start/stop automatic market scanner',
            checkboxSoundLabel: 'Turn on the sound',
            checkboxSoundTooltip:
                'Turn on/off the sound alert when the item in the market is found',
        },
    },
};

TWMarketScanner.setStyle = function () {
    var style = '@@cssStyles'; // grunt will import real styles
    $('<style>').text(style).appendTo(document.head);
};

TWMarketScanner.beep = function () {
    new Audio('@@beepSound').play();
};

TWMarketScanner.openMarketWindow = function (element) {
    var idTown, textSearch, event;

    TWMarketScanner.resultsWindow.hide();

    idTown = $(element).data('city');
    textSearch = $(element).data('search');

    MarketWindow.open(idTown);
    MarketWindow.showTab('buy');
    $('div.market-buy .iSearchbox input', MarketWindow.DOM).val(textSearch);
    event = $.Event('keypress');
    event.which = 13;
    event.keyCode = 13;
    $('div.market-buy .iSearchbox input', MarketWindow.DOM).trigger(event);
};

TWMarketScanner.getSetting = function () {
    var savedData,
        dataToSave = [];

    savedData = JSON.parse(
        localStorage.getItem(TWMarketScanner.SETTING_PREFIX)
    );

    if (!savedData) {
        // set empty setting to local storage
        for (let i = 0; i < TWMarketScanner.MAX_OFFERS; i += 1) {
            dataToSave.push({ searchText: '', limit: '' });
        }
        TWMarketScanner.setting.data = dataToSave;
        TWMarketScanner.setting.power = true;
        TWMarketScanner.setting.sound = true;

        localStorage.setItem(
            TWMarketScanner.SETTING_PREFIX,
            JSON.stringify({ power: 'on', sound: 'on', setting: dataToSave })
        );
    } else {
        TWMarketScanner.setting.power = savedData.power !== 'off';
        TWMarketScanner.setting.sound = savedData.sound !== 'off';
        TWMarketScanner.setting.data = savedData.setting;
    }
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

    // eslint-disable-next-line no-console
    console.log('scanMarket(), hledám pattern: ', pattern);

    var results = Ajax.remoteCall(
        'building_market',
        'search',
        { pattern },
        function (json) {
            if (json.error) {
                MessageError(
                    TWMarketScanner.language[TWMarketScanner.languagePrefix]
                        .ajaxErrorMessage
                ).show();
                return null;
            }
        }
    );

    // eslint-disable-next-line no-console
    console.log('scanMarket(), vracím výsledek: ', results);

    return results;
};

TWMarketScanner.getAllScans = function () {
    if (!TWMarketScanner.setting.power) return null;

    $.when(
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[0].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[1].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[2].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[3].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[4].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[5].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[6].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[7].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[8].searchText),
        TWMarketScanner.scanMarket(TWMarketScanner.setting.data[9].searchText)
    ).done(function (...results) {
        // eslint-disable-next-line no-console
        console.log('Komplet výsledky z ajaxu pro všechy dotazy:', results);

        var dataForAll = [], // array with filtered results for all items (all rows of inputs in setting)
            dataForItem, // filtered results for one item (one row of input in setting)
            currentBidPricePerPiece,
            maxPricePerPiece,
            pricePerPiece,
            resultForOneItem,
            itemCount,
            itemId,
            totalPrice,
            limit,
            found,
            i,
            u;

        if ($('#TWMS-result-button').length) {
            // eslint-disable-next-line no-console
            console.log('Schovávám minulé okno s výsledkama');
            TWMarketScanner.resultsWindow.hide();
        }

        TWMarketScanner.resultsWindow = new west.gui.Dialog(
            TWMarketScanner.language[
                TWMarketScanner.languagePrefix
            ].windowHeadline
        );

        for (i = 0; i < results.length; i += 1) {
            if (results[i]) {
                if (results[i][0].msg.search_result.length > 0) {
                    resultForOneItem = results[i][0].msg.search_result;

                    dataForItem = {};
                    limit =
                        Number(TWMarketScanner.setting.data[i].limit) === 0
                            ? TWMarketScanner.NO_LIMIT
                            : TWMarketScanner.setting.data[i].limit;
                    found = false;

                    for (u = 0; u < resultForOneItem.length; u += 1) {
                        currentBidPricePerPiece =
                            resultForOneItem[u].current_bid /
                            resultForOneItem[u].item_count;
                        maxPricePerPiece =
                            resultForOneItem[u].max_price /
                            resultForOneItem[u].item_count;
                        pricePerPiece =
                            currentBidPricePerPiece || maxPricePerPiece;

                        itemCount = resultForOneItem[u].item_count;
                        itemId = resultForOneItem[u].item_id;

                        if (Number(limit) >= Number(pricePerPiece)) {
                            found = true;
                            itemCount = resultForOneItem[u].item_count;
                            itemId = resultForOneItem[u].item_id;

                            totalPrice =
                                resultForOneItem[u].current_bid ||
                                resultForOneItem[u].max_price;

                            dataForItem[u] = {
                                itemId,
                                pricePerPiece,
                                itemCount,
                                totalPrice,
                            };
                        }
                    }

                    if (found) {
                        dataForAll.push({
                            setting: {
                                searchText:
                                    TWMarketScanner.setting.data[i].searchText,
                                limit,
                            },
                            items: dataForItem,
                        });
                    }
                }
            }
        }

        // if found nothing, go back
        if (dataForAll.length === 0) return;

        var content = $("<div class='twms-table-wrapper' />");

        for (i = 0; i < dataForAll.length; i += 1) {
            content.append(TWMarketScanner.generateTable(dataForAll[i]));
        }

        if (TWMarketScanner.setting.sound) TWMarketScanner.beep();

        TWMarketScanner.resultsWindow
            .setText(content)
            .addButton(
                TWMarketScanner.language[TWMarketScanner.languagePrefix]
                    .closeButton
            )
            .setId('TWMS-result-button')
            .show();
    });
};

TWMarketScanner.getItemName = function (itemId) {
    var result = ItemManager.get(String(itemId));

    return { name: result.name, imageUrl: result.image };
};

TWMarketScanner.generateTable = function (data) {
    var caption,
        cells,
        idTown,
        item,
        itemCount,
        itemsData,
        itemText,
        limit,
        limitText,
        pricePerPiece,
        row,
        searchText,
        setting,
        table,
        thead,
        totalPrice;

    setting = data.setting;
    itemsData = data.items;

    idTown = Character.homeTown.town_id;

    limit = setting.limit; // same limit is in every result, so we take first one

    searchText = setting.searchText; // same searchText is in every result, so we take first one

    table = $("<table class='twms-table' />");

    limitText =
        limit === TWMarketScanner.NO_LIMIT
            ? TWMarketScanner.language[TWMarketScanner.languagePrefix].noLimit
            : format_money(limit);

    caption = $(
        "<caption class='twms-caption'>" +
            searchText +
            ' (' +
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .limitCaption +
            ' ' +
            limitText +
            ')' +
            '</caption>'
    );
    thead = $(
        "<thead><tr><th class='twms-th-image'></th><th class='twms-th-item'>" +
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .itemCaption +
            "<th class='twms-th-ppp'>" +
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .pricePerPieceCaption +
            "</th><th class='twms-th-pieces'>" +
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .piecesCaption +
            "</th><th class='twms-th-sum'>" +
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .totalCaption +
            '</th></tr></thead>'
    );

    table.append(caption);
    table.append(thead);

    $.each(itemsData, function (_key, value) {
        item = TWMarketScanner.getItemName(value.itemId);

        pricePerPiece = value.pricePerPiece;
        itemCount = value.itemCount;
        totalPrice = value.totalPrice;

        row = $('<tr/>');

        itemText = idTown
            ? '<a href="#" onClick="TWMarketScanner.openMarketWindow(this)" data-city="' +
              idTown +
              '" data-search="' +
              item.name +
              '">' +
              item.name +
              '</a>'
            : item.name;

        cells = $(
            "<td><img class='twms-item-image' src='" +
                item.imageUrl +
                "' /></td><td class='twms-text-left'>" +
                itemText +
                "<td class='twms-text-right'>$" +
                format_money(Math.round(pricePerPiece * 100) / 100) +
                "</td><td class='twms-text-center'>" +
                format_number(itemCount) +
                "</td><td class='twms-text-right'>$" +
                format_money(totalPrice) +
                '</td>'
        );

        row.append(cells);
        table.append(row);
    });

    return table;
};

TWMarketScanner.init = function () {
    // test if script already exists
    if ($('#TWMS-menuLink').length) {
        MessageError(
            TWMarketScanner.SCRIPT_NAME +
                ' ' +
                TWMarketScanner.language[TWMarketScanner.languagePrefix]
                    .alreadyInstalled
        ).show();
        return;
    }

    if (TWMarketScanner.SETTING_PREFIX.length < 1) {
        MessageError(
            TWMarketScanner.language[TWMarketScanner.languagePrefix].worldError
        ).show();
        return;
    }

    TWMarketScanner.getSetting();

    TWMarketScanner.setStyle();

    var div = $('<div class="ui_menucontainer">/');
    var link = $(
        '<div id="TWMS-menuLink" class="menulink" title="' +
            TWMarketScanner.SCRIPT_NAME +
            '" >@@svgRadarIcon</div>'
    );
    link.click(function () {
        TWMarketScanner.showSetting();
    });
    var linkBottom = $('<div class="menucontainer_bottom">/');
    div.append(link);
    div.append(linkBottom);

    $('#ui_menubar').append(div);

    if (!TWMarketScanner.setting.power)
        $('#TWMS-menuLink').addClass('power-off');

    TWMarketScanner.getAllScans();
    TWMarketScanner.startTimer();
};

TWMarketScanner.showSetting = function () {
    var buttonsWrapper,
        cancelBtn,
        form,
        checkboxesWrapper,
        footerWrapper,
        checkboxPower,
        checkboxSound,
        info,
        inputItem,
        inputLimit,
        limit,
        row,
        saveBtn,
        savedSetting,
        scrollPane,
        searchText,
        settingWindow;

    savedSetting = TWMarketScanner.setting.data;

    settingWindow = wman
        .open('twms-setting', null)
        .setMiniTitle(
            TWMarketScanner.language[TWMarketScanner.languagePrefix].setting
        )
        .setTitle(
            TWMarketScanner.language[TWMarketScanner.languagePrefix].setting
        )
        .setMinSize(525, 484)
        .setSize(525, 484);

    form = $('<div />');

    checkboxesWrapper = $('<div class="twms-2-columns-wrapper" />');

    checkboxPower = new west.gui.Checkbox(
        TWMarketScanner.language[
            TWMarketScanner.languagePrefix
        ].checkboxPowerLabel
    )
        .setTooltip(
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .checkboxPowerTooltip
        )
        .setSelected(TWMarketScanner.setting.power);

    checkboxSound = new west.gui.Checkbox(
        TWMarketScanner.language[
            TWMarketScanner.languagePrefix
        ].checkboxSoundLabel
    )
        .setTooltip(
            TWMarketScanner.language[TWMarketScanner.languagePrefix]
                .checkboxSoundTooltip
        )
        .setSelected(TWMarketScanner.setting.sound);

    checkboxesWrapper.append(checkboxPower.getMainDiv());
    checkboxesWrapper.append(checkboxSound.getMainDiv());
    form.append(checkboxesWrapper);

    for (let i = 0; i < TWMarketScanner.MAX_OFFERS; i += 1) {
        row = $("<div class='twms-form-row'/>");
        inputItem = new west.gui.Textfield('item-' + (i + 1));
        inputItem
            .setLabel(
                TWMarketScanner.language[TWMarketScanner.languagePrefix]
                    .itemLabel +
                    (i + 1)
            )
            .setId('twms-item-' + (i + 1))
            .setSize(20)
            .maxlength(50);
        if (savedSetting) inputItem.setValue(savedSetting[i].searchText);
        row.append(inputItem.getMainDiv());

        inputLimit = new west.gui.Textfield('limit-' + (i + 1));
        inputLimit
            .setLabel(
                TWMarketScanner.language[TWMarketScanner.languagePrefix]
                    .limitLabel
            )
            .setSize(9)
            .maxlength(9)
            .onlyNumeric()
            .setId('twms-limit-' + (i + 1));
        if (savedSetting) inputLimit.setValue(savedSetting[i].limit);
        row.append(inputLimit.getMainDiv());

        form.append(row);
    }
    buttonsWrapper = $("<div class='twsm-buttonsWrapper' />");
    saveBtn = new west.gui.Button(
        TWMarketScanner.language[TWMarketScanner.languagePrefix].saveButton,
        function () {
            var settingsToSave = [],
                i;

            for (i = 0; i < TWMarketScanner.MAX_OFFERS; i += 1) {
                searchText = $('#twms-item-' + (i + 1))
                    .val()
                    .trim();
                limit = $('#twms-limit-' + (i + 1))
                    .val()
                    .trim();

                settingsToSave.push({ searchText, limit });
            }

            localStorage.setItem(
                TWMarketScanner.SETTING_PREFIX,
                JSON.stringify({
                    power: checkboxPower.isSelected() ? 'on' : 'off',
                    sound: checkboxSound.isSelected() ? 'on' : 'off',
                    setting: settingsToSave,
                })
            );
            TWMarketScanner.setting.data = settingsToSave;
            TWMarketScanner.setting.power = checkboxPower.isSelected();
            TWMarketScanner.setting.sound = checkboxSound.isSelected();

            TWMarketScanner.stopTimer();

            if (checkboxPower.isSelected()) {
                // eslint-disable-next-line no-console
                console.log(
                    'Spouštím skenovaní po uložení nastavení a zapínám timer'
                );
                $('#TWMS-menuLink').removeClass('power-off');
                TWMarketScanner.getAllScans();
                TWMarketScanner.startTimer();
            } else {
                $('#TWMS-menuLink').addClass('power-off');
            }

            settingWindow.destroy();
        }
    );
    cancelBtn = new west.gui.Button(
        TWMarketScanner.language[TWMarketScanner.languagePrefix].closeButton,
        function () {
            settingWindow.destroy();
        }
    );

    footerWrapper = $('<div class="twms-2-columns-wrapper" />');

    info = $(
        "<a href='@@homepage' target='_blank' class='twsm-infoText'>" +
            TWMarketScanner.SCRIPT_NAME +
            ' v. ' +
            TWMarketScanner.VERSION +
            '</a>'
    );

    footerWrapper.append(info);
    buttonsWrapper.append(saveBtn.getMainDiv(), cancelBtn.getMainDiv());
    footerWrapper.append(buttonsWrapper);
    scrollPane = new west.gui.Scrollpane();
    scrollPane.appendContent(form).appendContent(footerWrapper);

    settingWindow.appendToContentPane(scrollPane.getMainDiv());
};

$(document).ready(function () {
    try {
        TWMarketScanner.init();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e.stack); /* RemoveLogging:skip */
    }
});
