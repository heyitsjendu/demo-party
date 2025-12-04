// DF25UtilityWrapperController.js
({
  onUtilityShrink : function(cmp, evt, helper) {
    const api = cmp.find('utilityApi');
    api.getEnclosingUtilityId().then(id => {
      api.setPanelHeight({ utilityId: id, heightPX: 45 });
    });
  },
  onUtilityRestore : function(cmp, evt, helper) {
    const api = cmp.find('utilityApi');
    api.getEnclosingUtilityId().then(id => {
      // pick a sensible “full size” height
      api.setPanelHeight({ utilityId: id, heightPX: 600 });
    });
  }
});