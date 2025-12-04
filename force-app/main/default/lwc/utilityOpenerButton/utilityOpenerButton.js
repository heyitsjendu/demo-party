import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getUtilityBarContext, openUtility } from 'lightning/utilityBarApi';

export default class UtilityOpenerButton extends LightningElement {
    utilityApiName = 'c:dF25_Conversation_Simulator'; 

    async handleOpenUtility() {
        try {
            const utilityBarContext = await getUtilityBarContext();
            const myUtility = utilityBarContext.find(utility => 
                utility.developerName === this.utilityApiName
            );

            if (myUtility) {
                await openUtility({ utilityId: myUtility.id });
            } else {
                this.showErrorToast('Utility not found. Check the API name and App Manager setup.');
            }
        } catch (error) {
            console.error('Error opening utility:', error);
            this.showErrorToast(error.body ? error.body.message : 'An unknown error occurred.');
        }
    }

    showErrorToast(message) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error',
        }));
    }
}