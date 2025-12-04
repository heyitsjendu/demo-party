({
  doInit : function(cmp, evt, helper) {
    helper.bind(cmp);   // attach window message listener
  },

  onShrink : function(cmp) {
    const api = cmp.find('utilityApi');
    api.getEnclosingUtilityId().then(id =>
      api.setPanelHeight({ utilityId: id, heightPX: 54 })
    );
  },

  onRestore : function(cmp) {
    const api = cmp.find('utilityApi');
    api.getEnclosingUtilityId().then(id =>
      api.setPanelHeight({ utilityId: id, heightPX: 488 })
    );
  },

  onClose : function(cmp) {
    const api = cmp.find('utilityApi');
    api.getEnclosingUtilityId().then(id =>
      api.minimizeUtility({ utilityId: id })
    );
  }
});