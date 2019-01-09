
scorum.api.setOptions({ url: 'https://prodnet.scorum.com' });
scorum.config.set('chain_id', 'db4007d45f04c1403a7e66a5c66b5b1cdfc2dde8b5335d1d2f116d592ca3dbb1');
vex.defaultOptions.className = 'vex-theme-default';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (window.location.pathname.indexOf('/profile/@') !== -1) {
        $('.profile-icons').append('<span class="font-weight-bold text-white delegate" title="Delegate">D</span>')

        var delegatee = window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);
        scorum.api.getAccounts([delegatee], function (err, result) {
            if (err) return;
            $('.profile-icons').append('<span class="font-weight-bold text-white ml-0_5" title="The amount delegated">' + Number.parseFloat(result[0].delegated_scorumpower).toFixed(0) + ' SP </span>')
            $('.profile-icons').append('<span class="separator text-white"> | </span>');
            $('.profile-icons').append('<span class="font-weight-bold text-white ml-0_5" title="The amount of delegation received">' + Number.parseFloat(result[0].received_scorumpower).toFixed(0) + ' SP </span>')
        });
    }
    $.initialize(".home-container", function () {
        setTimeout(function () {
            if ($.find(".container.betting").length > 0) return;

            chrome.storage.local.get(['wif', 'username'], function (result) {
                if (result.username == null) return;

                // get bets
                $.ajax({
                    url: "https://bet-api.scorum.com/v1/account/" + result.username + "/bets?is_finished=false&limit=10",
                    contentType: "application/json"
                })
                    .done(function (result) {

                        if (result.length == 0) return;

                        var bettingSpace = $(".home-container").prepend("<div class='container betting'></div>").find(".betting");
                        $(bettingSpace).load(chrome.extension.getURL("betting.html"), function () {

                            var template = $('#template').html();
                            Mustache.parse(template);
                            var rendered = Mustache.render(template, {
                                "matches": result,
                                "toDate": function () { return new Date(this.game.start_time).toDateString() },
                                "matched": function () { return this.unmatched == 0 ? "Matched" : "Unmatched" },
                            });
                            $(".betting-table-body").html(rendered);

                        });
                    });
            });
        });
    });
});


$(document).on('click', '.delegate', function () {
    var delegatee = window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);

    chrome.storage.local.get(['wif', 'username'], function (result) {
        if (result.wif == null || result.username == null) {
            vex.dialog.alert('Please set your username and wif key in the chrome extension options first. ' +
                '\nTo do this, right click on the Scorum extension icon in the top right section of your browser and select OPTIONS. ')
            return;
        }
        vex.dialog.prompt({
            message: 'Delegation to @' + delegatee,
            input: '<label style="font-size: 14px;" for="number">Type the amount you wish to delegate (0 to remove delegation)</label>' +
                '<input name="number" type="number" min="0"  max="100000000" step="1">',
            callback: function (value) {
                if (!value) return;

                var precisionValue = Number.parseFloat(value).toFixed(9);
                scorum.broadcast.delegateScorumpower(result.wif, result.username, delegatee, precisionValue + ' SP', function (err, delegateResult) {
                    if (err == null)
                        vex.dialog.alert({
                            message: 'Success!\nHere is your Transaction Id: ' + delegateResult.id,
                        })
                    console.log(err, result);

                });
            }
        })
    });


});

