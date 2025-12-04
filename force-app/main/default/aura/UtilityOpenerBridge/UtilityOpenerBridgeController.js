({
    doInit: function(component, event, helper) {
        console.log('UtilityOpenerBridge initialized');
        
        var handleMessage = function(evt) {
            console.log('Full event:', evt);
            console.log('Event data:', evt.data);
            console.log('Event data type:', typeof evt.data);
            
            // Check if data exists and has our type
            if (evt.data && evt.data.type === 'OPEN_UTILITY') {
                console.log('OPENING UTILITY NOW');
                helper.openUtilityItem(component);
            }
        };
        
        window.addEventListener('message', handleMessage, false);
    }
})