// PUBLISH
var isPublished = false;
var showPagePips = false;
var showPageCount = false;

// check for Engage
if (isPublished) {
    RemoteMeeting();
} else {
    // default to adding the anims for dev build
    notEngageSoAddAnims();
}

$(function() {

    // links
    var pagesLink = $('.pages-link');
    var refsLink = $('.refs-link');
    var piLink = $('.pi-link');

    // page elements
    var refsOverlay = $('#refs-overlay');
    var references = $('#references');
    var refCloseBtn = $('.ref-close-button');

    var popupOverlay = $('#popup-overlay');
    var popup = $('.popup-link');
    var popCloseBtn = $('.pop-close-button');

    /******************************************************************************
     * Cheeky page flip
     */

    if (!isPublished) {
        var pageName = '.goTo-' + $(location).attr('href').split('/').pop().split('.').shift().replace(/-/g, ' ').toCamelCase();

        var l = $('<input type="button" class="secret-button" id="secret-left" value="&lt;" />');
        var r = $('<input type="button" class="secret-button" id="secret-right" value="&gt;" />');

        $("nav").prepend(r);
        $("nav").prepend(l);

        var nextMenuItem = '', prevMenuItem = '';

        $.getJSON( "../keymessages.json", function( data ) {

            var items = [];

            $.each( data, function( key, val ) {
                items.push(key);
            });

            // exclude 0/1 for pres and shared res
            for (var i=2; i<items.length; i++) {

                if (pageName === '.goTo-' + items[i].replace(/-/g, ' ').toCamelCase()) {

                    if (items[i-1] !== undefined) {
                        prevMenuItem = (i>2) ? items[i-1].replace(/ /g, '-') : '';
                    }
                    if (items[i+1] !== undefined) {
                        nextMenuItem = (i<=items.length-1) ? items[i+1].replace(/ /g, '-') : '';
                    }
                }
            }

            $('.secret-button').on('click', function (e) {

                if ($(this).attr('id') === 'secret-left' && prevMenuItem !== '') {
                    location.href = prevMenuItem + '.html';
                } else
                if ($(this).attr('id') === 'secret-right' && nextMenuItem !== '') {
                    location.href = nextMenuItem + '.html';
                }
            });
        });
    }



    /******************************************************************************
     * Nav submenu link (toggle)
     */
    $('nav').find('span').on('click', function (e) {
        e.preventDefault();

        // show and change colour of selected nav
        var subnav = $(this).siblings('ul');

        if ( $(this).hasClass('open') ) {
            // hide this one
            $(this).removeClass('open');
            $(subnav).removeClass('open');

            subnav.hide();
        } else {
            // hide all subnavs
            $('nav ul').find('ul').hide();
            $('nav').find('*').removeClass('open');

            // show this one
            $(this).addClass('open');
            $(subnav).addClass('open');

            subnav.show();
        }
    });



    /******************************************************************************
     * References link (toggle)
     */

    refsLink.on('click', function (e) {
        e.preventDefault();

        refsOverlay.toggleClass('show');
        references.toggleClass('show');
    });

    /******************************************************************************
     * Popup open link (using data-attr)
     */

    popup.on('click', function (e) {
        e.preventDefault();

        var popupId = $(this).attr('data-popup-id');

        popupOverlay.addClass('show');
        $('body').find('#'+popupId).addClass('show');
    });

    /******************************************************************************
     * Ref close button
     */

    refCloseBtn.on('click', function (e) {
        e.preventDefault();

        refsOverlay.removeClass('show');
        $(this).parent().parent().removeClass('show');//$(this).parent().removeClass('show');
    });

    /******************************************************************************
     * Popup close button
     */

    popCloseBtn.on('click', function (e) {
        e.preventDefault();

        popupOverlay.removeClass('show');
        $(this).parent().parent().removeClass('show');
    });


    /******************************************************************************
     * Links out to other presentations
     *
     */

    /** INSERT LINK TO OTHER PRES HERE **/


    /******************************************************************************
     * VEEVA MENU LINKS
     */

    /** INSERT NEW KEYMESSAGE LINK HERE **/
});

(function($) {
    $.fn.animateNumbers = function(start, stop, commas, duration, delay, ease) {
        return this.each(function() {
            var $this = $(this);
            start = (start !== null) ? start : parseInt($this.text().replace(/,/g, "")) ;
            commas = (commas === undefined) ? true : commas;
            delay = (delay === undefined) ? 0 : delay;

            setTimeout(function () {
                $({value: start}).animate({value: stop}, {
                    duration: duration === undefined ? 1000 : duration,
                    easing: ease === undefined ? "swing" : ease,
                    step: function() {
                        $this.text(Math.floor(this.value));
                        if (commas) { $this.text($this.text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")); }
                    },
                    complete: function() {
                        if (parseInt($this.text()) !== stop) {
                            $this.text(stop);
                            if (commas) { $this.text($this.text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")); }
                        }
                    }
                });
            }, delay);
        });
    };
})(jQuery);

// convert string to camelcase
String.prototype.toCamelCase = function() {
    return this
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/\^(.)/g, function($1) { return $1.toLowerCase(); });
}


/******************************************************************************
 * Nav highlighting
 * String '.goTo-CamelCasePageName'
 */
function highlightNav (pageName) {
    $('nav').find(pageName).each(function (e) {
        $(this).addClass('active');
        $(this).parent().parent().addClass('active');
        $(this).parent().parent().siblings('a').first().addClass('active');

        if (!isPublished || showPageCount) {
            // add section page count to footer
            if (!$(this).hasClass('dummy-page')) {
                var pageCount = ($(this).parent().index() + 1) + ' of ' + ($(this).parent().siblings('li').length + 1);
            }
        }

        // add section page count to footer
        if (showPagePips) {
            if (!$(this).hasClass('dummy-page')) {
                var pageCount = '';
                var active = '';

                for (var i = 0; i < $(this).parent().siblings('li').length + 1; i++) {
                    active = ($(this).parent().index() === i) ? ' class="active" ' : '' ;
                    pageCount += '<div' + active + '></div>';
                }

                $('footer').append('<div id="pageCount">' + pageCount + '</div>');
            }
        }
    });
}

/******************************************************************************
 * Lazyload audio and video
 * String 'audio-file.mp3'
 * String 'video-file.mp4'
 * String 'video-poster.jpg'
 */
var audioClickedAlready = false;
var videoClickedAlready = false;

function insertAudioVideo(a, v, p) {
    $('.popup-link').on('click', function (e) {
        //audio
        if (!audioClickedAlready && $(this).attr('data-popup-id') === 'popup-audio') {
            audioClickedAlready = true;
            $('#popup-audio div.content').append('<audio class="right" controls><source src="./shared/videos/'+a+'" type="video/mp4"></audio>');

            // hide it and then show it...
            $('#popup-audio div').find('audio').css('display', 'none');
            setTimeout(function () {
                $('#popup-audio div').find('audio').css({'display': 'block', 'opacity': 0, 'animation': '0.7s ease-out 0.5s 1 forwards fadeIn'});
            }, 500);
        }
        //video
        if (!videoClickedAlready && $(this).attr('data-popup-id') === 'popup-video') {
            videoClickedAlready = true;
            $('#popup-video div.content').append('<video poster="./shared/imgs/'+p+'" controls><source src="./shared/videos/'+v+'" type="video/mp4"></video>');

            // hide it and then show it...
            $('#popup-video div').find('video').css('display', 'none');
            setTimeout(function () {
                $('#popup-video div').find('video').css({'display': 'block', 'opacity': 0, 'animation': '0.7s ease-out 0.5s 1 forwards fadeIn'});
            }, 500);
        }
    });
}

/******************************************************************************
 * Veeva - Detect if Engage
 */
function RemoteMeeting() {
    com.veeva.clm.getDataForCurrentObject("Call", "Remote_meeting_vod__c", ShowRemoteResponses);
}
function ShowRemoteResponses(result) {
    if (result.success === true) {
        alert("Remote_meeting_vod__c: " + JSON.stringify(result.Call.Remote_meeting_vod__c));

        if (result.Call.Remote_meeting_vod__c === null) {
            // CLM
            notEngageSoAddAnims();
        } else {
            // Engage
        }
    } else {
        alert("result.Call.Remote_meeting_vod__c: fail");

        // F2F iPad
        notEngageSoAddAnims();
    }
}
function notEngageSoAddAnims() {
    var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', cssAnimsFile); // cssAnimsFile is added to page by gulp
    document.getElementsByTagName('head')[0].appendChild(link);
}

function _notEngageSoAddAnims() {}