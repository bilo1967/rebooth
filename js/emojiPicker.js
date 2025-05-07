function pasteHtmlAtCaret(html) {
    var sel, range;
    if (window.getSelection) {
        // Modern browsers
        sel = window.getSelection();
        
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            
            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
}

(function ($) {
	$.fn.emojiPicker = function (arg, params) {
        
        
        var elemId = null,
            bindElem = null,
            $bindElem = null,
            onSelect = () => {},
            settings = {};
        
		var defaults = {
			emojis: [
                '&#x1F642;', '&#x1f600;', '&#x1f601;', '&#x1f604;', '&#x1f606;',
                '&#x1f605;', '&#x1f602;', '&#x1f60a;', '&#x1f60b;', '&#x1f60d;',
                
                '&#x1f609;', '&#x1f607;', '&#x1f608;', '&#x1f60c;', '&#x1f60e;',
                '&#x1f634;', '&#x1f62c;', '&#x1f61b;', '&#x1f61c;', '&#x1f61d;', 
                
                '&#x1f619;', '&#x1f618;', '&#x1f637;', '&#x1f60f;', '&#x1f633;',
                '&#x1f644;', '&#x1f615;', '&#x1f624;', '&#x1f620;', '&#x1f621;', 
                

                '&#x1f62f;', '&#x1f632;', '&#x1f635;', '&#x1f631;', '&#x1f613;',
                '&#x1f612;', '&#x1f623;', '&#x1f616;', '&#x1f62b;', '&#x1f629;',  

                
                '&#x1f636;', '&#x1f610;', '&#x1F641;', '&#x1f626;', '&#x1f61f;', 
                '&#x1f625;', '&#x1f630;', '&#x1f62d;', '&#x1f614;', '&#x1f62a;',
                
                
                '&#128049;', '&#x1f638;', '&#x1f639;', '&#x1f63a;', '&#x1f63b;', 
                '&#x1f63c;', '&#x1f63d;', '&#x1f63e;', '&#x1f63f;', '&#x1f640;', 
                
                '&#x1F648;', '&#x1F649;', '&#x1F64A;', '&#128123;', '&#128125;',
                '&#x1f4a9;', '&#x2620;',  '&#127870;', '&#129346;', '&#127874;',
                   
                '&#x1F340;', '&#x1F44C;', '&#x1F44D;', '&#x1F44E;', '&#x1F918;', 
                '&#x1f4aa;', '&#x1f627;', '&#x1f628;', '&#x1f622;', '&#129395;',
                
            ],
            classes: '',
            css: {
                position: "fixed", 
                display: "none", 
                'z-index': 100, 
                background: '#FFFFFF',
                'user-select': 'none',
            },
            emojiClasses: '',
            emojiCSS: {
                cursor: "pointer", 
                width: "28px", 
                'font-size': '20px', 
                padding: '1px',
                display: 'inline-block',
            },
            columns: 10,
            position: 'below-left', // below-right, over-left, over-right
		};
		
        if (typeof arg === 'function') {
            onSelect = arg;
        } else if (typeof arg  === 'string') {
            elemId = arg;
        } else {
            throw "First argument must be a string (tag id) or a callback function";
        }
        
        
		if (!params) {
			settings = defaults;
		} else {
			for (var n in defaults) {
				settings[n] = params[n] ? params[n] : defaults[n];
			}
		}
        
        if (elemId) {
            $bindElem = $('#' + elemId);
            
            if ($bindElem.length == 0) return;
            if ($bindElem.length > 1) throw "You can bind an emojiPicker just to a single input field";
            
            bindElem = $bindElem.get(0);
        }
        

		this.each(function (n, button) {
            
            var $button = $(button);

            $(window).on('resize', closeEmojiPicker);

			$button.on('click', (e) => {
                e.stopPropagation();
                
                if (($pickupList).is(':visible')) {
                    closeEmojiPicker(); 
                } else {
                    showEmojiPicker();
                }
            });


			function showEmojiPicker() {
                
                // Positioning is fixed, with reference to viewport
                // and not to the activating button or the bound element
                var wh = document.body.clientHeight, // viewport height
                    ww = document.body.clientWidth,  // viewport width
                    p = $button.offset(),            // button offset relative to viewport
                    w = $button.outerWidth(),        //    "   width
                    h = $button.outerHeight(),       //    "   height
                    l = p.left,                      //    "   left
                    t = p.top,                       //    "   top
                    r = ww - (l + w),                //    "   right
                    b = wh - (t + h),                //    "   bottom
                    np = { position: 'fixed' };      // where to place picker
/*                   
console.log("=====================================");
console.log('wiewport: ' + ww + "×" + wh);
console.log('w: ' + w);
console.log('h: ' + h);
console.log('l: ' + l);
console.log('t: ' + t);
console.log('r: ' + r);
console.log('b: ' + b);
*/
                switch (settings.position) {
                    case 'over-right':
                    case 'top-right':
                        np.bottom = b + h;
                        np.right = r;
                        break;                
                    case 'over-left':
                    case 'top-left':
                        np.bottom = b + h;
                        np.left = l;
                        break;
                    case 'below-right':
                    case 'bottom-right':
                        np.top = t + h;
                        np.right = r;
                        break;
                    case 'below-left':
                    case 'bottom-left':
                        np.top = t + h;
                        np.left = l;
                        break;
                }

                $pickupList.css(np).show();
                
				if ($bindElem) $bindElem.focus();

                setTimeout(function () {
                    $(document).one('click', () => {
                        closeEmojiPicker();
                    });
                }, 0);
			}

			function closeEmojiPicker() {

				$pickupList.hide();
                $(document).off('click', closeEmojiPicker);
                document.body.focus();
			}

			function clickEmoji(e) {
                
                e.stopPropagation();
                
                onSelect(e.currentTarget.innerHTML);
                
                if (!bindElem) return;


                if ($bindElem.is("input") || $bindElem.is("textarea")) {
                    if (bindElem.selectionStart || bindElem.selectionStart == '0') {
                        var startPos = bindElem.selectionStart;
                        var endPos = bindElem.selectionEnd;
                        bindElem.value = bindElem.value.substring(0, startPos)
                            + e.currentTarget.innerHTML
                            + bindElem.value.substring(endPos, bindElem.value.length);
                    } else {
                        bindElem.value += e.currentTarget.innerHTML;
                    }
                    // closeEmojiPicker();
                    $bindElem.focus();
                    bindElem.selectionStart = startPos + 2;
                    bindElem.selectionEnd = endPos + 2;
                } else {
                    // let id = window.getSelection().baseNode.parentNode.id || window.getSelection().baseNode.id;

                    pasteHtmlAtCaret(e.currentTarget.innerHTML);
                    // execCommand is deprecated...
                    //document.execCommand('insertText', false, e.currentTarget.innerHTML);
                    
                    $bindElem.focus();
                }
			}

			var $pickupList = $('<div>')
              .addClass(defaults.classes)
              .addClass(settings.classes)
              .css(defaults.css)
              .css(settings.css);
              
            if (!settings.css.width) {
                let c = settings.columns ? settings.columns : defaults.columns,
                    w = settings.emojiCSS.width ? settings.emojiCSS.width : defaults.emojiCSS.width,
                    p = settings.emojiCSS.padding ? settings.emojiCSS.padding : defaults.emojiCSS.padding
                
                $pickupList.css({
                    width: 'calc( ' + c +  ' * ( ' + w + ' + 2 * ' + p + ' ) )'
                });
            }
            
			for (var n in settings.emojis) {
				if (n > 0 && n % settings.columns == 0) {
					$("<br/>").appendTo($pickupList);
				}
				$("<span>")
                    .html(settings.emojis[n])
                    .addClass(defaults.emojiClasses)
                    .addClass(settings.emojiClasses)
                    .css(defaults.emojiCSS)
                    .css(settings.emojiCSS)
                    .on('click', clickEmoji).appendTo($pickupList);
			}

			//$pickupList.insertAfter($button);
            $pickupList.appendTo($('body'));
            

		});
        
		return this;
	};
})(jQuery);        