var pageHeader = {
    $: $('.page-header'),
    toggleFixed: function () {
        if ($(window).scrollTop() == 0) {
            pageHeader.$.removeClass('fixed');
        } else {
            if (!pageHeader.$.is('.fixed')) {
                pageHeader.$.addClass('fixed');
            }
        }
    },
    getCurrentHeight: function () {
        return pageHeader.$.outerHeight();
    },
    getInnerHeight: function () {
        return pageHeader.$.find('.header-inner nav').outerHeight();
    }
};

var popupWindow = {
    $: $('.popup-holder'),
    previousScroll: 0,
    open: function($target) {
        if (typeof $target === 'string') {
            $target = $($target);
        }

        if ($target.length == 0) {
            return;
        }

        $('body').addClass('popup-opened');

        popupWindow.$.css({ 'display': 'block' });

        popupWindow.setup.position();
        popupWindow.setup.offsetTop();

        popupWindow.$.addClass('fade-in');
    },
    close: function (onClose) {
        popupWindow.$.removeClass('fade-in');

        setTimeout(function() {
            $('body').removeClass('popup-opened');

            popupWindow.$.css({ 'display': '', 'top': '' });

            if (typeof onClose == 'function') {
                onClose();
            }
        }, 500);
    },
    setup: {
        position: function () {
            var popupHeight = popupWindow.getInnerHolder().outerHeight();

            popupWindow.getInnerHolder().css({ 'top': '', 'margin-top': '0px' });

            if ($(window).height() > popupHeight) {
                var topMargin = popupHeight / 2;

                popupWindow.getInnerHolder().css({ 'top': '50%', 'margin-top': - topMargin + 'px' });
            }
        },
        offsetTop: function () {
            var $window = $(window);
            var windowH = $window.height();
            var currentScroll = $window.scrollTop();
            var popupH = popupWindow.getInnerHolder().outerHeight();
            var topPosition = 0;

            if (windowH < popupH) {
                // scrolling down
                if (currentScroll > popupWindow.previousScroll) {
                    topPosition = (popupH - windowH) * -1;
                }

                if ($('body').is('.popup-opened')) {
                    popupWindow.$.css({ 'top': topPosition + 'px' });
                }
            }

            popupWindow.previousScroll = currentScroll;
        }
    },
    getInnerHolder: function () {
        return popupWindow.$.find('.popup-inner');
    }
};

var contentSlider = {
    slide: function ($selector, index) {
        if (typeof $selector === 'string') {
            $selector = $($selector);
        }

        var $slideToItem = $selector.find('.slide-item:eq('+index+')');

        $selector.find('.slide-item.active').removeClass('active');

        $slideToItem.addClass('active');

        $selector.animate({
            left: '-' + index * 100 + '%'
        });
    }
};

var Form = {
    isBusy: false,

    submit: function ($form) {
        var self = this;

        if (!$form.length) {
            return;
        }

        this.checkEmpty($form);

        if ($form.find('.error').length) {
            this.scrollToError($form);

            return;
        }

        $.post($form.attr('action'), $form.serialize()).success(function () {
            popupWindow.open($form.data('popup'));
            $form[0].reset();
        }).error(function (response) {
            var errors = response.responseJSON;

            for (var k in errors) {
                var $errorHolder = $form.find('[name="'+k+'"]').parents('.input-holder');

                self.showError($errorHolder, errors[k]);
            }
        });
    },

    checkEmpty: function ($form) {
        var self = this;

        $form.find('.input-holder:visible').each(function () {
            var $this = $(this);
            var $input = $this.find(':input');
            var isEmpty = $.trim($input.val()) == '';

            if ($input.is('[type="checkbox"]')) {
                isEmpty = !$input.prop('checked');
            }

            if (isEmpty) {
                self.showError($this, $this.data('error'));
            }
        });
    },
    scrollToError: function ($form) {
        if ($form.find('.error').length != 0) {
            var errorPosition = $form.find('.error:first').offset().top;
            var windowTop = $(window).scrollTop();

            if (windowTop > errorPosition - pageHeader.getCurrentHeight()) {
                $(window).scrollTop(errorPosition - pageHeader.getCurrentHeight());
            }
        }
    },
    showError: function ($holder, text) {
        $holder.addClass('error');
        $holder.find('.error-message').text(text);
    }
};

$.fn.extend({
    animateCss: function (animationName, callback) {
        if (callback === undefined) {
            callback = function () {};
        }

        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        $(this).addClass('animated ' + animationName).one(animationEnd, function() {
            $(this).removeClass('animated ' + animationName);

            callback();
        });
    }
});

var Chat = {
    updateTimeout: undefined,
    token: $('.js-chat-token').val(),
    $elements: {
        holder: $('.js-chat-holder'),
        content: $('.js-chat-content'),
        messageHolder: $('.js-chat-message-holder'),
        messages: $('.js-chat-messages-inner'),
        defaultMessage: $('.js-chat-default-message')
    },
    notification: {
        $: $('.js-chat-notification'),
        $message: $('.js-chat-notification-message'),
        $chatIcon: $('.js-chat-icon'),
        $avatar: $('.js-chat-avatar'),
        $notifyCount: $('.js-notify-count'),
        counter: 0,
        timeOut: undefined,
        updateCount: function (count) {
            if (count == 0) {
                count = '';
            }
            if (count >= 10) {
                count = '9+';
            }

            this.$notifyCount.text(count).animateCss('bounce');
        },
        show: function () {
            if (!this.$chatIcon.is(':visible')) {
                this.$chatIcon.css('display', 'inline-block').animateCss('fadeInRight');
            }
        },
        hide: function () {
            if (this.$chatIcon.is(':visible')) {
                this.$chatIcon.animateCss('fadeOutRight', function () {
                    Chat.notification.$chatIcon.hide();
                });
            }
        },
        showAvatar: function () {
            if (!this.$.is('.is-opened')) {
                Chat.notification.$.addClass('is-opened');
                this.$notifyCount.addClass('notify-green');
                this.$avatar.animateCss('zoomIn');
            }
        },
        showIcon: function () {
            if (this.$.is('.is-opened')) {
                this.$notifyCount.removeClass('notify-green');

                this.$avatar.animateCss('zoomOut', function () {
                    Chat.notification.$.removeClass('is-opened');
                });
            }
        }
    },
    notify: function (message) {
        var self = this;

        if (self.notification.timeOut !== undefined) {
            clearTimeout(self.notification.timeOut);
        }

        if (message !== undefined) {
            self.notification.counter++;
        }

        self.notification.updateCount(self.notification.counter);
        self.notification.$message.css('display', 'inline-block');
        self.notification.showAvatar();
        self.notification.$message.find('p').html(message);
        self.notification.$message.animateCss('flipInX');

        self.notification.timeOut = setTimeout(function () {
            self.notification.$message.animateCss('flipOutX', function () {
                self.notification.$message.css('display', 'none');

                if (!self.isOnline) {
                    self.notification.showIcon();
                }
            });
        }, 10000);

    },
    showWelcomeMessage: function () {
        var message = this.$elements.defaultMessage.find('p').html();

        if (!Chat.isOpened()) {
            Chat.notify(message);
        }

        $.post(this.notification.$.data('welcome'), {
            '_token': Chat.token,
            shown: true
        });
    },
    isAnonymous: null,
    isOnline: null,
    changeStatus: function (isOnline, isAnonymous) {
        var $body = $('body');

        if (isOnline === undefined) {
            isOnline = true;
        }

        isAnonymous = !!isAnonymous;
        isOnline = !!isOnline;
        if (this.isOnline == isOnline && this.isAnonymous == isAnonymous) {
            return;
        }

        this.isAnonymous = isAnonymous;
        this.isOnline = isOnline;

        $body.removeClass('offline anonymous');

        if (isOnline) {
            this.notification.showAvatar();
        }

        if (!isOnline) {
            this.notification.showIcon();
            $body.addClass('offline');

            if (isAnonymous) {
                $body.addClass('anonymous');
            }
        }

        //this.$elements.messageHolder.height(this.$elements.content.outerHeight() - $('.js-chat-form').outerHeight());
    },
    open: function () {
        var $body = $('body');

        this.notification.counter = 0;
        this.notification.updateCount(this.notification.counter);

        $body.addClass('chat-opened');
        $('html, body').css('overflowX', 'hidden');

        this.$elements.holder.show().animateCss('slideInRight', function () {
            $('html, body').css('overflow', '');
        });

        this.toBottom = true;

        this.scrollToBottom();
    },
    close: function () {
        var self = this, $body = $('body');

        $('html, body').css('overflowX', 'hidden');

        self.$elements.holder.animateCss('slideOutRight', function () {
            self.$elements.holder.hide();
            $body.removeClass('chat-opened').height('');
            $('html, body').css('overflow', '');
        });
    },
    isOpened: function () {
        return $('body.chat-opened').length != 0;
    },
    getMessagesHeight: function () {
        return this.$elements.messages.outerHeight(true) + this.$elements.defaultMessage.outerHeight(true);
    },
    toBottom: true,
    scrollToBottom: function () {
        if (this.toBottom) {
            this.$elements.messageHolder.scrollTop(this.getMessagesHeight());
        }
    },
    addMessage: function (message, prepend) {
        var func = 'prepend';
        if (!prepend) {
            func = 'append';
        }

        var template = '.js-chat-message-from';
        if (message.is_by_user) {
            template = '.js-chat-message-to';
        }

        var $message = $(template + '.hidden').clone().removeClass('hidden ' + template);

        $message.find('.js-message-time').text(message.date);
        $message.find('.js-message-text').text(message.body);

        this.$elements.messageHolder.trigger('scroll');

        this.$elements.messages[func]($message);

        this.scrollToBottom();
    },
    before: -1,
    after: null,

    timeout: 2500,
    isBusy: false,
    loop: function () {
        var self = this;

        if (self.updateTimeout !== undefined) {
            clearTimeout(self.updateTimeout);
        }

        self.updateTimeout = setTimeout(function () {
            self.update(function () {
                self.loop();
            });
        }, this.timeout);
    },
    update: function (onDone) {
        var self = this;
        if (self.isBusy) {
            setTimeout(function () {
                self.update(onDone);
            }, 300);
            return;
        }

        self.isBusy = true;
        $.get(self.$elements.holder.attr('data-update'), {
            after: self.after
        }).done(function (response) {
            if (onDone) {
                onDone(response);
            }
            $.each(response.messages, function (k, message) {
                self.addMessage(message);

                if (!self.isOpened() && !message.is_by_user) {
                    self.notify(message.body);
                }

                self.after = Math.max(self.after, parseInt(message.id));
            });

            self.timeout = 10000;
            if (response.isOnline) {
                self.timeout = 2500;
            }

            self.changeStatus(response.isOnline, response.anonymous);
        }).fail(function () {
            self.timeout = 5000;
            self.loop();
        }).always(function () {
            self.isBusy = false;
        });
    }
};