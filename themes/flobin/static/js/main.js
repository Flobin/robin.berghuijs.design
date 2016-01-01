/*!
 * headroom.js v0.6.0 - Give your page some headroom. Hide your header until you need it
 * Copyright (c) 2014 Nick Williams - http://wicky.nillia.ms/headroom.js
 * License: MIT
 */

(function(window, document) {

  'use strict';

  /* exported features */
  
  var features = {
    bind : !!(function(){}.bind),
    classList : 'classList' in document.documentElement,
    rAF : !!(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame)
  };
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
  
  /**
   * Handles debouncing of events via requestAnimationFrame
   * @see http://www.html5rocks.com/en/tutorials/speed/animations/
   * @param {Function} callback The callback to handle whichever event
   */
  function Debouncer (callback) {
    this.callback = callback;
    this.ticking = false;
  }
  Debouncer.prototype = {
    constructor : Debouncer,
  
    /**
     * dispatches the event to the supplied callback
     * @private
     */
    update : function() {
      this.callback && this.callback();
      this.ticking = false;
    },
  
    /**
     * ensures events don't get stacked
     * @private
     */
    requestTick : function() {
      if(!this.ticking) {
        requestAnimationFrame(this.rafCallback || (this.rafCallback = this.update.bind(this)));
        this.ticking = true;
      }
    },
  
    /**
     * Attach this as the event listeners
     */
    handleEvent : function() {
      this.requestTick();
    }
  };
  /**
   * Helper function for extending objects
   */
  function extend (object /*, objectN ... */) {
    if(arguments.length <= 0) {
      throw new Error('Missing arguments in extend function');
    }
  
    var result = object || {},
        key,
        i;
  
    for (i = 1; i < arguments.length; i++) {
      var replacement = arguments[i] || {};
  
      for (key in replacement) {
        if(typeof result[key] === 'object') {
          result[key] = extend(result[key], replacement[key]);
        }
        else {
          result[key] = result[key] || replacement[key];
        }
      }
    }
  
    return result;
  }
  
  /**
   * Helper function for normalizing tolerance option to object format
   */
  function normalizeTolerance (t) {
    return t === Object(t) ? t : { down : t, up : t };
  }
  
  /**
   * UI enhancement for fixed headers.
   * Hides header when scrolling down
   * Shows header when scrolling up
   * @constructor
   * @param {DOMElement} elem the header element
   * @param {Object} options options for the widget
   */
  function Headroom (elem, options) {
    options = extend(options, Headroom.options);
  
    this.lastKnownScrollY = 0;
    this.elem             = elem;
    this.debouncer        = new Debouncer(this.update.bind(this));
    this.tolerance        = normalizeTolerance(options.tolerance);
    this.classes          = options.classes;
    this.offset           = options.offset;
    this.initialised      = false;
    this.onPin            = options.onPin;
    this.onUnpin          = options.onUnpin;
    this.onTop            = options.onTop;
    this.onNotTop         = options.onNotTop;
  }
  Headroom.prototype = {
    constructor : Headroom,
  
    /**
     * Initialises the widget
     */
    init : function() {
      if(!Headroom.cutsTheMustard) {
        return;
      }
  
      this.elem.classList.add(this.classes.initial);
  
      // defer event registration to handle browser 
      // potentially restoring previous scroll position
      setTimeout(this.attachEvent.bind(this), 100);
  
      return this;
    },
  
    /**
     * Unattaches events and removes any classes that were added
     */
    destroy : function() {
      var classes = this.classes;
  
      this.initialised = false;
      window.removeEventListener('scroll', this.debouncer, false);
      this.elem.classList.remove(classes.unpinned, classes.pinned, classes.top, classes.initial);
    },
  
    /**
     * Attaches the scroll event
     * @private
     */
    attachEvent : function() {
      if(!this.initialised){
        this.lastKnownScrollY = this.getScrollY();
        this.initialised = true;
        window.addEventListener('scroll', this.debouncer, false);
  
        this.debouncer.handleEvent();
      }
    },
    
    /**
     * Unpins the header if it's currently pinned
     */
    unpin : function() {
      var classList = this.elem.classList,
        classes = this.classes;
      
      if(classList.contains(classes.pinned) || !classList.contains(classes.unpinned)) {
        classList.add(classes.unpinned);
        classList.remove(classes.pinned);
        this.onUnpin && this.onUnpin.call(this);
      }
    },
  
    /**
     * Pins the header if it's currently unpinned
     */
    pin : function() {
      var classList = this.elem.classList,
        classes = this.classes;
      
      if(classList.contains(classes.unpinned)) {
        classList.remove(classes.unpinned);
        classList.add(classes.pinned);
        this.onPin && this.onPin.call(this);
      }
    },
  
    /**
     * Handles the top states
     */
    top : function() {
      var classList = this.elem.classList,
        classes = this.classes;
      
      if(!classList.contains(classes.top)) {
        classList.add(classes.top);
        classList.remove(classes.notTop);
        this.onTop && this.onTop.call(this);
      }
    },
  
    /**
     * Handles the not top state
     */
    notTop : function() {
      var classList = this.elem.classList,
        classes = this.classes;
      
      if(!classList.contains(classes.notTop)) {
        classList.add(classes.notTop);
        classList.remove(classes.top);
        this.onNotTop && this.onNotTop.call(this);
      }
    },
  
    /**
     * Gets the Y scroll position
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY
     * @return {Number} pixels the page has scrolled along the Y-axis
     */
    getScrollY : function() {
      return (window.pageYOffset !== undefined)
        ? window.pageYOffset
        : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    },
  
    /**
     * Gets the height of the viewport
     * @see http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript
     * @return {int} the height of the viewport in pixels
     */
    getViewportHeight : function () {
      return window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    },
  
    /**
     * Gets the height of the document
     * @see http://james.padolsey.com/javascript/get-document-height-cross-browser/
     * @return {int} the height of the document in pixels
     */
    getDocumentHeight : function () {
      var body = document.body,
        documentElement = document.documentElement;
  
      return Math.max(
          body.scrollHeight, documentElement.scrollHeight,
          body.offsetHeight, documentElement.offsetHeight,
          body.clientHeight, documentElement.clientHeight
      );
    },
  
    /**
     * determines if the scroll position is outside of document boundaries
     * @param  {int}  currentScrollY the current y scroll position
     * @return {bool} true if out of bounds, false otherwise
     */
    isOutOfBounds : function (currentScrollY) {
      var pastTop  = currentScrollY < 0,
        pastBottom = currentScrollY + this.getViewportHeight() > this.getDocumentHeight();
      
      return pastTop || pastBottom;
    },
  
    /**
     * determines if the tolerance has been exceeded
     * @param  {int} currentScrollY the current scroll y position
     * @return {bool} true if tolerance exceeded, false otherwise
     */
    toleranceExceeded : function (currentScrollY, direction) {
      return Math.abs(currentScrollY-this.lastKnownScrollY) >= this.tolerance[direction];
    },
  
    /**
     * determine if it is appropriate to unpin
     * @param  {int} currentScrollY the current y scroll position
     * @param  {bool} toleranceExceeded has the tolerance been exceeded?
     * @return {bool} true if should unpin, false otherwise
     */
    shouldUnpin : function (currentScrollY, toleranceExceeded) {
      var scrollingDown = currentScrollY > this.lastKnownScrollY,
        pastOffset = currentScrollY >= this.offset;
  
      return scrollingDown && pastOffset && toleranceExceeded;
    },
  
    /**
     * determine if it is appropriate to pin
     * @param  {int} currentScrollY the current y scroll position
     * @param  {bool} toleranceExceeded has the tolerance been exceeded?
     * @return {bool} true if should pin, false otherwise
     */
    shouldPin : function (currentScrollY, toleranceExceeded) {
      var scrollingUp  = currentScrollY < this.lastKnownScrollY,
        pastOffset = currentScrollY <= this.offset;
  
      return (scrollingUp && toleranceExceeded) || pastOffset;
    },
  
    /**
     * Handles updating the state of the widget
     */
    update : function() {
      var currentScrollY  = this.getScrollY(),
        scrollDirection = currentScrollY > this.lastKnownScrollY ? 'down' : 'up',
        toleranceExceeded = this.toleranceExceeded(currentScrollY, scrollDirection);
  
      if(this.isOutOfBounds(currentScrollY)) { // Ignore bouncy scrolling in OSX
        return;
      }
  
      if (currentScrollY <= this.offset ) {
        this.top();
      } else {
        this.notTop();
      }
  
      if(this.shouldUnpin(currentScrollY, toleranceExceeded)) {
        this.unpin();
      }
      else if(this.shouldPin(currentScrollY, toleranceExceeded)) {
        this.pin();
      }
  
      this.lastKnownScrollY = currentScrollY;
    }
  };
  /**
   * Default options
   * @type {Object}
   */
  Headroom.options = {
    tolerance : {
      up : 0,
      down : 0
    },
    offset : 0,
    classes : {
      pinned : 'headroom--pinned',
      unpinned : 'headroom--unpinned',
      top : 'headroom--top',
      notTop : 'headroom--not-top',
      initial : 'headroom'
    }
  };
  Headroom.cutsTheMustard = typeof features !== 'undefined' && features.rAF && features.bind && features.classList;

  window.Headroom = Headroom;

}(window, document));
/* InstantClick 3.1.0 | (C) 2014 Alexandre Dieulot | http://instantclick.io/license */

var InstantClick = function(document, location) {
  // Internal variables
  var $ua = navigator.userAgent,
      $isChromeForIOS = $ua.indexOf(' CriOS/') > -1,
      $hasTouch = 'createTouch' in document,
      $currentLocationWithoutHash,
      $urlToPreload,
      $preloadTimer,
      $lastTouchTimestamp,

  // Preloading-related variables
      $history = {},
      $xhr,
      $url = false,
      $title = false,
      $mustRedirect = false,
      $body = false,
      $timing = {},
      $isPreloading = false,
      $isWaitingForCompletion = false,
      $trackedAssets = [],

  // Variables defined by public functions
      $useWhitelist,
      $preloadOnMousedown,
      $delayBeforePreload,
      $eventsCallbacks = {
        fetch: [],
        receive: [],
        wait: [],
        change: []
      }


  ////////// HELPERS //////////


  function removeHash(url) {
    var index = url.indexOf('#')
    if (index < 0) {
      return url
    }
    return url.substr(0, index)
  }

  function getLinkTarget(target) {
    while (target && target.nodeName != 'A') {
      target = target.parentNode
    }
    return target
  }

  function isBlacklisted(elem) {
    do {
      if (!elem.hasAttribute) { // Parent of <html>
        break
      }
      if (elem.hasAttribute('data-instant')) {
        return false
      }
      if (elem.hasAttribute('data-no-instant')) {
        return true
      }
    }
    while (elem = elem.parentNode);
    return false
  }

  function isWhitelisted(elem) {
    do {
      if (!elem.hasAttribute) { // Parent of <html>
        break
      }
      if (elem.hasAttribute('data-no-instant')) {
        return false
      }
      if (elem.hasAttribute('data-instant')) {
        return true
      }
    }
    while (elem = elem.parentNode);
    return false
  }

  function isPreloadable(a) {
    var domain = location.protocol + '//' + location.host

    if (a.target // target="_blank" etc.
        || a.hasAttribute('download')
        || a.href.indexOf(domain + '/') != 0 // Another domain, or no href attribute
        || (a.href.indexOf('#') > -1
            && removeHash(a.href) == $currentLocationWithoutHash) // Anchor
        || ($useWhitelist
            ? !isWhitelisted(a)
            : isBlacklisted(a))
       ) {
      return false
    }
    return true
  }

  function triggerPageEvent(eventType, arg1, arg2, arg3) {
    var returnValue = false
    for (var i = 0; i < $eventsCallbacks[eventType].length; i++) {
      if (eventType == 'receive') {
        var altered = $eventsCallbacks[eventType][i](arg1, arg2, arg3)
        if (altered) {
          /* Update args for the next iteration of the loop. */
          if ('body' in altered) {
            arg2 = altered.body
          }
          if ('title' in altered) {
            arg3 = altered.title
          }

          returnValue = altered
        }
      }
      else {
        $eventsCallbacks[eventType][i](arg1, arg2, arg3)
      }
    }
    return returnValue
  }

  function changePage(title, body, newUrl, scrollY) {
    document.documentElement.replaceChild(body, document.body)
    /* We cannot just use `document.body = doc.body`, it causes Safari (tested
       5.1, 6.0 and Mobile 7.0) to execute script tags directly.
    */

    if (newUrl) {
      history.pushState(null, null, newUrl)

      var hashIndex = newUrl.indexOf('#'),
          hashElem = hashIndex > -1
                     && document.getElementById(newUrl.substr(hashIndex + 1)),
          offset = 0

      if (hashElem) {
        while (hashElem.offsetParent) {
          offset += hashElem.offsetTop

          hashElem = hashElem.offsetParent
        }
      }
      scrollTo(0, offset)

      $currentLocationWithoutHash = removeHash(newUrl)
    }
    else {
      scrollTo(0, scrollY)
    }

    if ($isChromeForIOS && document.title == title) {
      /* Chrome for iOS:
       *
       * 1. Removes title on pushState, so the title needs to be set after.
       *
       * 2. Will not set the title if it’s identical when trimmed, so
       *    appending a space won't do, but a non-breaking space works.
       */
      document.title = title + String.fromCharCode(160)
    }
    else {
      document.title = title
    }

    instantanize()
    bar.done()
    triggerPageEvent('change', false)

    // Real event, useful for combining userscripts, but only for that so it’s undocumented.
    var userscriptEvent = document.createEvent('HTMLEvents')
    userscriptEvent.initEvent('instantclick:newpage', true, true)
    dispatchEvent(userscriptEvent)
  }

  function setPreloadingAsHalted() {
    $isPreloading = false
    $isWaitingForCompletion = false
  }

  function removeNoscriptTags(html) {
    /* Must be done on text, not on a node's innerHTML, otherwise strange
     * things happen with implicitly closed elements (see the Noscript test).
     */
    return html.replace(/<noscript[\s\S]+<\/noscript>/gi, '')
  }


  ////////// EVENT HANDLERS //////////


  function mousedown(e) {
    if ($lastTouchTimestamp > (+new Date - 500)) {
      return // Otherwise, click doesn’t fire
    }

    var a = getLinkTarget(e.target)

    if (!a || !isPreloadable(a)) {
      return
    }

    preload(a.href)
  }

  function mouseover(e) {
    if ($lastTouchTimestamp > (+new Date - 500)) {
      return // Otherwise, click doesn’t fire
    }

    var a = getLinkTarget(e.target)

    if (!a || !isPreloadable(a)) {
      return
    }

    a.addEventListener('mouseout', mouseout)

    if (!$delayBeforePreload) {
      preload(a.href)
    }
    else {
      $urlToPreload = a.href
      $preloadTimer = setTimeout(preload, $delayBeforePreload)
    }
  }

  function touchstart(e) {
    $lastTouchTimestamp = +new Date

    var a = getLinkTarget(e.target)

    if (!a || !isPreloadable(a)) {
      return
    }

    if ($preloadOnMousedown) {
      a.removeEventListener('mousedown', mousedown)
    }
    else {
      a.removeEventListener('mouseover', mouseover)
    }
    preload(a.href)
  }

  function click(e) {
    var a = getLinkTarget(e.target)

    if (!a || !isPreloadable(a)) {
      return
    }

    if (e.which > 1 || e.metaKey || e.ctrlKey) { // Opening in new tab
      return
    }
    e.preventDefault()
    display(a.href)
  }

  function mouseout() {
    if ($preloadTimer) {
      clearTimeout($preloadTimer)
      $preloadTimer = false
      return
    }

    if (!$isPreloading || $isWaitingForCompletion) {
      return
    }
    $xhr.abort()
    setPreloadingAsHalted()
  }

  function readystatechange() {
    if ($xhr.readyState < 4) {
      return
    }
    if ($xhr.status == 0) {
      /* Request aborted */
      return
    }

    $timing.ready = +new Date - $timing.start

    if ($xhr.getResponseHeader('Content-Type').match(/\/(x|ht|xht)ml/)) {
      var doc = document.implementation.createHTMLDocument('')
      doc.documentElement.innerHTML = removeNoscriptTags($xhr.responseText)
      $title = doc.title
      $body = doc.body

      var alteredOnReceive = triggerPageEvent('receive', $url, $body, $title)
      if (alteredOnReceive) {
        if ('body' in alteredOnReceive) {
          $body = alteredOnReceive.body
        }
        if ('title' in alteredOnReceive) {
          $title = alteredOnReceive.title
        }
      }

      var urlWithoutHash = removeHash($url)
      $history[urlWithoutHash] = {
        body: $body,
        title: $title,
        scrollY: urlWithoutHash in $history ? $history[urlWithoutHash].scrollY : 0
      }

      var elems = doc.head.children,
          found = 0,
          elem,
          data

      for (var i = elems.length - 1; i >= 0; i--) {
        elem = elems[i]
        if (elem.hasAttribute('data-instant-track')) {
          data = elem.getAttribute('href') || elem.getAttribute('src') || elem.innerHTML
          for (var j = $trackedAssets.length - 1; j >= 0; j--) {
            if ($trackedAssets[j] == data) {
              found++
            }
          }
        }
      }
      if (found != $trackedAssets.length) {
        $mustRedirect = true // Assets have changed
      }
    }
    else {
      $mustRedirect = true // Not an HTML document
    }

    if ($isWaitingForCompletion) {
      $isWaitingForCompletion = false
      display($url)
    }
  }


  ////////// MAIN FUNCTIONS //////////


  function instantanize(isInitializing) {
    document.body.addEventListener('touchstart', touchstart, true)
    if ($preloadOnMousedown) {
      document.body.addEventListener('mousedown', mousedown, true)
    }
    else {
      document.body.addEventListener('mouseover', mouseover, true)
    }
    document.body.addEventListener('click', click, true)

    if (!isInitializing) {
      var scripts = document.body.getElementsByTagName('script'),
          script,
          copy,
          parentNode,
          nextSibling

      for (i = 0, j = scripts.length; i < j; i++) {
        script = scripts[i]
        if (script.hasAttribute('data-no-instant')) {
          continue
        }
        copy = document.createElement('script')
        if (script.src) {
          copy.src = script.src
        }
        if (script.innerHTML) {
          copy.innerHTML = script.innerHTML
        }
        parentNode = script.parentNode
        nextSibling = script.nextSibling
        parentNode.removeChild(script)
        parentNode.insertBefore(copy, nextSibling)
      }
    }
  }

  function preload(url) {
    if (!$preloadOnMousedown
        && 'display' in $timing
        && +new Date - ($timing.start + $timing.display) < 100) {
      /* After a page is displayed, if the user's cursor happens to be above
         a link a mouseover event will be in most browsers triggered
         automatically, and in other browsers it will be triggered when the
         user moves his mouse by 1px.

         Here are the behavior I noticed, all on Windows:
         - Safari 5.1: auto-triggers after 0 ms
         - IE 11: auto-triggers after 30-80 ms (depends on page's size?)
         - Firefox: auto-triggers after 10 ms
         - Opera 18: auto-triggers after 10 ms

         - Chrome: triggers when cursor moved
         - Opera 12.16: triggers when cursor moved

         To remedy to this, we do not start preloading if last display
         occurred less than 100 ms ago. If they happen to click on the link,
         they will be redirected.
      */

      return
    }
    if ($preloadTimer) {
      clearTimeout($preloadTimer)
      $preloadTimer = false
    }

    if (!url) {
      url = $urlToPreload
    }

    if ($isPreloading && (url == $url || $isWaitingForCompletion)) {
      return
    }
    $isPreloading = true
    $isWaitingForCompletion = false

    $url = url
    $body = false
    $mustRedirect = false
    $timing = {
      start: +new Date
    }
    triggerPageEvent('fetch')
    $xhr.open('GET', url)
    $xhr.send()
  }

  function display(url) {
    if (!('display' in $timing)) {
      $timing.display = +new Date - $timing.start
    }
    if ($preloadTimer || !$isPreloading) {
      /* $preloadTimer:
         Happens when there’s a delay before preloading and that delay
         hasn't expired (preloading didn't kick in).

         !$isPreloading:
         A link has been clicked, and preloading hasn’t been initiated.
         It happens with touch devices when a user taps *near* the link,
         Safari/Chrome will trigger mousedown, mouseover, click (and others),
         but when that happens we ignore mousedown/mouseover (otherwise click
         doesn’t fire). Maybe there’s a way to make the click event fire, but
         that’s not worth it as mousedown/over happen just 1ms before click
         in this situation.

         It also happens when a user uses his keyboard to navigate (with Tab
         and Return), and possibly in other non-mainstream ways to navigate
         a website.
      */

      if ($preloadTimer && $url && $url != url) {
        /* Happens when the user clicks on a link before preloading
           kicks in while another link is already preloading.
        */

        location.href = url
        return
      }

      preload(url)
      bar.start(0, true)
      triggerPageEvent('wait')
      $isWaitingForCompletion = true // Must be set *after* calling `preload`
      return
    }
    if ($isWaitingForCompletion) {
      /* The user clicked on a link while a page was preloading. Either on
         the same link or on another link. If it's the same link something
         might have gone wrong (or he could have double clicked, we don’t
         handle that case), so we send him to the page without pjax.
         If it's another link, it hasn't been preloaded, so we redirect the
         user to it.
      */
      location.href = url
      return
    }
    if ($mustRedirect) {
      location.href = $url
      return
    }
    if (!$body) {
      bar.start(0, true)
      triggerPageEvent('wait')
      $isWaitingForCompletion = true
      return
    }
    $history[$currentLocationWithoutHash].scrollY = pageYOffset
    setPreloadingAsHalted()
    changePage($title, $body, $url)
  }


  ////////// PROGRESS BAR FUNCTIONS //////////


  var bar = function() {
    var $barContainer,
        $barElement,
        $barTransformProperty,
        $barProgress,
        $barTimer

    function init() {
      $barContainer = document.createElement('div')
      $barContainer.id = 'instantclick'
      $barElement = document.createElement('div')
      $barElement.id = 'instantclick-bar'
      $barElement.className = 'instantclick-bar'
      $barContainer.appendChild($barElement)

      var vendors = ['Webkit', 'Moz', 'O']

      $barTransformProperty = 'transform'
      if (!($barTransformProperty in $barElement.style)) {
        for (var i = 0; i < 3; i++) {
          if (vendors[i] + 'Transform' in $barElement.style) {
            $barTransformProperty = vendors[i] + 'Transform'
          }
        }
      }

      var transitionProperty = 'transition'
      if (!(transitionProperty in $barElement.style)) {
        for (var i = 0; i < 3; i++) {
          if (vendors[i] + 'Transition' in $barElement.style) {
            transitionProperty = '-' + vendors[i].toLowerCase() + '-' + transitionProperty
          }
        }
      }

      var style = document.createElement('style')
      style.innerHTML = '#instantclick{position:' + ($hasTouch ? 'absolute' : 'fixed') + ';top:0;left:0;width:100%;pointer-events:none;z-index:2147483647;' + transitionProperty + ':opacity .25s .1s}'
        + '.instantclick-bar{background:#29d;width:100%;margin-left:-100%;height:2px;' + transitionProperty + ':all .25s}'
      /* We set the bar's background in `.instantclick-bar` so that it can be
         overriden in CSS with `#instantclick-bar`, as IDs have higher priority.
      */
      document.head.appendChild(style)

      if ($hasTouch) {
        updatePositionAndScale()
        addEventListener('resize', updatePositionAndScale)
        addEventListener('scroll', updatePositionAndScale)
      }

    }

    function start(at, jump) {
      $barProgress = at
      if (document.getElementById($barContainer.id)) {
        document.body.removeChild($barContainer)
      }
      $barContainer.style.opacity = '1'
      if (document.getElementById($barContainer.id)) {
        document.body.removeChild($barContainer)
        /* So there's no CSS animation if already done once and it goes from 1 to 0 */
      }
      update()
      if (jump) {
        setTimeout(jumpStart, 0)
        /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
      }
      clearTimeout($barTimer)
      $barTimer = setTimeout(inc, 500)
    }

    function jumpStart() {
      $barProgress = 10
      update()
    }

    function inc() {
      $barProgress += 1 + (Math.random() * 2)
      if ($barProgress >= 98) {
        $barProgress = 98
      }
      else {
        $barTimer = setTimeout(inc, 500)
      }
      update()
    }

    function update() {
      $barElement.style[$barTransformProperty] = 'translate(' + $barProgress + '%)'
      if (!document.getElementById($barContainer.id)) {
        document.body.appendChild($barContainer)
      }
    }

    function done() {
      if (document.getElementById($barContainer.id)) {
        clearTimeout($barTimer)
        $barProgress = 100
        update()
        $barContainer.style.opacity = '0'
        /* If you're debugging, setting this to 0.5 is handy. */
        return
      }

      /* The bar container hasn't been appended: It's a new page. */
      start($barProgress == 100 ? 0 : $barProgress)
      /* $barProgress is 100 on popstate, usually. */
      setTimeout(done, 0)
      /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
    }

    function updatePositionAndScale() {
      /* Adapted from code by Sam Stephenson and Mislav Marohnić
         http://signalvnoise.com/posts/2407
      */

      $barContainer.style.left = pageXOffset + 'px'
      $barContainer.style.width = innerWidth + 'px'
      $barContainer.style.top = pageYOffset + 'px'

      var landscape = 'orientation' in window && Math.abs(orientation) == 90,
          scaleY = innerWidth / screen[landscape ? 'height' : 'width'] * 2
      /* We multiply the size by 2 because the progress bar is harder
         to notice on a mobile device.
      */
      $barContainer.style[$barTransformProperty] = 'scaleY(' + scaleY  + ')'
    }

    return {
      init: init,
      start: start,
      done: done
    }
  }()


  ////////// PUBLIC VARIABLE AND FUNCTIONS //////////

  var supported = 'pushState' in history
                  && (!$ua.match('Android') || $ua.match('Chrome/'))
                  && location.protocol != "file:"

  /* The state of Android's AOSP browsers:

     2.3.7: pushState appears to work correctly, but
            `doc.documentElement.innerHTML = body` is buggy.
            See details here: http://stackoverflow.com/q/21918564
            Not an issue anymore, but it may fail where 3.0 do, this needs
            testing again.

     3.0:   pushState appears to work correctly (though the URL bar is only
            updated on focus), but
            `document.documentElement.replaceChild(doc.body, document.body)`
        throws DOMException: WRONG_DOCUMENT_ERR.

     4.0.2: Doesn't support pushState.

     4.0.4,
     4.1.1,
     4.2,
     4.3:   pushState is here, but it doesn't update the URL bar.
            (Great logic there.)

     4.4:   Works correctly. Claims to be 'Chrome/30.0.0.0'.

     All androids tested with Android SDK's Emulator.
     Version numbers are from the browser's user agent.

     Because of this mess, the only whitelisted browser on Android is Chrome.
  */

  function init() {
    if ($currentLocationWithoutHash) {
      /* Already initialized */
      return
    }
    if (!supported) {
      triggerPageEvent('change', true)
      return
    }
    for (var i = arguments.length - 1; i >= 0; i--) {
      var arg = arguments[i]
      if (arg === true) {
        $useWhitelist = true
      }
      else if (arg == 'mousedown') {
        $preloadOnMousedown = true
      }
      else if (typeof arg == 'number') {
        $delayBeforePreload = arg
      }
    }
    $currentLocationWithoutHash = removeHash(location.href)
    $history[$currentLocationWithoutHash] = {
      body: document.body,
      title: document.title,
      scrollY: pageYOffset
    }

    var elems = document.head.children,
        elem,
        data
    for (var i = elems.length - 1; i >= 0; i--) {
      elem = elems[i]
      if (elem.hasAttribute('data-instant-track')) {
        data = elem.getAttribute('href') || elem.getAttribute('src') || elem.innerHTML
        /* We can't use just `elem.href` and `elem.src` because we can't
           retrieve `href`s and `src`s from the Ajax response.
        */
        $trackedAssets.push(data)
      }
    }

    $xhr = new XMLHttpRequest()
    $xhr.addEventListener('readystatechange', readystatechange)

    instantanize(true)

    bar.init()

    triggerPageEvent('change', true)

    addEventListener('popstate', function() {
      var loc = removeHash(location.href)
      if (loc == $currentLocationWithoutHash) {
        return
      }

      if (!(loc in $history)) {
        location.href = location.href
        /* Reloads the page while using cache for scripts, styles and images,
           unlike `location.reload()` */
        return
      }

      $history[$currentLocationWithoutHash].scrollY = pageYOffset
      $currentLocationWithoutHash = loc
      changePage($history[loc].title, $history[loc].body, false, $history[loc].scrollY)
    })
  }

  function on(eventType, callback) {
    $eventsCallbacks[eventType].push(callback)
  }


  ////////////////////


  return {
    supported: supported,
    init: init,
    on: on
  }

}(document, location);

"use strict";

/**
 * Lightbox v0.4
 * Copyright © 2014 Felix Hagspiel - http://jslightbox.felixhagspiel.de
 *
 * @license MIT
 * - Free for use in both personal and commercial projects
 * - Attribution requires leaving author name, author link, and the license info intact
 */

function Lightbox () {
	/*
	* 	Attributes
	*/

	// public
	this.opt = {};
	this.box = false;
	this.wrapper = false;

	// private
	var that = this;
	var isIE8 = false;
	var body = document.getElementsByTagName('body')[0];
	var template = '<div class="jslghtbx-contentwrapper" id="jslghtbx-contentwrapper" ></div>';
	var imgRatio = false; // ratio of current image
	var currGroup = false; // current group
	var currThumbnail = false; // first clicked thumbnail
	var currImage = {}; // currently shown image
	var currImages = []; // images belonging to current group
	var thumbnails = []; // thumbnails
	var isOpen = false; // check if box is open
	var loadingImgSrc; // path to loading image
	// controls
	var nextBtn = false;
	var prevBtn = false;
	// resize-vars
	var maxWidth;
	var maxHeight;
	var wrapperWidth;
	var wrapperHeight;
	var newImgWidth;
	var newImgHeight;

	/*
	* 	Private methods
	*/

	// get correct height in IE8
	function getHeight(){
		return window.innerHeight || document.documentElement.offsetHeight;
	};

	// get correct width in IE8
	function getWidth(){
		return window.innerWidth || document.documentElement.offsetWidth;
	};

	// cross browser eventhandler
	function addEvent(el,e,callback,val){
	    if (el.addEventListener) {
	        el.addEventListener(e,callback, false);
	    } else if (el.attachEvent) {
	        el.attachEvent("on" + e, callback);
	    }
	};

	// check if element has a specific class
	function hasClass(el,className) {
		if(!el || !className){return;}
	    return (new RegExp("(^|\\s)" + className + "(\\s|$)").test(el.className));
	};

	// remove class from element
	function removeClass(el,className) {
		if(!el || !className){return;}
	    el.className = el.className.replace(new RegExp('(?:^|\\s)'+className+'(?!\\S)'),'' );
	    return el;
	};

	// add class to element
	function addClass(el,className) {
		if(!el || !className){return;}
	    if(!hasClass(el,className)) { el.className += ' '+className; }
	    return el;
	};

	// check if obj is set
	function isset(obj) {
		if(typeof obj != 'undefined'){return true;}
		return false;
	};

	// get attributes, cross-browser
	function getAttr(obj,attr) {
		if(!obj || typeof obj == undefined){return false;}
		var ret;
		if(obj.getAttribute){ret=obj.getAttribute(attr);}
		else if(obj.getAttributeNode){ret=obj.getAttributeNode(attr).value;}
		if(typeof ret != undefined && ret != ''){return ret;}
		return false;
	};

	// check attribute, cross-browser
	function hasAttr(obj,attr) {
		if(!obj || typeof obj == undefined){return false;}
		var ret;
		if(obj.getAttribute){ret=obj.getAttribute(attr);}
		else if(obj.getAttributeNode){ret=obj.getAttributeNode(attr).value;}
		if(typeof ret === 'string'){return true;}
		return false;
	};

	// lookup element in browser
	function exists(id){
		if(document.getElementById(id)) {return true;}
		return false;
	}

	// preload next and prev images
	function preload(){
		if(!currGroup){return;}
		var prev = new Image();
		var next = new Image();
		var pos = getPos(currThumbnail,currGroup);
		if(pos === (currImages.length - 1)) {
			prev.src = currImages[currImages.length - 1].src;
			next.src = currImages[0].src;
		} else if(pos === 0) {
			prev.src = currImages[currImages.length - 1].src;
			next.src = currImages[1].src;
		} else {
			prev.src = currImages[pos - 1].src;
			next.src = currImages[pos + 1].src;
		}
	}

	// add clickhandlers to thumbnails
	function clckHlpr(i) {
		addEvent(i,'click',function(e) {
			currGroup = getAttr(i, 'data-jslghtbx-group') || false;
			currThumbnail = i;
			that.open(i);
		});
	};

	// get thumbnails by group
	function getByGroup(group) {
		var arr = [];
		for (var i = 0; i < thumbnails.length; i++) {
			if(getAttr(thumbnails[i],'data-jslghtbx-group') === group) {
				arr.push(thumbnails[i]);
			}
		}
		return arr;
	};

	// get position of thumbnail in group-array
	function getPos(thumbnail, group) {
		var arr = getByGroup(group);
		for (var i = 0; i < arr.length; i++) {
			if(getAttr(thumbnail,'src') === getAttr(arr[i],'src') &&
				getAttr(thumbnail,'data-jslghtbx') === getAttr(arr[i],'data-jslghtbx') ){
				return i;
			}
		}
	};

	// cross-browser stoppropagation
	function stopPropagation(e) {
		if(e.stopPropagation) {e.stopPropagation();}
		else {e.returnValue=false;}	
	}

	// init controls
	function initControls() {
		if(!nextBtn) {
			// create & append next-btn
			nextBtn = document.createElement('span');
			addClass(nextBtn,'jslghtbx-next');
			var nextBtnImg = document.createElement('img');
			nextBtnImg.setAttribute('src', '/assets/build/img/jslghtbx-next.png');
			nextBtn.appendChild(nextBtnImg);
			addEvent(nextBtn,'click',function(e){
				stopPropagation(e); // prevent closing of lightbox
				that.next();
			});
			that.box.appendChild(nextBtn);
		}
		addClass(nextBtn,'jslghtbx-active');
		if(!prevBtn) {
			// create & append next-btn
			prevBtn = document.createElement('span');
			addClass(prevBtn,'jslghtbx-prev');
			var prevBtnImg = document.createElement('img');
			prevBtnImg.setAttribute('src', '/assets/build/img/jslghtbx-prev.png');
			prevBtn.appendChild(prevBtnImg);
			addEvent(prevBtn,'click',function(e){
				stopPropagation(e); // prevent closing of lightbox
				that.prev();
			});
			that.box.appendChild(prevBtn);			
		}
		addClass(prevBtn,'jslghtbx-active');
	};

	// move controls to correct position
	function repositionControls() {
		if(that.opt.responsive && nextBtn && prevBtn) {
			var btnTop = (getHeight() / 2) - (nextBtn.offsetHeight / 2);
			if(isIE8) {
				var cssString = "top: "+btnTop+"px;";
				nextBtn.cssText = cssString;
				prevBtn.cssText= cssString;
			}
			else {
				nextBtn.style.top = btnTop+"px";
				prevBtn.style.top = btnTop+"px";
			}				
		}
	}

	/*
	* 	Public methods
	*/

	// init-function
	this.load = function(opt) {

		// set options
		if(opt){this.opt = opt;}

		// check for IE8
		if(document.attachEvent && ! document.addEventListener) {
			isIE8 = true;
		}

		// load box in custom element
		if(opt && opt.boxId) {
			this.box = document.getElementById(opt.boxId);
		}

		// load box in default element if no ID is given
		else if(!this.box && !exists('jslghtbx')) {
			var newEl = document.createElement('div');
			newEl.setAttribute('id','jslghtbx');
			newEl.setAttribute('class','jslghtbx');
			this.box = newEl;
			body.appendChild(this.box);
		}
		this.box.innerHTML = template;
		if(isIE8) {
			addClass(that.box,'jslghtbx-ie8');
		}
		this.wrapper = document.getElementById('jslghtbx-contentwrapper');

		// initiate default controls
		if(!opt || opt && opt.controls || opt && !isset(opt.controls)) {
			that.opt['controls'] = true;
		}

		// keep dimensions
		if(!opt || opt && opt.dimensions || opt && !isset(opt.dimensions)) {
			that.opt['dimensions'] = true;
		}	

		// add clickhandlers for custom next-button
		if(opt && opt.nextId) {
			addEvent(document.getElementById(opt.nextId),'click',function(){
				that.next();
			});
		}

		// add clickhandlers for custom prev-button
		if(opt && opt.prevId) {
		addEvent(document.getElementById(opt.prevId),'click',function(){
				that.prev();
			});
		}

		// close lightbox on click on given element
		if(opt && opt.closeId) {
			addEvent(document.getElementById(opt.closeId),'click',function(){
				that.close();
			});
		}

		// init regular closebutton
		if(!opt || opt && !opt.hideCloseBtn) {
			var closeBtn = document.createElement('span');
			closeBtn.setAttribute('id','jslghtbx-close');
			closeBtn.setAttribute('class','jslghtbx-close');
			closeBtn.innerHTML = 'X';
			this.box.appendChild(closeBtn);
			addEvent(closeBtn,'click',function(e){
				stopPropagation(e);
				that.close();
			});
		}

		// close lightbox on background-click by default / if true
		if( !isIE8 && (!opt || opt && opt.closeOnClick || opt && !isset(opt.closeOnClick))) {
			addEvent(this.box,'click',function(e){
				that.close();
			});
		}

		// set loading-image
		if(!opt || opt && !isset(opt.loadingImgSrc)) {
			loadingImgSrc = '/assets/build/img/jslghtbx-loading.gif';
		} else {
			loadingImgSrc = opt.loadingImgSrc;
		}
		if(!opt || opt && opt.loadingImg || opt && !isset(opt.loadingImg)) {
			this.opt['loadingImg'] = true;
			var el = document.createElement('img');
			el.setAttribute('src',loadingImgSrc);
			addClass(el,'jslghtbx-loading-img');
			this.box.appendChild(el);
		}

		// set preload-option
		if(!opt || opt && opt.preload || opt && !isset(opt.preload)) {
			this.opt['preload'] = true;
		}

		// set onopen-callback
		if(opt && opt.onopen && typeof opt.onopen === 'function') {
			this.opt['onopen'] = opt.onopen;
		}

		// set onclose-callback
		if(opt && opt.onclose && typeof opt.onclose === 'function') {
			this.opt['onclose'] = opt.onclose;
		}

		// set onresize-callback
		if(opt && opt.onresize && typeof opt.onresize === 'function') {
			this.opt['onresize'] = opt.onresize;
		}

		// set onload-callback
		if(opt && opt.onload && typeof opt.onload === 'function') {
			this.opt['onload'] = opt.onload;
		}

		// set carousel-function for prev/next
		if(!opt || opt && opt.carousel || opt && !isset(opt.carousel)) {
			this.opt['carousel'] = true;
		}

		// set animation-params
		if(!opt || opt && !isset(opt.animation) || opt && isset(opt.animation) && opt.animation === true) {
			that.opt['animation'] = 400; // set default animation time
		}

		// add resize-eventhandlers by default / if true
		if(!opt || opt && opt.responsive  || !isset(opt.responsive)) {
			this.opt['responsive'] = true;
			addEvent(window,'resize',function(e){
				that.resize();
			});
			addClass(this.box,'jslghtbx-nooverflow'); // hide scrollbars on prev/next
		} 
		else {
			removeClass(this.box,'jslghtbx-nooverflow');
		}

		// Find all thumbnails & add clickhandlers
		var arr = document.getElementsByTagName('img');
		for(var i = 0; i < arr.length; i++)
		{
			if(hasAttr(arr[i],'data-jslghtbx')) {
				thumbnails.push(arr[i]);
				clckHlpr(arr[i]);
			}
		}
	};

	this.resize = function() {
		if(!currImage.img){return;}
		maxWidth = getWidth();
		maxHeight = getHeight();
		var boxWidth = that.box.offsetWidth;
		var boxHeight = that.box.offsetHeight;
		if(!imgRatio && currImage.img && currImage.img.offsetWidth && currImage.img.offsetHeight) {
			imgRatio = currImage.img.offsetWidth / currImage.img.offsetHeight;
		}

		// Height of image is too big to fit in viewport
		if( Math.floor(boxWidth/imgRatio) > boxHeight ) {
			newImgWidth = boxHeight*imgRatio*0.8;
			newImgHeight = boxHeight*0.8;
		}
		// Width of image is too big to fit in viewport
		else {
			newImgWidth = boxWidth*0.8;
			newImgHeight = boxWidth/imgRatio*0.8;
		}
		newImgWidth = Math.floor(newImgWidth);
		newImgHeight = Math.floor(newImgHeight);

		// check if image exceeds maximum size
		if( this.opt.dimensions && newImgHeight > currImage.originalHeight ||
			this.opt.dimensions && newImgWidth > currImage.originalWidth) {

			newImgHeight = currImage.originalHeight;
			newImgWidth = currImage.originalWidth;
		}
		currImage.img.setAttribute('width',newImgWidth);
		currImage.img.setAttribute('height',newImgHeight);
		that.box.setAttribute('style','padding-top:'+((getHeight() - newImgHeight) /2)+'px');

		repositionControls();

		// execute resize callback
		if(this.opt.onresize) this.opt.onresize();
	};

	// show next image
	this.next = function() {
		if(!currGroup){return};
		// get position of next image
		var pos = getPos(currThumbnail,currGroup) + 1;  
		if(currImages[pos]) {
			currThumbnail = currImages[pos];	
		} 
		else if(that.opt.carousel) {
			currThumbnail = currImages[0];
		}
		else {
			return;
		}
		if(typeof this.opt.animation === 'number') {
			removeClass(currImage.img,'jslghtbx-animating-next');
			setTimeout(function(){
				that.open(currThumbnail);
				setTimeout(function(){
					addClass(currImage.img,'jslghtbx-animating-next');
				},that.opt.animation / 2)
				
			},this.opt.animation / 2);
		}
		else {
			that.open(currThumbnail);
		}
	};

	// show prev image
	this.prev = function() {
		if(!currGroup){return};
		// get position of prev image
		var pos = getPos(currThumbnail,currGroup) - 1; 
		if(currImages[pos]) {
			currThumbnail = currImages[pos];	
		}
		else if(that.opt.carousel) {
			currThumbnail = currImages[currImages.length - 1];
		}
		else {
			return;
		}
		if(typeof this.opt.animation === 'number') {
			removeClass(currImage.img,'jslghtbx-animating-prev');
			setTimeout(function(){
				that.open(currThumbnail);
				setTimeout(function(){
					addClass(currImage.img,'jslghtbx-animating-prev');
				},that.opt.animation / 2)
				
			},this.opt.animation / 2);
		}
		else {
			that.open(currThumbnail);
		}
	};

	// open the lightbox and show image
	this.open = function(el,group) {
		if(!el){return false;}

		// create new img-element
		currImage.img = new Image();

		// get correct image-source
		var src;
		if(typeof el === 'string') {
			// string with img-src given
			src = el;
		}
		else if(getAttr(el,'data-jslghtbx')) {
			// image-source given
			src =  getAttr(el,'data-jslghtbx');
		}
		else {
			// no image-source given
			src =  getAttr(el,'src');
		}
		imgRatio = false; // clear old image ratio for proper resize-values

		// add init-class on opening, but not at prev/next
		if(!isOpen) {
			addClass(currImage.img,'jslghtbx-animate-transition jslghtbx-animate-init');
			isOpen = true;
			
			// execute open callback
			if(this.opt.onopen) this.opt.onopen();
		}
		
		// hide overflow by default / if set
		if(!this.opt || !isset(this.opt.hideOverflow) || this.opt.hideOverflow ) {
			body.setAttribute('style','overflow: hidden');
		}
		this.box.setAttribute('style','padding-top: 0');
		this.wrapper.innerHTML = '';
		this.wrapper.appendChild(currImage.img);
		addClass(this.box,'jslghtbx-active');

		// show wrapper early to avoid bug where dimensions are not
		// correct in IE8
		if(isIE8) {
			addClass(that.wrapper,'jslghtbx-active');
		}

		// save images if group param was passed or currGroup exists
		group = group || currGroup;
		if(group) {
			currImages = getByGroup(group);
			if(that.opt.controls) {
				initControls();
			}
		}
		// show wrapper when image is loaded
		currImage.img.onload = function(){
			// store original width here
			var dummyImg = new Image();
			dummyImg.setAttribute('src',src);
			currImage.originalWidth = dummyImg.width;
			currImage.originalHeight = dummyImg.height;	
			addClass(that.wrapper,'jslghtbx-wrapper-active');
			var checkClassInt = setInterval(function(){
				if(hasClass(that.box,'jslghtbx-active') && hasClass(that.wrapper,'jslghtbx-wrapper-active'))
				{
					that.resize();
					addClass(currImage.img,'jslghtbx-animate-transition');
					// remove loading-gif
					removeClass(that.box,'jslghtbx-loading');
					// preload previous and next image
					if(that.opt.preload) {
						preload();
					}
					// execute onload callback
					if(that.opt.onload) that.opt.onload();

					clearInterval(checkClassInt);
				}
			},10);
		};

		// set src 
		currImage.img.setAttribute('src',src);

		// add loading-gif if set and if not IE8
		if(this.opt.loadingImg && !isIE8) {
			addClass(this.box,'jslghtbx-loading');
		}
	};

	this.close = function() {
		// restore Defaults
		currGroup = false;
		currThumbnail = false;
		currImage = {};
		currImages = [];
		isOpen = false;
		removeClass(that.box,'jslghtbx-active');
		removeClass(that.wrapper,'jslghtbx-wrapper-active');
		removeClass(nextBtn,'jslghtbx-active');
		removeClass(prevBtn,'jslghtbx-active');
		that.box.setAttribute('style','padding-top: 0px;');

		// Hide Lightbox if iE8
		if(isIE8) {
			that.box.setAttribute('style','display: none;');
		}

		// show overflow by default / if set
		if(!this.opt ||  !isset(this.opt.hideOverflow) || this.opt.hideOverflow ) {
			body.setAttribute('style','overflow: auto');
		}

		// execute close callback
		if(this.opt.onclose) this.opt.onclose();
	};
}


/*!
 * modernizr v3.2.0
 * Build http://modernizr.com/download?-setclasses-dontmin
 *
 * Copyright (c)
 *  Faruk Ates
 *  Paul Irish
 *  Alex Sexton
 *  Ryan Seddon
 *  Patrick Kettner
 *  Stu Cox
 *  Richard Herrera

 * MIT License
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in the
 * current UA and makes the results available to you in two ways: as properties on
 * a global `Modernizr` object, and as classes on the `<html>` element. This
 * information allows you to progressively enhance your pages with a granular level
 * of control over the experience.
*/

;(function(window, document, undefined){
  var classes = [];


  var tests = [];


  /**
   *
   * ModernizrProto is the constructor for Modernizr
   *
   * @class
   * @access public
   */

  var ModernizrProto = {
    // The current version, dummy
    _version: '3.2.0',

    // Any settings that don't work as separate modules
    // can go in here as configuration.
    _config: {
      'classPrefix': '',
      'enableClasses': true,
      'enableJSClass': true,
      'usePrefixes': true
    },

    // Queue of tests
    _q: [],

    // Stub these for people who are listening
    on: function(test, cb) {
      // I don't really think people should do this, but we can
      // safe guard it a bit.
      // -- NOTE:: this gets WAY overridden in src/addTest for actual async tests.
      // This is in case people listen to synchronous tests. I would leave it out,
      // but the code to *disallow* sync tests in the real version of this
      // function is actually larger than this.
      var self = this;
      setTimeout(function() {
        cb(self[test]);
      }, 0);
    },

    addTest: function(name, fn, options) {
      tests.push({name: name, fn: fn, options: options});
    },

    addAsyncTest: function(fn) {
      tests.push({name: null, fn: fn});
    }
  };



  // Fake some of Object.create so we can force non test results to be non "own" properties.
  var Modernizr = function() {};
  Modernizr.prototype = ModernizrProto;

  // Leak modernizr globally when you `require` it rather than force it here.
  // Overwrite name so constructor name is nicer :D
  Modernizr = new Modernizr();



  /**
   * docElement is a convenience wrapper to grab the root element of the document
   *
   * @access private
   * @returns {HTMLElement|SVGElement} The root element of the document
   */

  var docElement = document.documentElement;


  /**
   * A convenience helper to check if the document we are running in is an SVG document
   *
   * @access private
   * @returns {boolean}
   */

  var isSVG = docElement.nodeName.toLowerCase() === 'svg';


  /**
   * setClasses takes an array of class names and adds them to the root element
   *
   * @access private
   * @function setClasses
   * @param {string[]} classes - Array of class names
   */

  // Pass in an and array of class names, e.g.:
  //  ['no-webp', 'borderradius', ...]
  function setClasses(classes) {
    var className = docElement.className;
    var classPrefix = Modernizr._config.classPrefix || '';

    if (isSVG) {
      className = className.baseVal;
    }

    // Change `no-js` to `js` (independently of the `enableClasses` option)
    // Handle classPrefix on this too
    if (Modernizr._config.enableJSClass) {
      var reJS = new RegExp('(^|\\s)' + classPrefix + 'no-js(\\s|$)');
      className = className.replace(reJS, '$1' + classPrefix + 'js$2');
    }

    if (Modernizr._config.enableClasses) {
      // Add the new classes
      className += ' ' + classPrefix + classes.join(' ' + classPrefix);
      isSVG ? docElement.className.baseVal = className : docElement.className = className;
    }

  }

  ;

  /**
   * is returns a boolean if the typeof an obj is exactly type.
   *
   * @access private
   * @function is
   * @param {*} obj - A thing we want to check the type of
   * @param {string} type - A string to compare the typeof against
   * @returns {boolean}
   */

  function is(obj, type) {
    return typeof obj === type;
  }
  ;

  /**
   * Run through all tests and detect their support in the current UA.
   *
   * @access private
   */

  function testRunner() {
    var featureNames;
    var feature;
    var aliasIdx;
    var result;
    var nameIdx;
    var featureName;
    var featureNameSplit;

    for (var featureIdx in tests) {
      if (tests.hasOwnProperty(featureIdx)) {
        featureNames = [];
        feature = tests[featureIdx];
        // run the test, throw the return value into the Modernizr,
        // then based on that boolean, define an appropriate className
        // and push it into an array of classes we'll join later.
        //
        // If there is no name, it's an 'async' test that is run,
        // but not directly added to the object. That should
        // be done with a post-run addTest call.
        if (feature.name) {
          featureNames.push(feature.name.toLowerCase());

          if (feature.options && feature.options.aliases && feature.options.aliases.length) {
            // Add all the aliases into the names list
            for (aliasIdx = 0; aliasIdx < feature.options.aliases.length; aliasIdx++) {
              featureNames.push(feature.options.aliases[aliasIdx].toLowerCase());
            }
          }
        }

        // Run the test, or use the raw value if it's not a function
        result = is(feature.fn, 'function') ? feature.fn() : feature.fn;


        // Set each of the names on the Modernizr object
        for (nameIdx = 0; nameIdx < featureNames.length; nameIdx++) {
          featureName = featureNames[nameIdx];
          // Support dot properties as sub tests. We don't do checking to make sure
          // that the implied parent tests have been added. You must call them in
          // order (either in the test, or make the parent test a dependency).
          //
          // Cap it to TWO to make the logic simple and because who needs that kind of subtesting
          // hashtag famous last words
          featureNameSplit = featureName.split('.');

          if (featureNameSplit.length === 1) {
            Modernizr[featureNameSplit[0]] = result;
          } else {
            // cast to a Boolean, if not one already
            /* jshint -W053 */
            if (Modernizr[featureNameSplit[0]] && !(Modernizr[featureNameSplit[0]] instanceof Boolean)) {
              Modernizr[featureNameSplit[0]] = new Boolean(Modernizr[featureNameSplit[0]]);
            }

            Modernizr[featureNameSplit[0]][featureNameSplit[1]] = result;
          }

          classes.push((result ? '' : 'no-') + featureNameSplit.join('-'));
        }
      }
    }
  }
  ;

  // Run each test
  testRunner();

  // Remove the "no-js" class if it exists
  setClasses(classes);

  delete ModernizrProto.addTest;
  delete ModernizrProto.addAsyncTest;

  // Run the things that are supposed to run after the tests
  for (var i = 0; i < Modernizr._q.length; i++) {
    Modernizr._q[i]();
  }

  // Leak Modernizr namespace
  window.Modernizr = Modernizr;


;

})(window, document);

/*
            _____                 ________                       __
           / ___/______________  / / / __ \___ _   _____  ____ _/ /
           \__ \/ ___/ ___/ __ \/ / / /_/ / _ \ | / / _ \/ __ `/ /
          ___/ / /__/ /  / /_/ / / / _, _/  __/ |/ /  __/ /_/ / /
         /____/\___/_/   \____/_/_/_/ |_|\___/|___/\___/\__,_/_/    v3.0.0

‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
   Copyright 2014–2016 Julian Lloyd (@jlmakes) Open source under MIT license
————————————————————————————————————————————————————————————————————————————————
    https://scrollrevealjs.org — https://github.com/jlmakes/scrollreveal.js
______________________________________________________________________________*/

(function() {
  var Tools, sr, _requestAnimationFrame;

  this.ScrollReveal = (function() {
    ScrollReveal.prototype.defaults = {
      // Animation
      origin      : 'bottom',
      distance    : '20px',
      duration    : 500,
      delay       : 0,
      rotate      : { x: 0, y: 0, z: 0 },
      opacity     : 0,
      scale       : 0.9,
      easing      : 'cubic-bezier( 0.6, 0.2, 0.1, 1 )',
      // Options
      container   : null,
      mobile      : true,
      reset       : false,
      useDelay    : 'always',
      viewFactor  : 0.2,
      viewOffset  : { top: 0, right: 0, bottom: 0, left: 0 },
      afterReveal : function( domEl ) {},
      afterReset  : function( domEl ) {}
    };

    function ScrollReveal( config ) {
      if ( window == this ) {
        return new ScrollReveal( config );
      }
      sr = this;
      sr.tools = new Tools();
      sr.tools.extend( sr.defaults, config || {} );

      if ( sr.tools.isMobile() && !sr.defaults.mobile ) {
        return false;
      } else if ( !sr.tools.browserSupports('transform') ) {
        return console.warn('Your browser does not support CSS transform.');
      }

      sr.store = {
        elements   : {},
        containers : []
      };
      sr.history     = [];
      sr.counter     = 0;
      sr.blocked     = false;
      sr.initialized = false;
      return sr;
    }

    ScrollReveal.prototype.reveal = function( selector, config, sync ){
      var elements, container, elem, elemId;

      if ( config && config.container ) {
        container = config.container;
      } else {
        container = window.document.documentElement;
      }

      elements = Array.prototype.slice.call( container.querySelectorAll( selector ) );
      if ( !elements.length ) {
        return console.warn( 'reveal("' + selector + '"") returned 0 elements.' );
      }
      for ( var i = 0; i < elements.length; i++ ) {
        elem   = {}
        elemId = elements[ i ].getAttribute('data-sr-id');

        if ( elemId ) {
          elem = sr.store.elements[ elemId ];
        } else {
          elem = {
            id       : ++sr.counter,
            domEl    : elements[ i ],
            seen     : false,
            revealed : false
          };
          elem.domEl.setAttribute( 'data-sr-id', elem.id );
        }

        sr.configure( elem, config || {} );
        sr.style( elem );
        sr.updateStore( elem );

        if ( !elem.revealed ) {
          elem.domEl.setAttribute( 'style',
              elem.styles.inline
            + elem.styles.transform.initial
          );
        }
      }
      if ( !sync ) {
        sr.record( selector, config );
      }
      sr.init();
      return sr;
    };

    ScrollReveal.prototype.configure = function( elem, config ) {
      if ( !elem.config ) {
        elem.config = sr.tools.extendClone( sr.defaults, config );
      } else {
        elem.config = sr.tools.extendClone( elem.config, config );
      }

      if ( elem.config.origin === 'top' || elem.config.origin === 'bottom' ) {
        elem.config.axis = 'Y';
      } else {
        elem.config.axis = 'X';
      }

      if ( elem.config.origin === 'top' || elem.config.origin === 'left' ) {
        elem.config.distance = '-' + elem.config.distance;
      }
    };

    ScrollReveal.prototype.style = function( elem ) {
      var config = elem.config;

      if ( !elem.styles ) {
        elem.styles = {
          transition : {},
          transform  : {}
        };
        elem.styles.inline  = elem.domEl.getAttribute('style') || '';
        elem.styles.inline += '; visibility: visible; ';
        elem.styles.opacity = window.getComputedStyle( elem.domEl ).opacity;
      }

      elem.styles.transition.instant = 'transition: transform ' + config.duration / 1000 + 's ' + config.easing + ' 0s, opacity ' + config.duration / 1000 + 's ' + config.easing + ' 0s; ' +
                       '-webkit-transition: -webkit-transform ' + config.duration / 1000 + 's ' + config.easing + ' 0s, opacity ' + config.duration / 1000 + 's ' + config.easing + ' 0s; ';

      elem.styles.transition.delayed = 'transition: transform ' + config.duration / 1000 + 's ' + config.easing + ' ' + config.delay / 1000 + 's, opacity ' + config.duration / 1000 + 's ' + config.easing + ' ' + config.delay / 1000 + 's; ' +
                       '-webkit-transition: -webkit-transform ' + config.duration / 1000 + 's ' + config.easing + ' ' + config.delay / 1000 + 's, opacity ' + config.duration / 1000 + 's ' + config.easing + ' ' + config.delay / 1000 + 's; ';

      elem.styles.transform.initial = 'transform:';
      elem.styles.transform.target  = 'transform:';
      generateTransform( elem.styles.transform );

      elem.styles.transform.initial += ' -webkit-transform:';
      elem.styles.transform.target  += ' -webkit-transform:';
      generateTransform( elem.styles.transform );

      function generateTransform( transform ) {
        if ( parseInt( config.distance ) ) {
          transform.initial += ' translate' + config.axis + '(' + config.distance + ')';
          transform.target  += ' translate' + config.axis + '(0)';
        }
        if ( config.scale ) {
          transform.initial += ' scale(' + config.scale + ')';
          transform.target  += ' scale(1)';
        }
        if ( config.rotate.x ) {
          transform.initial += ' rotateX(' + config.rotate.x + 'deg)';
          transform.target  += ' rotateX(0)';
        }
        if ( config.rotate.y ) {
          transform.initial += ' rotateY(' + config.rotate.y + 'deg)';
          transform.target  += ' rotateY(0)';
        }
        if ( config.rotate.z ) {
          transform.initial += ' rotateZ(' + config.rotate.z + 'deg)';
          transform.target  += ' rotateZ(0)';
        }
        transform.initial += '; opacity: ' + config.opacity + ';';
        transform.target  += '; opacity: ' + elem.styles.opacity + ';';
      }
    };

    ScrollReveal.prototype.updateStore = function( elem ) {
      var container = elem.config.container;
      if ( container && sr.store.containers.indexOf( container ) == -1 ) {
        sr.store.containers.push( elem.config.container );
      }
      sr.store.elements[ elem.id ] = elem;
    };

    ScrollReveal.prototype.record = function( selector, config ) {
      var record = {
        selector : selector,
        config   : config
      };
      sr.history.push( record );
    };

    ScrollReveal.prototype.init = function() {
      sr.animate();
      for ( var i = sr.store.containers.length - 1; i >= 0; i-- ) {
        sr.store.containers[ i ].addEventListener( 'scroll', sr.handler );
        sr.store.containers[ i ].addEventListener( 'resize', sr.handler );
      }
      if ( !sr.initialized ){
        window.addEventListener( 'scroll', sr.handler );
        window.addEventListener( 'resize', sr.handler );
        sr.initialized = true;
      }
      return sr;
    };

    ScrollReveal.prototype.handler = function() {
      if ( !sr.blocked ) {
        sr.blocked = true;
        _requestAnimationFrame( sr.animate );
      }
    };

    ScrollReveal.prototype.animate = function() {
      var elem, visible;

      sr.tools.forOwn( sr.store.elements, function( elemId ) {
        elem    = sr.store.elements[ elemId ];
        visible = sr.isVisible( elem );
        if ( visible && !elem.revealed ) {

          if ( elem.config.useDelay === 'always'
          || ( elem.config.useDelay === 'onload' && !sr.initialized )
          || ( elem.config.useDelay === 'once'   && !elem.seen ) ) {
            elem.domEl.setAttribute( 'style',
                elem.styles.inline
              + elem.styles.transform.target
              + elem.styles.transition.delayed
            );
          } else {
            elem.domEl.setAttribute( 'style',
                elem.styles.inline
              + elem.styles.transform.target
              + elem.styles.transition.instant
            );
          }
          elem.seen = true;
          queueCallback( 'reveal', elem );

        } else if ( !visible && elem.config.reset && elem.revealed ){
          elem.domEl.setAttribute( 'style',
              elem.styles.inline
            + elem.styles.transform.initial
            + elem.styles.transition.instant
          );
          queueCallback( 'reset', elem );
        }
      });

      sr.blocked = false;

      function queueCallback( type, elem ) {
        var elapsed  = 0;
        var duration = 0;
        var callback = 'after';

        switch ( type ) {
          case 'reveal':
            duration = elem.config.duration + elem.config.delay;
            callback += 'Reveal';
            break;
          case 'reset':
            duration = elem.config.duration;
            callback += 'Reset';
            break;
        }

        if ( elem.timer ) {
          elapsed = Math.abs( elem.timer.started - new Date() );
          window.clearTimeout( elem.timer.clock );
        }

        elem.timer = { started: new Date() };

        elem.timer.clock = window.setTimeout(function() {
          elem.config[ callback ]( elem.domEl );
          elem.timer = null;
        }, duration - elapsed );
        return type === 'reveal' ? elem.revealed = true : elem.revealed = false;
      }
    };

    ScrollReveal.prototype.isVisible = function( elem ) {
      var config, rect, viewable;
      var viewport = {
        width  : window.document.documentElement.clientWidth,
        height : window.document.documentElement.clientHeight
      };
      if ( elem.config.container ) {
        var container = elem.config.container.getBoundingClientRect();
        viewable = {
          top    : sr.tools.clamp( 0, container.top,    viewport.height ),
          right  : sr.tools.clamp( 0, container.right,  viewport.width  ),
          bottom : sr.tools.clamp( 0, container.bottom, viewport.height ),
          left   : sr.tools.clamp( 0, container.left,   viewport.width  )
        };
      } else {
        viewable = {
          top    : 0,
          right  : viewport.width,
          bottom : viewport.height,
          left   : 0
        }
      }
      rect   = elem.domEl.getBoundingClientRect();
      config = elem.config;
      return (
        rect.top    + ( rect.height * config.viewFactor ) < viewable.bottom - config.viewOffset.bottom &&
        rect.right  - ( rect.width  * config.viewFactor ) > viewable.left   + config.viewOffset.left   &&
        rect.bottom - ( rect.height * config.viewFactor ) > viewable.top    + config.viewOffset.top    &&
        rect.left   + ( rect.width  * config.viewFactor ) < viewable.right  - config.viewOffset.right
      );
    };

    ScrollReveal.prototype.sync = function() {
      for ( var i = 0; i < sr.history.length; i++ ) {
        var record = sr.history[ i ];
        sr.reveal( record.selector, record.config, true );
      };
      return sr;
    };

    return ScrollReveal;

  })();

  var Tools = (function() {

    Tools.prototype.clamp = function( min, num, max ) {
      return Math.min( Math.max( min, num ), max );
    };

    Tools.prototype.isObject = function( object ) {
      return object !== null && typeof object === 'object' && object.constructor == Object;
    };

    Tools.prototype.forOwn = function( object, callback ) {
      if ( !this.isObject( object ) ){
        throw new TypeError( 'Expected "object", but received "' + typeof object + '".' );
      } else {
        for ( var property in object ) {
          if ( object.hasOwnProperty( property ) ) {
            callback( property );
          }
        }
      }
    };

    Tools.prototype.extend = function( target, source ) {
      this.forOwn( source, function( property ) {
        if ( this.isObject( source[ property ] ) ) {
          if ( !target[ property ] || !this.isObject( target[ property ] ) ) {
            target[ property ] = {};
          }
          this.extend( target[ property ], source[ property ] );
        } else {
          target[ property ] = source[ property ];
        }
      }.bind( this ));
      return target;
    };

    Tools.prototype.extendClone = function( target, source ) {
      return this.extend( this.extend( {}, target ), source );
    };

    Tools.prototype.isMobile = function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent );
    };

    Tools.prototype.browserSupports = function( feature ) {
      var sensor    = document.createElement('sensor');
      var cssPrefix = 'Webkit,Moz,O,'.split(',');
      var tests     = ( feature + cssPrefix.join( feature + ',' ) ).split(',');

      for ( var i = 0; i < tests.length; i++ ){
        if ( !sensor.style[ tests[ i ] ] === '' ) {
          return false;
        }
      }
      return true;
    };

    function Tools(){};
    return Tools;

  })();

  var _requestAnimationFrame = this.requestAnimationFrame       ||
                               this.webkitRequestAnimationFrame ||
                               this.mozRequestAnimationFrame;

}).call( this );
