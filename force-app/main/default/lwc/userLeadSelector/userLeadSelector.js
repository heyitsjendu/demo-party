/* userLeadSelector.js */
import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import getUsers from '@salesforce/apex/UserLeadSelectorController.getUsers';
import getLeads from '@salesforce/apex/UserLeadSelectorController.getLeads';

export default class UserLeadSelector extends LightningElement {
    @api selectedUserId;
    @api selectedLeadIds = [];

    @track users = [];
    @track leads = [];

    error;
    isLoading = true;

    // Lead columns
    leadColumns = [
        { label: 'Name', fieldName: 'Name', type: 'text', sortable: true },
        { label: 'Company', fieldName: 'Company', type: 'text', sortable: true },
        { label: 'State', fieldName: 'License_State__c', type: 'text' },
        { label: 'Created Date', fieldName: 'CreatedDate', type: 'date' }
    ];

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        Promise.all([
            getUsers(),
            getLeads()
        ])
        .then(([usersResult, leadsResult]) => {
            this.users = usersResult;
            this.leads = leadsResult;
            this.error = undefined;
        })
        .catch(error => {
            this.error = error;
            this.users = [];
            this.leads = [];
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

    // --- Selection Handlers ---

    handleUserClick(event) {
        // Get the ID from the data-id attribute on the div
        const userId = event.currentTarget.dataset.id;
        this.selectedUserId = userId;
        
        // Dispatch the flow event
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedUserId', this.selectedUserId));
    }

    handleLeadSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedLeadIds = selectedRows.map(row => row.Id);
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedLeadIds', this.selectedLeadIds));
    }

    // --- Getters ---

    // Transform User data for Tile Display
    get userListWithFlags() {
        if (!this.users) return [];
        
        return this.users.map(user => {
            // Calculate Initials (e.g., "John Doe" -> "JD")
            const initials = user.Name 
                ? user.Name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';

            // Check if this user is the currently selected one
            const isSelected = (user.Id === this.selectedUserId);

            return {
                ...user, // Passes Id, Name, SmallPhotoUrl, etc.
                initials: initials,
                isSelected: isSelected,
                tileClass: isSelected ? 'user-tile selected-item' : 'user-tile'
            };
        });
    }

    get selectedLeadRows() {
        return this.selectedLeadIds || [];
    }

    get errorMessage() {
        return this.error?.body?.message || 'Unknown error occurred';
    }

    get leadFooterText() {
        const selectedCount = this.selectedLeadIds ? this.selectedLeadIds.length : 0;
        return `${selectedCount} Selected / ${this.leads.length} Total`;
    }

    @api
    validate() {
        if (!this.selectedUserId) {
            return { isValid: false, errorMessage: 'Please select an Account Executive.' };
        }
        if (!this.selectedLeadIds || this.selectedLeadIds.length === 0) {
            return { isValid: false, errorMessage: 'Please select at least one lead.' };
        }
        return { isValid: true };
    }
}