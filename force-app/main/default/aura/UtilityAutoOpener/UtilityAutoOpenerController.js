({
    doInit: function(component, event, helper) {
        // Get URL parameter
        var urlParams = new URLSearchParams(window.location.search);
        var openUtility = urlParams.get('c__openUtility');
        
        if (openUtility === 'true') {
            // Small delay to ensure utility bar is ready
            setTimeout(function() {
                helper.openUtilityItem(component);
            }, 500);
        }
    }
})