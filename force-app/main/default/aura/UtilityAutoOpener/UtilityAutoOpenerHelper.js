({
    openUtilityItem: function(component) {
        var utilityBar = component.find("utilityBar");
        
        utilityBar.getAllUtilityInfo().then(function(response) {
            console.log('All utilities:', response);
            
            // Find the conversation simulator utility
            var conversationUtility = response.find(function(utility) {
                return utility.developerName === 'dF25_Conversation_Simulator';
            });
            
            if (conversationUtility) {
                utilityBar.openUtility({
                    utilityId: conversationUtility.id
                }).then(function(result) {
                    console.log('Utility opened successfully');
                }).catch(function(error) {
                    console.error('Error opening utility:', error);
                });
                
                // Optional: Remove the URL parameter after opening
                var url = new URL(window.location);
                url.searchParams.delete('c__openUtility');
                window.history.replaceState({}, '', url);
            } else {
                console.error('Conversation utility not found');
            }
        }).catch(function(error) {
            console.error('Error getting utility info:', error);
        });
    }
})