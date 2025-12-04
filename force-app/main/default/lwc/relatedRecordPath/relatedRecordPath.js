import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getRelatedRecordPath from '@salesforce/apex/RelatedRecordPathController.getRelatedRecordPath';

export default class RelatedRecordPath extends NavigationMixin(LightningElement) {
    @api recordId; // Account record ID (automatically provided when on record page)
    @api relatedObjectApiName = 'ClinicalServiceRequest';
    @api lookupFieldApiName = 'PatientId'; // Lookup field on CSR pointing to Account
    @api stageFieldApiName = 'Status'; // Picklist field for the path
    @api pathTitle = 'Clinical Service Request Status';

    relatedRecordId;
    currentStageValue;
    pathStages = [];
    isLoading = true;
    errorMessage;
    wiredRecordResult;

    @wire(getRelatedRecordPath, { 
        parentRecordId: '$recordId',
        relatedObjectApiName: '$relatedObjectApiName',
        lookupFieldApiName: '$lookupFieldApiName',
        stageFieldApiName: '$stageFieldApiName'
    })
    wiredRecord(result) {
        this.wiredRecordResult = result;
        this.isLoading = true;
        this.errorMessage = null;

        if (result.data) {
            if (result.data.success) {
                this.relatedRecordId = result.data.recordId;
                this.currentStageValue = result.data.currentStage;
                this.buildPathStages(result.data.picklistValues, result.data.currentStage);
                this.isLoading = false;
            } else {
                this.errorMessage = result.data.message;
                this.isLoading = false;
            }
        } else if (result.error) {
            this.errorMessage = 'Error loading related record: ' + this.getErrorMessage(result.error);
            this.isLoading = false;
        }
    }

    buildPathStages(picklistValues, currentStage) {
        if (!picklistValues || picklistValues.length === 0) {
            this.pathStages = [];
            return;
        }

        const currentIndex = picklistValues.findIndex(stage => stage.value === currentStage);
        
        this.pathStages = picklistValues.map((stage, index) => {
            let className = 'slds-path__item';
            
            if (index < currentIndex) {
                className += ' slds-is-complete';
            } else if (stage.value === currentStage) {
                className += ' slds-is-current slds-is-active';
            } else {
                className += ' slds-is-incomplete';
            }

            return {
                label: stage.label,
                value: stage.value,
                className: className,
                isActive: stage.value === currentStage
            };
        });
    }

    get showPath() {
        return !this.isLoading && !this.errorMessage && this.pathStages.length > 0;
    }

    get currentStageInfo() {
        return this.pathStages.find(stage => stage.isActive);
    }

    get relatedRecordUrl() {
        return this.relatedRecordId ? `/${this.relatedRecordId}` : null;
    }

    handleStageClick(event) {
        const selectedStage = event.currentTarget.dataset.value;
        
        if (selectedStage === this.currentStageValue) {
            return; // Already on this stage
        }

        this.updateStage(selectedStage);
    }

    async updateStage(newStage) {
        try {
            const fields = {};
            fields.Id = this.relatedRecordId;
            fields[this.stageFieldApiName] = newStage;

            await updateRecord({ fields });

            this.showToast('Success', 'Status updated successfully', 'success');
            
            // Refresh the data
            await refreshApex(this.wiredRecordResult);

        } catch (error) {
            this.showToast('Error', 'Error updating Status: ' + this.getErrorMessage(error), 'error');
        }
    }

    navigateToRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.relatedRecordId,
                actionName: 'view'
            }
        });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    getErrorMessage(error) {
        if (error.body && error.body.message) {
            return error.body.message;
        } else if (error.message) {
            return error.message;
        } else if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error';
    }
}