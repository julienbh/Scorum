vex.defaultOptions.className = 'vex-theme-default'

var data = chrome.storage.local.get(['wif', 'username'], function (result) {
    if (result.wif == null || result.username == null) {
        return;
    }
    $('#username').val(result.username);
    $('#wif').val(result.wif);
});


 

$(document).on('click', '#save',
    save);

$(document).on('click', '#reset',
    function(){
        var username = "";
        var wif = "";
        $('#username').val(username);
        $('#wif').val(wif);
        chrome.storage.local.set(
            { "wif": $('#wif').val(), "username": $('#username').val() });

    });

function save() {
    console.log('saving...')
    var username = $('#username').val();
    var wif = $('#wif').val();

    if (username == null || wif && wif.length != 51)
        console.error('bad username or password');
    else {
        chrome.storage.local.set(
            { "wif": $('#wif').val(), "username": $('#username').val() });
        window.close()
    }
}