({
  bind : function(cmp) {
    const api = cmp.find('utilityApi');

    function log(){ try{ console.log.apply(console, arguments); }catch(e){} }

    function onMessage(e){
      const msg = (e && e.data) || {};
      if (!msg || typeof msg !== 'object') return;

      const t = msg.type;
      const isOpen     = t === 'OPEN_CONVO_DEMO' || t === 'OPEN_UTILITY';
      const isSetHt    = t === 'SET_HEIGHT';
      const isMinimize = t === 'MINIMIZE_UTILITY';
      const isToggle   = t === 'TOGGLE_UTILITY';
      if (!isOpen && !isSetHt && !isMinimize && !isToggle) return;

      api.getEnclosingUtilityId().then(function(id){
        if (!id) { log('[ConvUtil] No enclosing utility id'); return; }

        if (isOpen) {
          log('[ConvUtil] Open/restore self');
          api.openUtility({ utilityId: id });
          api.setPanelHeight({ utilityId: id, heightPX: 488 });
          return;
        }
        if (isSetHt) {
          const h = Number(msg.heightPX) || 488;
          log('[ConvUtil] Set height', h);
          api.setPanelHeight({ utilityId: id, heightPX: h });
          return;
        }
        if (isMinimize) {
          log('[ConvUtil] Minimize self');
          api.minimizeUtility({ utilityId: id });
          return;
        }
        if (isToggle) {
          log('[ConvUtil] Toggle self');
          api.togglePanel({ utilityId: id });
        }
      });
    }

    if (!window.__convUtilBound) {
      window.addEventListener('message', onMessage, false);
      window.__convUtilBound = true;
      log('[ConvUtil] window message listener bound');
    }
  }
});