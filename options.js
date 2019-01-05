vex.defaultOptions.className = 'vex-theme-default'

var data = chrome.storage.local.get(['wif', 'username'], function (result) {
    if (result.wif == null || result.username == null){
        return;
    }
    $('#username').val(result.username);
    $('#wif').val(result.wif);
});

$(document).on('click', '.saveButton',
    save);

function save() {
    console.log('saving...')
    var username = $('#username').val();
    var wif = $('#wif').val();

    if (username == null || wif == null || wif.length != 51)
        console.error('bad username or password');
    else {
        chrome.storage.local.set(
            { "wif": $('#wif').val(), "username": $('#username').val() });
            window.close()
    }
}