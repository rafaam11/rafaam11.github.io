(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.SpatialSignal = api;

    if (root.document) {
      if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', function () {
          api.mount(root.document);
        }, { once: true });
      } else {
        api.mount(root.document);
      }
    }
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var controllers = typeof WeakMap === 'function' ? new WeakMap() : null;
  var controllerKey = '__spatialSignalController__';
  var focusableSelector = 'a[href], button, input, select, textarea, [tabindex]';

  function storedController(strip) {
    return controllers ? controllers.get(strip) : strip[controllerKey];
  }

  function storeController(strip, controller) {
    if (controllers) controllers.set(strip, controller);
    else strip[controllerKey] = controller;
  }

  function forgetController(strip) {
    if (controllers) controllers.delete(strip);
    else {
      try {
        delete strip[controllerKey];
      } catch (error) {
        strip[controllerKey] = null;
      }
    }
  }

  function list(node, selector) {
    if (!node || typeof node.querySelectorAll !== 'function') return [];
    return Array.prototype.slice.call(node.querySelectorAll(selector));
  }

  function mount(documentObject) {
    if (!documentObject || typeof documentObject.querySelector !== 'function') return null;

    var strip = documentObject.querySelector('[data-ss-evidence-strip]');
    if (!strip) return null;

    var existing = storedController(strip);
    if (existing) return existing;

    var slides = list(strip, '[data-ss-evidence-slide]');
    if (!slides.length) slides = list(strip, '.ss-evidence-slide');
    if (!slides.length) return null;

    var controls = list(strip, '[data-ss-evidence-control]');
    var stopButton = list(strip, '[data-ss-evidence-stop]')[0] || null;
    var traces = list(documentObject, '.ss-registration-trace[data-ss-state], [data-ss-registration-trace]');
    var interval = Number(strip.getAttribute('data-ss-interval'));
    if (!Number.isFinite(interval) || interval <= 0) interval = 4800;

    var view = documentObject.defaultView || (typeof window !== 'undefined' ? window : null);
    var motionQuery = view && typeof view.matchMedia === 'function'
      ? view.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    var narrowQuery = view && typeof view.matchMedia === 'function'
      ? view.matchMedia('(max-width: 720px)')
      : null;
    var activeIndex = 0;
    var visited = {};
    var hovered = false;
    var focused = false;
    var userStopped = false;
    var completed = false;
    var destroyed = false;
    var timer = null;
    var listeners = [];
    var originalTabIndex = typeof WeakMap === 'function' ? new WeakMap() : null;

    function rememberTabIndex(element) {
      if (!originalTabIndex || originalTabIndex.has(element)) return;
      originalTabIndex.set(element, element.getAttribute('tabindex'));
    }

    function setFocusable(element, enabled) {
      rememberTabIndex(element);
      if (!enabled) {
        element.setAttribute('tabindex', '-1');
        return;
      }

      var original = originalTabIndex ? originalTabIndex.get(element) : null;
      if (original === null || original === undefined) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', original);
    }

    function restoreFocusable(element) {
      var original = originalTabIndex ? originalTabIndex.get(element) : null;
      if (original === null || original === undefined) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', original);
    }

    function updateSlides() {
      var hideInactive = Boolean(narrowQuery && narrowQuery.matches);
      slides.forEach(function (slide, index) {
        var active = index === activeIndex;
        var state = active ? 'active' : (visited[index] ? 'visited' : 'inactive');
        slide.setAttribute('data-ss-state', state);
        slide.setAttribute('aria-hidden', hideInactive && !active ? 'true' : 'false');
        list(slide, focusableSelector).forEach(function (element) {
          setFocusable(element, !hideInactive || active);
        });
      });

      controls.forEach(function (control, index) {
        var target = Number(control.getAttribute('data-ss-target'));
        if (!Number.isInteger(target)) target = index;
        control.setAttribute('aria-pressed', target === activeIndex ? 'true' : 'false');
        control.removeAttribute('aria-selected');

        var slide = slides[target];
        if (slide && !control.getAttribute('aria-controls')) {
          var slideId = slide.getAttribute('id') || 'ss-evidence-slide-' + (target + 1);
          slide.setAttribute('id', slideId);
          control.setAttribute('aria-controls', slideId);
        }
      });

      if (stopButton) stopButton.setAttribute('aria-pressed', userStopped ? 'true' : 'false');
    }

    function setStripState(state) {
      strip.setAttribute('data-ss-state', state);
      traces.forEach(function (trace) {
        trace.setAttribute('data-ss-state', state);
        trace.setAttribute('data-ss-slide', String(activeIndex + 1));
      });
    }

    function clearTimer() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
    }

    function isReduced() {
      return Boolean(motionQuery && motionQuery.matches);
    }

    function isPaused() {
      return hovered || focused || Boolean(documentObject.hidden);
    }

    function show(index) {
      if (index < 0 || index >= slides.length || index === activeIndex) {
        updateSlides();
        return;
      }
      visited[activeIndex] = true;
      activeIndex = index;
      updateSlides();
    }

    function schedule() {
      clearTimer();
      if (destroyed || userStopped || completed) return;
      if (isReduced()) {
        setStripState('static');
        return;
      }
      if (isPaused()) {
        setStripState('paused');
        return;
      }
      if (activeIndex >= slides.length - 1) {
        completed = true;
        setStripState('complete');
        return;
      }

      setStripState('running');
      timer = setTimeout(function () {
        timer = null;
        show(activeIndex + 1);
        if (activeIndex >= slides.length - 1) {
          completed = true;
          setStripState('complete');
        } else {
          schedule();
        }
      }, interval);
    }

    function pauseIfNeeded() {
      if (destroyed || userStopped || completed || isReduced()) return;
      if (isPaused()) {
        clearTimer();
        setStripState('paused');
      } else {
        schedule();
      }
    }

    function stop() {
      if (destroyed || completed) return;
      userStopped = true;
      clearTimer();
      setStripState('stopped');
      if (stopButton) stopButton.setAttribute('aria-pressed', 'true');
    }

    function select(index) {
      if (destroyed || index < 0 || index >= slides.length) return;
      stop();
      show(index);
    }

    function addListener(target, type, listener) {
      if (!target || typeof target.addEventListener !== 'function') return;
      target.addEventListener(type, listener);
      listeners.push([target, type, listener]);
    }

    function onPointerEnter() {
      hovered = true;
      pauseIfNeeded();
    }

    function onPointerLeave() {
      hovered = false;
      pauseIfNeeded();
    }

    function onFocusIn() {
      focused = true;
      pauseIfNeeded();
    }

    function onFocusOut(event) {
      if (event && event.relatedTarget && typeof strip.contains === 'function' && strip.contains(event.relatedTarget)) return;
      focused = false;
      pauseIfNeeded();
    }

    function onVisibilityChange() {
      pauseIfNeeded();
    }

    function onMotionChange() {
      clearTimer();
      if (destroyed || userStopped || completed) return;
      if (isReduced()) setStripState('static');
      else schedule();
    }

    function onNarrowChange() {
      if (!destroyed) updateSlides();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimer();
      listeners.forEach(function (entry) {
        entry[0].removeEventListener(entry[1], entry[2]);
      });
      listeners.length = 0;
      if (motionQuery) {
        if (typeof motionQuery.removeEventListener === 'function') motionQuery.removeEventListener('change', onMotionChange);
        else if (typeof motionQuery.removeListener === 'function') motionQuery.removeListener(onMotionChange);
      }
      if (narrowQuery) {
        if (typeof narrowQuery.removeEventListener === 'function') narrowQuery.removeEventListener('change', onNarrowChange);
        else if (typeof narrowQuery.removeListener === 'function') narrowQuery.removeListener(onNarrowChange);
      }
      slides.forEach(function (slide) {
        slide.removeAttribute('aria-hidden');
        list(slide, focusableSelector).forEach(restoreFocusable);
      });
      setStripState('stopped');
      forgetController(strip);
    }

    var controller = {
      destroy: destroy,
      select: select,
      stop: stop
    };
    storeController(strip, controller);

    addListener(strip, 'pointerenter', onPointerEnter);
    addListener(strip, 'pointerleave', onPointerLeave);
    addListener(strip, 'focusin', onFocusIn);
    addListener(strip, 'focusout', onFocusOut);
    addListener(strip, 'pointerdown', stop);
    addListener(strip, 'touchstart', stop);
    addListener(strip, 'keydown', stop);
    addListener(documentObject, 'visibilitychange', onVisibilityChange);
    controls.forEach(function (control, index) {
      addListener(control, 'click', function () {
        var target = Number(control.getAttribute('data-ss-target'));
        select(Number.isInteger(target) ? target : index);
      });
    });
    addListener(stopButton, 'click', stop);
    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', onMotionChange);
      else if (typeof motionQuery.addListener === 'function') motionQuery.addListener(onMotionChange);
    }
    if (narrowQuery) {
      if (typeof narrowQuery.addEventListener === 'function') narrowQuery.addEventListener('change', onNarrowChange);
      else if (typeof narrowQuery.addListener === 'function') narrowQuery.addListener(onNarrowChange);
    }

    updateSlides();
    schedule();
    return controller;
  }

  return { mount: mount };
}));
