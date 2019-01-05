
scorum.api.setOptions({ url: 'https://prodnet.scorum.com' });
scorum.config.set('chain_id', 'db4007d45f04c1403a7e66a5c66b5b1cdfc2dde8b5335d1d2f116d592ca3dbb1');
vex.defaultOptions.className = 'vex-theme-default'; 

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // todo
    if (window.location.pathname.indexOf('/profile/@') !== -1) {
        $('.profile-icons').append('<span class="font-weight-bold text-white ml-0_5 mr-3 delegate">Delegate</span>')

    }
});

$(document).on('click', '.delegate', function () {
    var delegatee = window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);

    var data = chrome.storage.local.get(['wif', 'username'], function (result) {
        if (result.wif == null || result.username == null){
        vex.dialog.alert('Please set your username and wif key in the chrome extension options first. '+
        '\nTo do this, right click on the Scorum extension icon in the top right section of your browser and select OPTIONS. ')
            return;
    }
        vex.dialog.prompt({
            message: 'Delegation to '+delegatee,
            input: '<label for="number">Type the amount you wish to delegate</label>' +
            '<input name="number" type="number" min="0"  max="100000000" step="1">',
            callback: function (value) {
                if (!value) return;
                
                var precisionValue = Number.parseFloat(value).toFixed(9);
                scorum.broadcast.delegateScorumpower(result.wif, result.username, delegatee, precisionValue + ' SP', function (err, delegateResult) {
                    if(err ==null)
                        vex.dialog.alert({
                            message: 'Success!\n'+delegateResult.id,
                            
                    })
                    console.log(err, result);

                }); 
//'0.000000000 SP'
                }
        })
    
   

    });


});

