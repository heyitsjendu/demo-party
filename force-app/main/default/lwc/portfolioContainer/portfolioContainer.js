import { LightningElement } from 'lwc';

export default class PortfolioContainer extends LightningElement {
    currentTab = 'einstein'; // Default tab

    get showEinstein() {
        return this.currentTab === 'einstein';
    }

    get showApi() {
        return this.currentTab === 'api';
    }

    // Dynamic CSS classes for active state
    get einsteinTabClass() {
        return `slds-tabs_default__item ${this.currentTab === 'einstein' ? 'slds-is-active' : ''}`;
    }

    get apiTabClass() {
        return `slds-tabs_default__item ${this.currentTab === 'api' ? 'slds-is-active' : ''}`;
    }

    selectEinstein() {
        this.currentTab = 'einstein';
    }

    selectApi() {
        this.currentTab = 'api';
    }
}