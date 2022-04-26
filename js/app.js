var secondsToTime = function (secodns) {
    var min = Math.floor(secodns / 60);
    var sec = Math.floor(secodns) % 60;

    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
};
function isEditorEnabled() {
    return $('.ct-toolbox').length != 0;
}

function getScrollHeight($element) {
    var $e = $element.get(0);

    return Math.max(
        $e.scrollHeight,
        $e.offsetHeight,
        $e.clientHeight
    );
}

function scrollPage($target) {
    var windowTop = $(window).scrollTop();
    var topPosition = $('.page-top').outerHeight();

    if ($target.length) {
        topPosition = Math.round($target.offset().top);
    }

    pageHeader.$.addClass('fixed');

    setTimeout(function () {
        var headerH = pageHeader.getCurrentHeight();

        if (!headerH || headerH > 94) {
            headerH = 94;
        }

        var scrollTop = topPosition - headerH;

        var scrollDiff = scrollTop - windowTop;

        if (windowTop > scrollTop) {
            scrollDiff = windowTop -scrollTop
        }

        if (scrollDiff > 0) {
            var animationSpeed = 750;

            if (scrollDiff / 5 > animationSpeed) {
                animationSpeed = scrollDiff / 5;
            }
            $('html, body').animate({ scrollTop: scrollTop }, animationSpeed);
        }

    }, 500);
}

function fixHeight() {
    var $heightFix = $('.js-height-fix');

    if ($heightFix.length) {
        var windowW = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;

        var windowH = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;

        $heightFix.each(function () {
            var $this = $(this);
            $this.css('height', '');

            var screenH = screen.availHeight;

            if (windowW > windowH && screen.width != windowW) {
                screenH = screen.availWidth;
            }

            var fixContentH = $this.find('.js-height-fix-inner').outerHeight();
            var compareH = screenH - parseInt($this.css('paddingBottom'));

            if (!$this.is('.js-top-height-fix')) {
                compareH -= pageHeader.getCurrentHeight();

                if (screenH > fixContentH) {
                    screenH = compareH;
                }
            }

            if (fixContentH > compareH) {
                screenH = fixContentH;

                if ($this.is('.js-top-height-fix')) {
                    screenH += parseInt($this.css('paddingBottom')) + pageHeader.getCurrentHeight();
                }
            }

            $this.css('height', screenH);
        });
    }
}

new WOW({ mobile: false }).init();

$(function () {
    var $body = $('body');
    var $window = $(window);

    //Chrome iOs
    if (/CriOS/i.test(navigator.userAgent) && /(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
        window.onresize = function () {
            var delay = 200;

            if (pageHeader.$.is('.nav-opened')) {
                $('.js-height-fix').each(function () {
                    $(this).css('height', '');
                });

                delay = 500;
            }

            setTimeout(fixHeight, delay);
        };

        fixHeight();
    }

    //WOW JS isMobile check
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        var $portfolioImg = $('.portfolio-item').find('img.wow');

        if ($portfolioImg.length) {
            $portfolioImg.each(function () {
                $(this).addClass('no-scale');
            });
        }
    }

    if ($window.width() >= 768) {
        var videoHolder = $('.page-top').find('.video-holder');

        if (videoHolder.length != 0) {
            var videoSrc = videoHolder.data('src');
            var $video = videoHolder.find('video');

            $video.on('progress', function () {
                if(!$video.get(0).paused) {
                    if (!$video.is(':visible')) {
                        videoHolder.fadeIn();
                    }
                }
            });

            $video.attr('src', videoSrc);
        }
    }

    var neededString = $('.member-description p b');

    if (neededString.length) {
        neededString.each(function() {
            var $this = $(this),
                text = $this.text(),
                newText = text.replace(/\//g, '/ ').replace(/\s{2,}/g, ' ');

            $this.text(newText);
        });
    }

    $window.on('scroll', function () {

        pageHeader.toggleFixed();

        if (popupWindow.$.length != 0 && $body.is('.popup-opened')) {
            popupWindow.setup.offsetTop();
        }

        Chat.notification.$.css('bottom', '');

        if (!$body.is('.chat-opened')) {
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            var bottom = $body.outerHeight() + scrollTop;
            var footerH = $body.find('footer').outerHeight();
            var bottomDiff = footerH + parseInt(Chat.notification.$.css('bottom'));
            var toBottom = getScrollHeight($body);

            if (toBottom <= bottom + Chat.notification.$.outerHeight()) {
                if ($window.width() >= 768) {
                    Chat.notification.$.css('bottom', bottom + bottomDiff - toBottom);
                }
            }
        }

    }).on('resize', function () {
        Chat.notification.$.css('bottom', '');

        if (popupWindow.$.length != 0 && $body.is('.popup-opened')) {
            popupWindow.setup.position();
            popupWindow.setup.offsetTop();
        }

        if (pageHeader.$.is('.nav-opened')) {
            $('html, body').css({ 'overflow': '', 'height': '' });
            pageHeader.$.css('height', '').removeClass('nav-opened');
        }

        if ($('.presentation-video-holder:visible').length == 0) {
            $('html, body').css({ 'overflow': '', 'height': '' });
        }

        Chat.$elements.messageHolder.trigger('scroll');

    }).on('load', function () {
        Chat.notification.show();

        $.get(Chat.$elements.holder.attr('data-conversations'), {
            before: Chat.before
        }).done(function (response) {
            var messages = response.messages;

            if (messages.length != 0) {
                var lastUnseenMessage = null;
                for (var k in messages) {
                    messages[k].id = parseInt(messages[k].id);
                    Chat.addMessage(messages[k], true);

                    if (lastUnseenMessage === null && !messages[k].is_by_user && !messages[k].is_seen) {
                        lastUnseenMessage = messages[k];
                    }

                    Chat.after = Math.max(Chat.after, messages[k].id);
                    if (Chat.before == -1 || Chat.before > messages[k].id) {
                        Chat.before = messages[k].id;
                    }
                }

                if (lastUnseenMessage !== null) {
                    Chat.notify(lastUnseenMessage.body)
                }

                Chat.loop();
            }

            if (!response.isWelcomed) {
                setTimeout(function () {
                    Chat.showWelcomeMessage();

                }, 5000);
            }

            Chat.changeStatus(response.isOnline, response.anonymous);
        });

        // Chat messages scrolling
        Chat.$elements.messageHolder.on('scroll', function () {
            var $this = $(this);
            var bottom = $this.outerHeight() + $this.scrollTop();

            Chat.toBottom = getScrollHeight($this) === bottom;
        });
    });

    $body.on('vclick', '.scroll-down, .js-scroll-down', function (e) {
        e.preventDefault();

        //if (!isEditorEnabled()) {
            //var $this = $(this).attr("href");

            /*if ($this.is('.js-prevent-scroll-down')) {
                return false;
            }*/
            var $this = $(this);
            //var target = $this.data('target');
            var target = $(this).attr("href");
            var $target = $(target);

            if ($this.is('.js-portfolio-scroll')) {
                $target = $this.parent().next();
            }

            scrollPage($target);
        //}

    }).on('vclick', '.nav-toggle', function () {
        var windowHeight = $window.height();
        var height = pageHeader.getCurrentHeight();
        var dataHeight = pageHeader.$.data('height');

        $('html, body').css({ 'overflow': '', 'height': '' });

        if (!dataHeight) {
            pageHeader.$.data('height', height);
        }

        if (!pageHeader.$.is('.nav-opened')) {

            height = pageHeader.getInnerHeight();

            if (windowHeight > pageHeader.getInnerHeight()) {
                height = windowHeight;
            }

            $('html').css('overflow-y', 'scroll');
            $body.css('overflow', 'hidden');
        }

        if (pageHeader.$.is('.nav-opened')) {
            height = dataHeight;
        }

        pageHeader.$.height(height).toggleClass('nav-opened');

        return false;

    }).on('vclick', '.close-popup', function () {
        if (!isEditorEnabled()) {
            popupWindow.close();
        }

        return false;
    });

    var hash = document.location.hash;

    if (hash) {
        var $scrollDown = $('a[href="'+hash+'"]');

        if ($scrollDown.length) {
            if ($scrollDown.data('hash-animate') == undefined) {
                $scrollDown.trigger('vclick');
            }
        }
    }

    var $playerHolder = $('.presentation-video-holder');
    var $playPresentation = $('#playPresentation');

    /*
        Youtube Video
    */
    onYouTubeIframeAPIReady = function () {
        var updateCurrentTime;

        presentationPlayer = new YT.Player('videoPresentation', {
            videoId: $('#videoPresentation').data('video'),
            width: '100%',
            height: '100%',
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'showinfo' : 0
            },
            events: {
                onReady: function (event) {
                    $playPresentation.removeClass('disabled');
                },
                onStateChange: function (event) {
                    if (event.data == YT.PlayerState.PLAYING) {
                        updateCurrentTime = setInterval(function () {
                            $('#presentationCurrentTime').text(secondsToTime(presentationPlayer.getCurrentTime()));
                        }, 1000);
                    }

                    if (event.data == YT.PlayerState.ENDED || event.data == YT.PlayerState.PAUSED) {
                        clearInterval(updateCurrentTime);
                    }
                }
            }
        });
    };

    $playPresentation.on('vclick', function (e) {
        if (!isEditorEnabled()) {
            e.preventDefault();

            if ($(this).is('.disabled')) {
                return false;
            }

            $('#presentationDuration').text(secondsToTime(presentationPlayer.getDuration()));
            $('#presentationCurrentTime').text(secondsToTime(presentationPlayer.getCurrentTime()));

            $playerHolder.show();
            $('html, body').css('overflow', 'hidden');

            if (!/(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent)) {
                presentationPlayer.playVideo();
            }
        }
    });

    $('#closeVideoPresentation').on('vclick', function (e) {
        e.preventDefault();

        $playerHolder.hide();
        $('html, body').css('overflow', '');

        presentationPlayer.pauseVideo().seekTo(0);
    });

    $('.contacts form [type="radio"]').each(function () {
        $(this).val($.trim($(this).parent().text()));
    });

    //Form submit
    $('.js-form').on('submit', function (e) {
        e.preventDefault();

        if (!isEditorEnabled()) {
            Form.submit($(this));
        }
    });

    // Hide form errors
    $('.input-holder').on('input change propertychange', 'input, textarea', function () {
        var $input = $(this);
        var $errorHolder = $input.parents('.input-holder.error');

        if ($errorHolder.length != 0) {
            $errorHolder.removeClass('error');
            $errorHolder.find('.error-message').text('');
        }
    });

    var $solutionContent = $('.solution-content');

    $('.solution-menu-bubble').on('vclick', function () {
        var $bubble = $(this);

        if ($bubble.is('.active')) {
            return;
        }

        $solutionContent.find('.slide-arrow').removeClass('hidden');

        var isFirst = $bubble.parent().prev().length == 0;
        var isLast = $bubble.parent().next().length == 0;

        if (isFirst) {
            $solutionContent.find('a[href="#prev"]').addClass('hidden');
        }

        if (isLast) {
            $solutionContent.find('a[href="#next"]').addClass('hidden');
        }

        var index = $bubble.data('index');

        $('.solution-menu-bubble.active').removeClass('active');
        $bubble.addClass('active');

        contentSlider.slide('.solution-content-inner', index);

        return false;
    });

    $solutionContent.find('.slide-arrow').on('vclick', function (e) {
        e.preventDefault();

        var $arrow = $(this);
        var $activeBubble = $('.solution-menu').find('.active');
        var $triggerBubble = $activeBubble.parent().next();

        if ($arrow.is('a[href="#prev"]')) {
            $triggerBubble = $activeBubble.parent().prev();
        }

        $triggerBubble.find('.solution-menu-bubble').trigger('vclick');
    });

    // Open chat
    $('.js-chat-open').on('vclick', function (e) {
        e.preventDefault();

        $.get(Chat.$elements.holder.attr('data-update'), {
            after: Chat.after
        }).done(function (response) {

            if (response.messages.length) {
                Chat.loop();
            }

            Chat.changeStatus(response.isOnline, response.anonymous);
        }).always(function () {
            Chat.open();
        });

        return false;
    });

    // Close chat
    $('.js-chat-close').on('vclick', function (e) {
        e.preventDefault();

        Chat.close();

        return false;
    });

    // Chat post
    $('.js-chat-form').on('submit', function (e) {
        e.preventDefault();

        var $form = $(this);

        Form.checkEmpty($form);

        if ($form.find('.input-holder.error').length == 0 && !Form.isBusy) {
            Form.isBusy = true;

            $.post($form.attr('action'), $form.serialize()+'&'+$.param({
                '_token': Chat.token
            })).done(function (response) {
                Chat.update();

                $form[0].reset();

                if (typeof Chat.updateTimeout === 'undefined') {
                    Chat.loop();
                }

            }).fail(function (response) {
                var errors = response.responseJSON;

                Form.showError($form, errors);
            }).always(function () {
                Form.isBusy = false;
            });
        }
    });

    // Chat message focus
    $('.js-chat-text-input').on('focus', function () {

        if (typeof Chat.updateTimeout === 'undefined') {
            var $errorHolder = $('.js-chat-form').find('.input-holder.error');

            if ($errorHolder.length) {
                $errorHolder.find('input').trigger('change');
            }

            var $request;
            if ($request != null){
                $request.abort();
                $request = null;
            }

            $request = $.get(Chat.$elements.holder.attr('data-update'), {
                after: Chat.after
            }).done(function (response) {
                Chat.changeStatus(response.isOnline, response.anonymous);
            });
        }
    });

    // Paginate News
    $body.on('vclick', '.js-paginate-news', function (ev) {
        ev.preventDefault();

        var $this = $(this);

        if ($this.is('.active')) {
            return;
        }

        var $parent = $this.parents('.js-paginate-holder');
        var page = $this.data('page');
        var link = $parent.data('link');
        link = link.replace('--PAGE--', page);
        var target = $parent.data('target');

        $.ajax({ url: link }).success(function(response) {
            $('html, body').scrollTop($this.parents('.js-blog-page').offset().top - pageHeader.getCurrentHeight());

            $(target).fadeOut(function () {
                $(this).html(response).fadeIn();
            })
        });
    });

    // Share News
    $('.js-social-share').on('vclick', function (ev) {
        ev.preventDefault();

        var $share = $(this);

        var url = $share.attr('href');
        if (url == '#') {
            url = location.href;
        }

        if ($share.is('.js-share-facebook')) {
            FB.ui({
                method: 'share',
                href: url
            }, function(response) {});

            return false;
        }

        /*var title = $(this).attr('data-title');

        var $titleHolder = $('.js-title-holder');
        if ($titleHolder.length) {
            title = $.trim($titleHolder.text()).replace(/\s\s+/g, ' ');
        }

        if (!title) {
            title = $('title').text();
        }

        if ($share.is('.js-share-twitter')) {
            window.open(
                'http://twitter.com/share?url=' + url + '&hashtags=uxdesignagency,uxda&text=' + encodeURIComponent(title),
                'twitter_share', 'width=550, height=450, menubar=1, resizable=1'
            );
        }

        if ($share.is('.js-share-linked')) {
            var description = $share.attr('data-description');
            if (!description) {
                description = $('meta[property="og:description"]').attr('content');
            }

            window.open(
                'https://www.linkedin.com/shareArticle?mini=true&url=' + url + '&title=' + encodeURIComponent(title) + '&summary= '+ encodeURIComponent(description),
                'linkedin_share', 'width=520, height=570, menubar=1, resizable=1'
            );
        }

        return false;*/
    });

    // Play gif image
    $body.on('vclick', '.js-img-gif', function () {
        if (!isEditorEnabled()) {
            var $img = $(this);
            var src = $img.data('gif');
            var $gifHolder = $img.parents('.gif-holder');

            $gifHolder.addClass('is-loading is-playing');

            $img.on('load', function () {
                $gifHolder.removeClass('is-loading');
            });

            $img.attr('src', src).removeClass('js-img-gif');

            return false;
        }
    }).on('vclick', '.js-play-gif', function() {
        $(this).siblings('.js-img-gif').trigger('vclick');
    });

}); var onYouTubeIframeAPIReady, presentationPlayer;