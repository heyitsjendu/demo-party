({
    doInit : function(component, event, helper) {
        var workspaceAPI = component.find("workspace");

        workspaceAPI.getFocusedTabInfo()
        .then(function(tabInfo) {
            // tabInfo.recordId will be null on non-record tabs (Home, list view, etc.)
            component.set("v.recordId", tabInfo.recordId || null);
            component.set("v.objectApiName", tabInfo.objectApiName || null);
        })
        .catch(function(error) {
            // optional: log or surface an error
            console.error('workspaceAPI error: ' + JSON.stringify(error));
        });
    }
})