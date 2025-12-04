({
  setSteps: function(component) {
    let originalStepsWrapper = component.get("v.originalStepsWrapper");
    let originalSteps = this.parseSteps(originalStepsWrapper);
    component.set("v.originalSteps", originalSteps);

    //clone original steps so we don't overwrite it
    let steps = JSON.parse(JSON.stringify(originalSteps));
    component.set("v.steps", steps);
  },
  loadRecord: function(component, recordId, checkBoxApiName) {
    const recordLoader = component.find("recordLoader");
    let fields = [];
    fields.push(checkBoxApiName);
    recordLoader.set("v.fields", fields);
    recordLoader.set("v.recordId", recordId);
    recordLoader.reloadRecord(true, function() {});
  },
  toggleCheckBox: function(component, checkBoxApiName) {
    let record = component.get("v.record");
    record[checkBoxApiName] = !record[checkBoxApiName];
    component.set("v.record", record);
    component.find("recordLoader").saveRecord(function() {});
  },
  showToast: function(component, toastMessage) {
    let toastEvent = $A.get("e.force:showToast");
    toastEvent.setParams({
      message: toastMessage,
      type: "success"
    });
    toastEvent.fire();
  },
  parseSteps: function(originalSteps) {
    let steps = originalSteps.split(",");
    let final = [];

    for (let s of steps) {
      let label = s.split("|")[0] || "Step";
      let icon = s.split("|")[1] || "utility:success";

      let step = {
        text: label,
        isActive: false,
        isComplete: false,
        variant: "",
        iconName: icon
      };
      final.push(step);
    }
    return final;
  }
});