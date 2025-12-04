({
  doInit: function(component, event, helper) {
    let buttonIcon = component.get("v.buttonIcon") || "utility:sync";
    component.set("v.buttonIcon", buttonIcon);

    let recordId = component.get("v.recordId");
    let checkBoxApiName = component.get("v.checkBoxApiName");
    if (recordId && checkBoxApiName) {
      helper.loadRecord(component, recordId, checkBoxApiName);
    }
    helper.setSteps(component);
  },
  start: function(component, event, helper) {
    let intervalId = component.get("v.intervalId");
    if (intervalId) {

      clearInterval(intervalId);
      helper.setSteps(component);
      component.set("v.intervalId", null);
      return;
    }

    const intervalTime = component.get("v.intervalTime");
    let steps = component.get("v.steps");
    let activeStepIndex = 0;

    steps[activeStepIndex].isActive = true;
    component.set("v.steps", steps); 

    intervalId = setInterval(
      $A.getCallback(function() {
        let activeStep = steps[activeStepIndex];
        if (activeStep) {
          activeStep.isActive = false;
          activeStep.isComplete = true;
          activeStep.variant = "success";
          activeStep.iconName = "utility:success";
        }

        let nextStep = steps[activeStepIndex + 1];
        if (nextStep) {
          nextStep.isActive = true;
          activeStepIndex++;
        } else {
          clearInterval(intervalId);

          let recordId = component.get("v.recordId");
          let checkBoxApiName = component.get("v.checkBoxApiName");
          if (recordId && checkBoxApiName) {
              try{
                  helper.toggleCheckBox(component, checkBoxApiName);
              }
              catch(error){
                  //let message = JSON.stringify(error);
                  console.log("%cCO_IntegrationStatus Message: " + error, "background-color: blue; color: white");
              }
          }

          let toastMessage = component.get("v.toastMessage");
          if (toastMessage) {
            helper.showToast(component, toastMessage);
          }
        }

        component.set("v.steps", steps);
      }),
      intervalTime
    );
    component.set("v.intervalId", intervalId);
  }
});