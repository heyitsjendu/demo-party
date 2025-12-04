/* ORIGINAL CODE IN CASE IT BREAKS

({
    openUtilityItem: function(component) {
        console.log('openUtilityItem helper called');
        var utilityBar = component.find("utilityBar");
        
        utilityBar.getAllUtilityInfo().then(function(result) {
            console.log('ALL UTILITIES FOUND:', result);
            
            // Just use the first utility (since there's only 1)
            if (result && result.length > 0) {
                var firstUtility = result[0];
                console.log('Using first utility with ID:', firstUtility.id);
                
                utilityBar.openUtility({
                    utilityId: firstUtility.id
                }).then(function(openResult) {
                    console.log('Utility opened successfully!');
                }).catch(function(error) {
                    console.error('Error opening utility:', error);
                });
            } else {
                console.error('No utilities found in bar');
            }
        }).catch(function(error) {
            console.error('Error getting utilities:', error);
        });
    }
}) */

    ({
  openUtilityItem: function(component) {
    var utilityBar = component.find("utilityBar");

    utilityBar.getAllUtilityInfo().then(function(list) {
      // Prefer match by label as configured in App Manager:
      let target = list.find(u => u.utilityLabel === '.');

      // Fallback: match by component (LightningComponent) name
      if (!target) {
        target = list.find(u =>
          u.utilityType === 'LightningComponent' &&
          /DF25UtilityWrapper/.test(u.targetName) // <-- wrapper name
        );
      }

      if (!target) {
        console.error('No matching utility found.');
        return;
      }

      const utilityId = target.id;
      utilityBar.openUtility({ utilityId });
      // optional default height when opening:
      utilityBar.setPanelHeight({ utilityId, heightPX: 600 });
    });
  }
})