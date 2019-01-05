scorum.api.setOptions({ url: 'https://prodnet.scorum.com' });
scorum.config.set('chain_id', 'db4007d45f04c1403a7e66a5c66b5b1cdfc2dde8b5335d1d2f116d592ca3dbb1');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // todo
    if (window.location.pathname.indexOf('/profile/@') !== -1) {
        $('.profile-icons').append('<span class="font-weight-bold text-white ml-0_5 mr-3 delegate">Delegate</span>')

    }
});

$(document).on('click', '.delegate', function () {
    var name = window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);
    var confirmed = confirm('are you sure you want to delegate to ' + name + '?');
    if (!confirmed) return;
    
    var data = chrome.storage.local.get(['wif', 'username'], function (result) {
        scorum.broadcast.delegateScorumpower(result.wif, result.username, 'waveyourflags', '0.000000000 SP', function (err, result) {
            console.log(err, result);
        });
    });


});

